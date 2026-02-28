import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createPlantSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  species: z.string().max(100).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  planted_at: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sort = searchParams.get('sort') ?? 'newest'

  const orderColumn = sort === 'alphabetical' ? 'name' : 'created_at'
  const ascending = sort === 'alphabetical'

  const { data: plants, error } = await supabase
    .from('plants')
    .select(`
      id, user_id, name, species, location, planted_at, notes, created_at, updated_at,
      plant_photos (id, plant_id, storage_path, is_cover, created_at)
    `)
    .eq('user_id', user.id)
    .order(orderColumn, { ascending })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: 'Fehler beim Laden der Pflanzen.' }, { status: 500 })
  }

  // Generate signed URLs for cover photos
  const plantsWithUrls = await Promise.all(
    (plants ?? []).map(async (plant) => {
      const photos = plant.plant_photos ?? []
      const photosWithUrls = await Promise.all(
        photos.map(async (photo) => {
          const { data } = await supabase.storage
            .from('plant-photos')
            .createSignedUrl(photo.storage_path, 3600)
          return { ...photo, url: data?.signedUrl ?? '' }
        })
      )
      return { ...plant, plant_photos: photosWithUrls }
    })
  )

  return NextResponse.json(plantsWithUrls)
}

export async function POST(request: Request) {
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

  const parsed = createPlantSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { data: plant, error } = await supabase
    .from('plants')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Fehler beim Anlegen der Pflanze.' }, { status: 500 })
  }

  return NextResponse.json(plant, { status: 201 })
}
