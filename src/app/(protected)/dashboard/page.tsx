import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Leaf, Sprout, Newspaper, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArticleCard } from '@/components/feed/article-card'
import { UpcomingTasksSection } from '@/components/dashboard/upcoming-tasks-section'
import { SeasonalTipWidget } from '@/components/dashboard/seasonal-tip-widget'
import { WeatherWidget } from '@/components/dashboard/weather-widget'
import { WeatherSection, WeatherSkeleton } from '@/components/dashboard/weather-section'
import { SeasonalCover } from '@/components/dashboard/seasonal-cover'
import type { FeedArticle } from '@/lib/types/feed'

type TaskRow = {
  id: string
  name: string
  next_due_date: string
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
    { data: upcomingTasksRaw },
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
      .select('id, name, next_due_date, plants(name)')
      .eq('user_id', user!.id)
      .order('next_due_date', { ascending: true })
      .limit(6),
    supabase
      .from('care_tasks')
      .select('plant_id')
      .eq('user_id', user!.id)
      .lt('next_due_date', today),
    supabase
      .from('user_settings')
      .select('city_name, latitude, longitude, display_name')
      .eq('user_id', user!.id)
      .maybeSingle(),
  ])

  // Fetch today's weather for the contextual greeting (same URL as WeatherSection → Next.js deduplicates)
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

  // Greeting name: prefer display_name, fall back to email prefix
  const displayName = userSettings?.display_name?.trim()
  const firstName = displayName || user?.email?.split('@')[0] || 'Gärtner'

  // Show up to 3 articles: personalized first, fill with general
  const allArticles = [...(personalizedArticles ?? []), ...(generalArticles ?? [])] as FeedArticle[]
  const previewArticles = allArticles.slice(0, 3)

  const hasPlants = (plantCount ?? 0) > 0

  // Prepare upcoming tasks
  const typedTasks = (upcomingTasksRaw ?? []) as unknown as TaskRow[]
  const upcomingTasks = typedTasks.slice(0, 5).map((t) => ({
    id: t.id,
    name: t.name,
    plant_name: t.plants?.name ?? 'Unbekannte Pflanze',
    next_due_date: t.next_due_date,
  }))
  const totalUpcomingCount = typedTasks.length

  // Count distinct plants with overdue tasks
  const safeOverdueCount = new Set((overdueTasksRaw ?? []).map((t) => t.plant_id)).size

  return (
    <div className="space-y-8">
      {/* Seasonal cover with contextual greeting */}
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
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meine Pflanzen</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plantCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {plantCount === 1 ? 'Pflanze in deinem Garten' : 'Pflanzen in deinem Garten'}
            </p>
            {safeOverdueCount > 0 && (
              <Link href="/tasks" className="block">
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {safeOverdueCount} {safeOverdueCount === 1 ? 'Pflanze braucht' : 'Pflanzen brauchen'} Aufmerksamkeit
                </p>
              </Link>
            )}
            <Button asChild variant="link" className="px-0 mt-2 h-auto text-xs">
              <Link href="/plants">Alle Pflanzen ansehen →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Tasks */}
      <UpcomingTasksSection tasks={upcomingTasks} totalCount={totalUpcomingCount} />

      {/* Seasonal Tip */}
      <SeasonalTipWidget />

      {/* Weather Widget */}
      {userSettings?.latitude && userSettings?.longitude ? (
        <Suspense fallback={<WeatherSkeleton />}>
          <WeatherSection
            latitude={userSettings.latitude}
            longitude={userSettings.longitude}
            cityName={userSettings.city_name ?? ''}
          />
        </Suspense>
      ) : (
        <WeatherWidget weather={null} cityName={null} />
      )}

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
