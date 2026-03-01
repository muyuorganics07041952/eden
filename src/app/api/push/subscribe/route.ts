import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { subscribeSchema, unsubscribeSchema } from '@/lib/types/push'

// In-memory rate limiter: max 10 requests per user per 60 seconds
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Rate limiting
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 })
  }

  const parsed = subscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { endpoint, p256dh, auth, timezone, reminderHour } = parsed.data

  // Upsert using endpoint as unique key
  const { data: existing } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('endpoint', endpoint)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Update existing subscription
    const { data: subscription, error } = await supabase
      .from('push_subscriptions')
      .update({
        p256dh_key: p256dh,
        auth_key: auth,
        timezone,
        reminder_hour: reminderHour,
        enabled: true,
      })
      .eq('id', existing.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating push subscription:', error)
      return NextResponse.json({ error: 'Fehler beim Aktualisieren der Subscription.' }, { status: 500 })
    }

    return NextResponse.json(subscription, { status: 200 })
  }

  // Create new subscription
  const { data: subscription, error } = await supabase
    .from('push_subscriptions')
    .insert({
      user_id: user.id,
      endpoint,
      p256dh_key: p256dh,
      auth_key: auth,
      timezone,
      reminder_hour: reminderHour,
      enabled: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating push subscription:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern der Subscription.' }, { status: 500 })
  }

  return NextResponse.json(subscription, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 })
  }

  const parsed = unsubscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', parsed.data.endpoint)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting push subscription:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Subscription.' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
