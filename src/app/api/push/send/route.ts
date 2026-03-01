import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import webpush from 'web-push'
import type { PushSubscriptionData } from '@/lib/types/push'

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify VAPID config
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.error('Missing VAPID configuration')
    return NextResponse.json({ error: 'Push notifications not configured' }, { status: 503 })
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  const supabase = createAdminClient()

  // Fetch all enabled subscriptions
  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('enabled', true)
    .limit(10000)

  if (subError) {
    console.error('Error fetching push subscriptions:', subError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, errors: 0 })
  }

  // Filter subscriptions where the current UTC time matches the user's local reminder hour
  const now = new Date()
  const matchingSubscriptions = (subscriptions as PushSubscriptionData[]).filter((sub) => {
    try {
      const localHourStr = now.toLocaleString('en-US', {
        timeZone: sub.timezone,
        hour: 'numeric',
        hour12: false,
      })
      const localHour = parseInt(localHourStr, 10)
      return localHour === sub.reminder_hour
    } catch {
      // Invalid timezone — skip this subscription
      console.warn(`Invalid timezone for subscription ${sub.id}: ${sub.timezone}`)
      return false
    }
  })

  let sent = 0
  let skipped = 0
  let errors = 0

  // Group subscriptions by user to avoid duplicate task queries
  const byUser = new Map<string, PushSubscriptionData[]>()
  for (const sub of matchingSubscriptions) {
    const existing = byUser.get(sub.user_id)
    if (existing) {
      existing.push(sub)
    } else {
      byUser.set(sub.user_id, [sub])
    }
  }

  const today = new Date().toISOString().split('T')[0]

  for (const [userId, userSubs] of byUser) {
    // Count due care tasks for this user
    const { count, error: countError } = await supabase
      .from('care_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('next_due_date', today)

    if (countError) {
      console.error(`Error counting tasks for user ${userId}:`, countError)
      errors += userSubs.length
      continue
    }

    if (!count || count === 0) {
      skipped += userSubs.length
      continue
    }

    const plural = count === 1 ? '' : 'n'
    const payload = JSON.stringify({
      title: 'Eden \u2013 Pflegeaufgaben f\u00e4llig',
      body: `Du hast ${count} Pflegeaufgabe${plural} heute f\u00e4llig.`,
      url: '/tasks',
    })

    // Send to all devices of this user
    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key,
            },
          },
          payload
        )
        sent++
      } catch (err: unknown) {
        const webPushError = err as { statusCode?: number }
        if (webPushError.statusCode === 410) {
          // Subscription expired or unsubscribed — clean up
          console.log(`Removing expired subscription ${sub.id}`)
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id)
        } else {
          console.error(`Error sending push to subscription ${sub.id}:`, err)
        }
        errors++
      }
    }
  }

  return NextResponse.json({ sent, skipped, errors })
}
