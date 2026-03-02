import { createClient } from "@/lib/supabase/server"
import { Newspaper, Sparkles, BookOpen, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { ArticleCard } from "@/components/feed/article-card"
import type { FeedArticle } from "@/lib/types/feed"

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch personalized articles (user_id = current user)
  const { data: personalizedArticles, error: personalizedError } = await supabase
    .from("feed_articles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  // Fetch general articles (user_id is null)
  const { data: generalArticles, error: generalError } = await supabase
    .from("feed_articles")
    .select("*")
    .is("user_id", null)
    .order("created_at", { ascending: false })
    .limit(20)

  const personalized = (personalizedArticles ?? []) as FeedArticle[]
  const general = (generalArticles ?? []) as FeedArticle[]
  const hasPersonalized = personalized.length > 0
  const hasGeneral = general.length > 0
  const hasAnyContent = hasPersonalized || hasGeneral
  const hasError = personalizedError || generalError

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Feed</h1>
        <p className="text-muted-foreground mt-1">
          Tipps und Wissen rund um deinen Garten.
        </p>
      </div>

      {/* Error State */}
      {hasError && !hasAnyContent && (
        <FeedErrorState />
      )}

      {/* Empty State */}
      {!hasError && !hasAnyContent && (
        <EmptyFeedState />
      )}

      {/* Personalized Section */}
      {hasPersonalized && (
        <section aria-label="Personalisierte Artikel">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Für deine Pflanzen</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {personalized.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* General Section */}
      {hasGeneral && (
        <section aria-label="Allgemeine Gartenartikel">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Garten-Wissen</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {general.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function EmptyFeedState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <Newspaper className="h-10 w-10 text-primary/40" />
      </div>
      <h2 className="text-lg font-medium">Dein Feed wird vorbereitet</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        Schau bald wieder vorbei -- neue Gartentipps und personalisierte Inhalte werden regelmaessig fuer dich erstellt.
      </p>
    </div>
  )
}

function FeedErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-destructive/10 p-4 rounded-full mb-4">
        <Newspaper className="h-10 w-10 text-destructive/60" />
      </div>
      <p className="text-sm text-muted-foreground mb-2">Fehler beim Laden der Inhalte.</p>
      <p className="text-xs text-muted-foreground">Bitte versuche es spaeter erneut.</p>
    </div>
  )
}
