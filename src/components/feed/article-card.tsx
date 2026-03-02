import Link from "next/link"
import { Clock } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { FeedArticle } from "@/lib/types/feed"
import { CATEGORY_COLORS } from "@/lib/types/feed"

interface ArticleCardProps {
  article: FeedArticle
}

export function ArticleCard({ article }: ArticleCardProps) {
  const colors = CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS["Allgemein"]

  return (
    <Link href={`/feed/${article.id}`} className="block group" aria-label={`Artikel lesen: ${article.title}`}>
      <Card className="h-full transition-colors group-hover:border-primary/40">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0 text-xs font-medium`}>
              {article.category}
            </Badge>
          </div>
          <h3 className="text-base font-semibold leading-snug mt-2 group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {article.summary}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>{article.reading_time} Min. Lesezeit</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
