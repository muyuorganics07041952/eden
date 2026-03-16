import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { CommunityTipComment } from '@/lib/types/community'

const createCommentSchema = z.object({
  text: z.string().min(1, 'Kommentar darf nicht leer sein').max(300, 'Maximal 300 Zeichen'),
})

export async function GET(
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

  // Fetch comments ordered by created_at ASC
  const { data: comments, error: commentsError } = await supabase
    .from('community_tip_comments')
    .select('*')
    .eq('tip_id', tipId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (commentsError) {
    console.error('Error fetching comments:', commentsError)
    return NextResponse.json({ error: 'Fehler beim Laden der Kommentare.' }, { status: 500 })
  }

  if (!comments || comments.length === 0) {
    return NextResponse.json([])
  }

  // Resolve author names
  const userIds = comments
    .map((c) => c.user_id)
    .filter((uid): uid is string => uid !== null)
  const uniqueUserIds = [...new Set(userIds)]

  const nameMap = new Map<string, string>()
  if (uniqueUserIds.length > 0) {
    const adminClient = createAdminClient()
    for (const uid of uniqueUserIds) {
      try {
        const { data } = await adminClient.auth.admin.getUserById(uid)
        const meta = data?.user?.user_metadata
        const name = meta?.display_name || meta?.full_name || meta?.name
        nameMap.set(uid, name || 'Unbekannter Nutzer')
      } catch {
        nameMap.set(uid, 'Unbekannter Nutzer')
      }
    }
  }

  const result: CommunityTipComment[] = comments.map((c) => ({
    id: c.id,
    tip_id: c.tip_id,
    user_id: c.user_id,
    text: c.text,
    created_at: c.created_at,
    author_name: c.user_id
      ? (nameMap.get(c.user_id) ?? 'Unbekannter Nutzer')
      : 'Gelöschter Nutzer',
  }))

  return NextResponse.json(result)
}

export async function POST(
  request: Request,
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 })
  }

  const parsed = createCommentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { text } = parsed.data

  const { data: comment, error: insertError } = await supabase
    .from('community_tip_comments')
    .insert({
      tip_id: tipId,
      user_id: user.id,
      text,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating comment:', insertError)
    return NextResponse.json({ error: 'Fehler beim Erstellen des Kommentars.' }, { status: 500 })
  }

  // Get author name from current user metadata
  const meta = user.user_metadata
  const author_name = meta?.display_name || meta?.full_name || meta?.name || 'Unbekannter Nutzer'

  const result: CommunityTipComment = {
    id: comment.id,
    tip_id: comment.tip_id,
    user_id: comment.user_id,
    text: comment.text,
    created_at: comment.created_at,
    author_name,
  }

  return NextResponse.json(result, { status: 201 })
}
