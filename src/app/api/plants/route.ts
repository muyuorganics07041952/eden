import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createPlantSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  species: z.string().max(100).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  planted_at: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string().trim().max(50)).max(10).optional().default([]),
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
      id, user_id, name, species, location, planted_at, notes, tags, created_at, updated_at,
      plant_photos (id, plant_id, storage_path, is_cover, created_at)
    `)
    .eq('user_id', user.id)
    .order(orderColumn, { ascending })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: 'Fehler beim Laden der Pflanzen.' }, { status: 500 })
  }

  // Collect only the cover photo path per plant (first photo if none marked as cover).
  // The detail page generates URLs for all photos; the list only needs the thumbnail.
  const plantList = plants ?? []
  const coverPaths: string[] = []
  for (const plant of plantList) {
    const photos = plant.plant_photos ?? []
    const cover = photos.find((p) => p.is_cover) ?? photos[0] ?? null
    if (cover) coverPaths.push(cover.storage_path)
  }

  // One batch call for all cover photos instead of N×M individual calls
  const { data: signedUrls } = coverPaths.length > 0
    ? await supabase.storage.from('plant-photos').createSignedUrls(coverPaths, 3600)
    : { data: [] }

  const urlMap = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]))

  const plantsWithUrls = plantList.map((plant) => {
    const photos = plant.plant_photos ?? []
    const cover = photos.find((p) => p.is_cover) ?? photos[0] ?? null
    return {
      ...plant,
      plant_photos: photos.map((photo) => ({
        ...photo,
        url: cover && photo.storage_path === cover.storage_path
          ? (urlMap.get(photo.storage_path) ?? '')
          : '',
      })),
    }
  })

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

  // Process tags: trim, filter empty, deduplicate case-insensitively
  const rawTags = parsed.data.tags ?? []
  const seen = new Set<string>()
  const processedTags = rawTags
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .filter((t) => {
      const lower = t.toLowerCase()
      if (seen.has(lower)) return false
      seen.add(lower)
      return true
    })

  const { data: plant, error } = await supabase
    .from('plants')
    .insert({ ...parsed.data, tags: processedTags, user_id: user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Fehler beim Anlegen der Pflanze.' }, { status: 500 })
  }

  return NextResponse.json(plant, { status: 201 })
}
