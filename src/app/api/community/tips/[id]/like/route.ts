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

  // Check if the tip exists
  const { data: tip, error: tipError } = await supabase
    .from('community_tips')
    .select('id, user_id, likes_count')
    .eq('id', tipId)
    .single()

  if (tipError || !tip) {
    return NextResponse.json({ error: 'Tipp nicht gefunden.' }, { status: 404 })
  }

  // BUG-1 fix: Prevent self-likes
  if (tip.user_id === user.id) {
    return NextResponse.json({ error: 'Du kannst deinen eigenen Tipp nicht liken.' }, { status: 400 })
  }

  // Check if the user already liked this tip
  const { data: existingLike } = await supabase
    .from('community_tip_likes')
    .select('tip_id')
    .eq('tip_id', tipId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingLike) {
    // Unlike: delete the like (trigger decrements likes_count)
    const { error: deleteError } = await supabase
      .from('community_tip_likes')
      .delete()
      .eq('tip_id', tipId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error removing like:', deleteError)
      return NextResponse.json({ error: 'Fehler beim Entfernen des Likes.' }, { status: 500 })
    }

    // Fetch updated likes_count
    const { data: updated } = await supabase
      .from('community_tips')
      .select('likes_count')
      .eq('id', tipId)
      .single()

    return NextResponse.json({
      liked: false,
      likes_count: updated?.likes_count ?? Math.max(tip.likes_count - 1, 0),
    })
  } else {
    // Like: insert a new like (trigger increments likes_count)
    const { error: insertError } = await supabase
      .from('community_tip_likes')
      .insert({ tip_id: tipId, user_id: user.id })

    if (insertError) {
      console.error('Error adding like:', insertError)
      return NextResponse.json({ error: 'Fehler beim Hinzufügen des Likes.' }, { status: 500 })
    }

    // Fetch updated likes_count
    const { data: updated } = await supabase
      .from('community_tips')
      .select('likes_count')
      .eq('id', tipId)
      .single()

    return NextResponse.json({
      liked: true,
      likes_count: updated?.likes_count ?? tip.likes_count + 1,
    })
  }
}
