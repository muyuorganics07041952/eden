import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { settingsSchema } from '@/lib/types/push'

export async function PUT(request: Request) {
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

  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .update({ reminder_hour: parsed.data.reminderHour })
    .eq('user_id', user.id)
    .select()

  if (error) {
    console.error('Error updating push settings:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Einstellungen.' }, { status: 500 })
  }

  return NextResponse.json(subscriptions, { status: 200 })
}
