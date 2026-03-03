import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  display_name: z.string().min(1).max(50),
})

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body.' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültiger Name (max. 50 Zeichen).' }, { status: 422 })
  }

  const { display_name } = parsed.data

  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: user.id, display_name }, { onConflict: 'user_id' })

  if (error) {
    console.error('Profile save error:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
