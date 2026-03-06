import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const rangeSchema = z.enum(['today', 'week', 'month'])

function getEndOfWeek(): string {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun, 1=Mon, ...
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

function flattenTasks(tasks: Record<string, unknown>[]) {
  return tasks.map((task) => {
    const { plants, ...rest } = task as Record<string, unknown> & { plants: { name: string }[] }
    return {
      ...rest,
      plant_name: Array.isArray(plants) ? plants[0]?.name ?? '' : (plants as unknown as { name: string }).name,
    }
  })
}

const TASK_SELECT = `
  id,
  plant_id,
  user_id,
  name,
  frequency,
  interval_days,
  next_due_date,
  notes,
  created_at,
  plants!inner ( name )
`

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Month filter: ?month=1-12 — returns tasks for that calendar month across all years
  const rawMonth = request.nextUrl.searchParams.get('month')
  if (rawMonth !== null) {
    const month = parseInt(rawMonth, 10)
    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Ungültiger month-Parameter (1-12).' }, { status: 422 })
    }

    const { data: tasks, error } = await supabase
      .from('care_tasks')
      .select(TASK_SELECT)
      .eq('user_id', user.id)
      .order('next_due_date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Fehler beim Laden der Aufgaben.' }, { status: 500 })
    }

    const filtered = (tasks ?? []).filter((t) => {
      const d = new Date((t.next_due_date as string) + 'T00:00:00')
      return d.getMonth() + 1 === month
    })

    return NextResponse.json(flattenTasks(filtered as unknown as Record<string, unknown>[]))
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
    .from('care_tasks')
    .select(TASK_SELECT)
    .eq('user_id', user.id)
    .lte('next_due_date', endDate)
    .order('next_due_date', { ascending: true })
    .limit(200)

  if (error) {
    console.error('Error loading today tasks:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Aufgaben.' }, { status: 500 })
  }

  return NextResponse.json(flattenTasks(tasks as unknown as Record<string, unknown>[]))
}
