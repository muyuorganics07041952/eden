import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id: plantId, photoId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Fetch photo to get storage path and cover status
  const { data: photo, error: fetchError } = await supabase
    .from('plant_photos')
    .select('id, storage_path, is_cover, plant_id')
    .eq('id', photoId)
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !photo) {
    return NextResponse.json({ error: 'Foto nicht gefunden.' }, { status: 404 })
  }

  // Delete from Storage
  await supabase.storage.from('plant-photos').remove([photo.storage_path])

  // Delete from DB
  const { error: deleteError } = await supabase
    .from('plant_photos')
    .delete()
    .eq('id', photoId)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json({ error: 'Fehler beim Löschen des Fotos.' }, { status: 500 })
  }

  // If deleted photo was the cover, assign cover to the next remaining photo
  if (photo.is_cover) {
    const { data: remaining } = await supabase
      .from('plant_photos')
      .select('id')
      .eq('plant_id', plantId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    if (remaining && remaining.length > 0) {
      await supabase
        .from('plant_photos')
        .update({ is_cover: true })
        .eq('id', remaining[0].id)
        .eq('user_id', user.id)
    }
  }

  return new NextResponse(null, { status: 204 })
}
