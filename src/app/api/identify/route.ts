import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const PLANT_ID_API_URL = 'https://plant.id/api/v3/identification'
const API_TIMEOUT = 10_000 // 10 seconds
const MIN_CONFIDENCE = 0.10 // 10%
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Simple in-memory rate limiter: max 10 requests per user per 60 seconds
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000

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

export async function POST(request: Request) {
  // Verify authentication
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Per-user rate limiting
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte versuche es später erneut.' },
      { status: 429 }
    )
  }

  // Check API key is configured
  const apiKey = process.env.PLANT_ID_API_KEY
  if (!apiKey) {
    console.error('PLANT_ID_API_KEY is not configured')
    return NextResponse.json(
      { error: 'Pflanzenidentifikation ist derzeit nicht verfügbar.' },
      { status: 503 }
    )
  }

  // Parse the uploaded image
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Ungültige Formulardaten.' }, { status: 400 })
  }

  const imageFile = formData.get('image')
  if (!imageFile || !(imageFile instanceof File)) {
    return NextResponse.json({ error: 'Kein Bild übermittelt.' }, { status: 400 })
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(imageFile.type)) {
    return NextResponse.json(
      { error: 'Ungültiges Dateiformat. Erlaubt: JPEG, PNG, WebP.' },
      { status: 422 }
    )
  }

  // Validate file size (max 2 MB — generous buffer above 1 MB compressed target)
  if (imageFile.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Bild zu groß.' }, { status: 422 })
  }

  try {
    // Convert to base64 for Plant.id API
    const bytes = await imageFile.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // Call Plant.id v3 API
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT)

    const response = await fetch(PLANT_ID_API_URL, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: [`data:${imageFile.type};base64,${base64}`],
        // Request classification for common name and scientific name
        similar_images: false,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (response.status === 429) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte versuche es später erneut.' },
        { status: 429 }
      )
    }

    if (!response.ok) {
      console.error('Plant.id API error:', response.status, await response.text().catch(() => ''))
      return NextResponse.json(
        { error: 'Fehler bei der Pflanzenidentifikation.' },
        { status: 502 }
      )
    }

    const result = await response.json()

    // Extract suggestions from Plant.id v3 response
    const suggestions = (result.result?.classification?.suggestions ?? [])
      .slice(0, 3)
      .map((s: { name?: string; details?: { common_names?: string[] }; probability?: number }) => ({
        name: s.details?.common_names?.[0] ?? s.name ?? 'Unbekannt',
        species: s.name ?? '',
        confidence: Math.round((s.probability ?? 0) * 100),
      }))
      .filter((s: { confidence: number }) => s.confidence >= MIN_CONFIDENCE * 100)

    return NextResponse.json(suggestions)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Zeitlimit überschritten. Bitte versuche es erneut.' },
        { status: 504 }
      )
    }

    console.error('Identify API error:', err)
    return NextResponse.json(
      { error: 'Fehler bei der Pflanzenidentifikation.' },
      { status: 500 }
    )
  }
}
