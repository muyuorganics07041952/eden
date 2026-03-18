import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createFeedbackSchema } from '@/lib/validations/feedback'
import type { Feedback } from '@/lib/types/feedback'

const RATE_LIMIT_FEEDBACKS_PER_DAY = 5

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. Authentication check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // 2. Rate limit: max 5 feedbacks per 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from('feedback')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since)

  if (recentCount !== null && recentCount >= RATE_LIMIT_FEEDBACKS_PER_DAY) {
    return NextResponse.json(
      { error: 'Du hast heute schon 5 Feedbacks gesendet. Bitte versuche es morgen wieder.' },
      { status: 429 }
    )
  }

  // 3. Parse and validate input
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige JSON-Daten.' }, { status: 400 })
  }

  const parsed = createFeedbackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { type, text, page_url } = parsed.data

  // 4. Insert feedback
  const { data: feedback, error: insertError } = await supabase
    .from('feedback')
    .insert({ user_id: user.id, type, text, page_url })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating feedback:', insertError)
    return NextResponse.json({ error: 'Fehler beim Speichern des Feedbacks.' }, { status: 500 })
  }

  const result: Feedback = {
    id: feedback.id,
    user_id: feedback.user_id,
    type: feedback.type,
    text: feedback.text,
    page_url: feedback.page_url,
    created_at: feedback.created_at,
  }

  return NextResponse.json(result, { status: 201 })
}
