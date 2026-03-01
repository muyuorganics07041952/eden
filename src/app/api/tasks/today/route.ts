import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: tasks, error } = await supabase
    .from('care_tasks')
    .select(`
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
    `)
    .eq('user_id', user.id)
    .lte('next_due_date', today)
    .order('next_due_date', { ascending: true })
    .limit(200)

  if (error) {
    console.error('Error loading today tasks:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Aufgaben.' }, { status: 500 })
  }

  // Flatten the join result: plants.name -> plant_name
  // Supabase !inner join returns plants as an array with a single element
  const flatTasks = (tasks ?? []).map((task) => {
    const { plants, ...rest } = task as unknown as Record<string, unknown> & { plants: { name: string }[] }
    return {
      ...rest,
      plant_name: Array.isArray(plants) ? plants[0]?.name ?? '' : (plants as unknown as { name: string }).name,
    }
  })

  return NextResponse.json(flatTasks)
}
