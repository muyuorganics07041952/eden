import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { subscribeSchema, unsubscribeSchema } from '@/lib/types/push'

// Max push subscriptions per user (prevents abuse in serverless environment)
const MAX_SUBSCRIPTIONS_PER_USER = 25

export async function POST(request: Request) {
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

  const parsed = subscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { endpoint, p256dh, auth, timezone, reminderHour } = parsed.data

  // Check if endpoint already exists for this user (upsert path — no count check needed)
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

  // New endpoint — check subscription count before inserting
  const { count } = await supabase
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= MAX_SUBSCRIPTIONS_PER_USER) {
    return NextResponse.json(
      { error: 'Maximale Anzahl an Geräten erreicht. Bitte entferne ein anderes Gerät zuerst.' },
      { status: 429 }
    )
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
