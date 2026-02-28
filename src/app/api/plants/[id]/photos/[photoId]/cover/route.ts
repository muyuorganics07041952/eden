import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id: plantId, photoId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Verify photo belongs to this plant and user
  const { data: photo, error: fetchError } = await supabase
    .from('plant_photos')
    .select('id')
    .eq('id', photoId)
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !photo) {
    return NextResponse.json({ error: 'Foto nicht gefunden.' }, { status: 404 })
  }

  // Remove cover from all photos of this plant
  const { error: clearError } = await supabase
    .from('plant_photos')
    .update({ is_cover: false })
    .eq('plant_id', plantId)
    .eq('user_id', user.id)

  if (clearError) {
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Covers.' }, { status: 500 })
  }

  // Set new cover
  const { data: updated, error: setError } = await supabase
    .from('plant_photos')
    .update({ is_cover: true })
    .eq('id', photoId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (setError || !updated) {
    return NextResponse.json({ error: 'Fehler beim Setzen des Covers.' }, { status: 500 })
  }

  return NextResponse.json(updated)
}
