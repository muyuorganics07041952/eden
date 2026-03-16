"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  LayoutList,
  AlertTriangle,
  Clock,
  Leaf,
  Shovel,
  Loader2,
  AlertCircle,
  PartyPopper,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { FREQUENCY_LABELS, GARDEN_FREQUENCY_LABELS } from "@/lib/types/care"
import type { TodayCareTask, CareFrequency, GardenTask, GardenTaskFrequency } from "@/lib/types/care"

const MONTHS = [
  { num: 1,  letter: "J", name: "Januar" },
  { num: 2,  letter: "F", name: "Februar" },
  { num: 3,  letter: "M", name: "März" },
  { num: 4,  letter: "A", name: "April" },
  { num: 5,  letter: "M", name: "Mai" },
  { num: 6,  letter: "J", name: "Juni" },
  { num: 7,  letter: "J", name: "Juli" },
  { num: 8,  letter: "A", name: "August" },
  { num: 9,  letter: "S", name: "September" },
  { num: 10, letter: "O", name: "Oktober" },
  { num: 11, letter: "N", name: "November" },
  { num: 12, letter: "D", name: "Dezember" },
]

const MONTH_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function getDueStatus(nextDueDate: string, monthNum: number): "overdue" | "upcoming" {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  if (monthNum < currentMonth) return "overdue"
  if (monthNum === currentMonth) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(nextDueDate + "T00:00:00")
    return due < today ? "overdue" : "upcoming"
  }
  return "upcoming"
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  })
}

function getSeasonBadgeLabel(start: number, end: number): string {
  return `${MONTH_SHORT[start - 1]}–${MONTH_SHORT[end - 1]}`
}

