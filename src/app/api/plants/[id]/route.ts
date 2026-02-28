import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updatePlantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  species: z.string().max(100).nullable().optional(),
  location: z.string().max(100).nullable().optional(),
  planted_at: z.string().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const { data: plant, error } = await supabase
    .from('plants')
    .select(`
      id, user_id, name, species, location, planted_at, notes, created_at, updated_at,
      plant_photos (id, plant_id, storage_path, is_cover, created_at)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !plant) {
    return NextResponse.json({ error: 'Pflanze nicht gefunden.' }, { status: 404 })
  }

  // Generate signed URLs for all photos
  const photosWithUrls = await Promise.all(
    (plant.plant_photos ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from('plant-photos')
        .createSignedUrl(photo.storage_path, 3600)
      return { ...photo, url: data?.signedUrl ?? '' }
    })
  )

  return NextResponse.json({ ...plant, plant_photos: photosWithUrls })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  const parsed = updatePlantSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { data: plant, error } = await supabase
    .from('plants')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !plant) {
    return NextResponse.json({ error: 'Pflanze nicht gefunden oder Zugriff verweigert.' }, { status: 404 })
  }

  return NextResponse.json(plant)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Fetch all photos first so we can delete from Storage
  const { data: photos } = await supabase
    .from('plant_photos')
    .select('storage_path')
    .eq('plant_id', id)
    .eq('user_id', user.id)

  // Delete all photo files from Storage
  if (photos && photos.length > 0) {
    const paths = photos.map((p) => p.storage_path)
    await supabase.storage.from('plant-photos').remove(paths)
  }

  // Delete the plant (cascades to plant_photos rows)
  const { error } = await supabase
    .from('plants')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Fehler beim Löschen der Pflanze.' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
