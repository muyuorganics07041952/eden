"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  CheckSquare,
  Check,
  AlertCircle,
  AlertTriangle,
  Clock,
  PartyPopper,
  Loader2,
  Leaf,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FREQUENCY_LABELS } from "@/lib/types/care"
import type { TodayCareTask, CareFrequency } from "@/lib/types/care"

function getDueStatus(nextDueDate: string): "overdue" | "today" {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(nextDueDate + "T00:00:00")
  if (due < today) return "overdue"
  return "today"
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  })
}

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<TodayCareTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set())
  const [overdueTask, setOverdueTask] = useState<TodayCareTask | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/tasks/today")
      if (!res.ok) throw new Error("Fehler beim Laden")
      const data = await res.json()
      setTasks(Array.isArray(data) ? data : [])
    } catch {
      setError("Fehler beim Laden der Aufgaben.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  function handleCompleteClick(task: TodayCareTask) {
    const status = getDueStatus(task.next_due_date)
    if (status === "overdue") {
      setOverdueTask(task)
      return
    }
    doComplete(task, "today")
  }

  async function doComplete(task: TodayCareTask, mode: "today" | "original") {
    setOverdueTask(null)
    setCompletingIds((prev) => new Set(prev).add(task.id))
    try {
      const res = await fetch(`/api/plants/${task.plant_id}/care/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", mode }),
      })
      if (!res.ok) throw new Error("Fehler")
      // Remove from the list (no longer due today)
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
    } catch {
      // Keep the task in the list on error
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
    }
  }

  // Group tasks by plant
  const grouped = tasks.reduce<Record<string, { plantName: string; plantId: string; tasks: TodayCareTask[] }>>(
    (acc, task) => {
      if (!acc[task.plant_id]) {
        acc[task.plant_id] = {
          plantName: task.plant_name,
          plantId: task.plant_id,
          tasks: [],
        }
      }
      acc[task.plant_id].tasks.push(task)
      return acc
    },
    {}
  )

  // Sort: groups with overdue tasks first
  const sortedGroups = Object.values(grouped).sort((a, b) => {
    const aHasOverdue = a.tasks.some((t) => getDueStatus(t.next_due_date) === "overdue")
    const bHasOverdue = b.tasks.some((t) => getDueStatus(t.next_due_date) === "overdue")
    if (aHasOverdue && !bHasOverdue) return -1
    if (!aHasOverdue && bHasOverdue) return 1
    return a.plantName.localeCompare(b.plantName, "de")
  })

  const overdueCount = tasks.filter((t) => getDueStatus(t.next_due_date) === "overdue").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            Heute fällige Aufgaben
          </h1>
          {!loading && !error && tasks.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {tasks.length} Aufgabe{tasks.length !== 1 ? "n" : ""} fällig
              {overdueCount > 0 && (
                <span className="text-destructive">
                  {" "}({overdueCount} überfällig)
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <TasksPageSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-10 w-10 text-destructive/60" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={fetchTasks}>
            Erneut versuchen
          </Button>
        </div>
      ) : tasks.length === 0 ? (
        <AllDoneState onGoToPlants={() => router.push("/plants")} />
      ) : (
        <div className="space-y-6">
          {sortedGroups.map((group) => (
            <div key={group.plantId} className="space-y-2">
              {/* Plant header */}
              <button
                onClick={() => router.push(`/plants/${group.plantId}`)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Leaf className="h-4 w-4" />
                {group.plantName}
              </button>

              {/* Tasks */}
              <div className="space-y-2">
                {group.tasks.map((task) => {
                  const status = getDueStatus(task.next_due_date)
                  const isCompleting = completingIds.has(task.id)
                  return (
                    <Card
                      key={task.id}
                      className={
                        status === "overdue"
                          ? "border-destructive/50 bg-destructive/5"
                          : "border-primary/50 bg-primary/5"
                      }
                    >
                      <CardContent className="flex items-center gap-3 p-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0 rounded-full"
                          onClick={() => handleCompleteClick(task)}
                          disabled={isCompleting}
                          aria-label={`${task.name} als erledigt markieren`}
                        >
                          {isCompleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm">{task.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {FREQUENCY_LABELS[task.frequency as CareFrequency]}
                            </span>
                            {status === "overdue" && (
                              <Badge
                                variant="destructive"
                                className="text-xs px-1.5 py-0"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Seit {formatDate(task.next_due_date)}
                              </Badge>
                            )}
                          </div>
                          {task.notes && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {task.notes}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overdue completion confirmation dialog */}
      <AlertDialog open={!!overdueTask} onOpenChange={(open) => { if (!open) setOverdueTask(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Überfällige Aufgabe erledigen</AlertDialogTitle>
            <AlertDialogDescription>
              Die Aufgabe &quot;{overdueTask?.name}&quot; ist überfällig. Wie soll das nächste Fälligkeitsdatum berechnet werden?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="outline"
                onClick={() => overdueTask && doComplete(overdueTask, "original")}
              >
                Im Original-Rhythmus
              </Button>
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => overdueTask && doComplete(overdueTask, "today")}
            >
              Ab heute rechnen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AllDoneState({ onGoToPlants }: { onGoToPlants: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <PartyPopper className="h-10 w-10 text-primary/60" />
      </div>
      <h2 className="text-lg font-medium">Alles erledigt!</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-xs">
        Keine Aufgaben fällig. Entspann dich oder schau bei deinen Pflanzen vorbei.
      </p>
      <Button variant="outline" onClick={onGoToPlants}>
        <Leaf className="h-4 w-4" />
        Meine Pflanzen
      </Button>
    </div>
  )
}

function TasksPageSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, gi) => (
        <div key={gi} className="space-y-2">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 3 }).map((_, ti) => (
            <div key={ti} className="flex items-center gap-3 p-4 border rounded-lg">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
