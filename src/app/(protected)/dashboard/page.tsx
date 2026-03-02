import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Leaf, Sprout, ClipboardList, Newspaper, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArticleCard } from '@/components/feed/article-card'
import { UpcomingTasksSection } from '@/components/dashboard/upcoming-tasks-section'
import { SeasonalTipWidget } from '@/components/dashboard/seasonal-tip-widget'
import { WeatherWidget } from '@/components/dashboard/weather-widget'
import { WeatherSection, WeatherSkeleton } from '@/components/dashboard/weather-section'
import type { FeedArticle } from '@/lib/types/feed'

type TaskRow = {
  id: string
  name: string
  next_due_date: string
  plants: { name: string } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = user?.email?.split('@')[0] ?? 'Gärtner'

  const PREVIEW_FIELDS = 'id, title, summary, category, reading_time, created_at'
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: plantCount },
    { count: taskCount },
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
      .from('care_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .lte('next_due_date', today),
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
      .select('city_name, latitude, longitude')
      .eq('user_id', user!.id)
      .maybeSingle(),
  ])

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

  // Count distinct plants with overdue tasks (not individual task count)
  const safeOverdueCount = new Set((overdueTasksRaw ?? []).map((t) => t.plant_id)).size

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hallo, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Willkommen in deinem Garten.
        </p>
      </div>

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
        <div className="grid gap-4 sm:grid-cols-2">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heute fällige Aufgaben</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {(taskCount ?? 0) === 0 ? 'Alles erledigt!' : (taskCount === 1 ? 'Aufgabe fällig' : 'Aufgaben fällig')}
              </p>
              <Button asChild variant="link" className="px-0 mt-2 h-auto text-xs">
                <Link href="/tasks">Aufgaben ansehen →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
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
