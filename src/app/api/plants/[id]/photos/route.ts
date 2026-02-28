import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MAX_PHOTOS = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: plantId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Verify plant belongs to user
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('id')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    return NextResponse.json({ error: 'Pflanze nicht gefunden.' }, { status: 404 })
  }

  // Check current photo count
  const { count } = await supabase
    .from('plant_photos')
    .select('id', { count: 'exact', head: true })
    .eq('plant_id', plantId)
    .eq('user_id', user.id)

  if ((count ?? 0) >= MAX_PHOTOS) {
    return NextResponse.json(
      { error: `Maximale Anzahl von ${MAX_PHOTOS} Fotos erreicht.` },
      { status: 422 }
    )
  }

  // Parse multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Ungültige Formulardaten.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Keine Datei übermittelt.' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'Datei zu groß. Maximal 5 MB erlaubt.' },
      { status: 422 }
    )
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Ungültiges Dateiformat. Erlaubt: JPEG, PNG, WebP.' },
      { status: 422 }
    )
  }

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storagePath = `${user.id}/${plantId}/${fileName}`

  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('plant-photos')
    .upload(storagePath, bytes, { contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: 'Foto-Upload fehlgeschlagen.' }, { status: 500 })
  }

  // Determine if this should be the cover (first photo gets cover automatically)
  const isCover = (count ?? 0) === 0

  // Register photo in DB
  const { data: photo, error: dbError } = await supabase
    .from('plant_photos')
    .insert({
      plant_id: plantId,
      user_id: user.id,
      storage_path: storagePath,
      is_cover: isCover,
    })
    .select()
    .single()

  if (dbError) {
    // Cleanup orphaned storage file
    await supabase.storage.from('plant-photos').remove([storagePath])
    return NextResponse.json({ error: 'Fehler beim Speichern des Fotos.' }, { status: 500 })
  }

  // Generate signed URL for the response
  const { data: signedData } = await supabase.storage
    .from('plant-photos')
    .createSignedUrl(storagePath, 3600)

  return NextResponse.json({ ...photo, url: signedData?.signedUrl ?? '' }, { status: 201 })
}