export default function TasksOverviewPage() {
  const currentMonth = new Date().getMonth() + 1
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [tasks, setTasks] = useState<TodayCareTask[]>([])
  const [gardenTasks, setGardenTasks] = useState<GardenTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async (monthNum: number) => {
    setLoading(true)
    setError(null)
    try {
      const [careRes, gardenRes] = await Promise.all([
        fetch(`/api/tasks/today?month=${monthNum}`),
        fetch(`/api/garden-tasks?month=${monthNum}`),
      ])

      if (!careRes.ok) throw new Error("Fehler beim Laden")
      const careData = await careRes.json()
      setTasks(Array.isArray(careData) ? careData : [])

      if (gardenRes.ok) {
        const gardenData = await gardenRes.json()
        setGardenTasks(Array.isArray(gardenData) ? gardenData : [])
      } else {
        setGardenTasks([])
      }
    } catch {
      setError("Fehler beim Laden der Aufgaben.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks(selectedMonth)
  }, [fetchTasks, selectedMonth])

  const totalCount = tasks.length + gardenTasks.length
  const overdueCount = tasks.filter((t) => getDueStatus(t.next_due_date, selectedMonth) === "overdue").length
    + gardenTasks.filter((t) => getDueStatus(t.next_due_date, selectedMonth) === "overdue").length

  const overdueTasks = tasks.filter((t) => getDueStatus(t.next_due_date, selectedMonth) === "overdue")
  const upcomingTasks = tasks.filter((t) => getDueStatus(t.next_due_date, selectedMonth) === "upcoming")
  const overdueGarden = gardenTasks.filter((t) => getDueStatus(t.next_due_date, selectedMonth) === "overdue")
  const upcomingGarden = gardenTasks.filter((t) => getDueStatus(t.next_due_date, selectedMonth) === "upcoming")

  // Group care tasks by plant
  function groupByPlant(taskList: TodayCareTask[]) {
    return Object.values(
      taskList.reduce<Record<string, { plantName: string; plantId: string; tasks: TodayCareTask[] }>>((acc, task) => {
        if (!acc[task.plant_id]) {
          acc[task.plant_id] = { plantName: task.plant_name, plantId: task.plant_id, tasks: [] }
        }
        acc[task.plant_id].tasks.push(task)
        return acc
      }, {})
    ).sort((a, b) => a.plantName.localeCompare(b.plantName, "de"))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href="/tasks" aria-label="Zurück zu Aufgaben">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <LayoutList className="h-6 w-6 text-primary" />
            Aufgaben Übersicht
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Alle Aufgaben nach Monat
          </p>
        </div>
      </div>

      {/* Month Picker */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monat wählen</p>
        <div className="flex gap-1.5 flex-wrap" aria-label="Monat auswählen">
          {MONTHS.map((m) => (
            <button
              key={m.num}
              onClick={() => setSelectedMonth(m.num)}
              title={m.name}
              className={cn(
                "h-9 w-9 rounded-md text-xs font-medium transition-colors",
                selectedMonth === m.num
                  ? "bg-primary text-primary-foreground"
                  : m.num === currentMonth
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {m.letter}
            </button>
          ))}
        </div>
      </div>

      {/* Month Title & Summary */}
      <div className="flex items-baseline gap-3">
        <h2 className="text-lg font-semibold">
          {MONTHS[selectedMonth - 1].name}
        </h2>
        {!loading && !error && (
          <span className="text-sm text-muted-foreground">
            {totalCount === 0
              ? "Keine Aufgaben"
              : `${totalCount} Aufgabe${totalCount !== 1 ? "n" : ""}`}
            {overdueCount > 0 && (
              <span className="text-orange-600"> · {overdueCount} überfällig</span>
            )}
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <OverviewSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-10 w-10 text-destructive/60" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => fetchTasks(selectedMonth)}>
            Erneut versuchen
          </Button>
        </div>
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <PartyPopper className="h-10 w-10 text-primary/60" />
          </div>
          <h3 className="text-base font-medium">Keine Aufgaben</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Im {MONTHS[selectedMonth - 1].name} sind keine Aufgaben fällig.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Overdue section */}
          {(overdueGarden.length > 0 || overdueTasks.length > 0) && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <h3 className="text-sm font-semibold text-orange-700">Überfällig</h3>
              </div>

              {/* Overdue garden tasks */}
              {overdueGarden.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Shovel className="h-3.5 w-3.5" />
                    Garten
                  </div>
                  <div className="space-y-2">
                    {overdueGarden.map((task) => (
                      <TaskRow key={task.id} variant="overdue">
                        <TaskRowGarden task={task} selectedMonth={selectedMonth} />
                      </TaskRow>
                    ))}
                  </div>
                </div>
              )}

              {/* Overdue care tasks grouped by plant */}
              {overdueTasks.length > 0 && (
                <div className="space-y-4">
                  {groupByPlant(overdueTasks).map((group) => (
                    <PlantGroupOverview key={group.plantId} group={group} selectedMonth={selectedMonth} variant="overdue" />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Upcoming section */}
          {(upcomingGarden.length > 0 || upcomingTasks.length > 0) && (
            <section className="space-y-4">
              {(overdueGarden.length > 0 || overdueTasks.length > 0) && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground">Anstehend</h3>
                </div>
              )}

              {/* Upcoming garden tasks */}
              {upcomingGarden.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Shovel className="h-3.5 w-3.5" />
                    Garten
                  </div>
                  <div className="space-y-2">
                    {upcomingGarden.map((task) => (
                      <TaskRow key={task.id} variant="upcoming">
                        <TaskRowGarden task={task} selectedMonth={selectedMonth} />
                      </TaskRow>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming care tasks grouped by plant */}
              {upcomingTasks.length > 0 && (
                <div className="space-y-4">
                  {groupByPlant(upcomingTasks).map((group) => (
                    <PlantGroupOverview key={group.plantId} group={group} selectedMonth={selectedMonth} variant="upcoming" />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function TaskRow({ children, variant }: { children: React.ReactNode; variant: "overdue" | "upcoming" }) {
  return (
    <Card className={cn(
      variant === "overdue" ? "border-orange-200/70 bg-orange-50/50" : ""
    )}>
      <CardContent className="p-3">{children}</CardContent>
    </Card>
  )
}

function TaskRowGarden({ task, selectedMonth }: { task: GardenTask; selectedMonth: number }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{task.name}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
          {task.frequency !== "once" && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {GARDEN_FREQUENCY_LABELS[task.frequency as GardenTaskFrequency]}
            </span>
          )}
          {task.active_month_start != null && task.active_month_end != null && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {getSeasonBadgeLabel(task.active_month_start, task.active_month_end)}
            </Badge>
          )}
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
        {formatDate(task.next_due_date)}
      </span>
    </div>
  )
}

function PlantGroupOverview({
  group,
  selectedMonth,
  variant,
}: {
  group: { plantId: string; plantName: string; tasks: TodayCareTask[] }
  selectedMonth: number
  variant: "overdue" | "upcoming"
}) {
  void selectedMonth
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Leaf className="h-3.5 w-3.5" />
        {group.plantName}
      </div>
      <div className="space-y-2">
        {group.tasks.map((task) => (
          <TaskRow key={task.id} variant={variant}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">{task.name}</p>
                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  {FREQUENCY_LABELS[task.frequency as CareFrequency]}
                </span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                {formatDate(task.next_due_date)}
              </span>
            </div>
          </TaskRow>
        ))}
      </div>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
