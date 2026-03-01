import { createClient } from '@/lib/supabase/server'
import { Leaf, Sprout, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = user?.email?.split('@')[0] ?? 'Gärtner'

  const [{ count: plantCount }, { count: taskCount }] = await Promise.all([
    supabase
      .from('plants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
    supabase
      .from('care_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .lte('next_due_date', new Date().toISOString().split('T')[0]),
  ])

  const hasPlants = (plantCount ?? 0) > 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hallo, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Willkommen in deinem Garten.
        </p>
      </div>

      {!hasPlants ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-primary/10 p-4 rounded-full">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle>Dein Garten wartet</CardTitle>
            <CardDescription>
              Füge deine erste Pflanze hinzu und beginne deinen digitalen Garten aufzubauen.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/plants">Erste Pflanze anlegen</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meine Pflanzen</CardTitle>
              <Sprout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plantCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {plantCount === 1 ? 'Pflanze in deinem Garten' : 'Pflanzen in deinem Garten'}
              </p>
              <Button asChild variant="link" className="px-0 mt-2 h-auto text-xs">
                <Link href="/plants">Alle Pflanzen ansehen →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heute fällige Aufgaben</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {(taskCount ?? 0) === 0 ? 'Alles erledigt!' : (taskCount === 1 ? 'Aufgabe fällig' : 'Aufgaben fällig')}
              </p>
              <Button asChild variant="link" className="px-0 mt-2 h-auto text-xs">
                <Link href="/tasks">Aufgaben ansehen →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
