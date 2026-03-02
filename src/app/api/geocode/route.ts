import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Simple in-memory rate limiter: 10 requests per user per 60 seconds
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const timestamps = (rateLimitMap.get(userId) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (timestamps.length >= RATE_LIMIT_MAX) return true
  timestamps.push(now)
  rateLimitMap.set(userId, timestamps)
  return false
}

const querySchema = z.object({
  q: z.string().min(1, 'Suchbegriff ist erforderlich').max(200),
})

interface GeocodingResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  country_code: string
  admin1?: string
}

interface GeocodingResponse {
  results?: GeocodingResult[]
}

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte warte kurz und versuche es erneut.' },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({ q: searchParams.get('q') })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const query = encodeURIComponent(parsed.data.q)

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=de&format=json`,
      { next: { revalidate: 3600 } }
    )

    if (!response.ok) {
      return NextResponse.json({ results: [] })
    }

    const data: GeocodingResponse = await response.json()

    const results = (data.results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      latitude: r.latitude,
      longitude: r.longitude,
      admin1: r.admin1,
    }))

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
