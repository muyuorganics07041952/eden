import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { FREQUENCY_INTERVAL_MAP } from '@/lib/types/care'
import type { CareFrequency } from '@/lib/types/care'
import { adjustDateForSeason } from '@/lib/season'

const VALID_FREQUENCIES: CareFrequency[] = [
  'daily', 'weekly', 'biweekly', 'monthly',
  'three_months', 'six_months', 'yearly', 'custom',
]

const createCareTaskSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  frequency: z.enum(VALID_FREQUENCIES as [string, ...string[]]),
  interval_days: z.number().int().positive().optional(),
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: plantId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Verify the plant belongs to the user
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('id')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    return NextResponse.json({ error: 'Pflanze nicht gefunden.' }, { status: 404 })
  }

  const { data: tasks, error } = await supabase
    .from('care_tasks')
    .select('*')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .order('next_due_date', { ascending: true })
    .limit(100)

  if (error) {
    console.error('Error loading care tasks:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Pflegeaufgaben.' }, { status: 500 })
  }

  return NextResponse.json(tasks)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: plantId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Verify the plant belongs to the user
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('id')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    return NextResponse.json({ error: 'Pflanze nicht gefunden.' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 })
  }

  const parsed = createCareTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { name, frequency, next_due_date, notes } = parsed.data
  const active_month_start = parsed.data.active_month_start ?? null
  const active_month_end = parsed.data.active_month_end ?? null

  // Derive interval_days for non-custom frequencies
  const interval_days = frequency === 'custom'
    ? parsed.data.interval_days!
    : FREQUENCY_INTERVAL_MAP[frequency as Exclude<CareFrequency, 'custom'>]

  // If season is set and current date is outside the season, adjust next_due_date
  const adjustedDueDate = adjustDateForSeason(next_due_date, active_month_start, active_month_end)

  const { data: task, error } = await supabase
    .from('care_tasks')
    .insert({
      plant_id: plantId,
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
    console.error('Error creating care task:', error)
    return NextResponse.json({ error: 'Fehler beim Anlegen der Pflegeaufgabe.' }, { status: 500 })
  }

  return NextResponse.json(task, { status: 201 })
}
