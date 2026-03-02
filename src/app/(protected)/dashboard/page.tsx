import { createClient } from '@/lib/supabase/server'
import { Leaf, Sprout, ClipboardList, Newspaper } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArticleCard } from '@/components/feed/article-card'
import type { FeedArticle } from '@/lib/types/feed'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = user?.email?.split('@')[0] ?? 'Gärtner'

  const PREVIEW_FIELDS = 'id, title, summary, category, reading_time, created_at'

  const [{ count: plantCount }, { count: taskCount }, { data: personalizedArticles }, { data: generalArticles }] = await Promise.all([
    supabase
      .from('plants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
    supabase
      .from('care_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .lte('next_due_date', new Date().toISOString().split('T')[0]),
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
  ])

  // Show up to 3 articles: personalized first, fill with general
  const allArticles = [...(personalizedArticles ?? []), ...(generalArticles ?? [])] as FeedArticle[]
  const previewArticles = allArticles.slice(0, 3)

  const hasPlants = (plantCount ?? 0) > 0

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
