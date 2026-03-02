import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const locationSchema = z.object({
  city_name: z.string().min(1, 'Stadtname ist erforderlich').max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export async function PATCH(request: Request) {
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

  const parsed = locationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: user.id,
        city_name: parsed.data.city_name,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.error('Error upserting user settings:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern des Standorts.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
