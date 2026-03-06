import { z } from "zod"

export const ARTICLE_CATEGORIES = [
  "Bewässerung",
  "Düngung",
  "Schädlinge & Krankheiten",
  "Saisonales",
  "Allgemein",
] as const

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]

export interface FeedArticle {
  id: string
  user_id: string | null
  title: string
  summary: string
  content: string
  category: ArticleCategory
  reading_time: number
  title_hash: string
  plant_context: string[] | null
  created_at: string
}

/** Subset returned by GET /api/feed (no content field for bandwidth) */
export type FeedArticlePreview = Omit<FeedArticle, "content" | "title_hash" | "plant_context">

/** Response shape for GET /api/feed */
export interface FeedResponse {
  personalized: FeedArticlePreview[]
  general: FeedArticlePreview[]
}

/** Zod schema for validating Gemini-generated article JSON */
export const geminiArticleSchema = z.object({
  title: z.string().min(1).max(500),
  summary: z.string().min(1).max(500),
  content: z.string().min(1),
  category: z.enum(ARTICLE_CATEGORIES),
})

export type GeminiArticle = z.infer<typeof geminiArticleSchema>

export const CATEGORY_COLORS: Record<ArticleCategory, { bg: string; text: string }> = {
  "Bewässerung": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  "Düngung": { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  "Schädlinge & Krankheiten": { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  "Saisonales": { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  "Allgemein": { bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-700 dark:text-gray-300" },
}
