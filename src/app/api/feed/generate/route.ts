import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHash } from 'crypto'
import { geminiArticleSchema, ARTICLE_CATEGORIES } from '@/lib/types/feed'
import type { ArticleCategory } from '@/lib/types/feed'

// Allow up to 5 minutes (capped by Vercel plan)
export const maxDuration = 300

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
const API_TIMEOUT = 30_000 // 30 seconds (longer for article generation)
const MAX_USERS = 50

function titleHash(title: string): string {
  return createHash('sha256').update(title).digest('hex')
}

function calculateReadingTime(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(wordCount / 200))
}

/**
 * Extract and parse a JSON object from Gemini's response text.
 * Handles markdown fences and thinking parts.
 */
function parseGeminiJson(result: Record<string, unknown>): unknown | null {
  const candidates = result?.candidates as Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }> | undefined
  const parts = candidates?.[0]?.content?.parts ?? []
  const rawText = parts.filter((p) => !p.thought).map((p) => p.text ?? '').join('\n')

  const stripped = rawText.replace(/```json?\s*/g, '').replace(/```/g, '')

  // Try to find a JSON object
  const startIdx = stripped.indexOf('{')
  const endIdx = stripped.lastIndexOf('}')
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    return null
  }

  try {
    return JSON.parse(stripped.slice(startIdx, endIdx + 1))
  } catch {
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callGemini(prompt: string, apiKey: string): Promise<unknown | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.error('Gemini API error:', response.status, await response.text().catch(() => ''))
      return null
    }

    const result = await response.json()
    return parseGeminiJson(result)
  } catch (err) {
    clearTimeout(timeout)
    console.error('Gemini API call failed:', err)
    return null
  }
}

function getGeneralArticlePrompt(category: ArticleCategory, month: string): string {
  return `Du bist ein Gartenexperte und schreibst informative Artikel für Hobby-Gärtner auf Deutsch.

Erstelle einen Gartenartikel zum Thema "${category}" passend zum Monat ${month}.

Antworte NUR mit einem JSON-Objekt (kein Markdown, keine Erklärung) mit folgenden Feldern:
- "title": string (Artikeltitel, max. 200 Zeichen, einzigartig und spezifisch)
- "summary": string (Kurztext für Vorschau, max. 150 Zeichen)
- "content": string (vollständiger Artikeltext, 300-600 Wörter, informativ und praktisch)
- "category": "${category}"

Der Artikel soll praktische Tipps enthalten, die Hobby-Gärtner sofort umsetzen können.`
}

function getPersonalizedArticlePrompt(
  plantNames: string[],
  upcomingTasks: string[],
  category: ArticleCategory
): string {
  const plantsStr = plantNames.join(', ')
  const tasksStr = upcomingTasks.length > 0
    ? `Anstehende Aufgaben: ${upcomingTasks.join('; ')}`
    : 'Keine speziellen Aufgaben in den nächsten Tagen.'

  return `Du bist ein Gartenexperte und schreibst personalisierte Pflegetipps auf Deutsch.

Der Nutzer hat folgende Pflanzen: ${plantsStr}
${tasksStr}

Erstelle einen personalisierten Gartenartikel zum Thema "${category}" der sich auf diese Pflanzen bezieht.

Antworte NUR mit einem JSON-Objekt (kein Markdown, keine Erklärung) mit folgenden Feldern:
- "title": string (Artikeltitel, max. 200 Zeichen, einzigartig und spezifisch)
- "summary": string (Kurztext für Vorschau, max. 150 Zeichen)
- "content": string (vollständiger Artikeltext, 300-600 Wörter, personalisiert und praktisch)
- "category": "${category}"

Der Artikel soll direkt auf die genannten Pflanzen eingehen und konkrete Tipps geben.`
}

/**
 * Selects up to 5 plants for personalization.
 * Priority: plants with care tasks due in the next 14 days.
 * Fills remaining slots with random other plants.
 */
