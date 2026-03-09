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

const editSchema = z.object({
  action: z.literal('edit'),
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

const completeSchema = z.object({
  action: z.literal('complete'),
  mode: z.enum(['today', 'original']),
})

const updateSchema = z.discriminatedUnion('action', [editSchema, completeSchema])

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().split('T')[0]
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id: plantId, taskId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Verify plant belongs to user
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

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  if (parsed.data.action === 'edit') {
    const { name, frequency, next_due_date, notes } = parsed.data
    const active_month_start = parsed.data.active_month_start ?? null
    const active_month_end = parsed.data.active_month_end ?? null

    // Adjust due date if it falls outside the (new) season
    const adjusted_due_date = adjustDateForSeason(next_due_date, active_month_start, active_month_end)

    const interval_days = frequency === 'custom'
      ? parsed.data.interval_days!
      : FREQUENCY_INTERVAL_MAP[frequency as Exclude<CareFrequency, 'custom'>]

    const { data: task, error } = await supabase
      .from('care_tasks')
      .update({
        name,
        frequency,
        interval_days,
        next_due_date: adjusted_due_date,
        notes: notes ?? null,
        active_month_start,
        active_month_end,
      })
      .eq('id', taskId)
      .eq('plant_id', plantId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !task) {
      return NextResponse.json({ error: 'Pflegeaufgabe nicht gefunden.' }, { status: 404 })
    }

    return NextResponse.json(task)
  }

  // action === 'complete'
  const { mode } = parsed.data

  // Fetch the current task to get interval_days, current next_due_date, and season fields
  const { data: currentTask, error: fetchError } = await supabase
    .from('care_tasks')
    .select('interval_days, next_due_date, active_month_start, active_month_end')
    .eq('id', taskId)
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !currentTask) {
    return NextResponse.json({ error: 'Pflegeaufgabe nicht gefunden.' }, { status: 404 })
  }

  let newDueDate: string
  if (mode === 'today') {
    newDueDate = addDays(getTodayISO(), currentTask.interval_days)
  } else {
    // mode === 'original': advance from the current (possibly overdue) due date
    newDueDate = addDays(currentTask.next_due_date, currentTask.interval_days)
  }

  // Adjust for season: if the new due date falls outside the active season, jump to next season start
  newDueDate = adjustDateForSeason(newDueDate, currentTask.active_month_start, currentTask.active_month_end)

  const { data: updatedTask, error: updateError } = await supabase
    .from('care_tasks')
    .update({ next_due_date: newDueDate })
    .eq('id', taskId)
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateError || !updatedTask) {
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Pflegeaufgabe.' }, { status: 500 })
  }

  return NextResponse.json(updatedTask)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id: plantId, taskId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Verify plant belongs to user
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('id')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    return NextResponse.json({ error: 'Pflanze nicht gefunden.' }, { status: 404 })
  }

  const { error } = await supabase
    .from('care_tasks')
    .delete()
    .eq('id', taskId)
    .eq('plant_id', plantId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting care task:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Pflegeaufgabe.' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
