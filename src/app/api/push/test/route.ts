import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import webpush from 'web-push'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return NextResponse.json({ error: 'VAPID nicht konfiguriert.' }, { status: 503 })
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  const admin = createAdminClient()
  const { data: subscriptions } = await admin
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('enabled', true)

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ error: 'Keine aktive Subscription gefunden. Bitte Benachrichtigungen zuerst aktivieren.' }, { status: 404 })
  }

  const payload = JSON.stringify({
    title: 'Eden – Test',
    body: 'Push-Benachrichtigungen funktionieren! 🌱',
    url: '/settings',
  })

  let sent = 0
  const errors: string[] = []

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
        payload
      )
      sent++
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string }
      if (e.statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('id', sub.id)
        errors.push('Subscription abgelaufen und entfernt.')
      } else {
        errors.push(e.message ?? 'Unbekannter Fehler')
      }
    }
  }

  if (sent === 0) {
    return NextResponse.json({ error: `Senden fehlgeschlagen: ${errors.join(', ')}` }, { status: 500 })
  }

  return NextResponse.json({ sent, total: subscriptions.length })
}
