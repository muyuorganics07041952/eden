import { ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'

interface TaskItem {
  id: string
  name: string
  plant_name: string
  next_due_date: string
}

interface UpcomingTasksSectionProps {
  tasks: TaskItem[]
  totalCount: number
}

export function UpcomingTasksSection({ tasks, totalCount }: UpcomingTasksSectionProps) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <section aria-label="Anstehende Aufgaben">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
          <ClipboardList className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-lg font-semibold">Anstehende Aufgaben</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Alles erledigt! Dein Garten ist happy. 🌱
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const isOverdue = task.next_due_date < today
                const isToday = task.next_due_date === today
                const formattedDate = format(new Date(task.next_due_date + 'T00:00:00'), 'dd.MM.')

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 py-1.5 text-sm border-b last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isOverdue && (
                        <Badge className="shrink-0 text-xs bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-100">
                          Überfällig
                        </Badge>
                      )}
                      {isToday && !isOverdue && (
                        <Badge className="shrink-0 text-xs bg-amber-100 text-amber-800 hover:bg-amber-100 border-0">
                          Heute
                        </Badge>
                      )}
                      <span className="truncate">
                        <span className="font-medium">{task.plant_name}</span>
                        <span className="text-muted-foreground"> — {task.name}</span>
                      </span>
                    </div>
                    {!isOverdue && !isToday && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formattedDate}
                      </span>
                    )}
                  </div>
                )
              })}
              {totalCount > 5 && (
                <div className="pt-2">
                  <Button asChild variant="link" className="px-0 h-auto text-xs">
                    <Link href="/tasks">Alle Aufgaben ansehen →</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
