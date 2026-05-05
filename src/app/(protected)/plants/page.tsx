import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlantsClient } from '@/components/plants/plants-client'

export default async function PlantsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')
  const userId = session.user.id

  const today = new Date().toISOString().split('T')[0]

  const [{ data: plants }, { data: dueTasks }] = await Promise.all([
    supabase
      .from('plants')
      .select(`
        id, user_id, name, species, location, planted_at, notes, tags, created_at, updated_at,
        plant_photos (id, plant_id, storage_path, is_cover, created_at)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('care_tasks')
      .select('id, plant_id, next_due_date')
      .eq('user_id', userId)
      .lte('next_due_date', today)
      .limit(200),
  ])

  // Batch-sign one cover URL per plant (same logic as /api/plants)
  const plantList = plants ?? []
  const coverPaths: string[] = []
  for (const plant of plantList) {
    const photos = plant.plant_photos ?? []
    const cover = photos.find((p) => p.is_cover) ?? photos[0] ?? null
    if (cover) coverPaths.push(cover.storage_path)
  }

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

  return (
    <PlantsClient
      initialPlants={plantsWithUrls}
      initialDueTasks={dueTasks ?? []}
    />
  )
}
