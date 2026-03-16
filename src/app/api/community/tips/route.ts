import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { CommunityTip } from '@/lib/types/community'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const RATE_LIMIT_TIPS_PER_DAY = 10

const getTipsQuerySchema = z.object({
  plant_name: z.string().min(1, 'plant_name ist erforderlich'),
  species: z.string().optional(),
})

const createTipSchema = z.object({
  plant_name: z.string().min(1, 'Pflanzenname ist erforderlich'),
  plant_species: z.string().optional(),
  text: z.string().min(1, 'Tipp-Text ist erforderlich').max(500, 'Maximal 500 Zeichen'),
})

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

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

  // BUG-2 + BUG-4 fix: Use parameterized RPC for safe bidirectional matching
  const { data: tips, error: tipsError } = await supabase.rpc(
    'get_community_tips_for_plant',
    { p_plant_name: plant_name, p_species: species ?? null }
  )

  if (tipsError) {
    console.error('Error fetching community tips:', tipsError)
    return NextResponse.json({ error: 'Fehler beim Laden der Tipps.' }, { status: 500 })
  }

  if (!tips || tips.length === 0) {
    return NextResponse.json([])
  }

  const tipIds = (tips as { id: string }[]).map((t) => t.id)

  // Batch fetch likes for current user
  const { data: userLikes } = await supabase
    .from('community_tip_likes')
    .select('tip_id')
    .eq('user_id', user.id)
    .in('tip_id', tipIds)

  const likedTipIds = new Set((userLikes ?? []).map((l) => l.tip_id))

  // Batch fetch comment counts
  const { data: commentRows } = await supabase
    .from('community_tip_comments')
    .select('tip_id')
    .in('tip_id', tipIds)

  const commentCountMap = new Map<string, number>()
  for (const row of commentRows ?? []) {
    commentCountMap.set(row.tip_id, (commentCountMap.get(row.tip_id) ?? 0) + 1)
  }

  // BUG-3 fix: Generate signed URLs (bucket is now private)
  // BUG-10 fix: Use snapshotted author_name from table — no admin client needed
  const result: CommunityTip[] = await Promise.all(
    (tips as Record<string, unknown>[]).map(async (tip) => {
      let photo_url: string | undefined
      if (tip.photo_path) {
        const { data: urlData } = await supabase.storage
          .from('community-tips')
          .createSignedUrl(tip.photo_path as string, 3600)
        photo_url = urlData?.signedUrl ?? undefined
      }

      const tipId = tip.id as string
      return {
        id: tipId,
        user_id: tip.user_id as string | null,
        plant_name: tip.plant_name as string,
        plant_species: tip.plant_species as string | null,
        text: tip.text as string,
        photo_path: tip.photo_path as string | null,
        photo_url,
        likes_count: tip.likes_count as number,
        created_at: tip.created_at as string,
        author_name: (tip.author_name as string | null) ?? (tip.user_id ? 'Unbekannter Nutzer' : 'Gelöschter Nutzer'),
        has_liked: likedTipIds.has(tipId),
        comments_count: commentCountMap.get(tipId) ?? 0,
      }
    })
  )

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // BUG-9 fix: Rate limit — max 10 tips per 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from('community_tips')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since)

  if (recentCount !== null && recentCount >= RATE_LIMIT_TIPS_PER_DAY) {
    return NextResponse.json(
      { error: `Du kannst maximal ${RATE_LIMIT_TIPS_PER_DAY} Tipps pro Tag erstellen.` },
      { status: 429 }
    )
  }

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

  // BUG-10 fix: Snapshot author name at insert time
  const meta = user.user_metadata
  const author_name = meta?.display_name || meta?.full_name || meta?.name || 'Unbekannter Nutzer'

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

  const { data: tip, error: insertError } = await supabase
    .from('community_tips')
    .insert({
      user_id: user.id,
      plant_name,
      plant_species: plant_species ?? null,
      text,
      photo_path,
      author_name,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating community tip:', insertError)
    if (photo_path) {
      await supabase.storage.from('community-tips').remove([photo_path])
    }
    return NextResponse.json({ error: 'Fehler beim Erstellen des Tipps.' }, { status: 500 })
  }

  // BUG-3 fix: Use signed URL for response
  let photo_url: string | undefined
  if (tip.photo_path) {
    const { data: urlData } = await supabase.storage
      .from('community-tips')
      .createSignedUrl(tip.photo_path, 3600)
    photo_url = urlData?.signedUrl ?? undefined
  }

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
