import { createClient } from '@/lib/supabase/server'
import { Leaf, Newspaper } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArticleCard } from '@/components/feed/article-card'
import { SeasonalCover } from '@/components/dashboard/seasonal-cover'
import type { FeedArticle } from '@/lib/types/feed'

type OverdueTaskRow = {
  plant_id: string
  plants: { name: string } | null
}

function getWeatherGreeting(
  rainProb: number,
  maxTemp: number,
  minTemp: number,
  code: number
): string {
  if (rainProb > 60) return 'Lass den Regen die Arbeit machen – kein Gießen nötig heute. 🌧️'
  if (maxTemp > 32) return 'Sehr heiß heute – gieße morgens früh oder erst abends. 🌡️'
  if (minTemp < 3) return 'Frost möglich heute Nacht – schütze empfindliche Pflanzen. ❄️'
  if (maxTemp >= 15 && maxTemp <= 26 && rainProb <= 30) return 'Perfektes Gartenwetter heute – ideal für Pflanzarbeiten. ☀️'
  if (code === 0 || code === 1) return 'Schöner Tag – eine gute Zeit für deinen Garten. 🌿'
  if (code >= 51 && code <= 82) return 'Regnerisch heute – kein Gießen nötig, die Natur übernimmt. ☔'
  return 'Schau nach deinen Pflanzen und genieße deinen Garten. 🌱'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const PREVIEW_FIELDS = 'id, title, summary, category, reading_time, created_at'
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: plantCount },
    { data: personalizedArticles },
    { data: generalArticles },
    { data: overdueTasksRaw },
    { data: userSettings },
  ] = await Promise.all([
    supabase
      .from('plants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
    supabase
      .from('feed_articles')
      .select(PREVIEW_FIELDS)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('feed_articles')
      .select(PREVIEW_FIELDS)
      .is('user_id', null)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('care_tasks')
      .select('plant_id, plants(name)')
      .eq('user_id', user!.id)
      .lt('next_due_date', today),
    supabase
      .from('user_settings')
      .select('city_name, latitude, longitude, display_name')
      .eq('user_id', user!.id)
      .maybeSingle(),
  ])

  // Fetch today's weather for the contextual greeting
  let weatherGreeting: string | null = null
  if (userSettings?.latitude && userSettings?.longitude) {
    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${userSettings.latitude}&longitude=${userSettings.longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe/Berlin&forecast_days=7`,
        { next: { revalidate: 3600 } }
      )
      if (weatherRes.ok) {
        const json = await weatherRes.json()
        const d = json.daily
        weatherGreeting = getWeatherGreeting(
          d.precipitation_probability_max[0],
          d.temperature_2m_max[0],
          d.temperature_2m_min[0],
          d.weathercode[0]
        )
      }
    } catch {
      // no weather greeting, fallback to generic subtitle
    }
  }

  const displayName = userSettings?.display_name?.trim()
  const firstName = displayName || user?.email?.split('@')[0] || 'Gärtner'

  const allArticles = [...(personalizedArticles ?? []), ...(generalArticles ?? [])] as FeedArticle[]
  const previewArticles = allArticles.slice(0, 3)

  const hasPlants = (plantCount ?? 0) > 0

  const overdueGroups = Object.values(
    ((overdueTasksRaw ?? []) as unknown as OverdueTaskRow[]).reduce<
      Record<string, { plantId: string; plantName: string }>
    >((acc, t) => {
      if (!acc[t.plant_id]) {
        acc[t.plant_id] = {
          plantId: t.plant_id,
          plantName: t.plants?.name ?? 'Unbekannte Pflanze',
        }
      }
      return acc
    }, {})
  )

  return (
    <div className="space-y-8">
      <SeasonalCover name={firstName} weatherSubtitle={weatherGreeting} />

      {!hasPlants ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-primary/10 p-4 rounded-full">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle>Dein Garten wartet</CardTitle>
            <CardDescription>
              Füge deine erste Pflanze hinzu und beginne deinen digitalen Garten aufzubauen.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/plants">Erste Pflanze anlegen</Link>
            </Button>
          </CardContent>
        </Card>
      ) : overdueGroups.length > 0 ? (
        <div className="rounded-xl bg-orange-50 border border-orange-200/60 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-orange-800">
                {overdueGroups.length === 1
                  ? '1 Pflanze braucht Aufmerksamkeit'
                  : `${overdueGroups.length} Pflanzen brauchen Aufmerksamkeit`}
              </p>
              <p className="text-xs text-orange-700/70 mt-0.5 truncate">
                {overdueGroups.map((g) => g.plantName).join(' · ')}
              </p>
            </div>
            <Button asChild variant="link" className="h-auto p-0 text-sm text-orange-700 shrink-0">
              <Link href="/tasks">Jetzt kümmern →</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {/* Feed Preview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Garten-Wissen</h2>
          </div>
          <Button asChild variant="link" className="h-auto p-0 text-sm">
            <Link href="/feed">Alle Artikel →</Link>
          </Button>
        </div>
        {previewArticles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previewArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Newspaper className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Dein Feed wird vorbereitet – schau bald wieder vorbei.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
