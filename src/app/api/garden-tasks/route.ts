import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { FREQUENCY_INTERVAL_MAP } from '@/lib/types/care'
import type { GardenTaskFrequency } from '@/lib/types/care'
import { isInSeason, adjustDateForSeason } from '@/lib/season'

const VALID_FREQUENCIES: GardenTaskFrequency[] = [
  'once', 'daily', 'weekly', 'biweekly', 'monthly',
  'three_months', 'six_months', 'yearly', 'custom',
]

const rangeSchema = z.enum(['today', 'week', 'month'])

const createGardenTaskSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  frequency: z.enum(VALID_FREQUENCIES as [string, ...string[]]),
  interval_days: z.number().int().min(1).max(365).optional(),
  next_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum muss im Format YYYY-MM-DD sein'),
  notes: z.string().max(500).optional().nullable(),
  active_month_start: z.number().int().min(1).max(12).optional().nullable(),
  active_month_end: z.number().int().min(1).max(12).optional().nullable(),
}).refine(
  (data) => data.frequency !== 'custom' || (data.interval_days !== undefined && data.interval_days > 0),
  { message: 'interval_days ist bei benutzerdefinierter Häufigkeit erforderlich', path: ['interval_days'] }
).refine(
  (data) => {
    const hasStart = data.active_month_start != null
    const hasEnd = data.active_month_end != null
    return hasStart === hasEnd
  },
  { message: 'active_month_start und active_month_end müssen beide gesetzt oder beide leer sein', path: ['active_month_start'] }
)

function getEndOfWeek(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() + daysUntilSunday)
  return endOfWeek.toISOString().split('T')[0]
}

function getEndOfMonth(): string {
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return endOfMonth.toISOString().split('T')[0]
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Month filter: ?month=1-12
  const rawMonth = request.nextUrl.searchParams.get('month')
  if (rawMonth !== null) {
    const month = parseInt(rawMonth, 10)
    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Ungültiger month-Parameter (1-12).' }, { status: 422 })
    }

    const { data: tasks, error } = await supabase
      .from('garden_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('next_due_date', { ascending: true })
      .limit(200)

    if (error) {
      return NextResponse.json({ error: 'Fehler beim Laden der Gartenaufgaben.' }, { status: 500 })
    }

    const filtered = (tasks ?? []).filter((t) => {
      const d = new Date((t.next_due_date as string) + 'T00:00:00')
      const taskMonth = d.getMonth() + 1
      return taskMonth === month && isInSeason(month, t.active_month_start, t.active_month_end)
    })

    return NextResponse.json(filtered)
  }

  // Range filter: ?range=today|week|month (default: month)
  const rawRange = request.nextUrl.searchParams.get('range') || 'month'
  const parsedRange = rangeSchema.safeParse(rawRange)
  if (!parsedRange.success) {
    return NextResponse.json(
      { error: 'Ungültiger range-Parameter. Erlaubt: today, week, month.' },
      { status: 422 }
    )
  }
  const range = parsedRange.data
  const today = new Date().toISOString().split('T')[0]

  let endDate: string
  switch (range) {
    case 'today':
      endDate = today
      break
    case 'week':
      endDate = getEndOfWeek()
      break
    case 'month':
    default:
      endDate = getEndOfMonth()
      break
  }

  const { data: tasks, error } = await supabase
    .from('garden_tasks')
    .select('*')
    .eq('user_id', user.id)
    .lte('next_due_date', endDate)
    .order('next_due_date', { ascending: true })
    .limit(200)

  if (error) {
    console.error('Error loading garden tasks:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Gartenaufgaben.' }, { status: 500 })
  }

  // Filter out tasks that are out-of-season for today's month
  const currentMonth = new Date().getMonth() + 1
  const inSeasonTasks = (tasks ?? []).filter((t) =>
    isInSeason(currentMonth, t.active_month_start, t.active_month_end)
  )

  return NextResponse.json(inSeasonTasks)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 })
  }

  const parsed = createGardenTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { name, frequency, next_due_date, notes } = parsed.data
  const active_month_start = parsed.data.active_month_start ?? null
  const active_month_end = parsed.data.active_month_end ?? null

  // Derive interval_days: null for 'once', from map for fixed, from input for custom
  let interval_days: number | null
  if (frequency === 'once') {
    interval_days = null
  } else if (frequency === 'custom') {
    interval_days = parsed.data.interval_days!
  } else {
    interval_days = FREQUENCY_INTERVAL_MAP[frequency as Exclude<GardenTaskFrequency, 'once' | 'custom'>]
  }

  // If season is set and current date is outside the season, adjust next_due_date
  const adjustedDueDate = adjustDateForSeason(next_due_date, active_month_start, active_month_end)

  const { data: task, error } = await supabase
    .from('garden_tasks')
    .insert({
      user_id: user.id,
      name,
      frequency,
      interval_days,
      next_due_date: adjustedDueDate,
      notes: notes ?? null,
      active_month_start,
      active_month_end,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating garden task:', error)
    return NextResponse.json({ error: 'Fehler beim Anlegen der Gartenaufgabe.' }, { status: 500 })
  }

  return NextResponse.json(task, { status: 201 })
}