async function selectPlantsForUser(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<{ plants: Array<{ id: string; name: string; species: string | null }>; tasks: Array<{ plant_name: string; task_name: string; due_date: string }> }> {
  const today = new Date().toISOString().split('T')[0]
  const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Get plants with tasks due in next 14 days
  const { data: tasksWithPlants } = await supabase
    .from('care_tasks')
    .select('plant_id, name, next_due_date, plants!inner(id, name, species)')
    .eq('user_id', userId)
    .gte('next_due_date', today)
    .lte('next_due_date', in14Days)
    .order('next_due_date', { ascending: true })
    .limit(100)

  type TaskRow = {
    plant_id: string
    name: string
    next_due_date: string
    plants: { id: string; name: string; species: string | null }
  }

  const taskRows = (tasksWithPlants ?? []) as unknown as TaskRow[]

  // Collect unique plants with tasks
  const plantMap = new Map<string, { id: string; name: string; species: string | null }>()
  const taskDescriptions: Array<{ plant_name: string; task_name: string; due_date: string }> = []

  for (const row of taskRows) {
    if (!plantMap.has(row.plant_id)) {
      plantMap.set(row.plant_id, row.plants)
    }
    taskDescriptions.push({
      plant_name: row.plants.name,
      task_name: row.name,
      due_date: row.next_due_date,
    })
  }

  let selectedPlants = Array.from(plantMap.values())

  // If > 5, randomly pick 5 for variety
  if (selectedPlants.length > 5) {
    selectedPlants = shuffleArray(selectedPlants).slice(0, 5)
  }

  // If < 5, fill with random other plants from the user
  if (selectedPlants.length < 5) {
    const selectedIds = selectedPlants.map((p) => p.id)
    const needed = 5 - selectedPlants.length

    // Fetch more than needed so we can shuffle for true randomization
    const { data: otherPlants } = await supabase
      .from('plants')
      .select('id, name, species')
      .eq('user_id', userId)
      .not('id', 'in', `(${selectedIds.length > 0 ? selectedIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
      .limit(50)

    if (otherPlants && otherPlants.length > 0) {
      const shuffled = shuffleArray(otherPlants)
      selectedPlants.push(...shuffled.slice(0, needed))
    }
  }

  return { plants: selectedPlants, tasks: taskDescriptions }
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured')
    return NextResponse.json({ error: 'Gemini API not configured' }, { status: 503 })
  }

  const supabase = createAdminClient()

  let generalGenerated = 0
  let usersProcessed = 0
  let personalizedGenerated = 0
  let errors = 0

  // --- Step 1: Generate 3 general articles with varied categories ---
  const currentMonth = new Date().toLocaleString('de-DE', { month: 'long' })
  const categoriesForGeneral = shuffleArray([...ARTICLE_CATEGORIES]).slice(0, 3)

  for (const category of categoriesForGeneral) {
    try {
      const prompt = getGeneralArticlePrompt(category, currentMonth)
      const raw = await callGemini(prompt, apiKey)

      const parsed = geminiArticleSchema.safeParse(raw)
      if (!parsed.success) {
        console.error('Invalid Gemini response for general article:', parsed.error.issues)
        errors++
        continue
      }

      const article = parsed.data
      const hash = titleHash(article.title)

      const { error: insertError } = await supabase
        .from('feed_articles')
        .upsert(
          {
            user_id: null,
            title: article.title.slice(0, 200),
            summary: article.summary.slice(0, 150),
            content: article.content,
            category: article.category,
            reading_time: calculateReadingTime(article.content),
            title_hash: hash,
            plant_context: null,
          },
          { onConflict: 'title_hash', ignoreDuplicates: true }
        )

      if (insertError) {
        console.error('Error inserting general article:', insertError)
        errors++
      } else {
        generalGenerated++
      }
    } catch (err) {
      console.error('Error generating general article:', err)
      errors++
    }
    // Short delay between Gemini calls to avoid rate limits
    await sleep(3_000)
  }

  // --- Step 2: Generate personalized articles for active users ---
  // Active users = users who have at least one plant
  const { data: activeUsers, error: usersError } = await supabase
    .from('plants')
    .select('user_id')
    .limit(1000)

  if (usersError) {
    console.error('Error fetching active users:', usersError)
    return NextResponse.json({
      generalGenerated,
      usersProcessed,
      personalizedGenerated,
      errors: errors + 1,
      message: 'Failed to fetch active users — personalized generation skipped',
    }, { status: 503 })
  }

  // Deduplicate user IDs and limit to MAX_USERS
  const uniqueUserIds = [...new Set((activeUsers ?? []).map((row) => row.user_id))].slice(0, MAX_USERS)

  for (const userId of uniqueUserIds) {
    try {
      const { plants, tasks } = await selectPlantsForUser(supabase, userId)

      if (plants.length === 0) {
        continue
      }

      const plantNames = plants.map((p) => p.name)
      const upcomingTaskDescriptions = tasks
        .slice(0, 10)
        .map((t) => `${t.plant_name}: ${t.task_name} (fällig: ${t.due_date})`)

      // Generate 2 personalized articles with different categories
      const persCategories = shuffleArray([...ARTICLE_CATEGORIES]).slice(0, 2)

      for (const category of persCategories) {
        try {
          const prompt = getPersonalizedArticlePrompt(plantNames, upcomingTaskDescriptions, category)
          const raw = await callGemini(prompt, apiKey)

          const parsed = geminiArticleSchema.safeParse(raw)
          if (!parsed.success) {
            console.error(`Invalid Gemini response for user ${userId}:`, parsed.error.issues)
            errors++
            continue
          }

          const article = parsed.data
          const hash = titleHash(article.title)

          const { error: insertError } = await supabase
            .from('feed_articles')
            .upsert(
              {
                user_id: userId,
                title: article.title.slice(0, 200),
                summary: article.summary.slice(0, 150),
                content: article.content,
                category: article.category,
                reading_time: calculateReadingTime(article.content),
                title_hash: hash,
                plant_context: plantNames,
              },
              { onConflict: 'title_hash', ignoreDuplicates: true }
            )

          if (insertError) {
            console.error(`Error inserting personalized article for user ${userId}:`, insertError)
            errors++
          } else {
            personalizedGenerated++
          }
        } catch (err) {
          console.error(`Error generating personalized article for user ${userId}:`, err)
          errors++
        }
        // Short delay between Gemini calls to avoid rate limits
        await sleep(3_000)
      }

      usersProcessed++
    } catch (err) {
      console.error(`Error processing user ${userId}:`, err)
      errors++
    }
  }

  return NextResponse.json({
    generalGenerated,
    usersProcessed,
    personalizedGenerated,
    errors,
  })
}
