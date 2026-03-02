import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CATEGORY_COLORS } from "@/lib/types/feed"
import type { FeedArticle, ArticleCategory } from "@/lib/types/feed"

interface ArticleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Validate UUID format before hitting the DB
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_REGEX.test(id)) {
    return <ArticleNotFoundState />
  }

  // Fetch the article - RLS ensures the user can only see their own personalized articles or general ones
  const DETAIL_FIELDS = "id, title, summary, content, category, reading_time, created_at"
  const { data: article, error } = await supabase
    .from("feed_articles")
    .select(DETAIL_FIELDS)
    .eq("id", id)
    .single()

  if (error || !article) {
    return <ArticleNotFoundState />
  }

  const feedArticle = article as FeedArticle
  const colors = CATEGORY_COLORS[feedArticle.category] ?? CATEGORY_COLORS["Allgemein"]
  const createdDate = new Date(feedArticle.created_at).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <article className="max-w-2xl mx-auto">
      {/* Back Navigation */}
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link href="/feed">
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Feed
        </Link>
      </Button>

      {/* Article Header */}
      <header className="space-y-4 mb-6">
        <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0 text-xs font-medium`}>
          {feedArticle.category}
        </Badge>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {feedArticle.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {feedArticle.reading_time} Min. Lesezeit
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            {createdDate}
          </span>
        </div>
      </header>

      <Separator className="mb-6" />

      {/* Article Body */}
      <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground">
        {feedArticle.content.split("\n").map((paragraph, index) => {
          const trimmed = paragraph.trim()
          if (!trimmed) return null

          // Handle markdown-style headings
          if (trimmed.startsWith("### ")) {
            return (
              <h3 key={index} className="text-lg font-semibold mt-6 mb-2">
                {trimmed.slice(4)}
              </h3>
            )
          }
          if (trimmed.startsWith("## ")) {
            return (
              <h2 key={index} className="text-xl font-semibold mt-8 mb-3">
                {trimmed.slice(3)}
              </h2>
            )
          }
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return (
              <li key={index} className="text-base leading-relaxed text-muted-foreground ml-4 list-disc">
                {trimmed.slice(2)}
              </li>
            )
          }

          return (
            <p key={index} className="text-base leading-relaxed text-muted-foreground mb-4">
              {trimmed}
            </p>
          )
        })}
      </div>

      {/* Bottom Navigation */}
      <Separator className="mt-8 mb-6" />
      <Button asChild variant="outline" size="sm">
        <Link href="/feed">
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Feed
        </Link>
      </Button>
    </article>
  )
}

function ArticleNotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-lg font-medium">Artikel nicht gefunden</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Dieser Artikel existiert nicht mehr oder wurde entfernt.
      </p>
      <Button asChild variant="outline">
        <Link href="/feed">
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Feed
        </Link>
      </Button>
    </div>
  )
}
