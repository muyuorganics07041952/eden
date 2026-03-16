import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tipId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Verify tip exists
  const { data: tip, error: tipError } = await supabase
    .from('community_tips')
    .select('id')
    .eq('id', tipId)
    .single()

  if (tipError || !tip) {
    return NextResponse.json({ error: 'Tipp nicht gefunden.' }, { status: 404 })
  }

  // Insert report (unique constraint prevents duplicates)
  const { error: insertError } = await supabase
    .from('community_tip_reports')
    .insert({
      tip_id: tipId,
      reporter_user_id: user.id,
    })

  if (insertError) {
    // Check for unique constraint violation (already reported)
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Du hast diesen Tipp bereits gemeldet.' }, { status: 409 })
    }
    console.error('Error reporting tip:', insertError)
    return NextResponse.json({ error: 'Fehler beim Melden des Tipps.' }, { status: 500 })
  }

  return NextResponse.json({ reported: true }, { status: 201 })
}
