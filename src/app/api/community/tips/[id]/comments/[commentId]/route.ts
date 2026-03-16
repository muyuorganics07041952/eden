import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: tipId, commentId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Verify comment exists and belongs to the user
  const { data: comment, error: fetchError } = await supabase
    .from('community_tip_comments')
    .select('id, user_id')
    .eq('id', commentId)
    .eq('tip_id', tipId)
    .single()

  if (fetchError || !comment) {
    return NextResponse.json({ error: 'Kommentar nicht gefunden.' }, { status: 404 })
  }

  if (comment.user_id !== user.id) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const { error: deleteError } = await supabase
    .from('community_tip_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('Error deleting comment:', deleteError)
    return NextResponse.json({ error: 'Fehler beim Löschen des Kommentars.' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
