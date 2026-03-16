import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { CommunityTip } from '@/lib/types/community'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const getTipsQuerySchema = z.object({
  plant_name: z.string().min(1, 'plant_name ist erforderlich'),
  species: z.string().optional(),
})

const createTipSchema = z.object({
  plant_name: z.string().min(1, 'Pflanzenname ist erforderlich'),
  plant_species: z.string().optional(),
  text: z.string().min(1, 'Tipp-Text ist erforderlich').max(500, 'Maximal 500 Zeichen'),
})

/**
 * Resolve display names for a set of user IDs via the admin API.
 * Returns a map of userId -> displayName.
 */
async function resolveAuthorNames(userIds: string[]): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>()
  if (userIds.length === 0) return nameMap

  const adminClient = createAdminClient()
  const uniqueIds = [...new Set(userIds)]

  // Fetch users in batches (admin API supports listing)
  for (const uid of uniqueIds) {
    try {
      const { data } = await adminClient.auth.admin.getUserById(uid)
      const meta = data?.user?.user_metadata
      const name = meta?.display_name || meta?.full_name || meta?.name
      nameMap.set(uid, name || 'Unbekannter Nutzer')
    } catch {
      nameMap.set(uid, 'Unbekannter Nutzer')
    }
  }

  return nameMap
}

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Parse query params
  const { searchParams } = new URL(request.url)
  const parsed = getTipsQuerySchema.safeParse({
    plant_name: searchParams.get('plant_name') ?? undefined,
    species: searchParams.get('species') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Anfrage.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { plant_name, species } = parsed.data

  // Build the matching query using OR conditions:
  // tip.plant_name matches plant_name (bidirectional ILIKE)
  // OR tip.plant_species matches species (bidirectional ILIKE, if provided)
  let query = supabase
    .from('community_tips')
    .select('*')

  // Build OR filter for flexible matching
  const orConditions: string[] = [
    `plant_name.ilike.%${plant_name}%`,
  ]

  if (species) {
    orConditions.push(`plant_species.ilike.%${species}%`)
  }

  query = query.or(orConditions.join(','))
  query = query
    .order('likes_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: tips, error: tipsError } = await query

  if (tipsError) {
    console.error('Error fetching community tips:', tipsError)
    return NextResponse.json({ error: 'Fehler beim Laden der Tipps.' }, { status: 500 })
  }

  if (!tips || tips.length === 0) {
    return NextResponse.json([])
  }

  const tipIds = tips.map((t) => t.id)

  // Fetch likes for current user in one query
  const { data: userLikes } = await supabase
    .from('community_tip_likes')
    .select('tip_id')
    .eq('user_id', user.id)
    .in('tip_id', tipIds)

  const likedTipIds = new Set((userLikes ?? []).map((l) => l.tip_id))

  // Fetch comment counts in one query using Supabase RPC or manual count
  // We use a separate query per-tip but batch it
  const { data: commentCounts } = await supabase
    .from('community_tip_comments')
    .select('tip_id')
    .in('tip_id', tipIds)

  // Count comments per tip
  const commentCountMap = new Map<string, number>()
  for (const row of commentCounts ?? []) {
    commentCountMap.set(row.tip_id, (commentCountMap.get(row.tip_id) ?? 0) + 1)
  }

  // Resolve author names for all tips with user_ids
  const authorUserIds = tips
    .map((t) => t.user_id)
    .filter((uid): uid is string => uid !== null)
  const authorNames = await resolveAuthorNames(authorUserIds)

  // Build photo URLs
  const result: CommunityTip[] = tips.map((tip) => {
    let photo_url: string | undefined
    if (tip.photo_path) {
      const { data: urlData } = supabase.storage
        .from('community-tips')
        .getPublicUrl(tip.photo_path)
      photo_url = urlData?.publicUrl
    }

    return {
      id: tip.id,
      user_id: tip.user_id,
      plant_name: tip.plant_name,
      plant_species: tip.plant_species,
      text: tip.text,
      photo_path: tip.photo_path,
      photo_url,
      likes_count: tip.likes_count,
      created_at: tip.created_at,
      author_name: tip.user_id
        ? (authorNames.get(tip.user_id) ?? 'Unbekannter Nutzer')
        : 'Gelöschter Nutzer',
      has_liked: likedTipIds.has(tip.id),
      comments_count: commentCountMap.get(tip.id) ?? 0,
    }
  })

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Parse multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Ungültige Formulardaten.' }, { status: 400 })
  }

  const rawData = {
    plant_name: formData.get('plant_name'),
    plant_species: formData.get('plant_species') || undefined,
    text: formData.get('text'),
  }

  const parsed = createTipSchema.safeParse(rawData)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { plant_name, plant_species, text } = parsed.data

  // Handle optional photo upload
  let photo_path: string | null = null
  const photo = formData.get('photo')

  if (photo && photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Datei zu groß. Maximal 5 MB erlaubt.' },
        { status: 422 }
      )
    }

    if (!ALLOWED_TYPES.includes(photo.type)) {
      return NextResponse.json(
        { error: 'Ungültiges Dateiformat. Erlaubt: JPEG, PNG, WebP.' },
        { status: 422 }
      )
    }

    const ext = photo.name.split('.').pop() ?? 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const storagePath = `${user.id}/${fileName}`

    const bytes = await photo.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('community-tips')
      .upload(storagePath, bytes, { contentType: photo.type })

    if (uploadError) {
      console.error('Error uploading community tip photo:', uploadError)
      return NextResponse.json({ error: 'Foto-Upload fehlgeschlagen.' }, { status: 500 })
    }

    photo_path = storagePath
  }

  // Insert tip
  const { data: tip, error: insertError } = await supabase
    .from('community_tips')
    .insert({
      user_id: user.id,
      plant_name,
      plant_species: plant_species ?? null,
      text,
      photo_path,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating community tip:', insertError)
    // Cleanup orphaned photo
    if (photo_path) {
      await supabase.storage.from('community-tips').remove([photo_path])
    }
    return NextResponse.json({ error: 'Fehler beim Erstellen des Tipps.' }, { status: 500 })
  }

  // Build photo URL for response
  let photo_url: string | undefined
  if (tip.photo_path) {
    const { data: urlData } = supabase.storage
      .from('community-tips')
      .getPublicUrl(tip.photo_path)
    photo_url = urlData?.publicUrl
  }

  // Get author name from user metadata
  const meta = user.user_metadata
  const author_name = meta?.display_name || meta?.full_name || meta?.name || 'Unbekannter Nutzer'

  const result: CommunityTip = {
    id: tip.id,
    user_id: tip.user_id,
    plant_name: tip.plant_name,
    plant_species: tip.plant_species,
    text: tip.text,
    photo_path: tip.photo_path,
    photo_url,
    likes_count: tip.likes_count,
    created_at: tip.created_at,
    author_name,
    has_liked: false,
    comments_count: 0,
  }

  return NextResponse.json(result, { status: 201 })
}
