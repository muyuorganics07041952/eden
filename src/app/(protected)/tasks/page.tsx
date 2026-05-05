import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isInSeason } from '@/lib/season'
import { TasksClient } from '@/components/tasks/tasks-client'
import type { TodayCareTask, GardenTask } from '@/lib/types/care'

function getEndOfMonth(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
}

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')
  const userId = session.user.id

  const endOfMonth = getEndOfMonth()
  const currentMonth = new Date().getMonth() + 1

  const [{ data: rawCareTasks }, { data: rawGardenTasks }] = await Promise.all([
    supabase
      .from('care_tasks')
      .select(`
        id, plant_id, user_id, name, frequency, interval_days,
        next_due_date, notes, created_at, active_month_start, active_month_end,
        plants!inner ( name )
      `)
      .eq('user_id', userId)
      .lte('next_due_date', endOfMonth)
      .order('next_due_date', { ascending: true })
      .limit(200),
    supabase
      .from('garden_tasks')
      .select('*')
      .eq('user_id', userId)
      .lte('next_due_date', endOfMonth)
      .order('next_due_date', { ascending: true })
      .limit(200),
  ])

  // Apply season filter + flatten plant join (Supabase returns plants as object or array)
  const careTasks: TodayCareTask[] = (rawCareTasks ?? [])
    .filter((t) => isInSeason(currentMonth, t.active_month_start, t.active_month_end))
    .map((t) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = t as any
      const plants = row.plants
      const plantName: string = Array.isArray(plants) ? plants[0]?.name ?? '' : plants?.name ?? ''
      const { plants: _plants, ...rest } = row
      return { ...rest, plant_name: plantName } as TodayCareTask
    })

  const gardenTasks: GardenTask[] = (rawGardenTasks ?? [])
    .filter((t) => isInSeason(currentMonth, t.active_month_start, t.active_month_end))

  return (
    <TasksClient
      initialCareTasks={careTasks}
      initialGardenTasks={gardenTasks}
    />
  )
}
