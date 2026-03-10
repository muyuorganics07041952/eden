import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const todayISO = new Date().toISOString().split('T')[0]

  const { data: tasks, error } = await supabase
    .from('care_tasks')
    .select('id, plant_id, next_due_date')
    .eq('user_id', user.id)
    .lte('next_due_date', todayISO)
    .limit(200)

  if (error) {
    return NextResponse.json({ error: 'Fehler beim Laden der faelligen Aufgaben.' }, { status: 500 })
  }

  return NextResponse.json(tasks ?? [])
}
