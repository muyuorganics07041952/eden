import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tipId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Fetch the tip to verify ownership and get photo_path for cleanup
  const { data: tip, error: fetchError } = await supabase
    .from('community_tips')
    .select('id, user_id, photo_path')
    .eq('id', tipId)
    .single()

  if (fetchError || !tip) {
    return NextResponse.json({ error: 'Tipp nicht gefunden.' }, { status: 404 })
  }

  if (tip.user_id !== user.id) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  // Delete photo from storage if it exists
  if (tip.photo_path) {
    await supabase.storage.from('community-tips').remove([tip.photo_path])
  }

  // Delete tip (cascade deletes likes, comments, reports)
  const { error: deleteError } = await supabase
    .from('community_tips')
    .delete()
    .eq('id', tipId)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('Error deleting community tip:', deleteError)
    return NextResponse.json({ error: 'Fehler beim Löschen des Tipps.' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
