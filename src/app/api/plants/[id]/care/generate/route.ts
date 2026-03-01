import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { FREQUENCY_INTERVAL_MAP } from '@/lib/types/care'
import type { CareFrequency } from '@/lib/types/care'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
const API_TIMEOUT = 15_000 // 15 seconds

// In-memory rate limiter: max 5 requests per user per 60 seconds
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60_000

const VALID_FREQUENCIES: CareFrequency[] = [
  'daily', 'weekly', 'biweekly', 'monthly',
  'three_months', 'six_months', 'yearly', 'custom',
]

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().split('T')[0]
}

type GeminiTask = {
  name?: unknown
  frequency?: unknown
  interval_days?: unknown
  notes?: unknown
  days_until_first?: unknown
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: plantId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Rate limiting
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.' },
      { status: 429 }
    )
  }

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured')
    return NextResponse.json(
      { error: 'KI-Pflegevorschläge sind derzeit nicht verfügbar.' },
      { status: 503 }
    )
  }

  // Fetch plant and verify ownership
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('id, name, species')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    return NextResponse.json({ error: 'Pflanze nicht gefunden.' }, { status: 404 })
  }

  const prompt = `Du bist ein Pflanzenexperte. Erstelle einen Pflegeplan für folgende Pflanze:
- Name: ${plant.name}
- Art/Gattung: ${plant.species || 'unbekannt'}

Antworte NUR mit einem JSON-Array (kein Markdown, keine Erklärung) mit 3-5 Pflegeaufgaben.
Jede Aufgabe hat folgende Felder:
- "name": string (z.B. "Gießen", "Düngen", "Beschneiden", "Umtopfen")
- "frequency": one of ["daily","weekly","biweekly","monthly","three_months","six_months","yearly","custom"]
- "interval_days": number (nur bei "custom", sonst weglassen oder null)
- "notes": string (kurze Anleitung auf Deutsch, max 100 Zeichen)
- "days_until_first": number (in wie vielen Tagen die erste Aufgabe fällig ist, min 0)`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT)

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (response.status === 429) {
      console.error('Gemini API rate limit hit:', response.status)
      return NextResponse.json(
        { error: 'KI-Kontingent erschöpft – bitte warte eine Minute und versuche es erneut.' },
        { status: 503 }
      )
    }

    if (response.status >= 500) {
      console.error('Gemini API server error:', response.status)
      return NextResponse.json(
        { error: 'KI-Dienst ist vorübergehend nicht erreichbar. Bitte versuche es später erneut.' },
        { status: 503 }
      )
    }

    if (!response.ok) {
      console.error('Gemini API error:', response.status, await response.text().catch(() => ''))
      return NextResponse.json(
        { error: 'Fehler bei der KI-Generierung.' },
        { status: 502 }
      )
    }

    const result = await response.json()

    // Extract text from Gemini response
    const rawText: string = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Parse JSON — strip markdown code fences if present
    const jsonMatch = rawText.replace(/```json?\s*/g, '').replace(/```/g, '').trim()
    let parsedTasks: GeminiTask[]
    try {
      parsedTasks = JSON.parse(jsonMatch)
    } catch {
      console.error('Failed to parse Gemini response as JSON:', rawText)
      return NextResponse.json(
        { error: 'KI-Antwort konnte nicht verarbeitet werden. Bitte versuche es erneut.' },
        { status: 502 }
      )
    }

    if (!Array.isArray(parsedTasks) || parsedTasks.length === 0) {
      return NextResponse.json(
        { error: 'KI hat keine Pflegeaufgaben generiert. Bitte versuche es erneut.' },
        { status: 502 }
      )
    }

    const today = getTodayISO()

    // Validate and transform each task
    const tasksToInsert = parsedTasks
      .slice(0, 5) // max 5 tasks
      .filter((t) => typeof t.name === 'string' && t.name.length > 0)
      .map((t) => {
        const name = String(t.name).slice(0, 100)
        const frequency = VALID_FREQUENCIES.includes(t.frequency as CareFrequency)
          ? (t.frequency as CareFrequency)
          : 'monthly'

        let interval_days: number
        if (frequency === 'custom') {
          interval_days = typeof t.interval_days === 'number' && t.interval_days > 0
            ? t.interval_days
            : 30 // fallback
        } else {
          interval_days = FREQUENCY_INTERVAL_MAP[frequency as Exclude<CareFrequency, 'custom'>]
        }

        const daysUntilFirst = typeof t.days_until_first === 'number' && t.days_until_first >= 0
          ? Math.round(t.days_until_first)
          : 0

        const next_due_date = addDays(today, daysUntilFirst)
        const notes = typeof t.notes === 'string' ? t.notes.slice(0, 500) : null

        return {
          plant_id: plantId,
          user_id: user.id,
          name,
          frequency,
          interval_days,
          next_due_date,
          notes,
        }
      })

    if (tasksToInsert.length === 0) {
      return NextResponse.json(
        { error: 'KI hat keine gültigen Pflegeaufgaben generiert.' },
        { status: 502 }
      )
    }

    // Bulk insert
    const { data: createdTasks, error: insertError } = await supabase
      .from('care_tasks')
      .insert(tasksToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting AI-generated care tasks:', insertError)
      return NextResponse.json(
        { error: 'Fehler beim Speichern der Pflegeaufgaben.' },
        { status: 500 }
      )
    }

    return NextResponse.json(createdTasks, { status: 201 })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Zeitlimit überschritten. Bitte versuche es erneut.' },
        { status: 504 }
      )
    }

    console.error('Care generate API error:', err)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten.' },
      { status: 500 }
    )
  }
}
