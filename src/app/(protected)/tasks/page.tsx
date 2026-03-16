"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  CheckSquare,
  Check,
  AlertCircle,
  AlertTriangle,
  Clock,
  PartyPopper,
  Loader2,
  Leaf,
  Plus,
  Shovel,
  MoreVertical,
  Search,
  LayoutList,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { FREQUENCY_LABELS, GARDEN_FREQUENCY_LABELS } from "@/lib/types/care"
import type { TodayCareTask, CareFrequency, GardenTask, GardenTaskFrequency, CareTask } from "@/lib/types/care"
import { GardenTaskSheet } from "@/components/tasks/garden-task-sheet"
import { TaskTypePicker } from "@/components/tasks/task-type-picker"
import { CareTaskSheet } from "@/components/care/care-task-sheet"
import { TaskFilterBar, type StatusFilter } from "@/components/tasks/task-filter-bar"

const MONTH_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function getSeasonBadgeLabel(start: number, end: number): string {
  return `${MONTH_SHORT[start - 1]}\–${MONTH_SHORT[end - 1]}`
}

function getDueStatus(nextDueDate: string): "overdue" | "today" | "upcoming" {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(nextDueDate + "T00:00:00")
  if (due < now) return "overdue"
  if (due.getTime() === now.getTime()) return "today"
  return "upcoming"
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
  const [gardenTasks, setGardenTasks] = useState<GardenTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set())
  const [overdueTask, setOverdueTask] = useState<TodayCareTask | null>(null)
  const [overdueGardenTask, setOverdueGardenTask] = useState<GardenTask | null>(null)
  const [gardenSheetOpen, setGardenSheetOpen] = useState(false)
  const [editingGardenTask, setEditingGardenTask] = useState<GardenTask | null>(null)
  const [typePickerOpen, setTypePickerOpen] = useState(false)
  const [careSheetOpen, setCareSheetOpen] = useState(false)
  const [careSheetPlantId, setCareSheetPlantId] = useState<string | null>(null)
  const lastCareSheetPlantIdRef = useRef<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [activeStatuses, setActiveStatuses] = useState<Set<StatusFilter>>(new Set())

  // Edit/delete state for care tasks
  const [editingCareTask, setEditingCareTask] = useState<TodayCareTask | null>(null)
  const [deletingCareTask, setDeletingCareTask] = useState<TodayCareTask | null>(null)
  const [isDeletingCare, setIsDeletingCare] = useState(false)

  // Delete state for garden tasks (via menu)
  const [deletingGardenTask, setDeletingGardenTask] = useState<GardenTask | null>(null)
  const [isDeletingGarden, setIsDeletingGarden] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [careRes, gardenRes] = await Promise.all([
        fetch("/api/tasks/today?range=month"),
        fetch("/api/garden-tasks?range=month"),
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
    fetchTasks()
  }, [fetchTasks])

  function resetFilters() {
    setSearchQuery("")
    setActiveStatuses(new Set())
  }

  // Filter toggle handlers
  function handleToggleStatus(status: StatusFilter) {
    setActiveStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(status)) {
        next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }

  // Computed filter data
  const availableStatuses = useMemo(() => {
    const statuses = new Set<StatusFilter>()
    for (const t of tasks) {
      const s = getDueStatus(t.next_due_date)
      if (s === "overdue" || s === "upcoming") statuses.add(s)
    }
    for (const t of gardenTasks) {
      const s = getDueStatus(t.next_due_date)
      if (s === "overdue" || s === "upcoming") statuses.add(s)
    }
    return statuses
  }, [tasks, gardenTasks])

  const isFilterActive = searchQuery.length > 0 || activeStatuses.size > 0

  // Filtered tasks
  const filteredCareTasks = useMemo(() => {
    let result = tasks
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.plant_name.toLowerCase().includes(q)
      )
    }
    if (activeStatuses.size > 0) {
      result = result.filter((t) => activeStatuses.has(getDueStatus(t.next_due_date) as StatusFilter))
    }
    return result
  }, [tasks, searchQuery, activeStatuses])

  const filteredGardenTasks = useMemo(() => {
    let result = gardenTasks
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((t) => t.name.toLowerCase().includes(q))
    }
    if (activeStatuses.size > 0) {
      result = result.filter((t) => activeStatuses.has(getDueStatus(t.next_due_date) as StatusFilter))
    }
    return result
  }, [gardenTasks, searchQuery, activeStatuses])

  const totalTaskCount = tasks.length + gardenTasks.length
  const filteredTotalCount = filteredCareTasks.length + filteredGardenTasks.length

  // --- Complete handlers ---

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

  // --- Garden task handlers ---

  function handleGardenCompleteClick(task: GardenTask) {
    const status = getDueStatus(task.next_due_date)
    if (status === "overdue") {
      if (task.frequency === "once") {
        doGardenComplete(task, "today")
      } else {
        setOverdueGardenTask(task)
      }
      return
    }
    doGardenComplete(task, "today")
  }

  async function doGardenComplete(task: GardenTask, mode: "today" | "original") {
    setOverdueGardenTask(null)
    setCompletingIds((prev) => new Set(prev).add(task.id))
    try {
      const res = await fetch(`/api/garden-tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", mode }),
      })
      if (!res.ok) throw new Error("Fehler")
      setGardenTasks((prev) => prev.filter((t) => t.id !== task.id))
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

  function handleGardenTaskClick(task: GardenTask) {
    setEditingGardenTask(task)
    setGardenSheetOpen(true)
  }

  function handleGardenSheetSuccess(task: GardenTask | null, action: "created" | "updated" | "deleted") {
    if (action === "created" && task) {
      fetchTasks()
    } else if (action === "updated" && task) {
      setGardenTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
    } else if (action === "deleted") {
      setGardenTasks((prev) => prev.filter((t) => t.id !== editingGardenTask?.id))
    }
    setEditingGardenTask(null)
  }

  // Garden task delete via menu
  async function handleDeleteGardenTask() {
    if (!deletingGardenTask) return
    setIsDeletingGarden(true)
    try {
      const res = await fetch(`/api/garden-tasks/${deletingGardenTask.id}`, {
        method: "DELETE",
      })
      if (!res.ok && res.status !== 204) throw new Error("Fehler")
      setGardenTasks((prev) => prev.filter((t) => t.id !== deletingGardenTask.id))
    } catch {
      // silently fail
    } finally {
      setIsDeletingGarden(false)
      setDeletingGardenTask(null)
    }
  }

  // Care task edit/delete via menu
  function handleEditCareTask(task: TodayCareTask) {
    setEditingCareTask(task)
    lastCareSheetPlantIdRef.current = task.plant_id
    setCareSheetPlantId(task.plant_id)
    setCareSheetOpen(true)
  }

  function handleCareEditSuccess(_savedTask: CareTask) {
    setCareSheetOpen(false)
    setCareSheetPlantId(null)
    setEditingCareTask(null)
    fetchTasks()
  }

  async function handleDeleteCareTask() {
    if (!deletingCareTask) return
    setIsDeletingCare(true)
    try {
      const res = await fetch(
        `/api/plants/${deletingCareTask.plant_id}/care/${deletingCareTask.id}`,
        { method: "DELETE" }
      )
      if (!res.ok && res.status !== 204) throw new Error("Fehler")
      setTasks((prev) => prev.filter((t) => t.id !== deletingCareTask.id))
    } catch {
      // silently fail
    } finally {
      setIsDeletingCare(false)
      setDeletingCareTask(null)
    }
  }

  function handleOpenCreateSheet() {
    setTypePickerOpen(true)
  }

  function handlePickerSelectGeneral() {
    setEditingGardenTask(null)
    setGardenSheetOpen(true)
  }

  function handlePickerSelectPlant(plantId: string) {
    setEditingCareTask(null)
    lastCareSheetPlantIdRef.current = plantId
    setCareSheetPlantId(plantId)
    setCareSheetOpen(true)
  }

  // Group filtered tasks by plant
  const grouped = filteredCareTasks.reduce<Record<string, { plantName: string; plantId: string; tasks: TodayCareTask[] }>>(
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
  const overdueGardenCount = gardenTasks.filter((t) => getDueStatus(t.next_due_date) === "overdue").length
  const totalOverdueCount = overdueCount + overdueGardenCount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            Fällige Aufgaben
          </h1>
          {!loading && !error && totalTaskCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {totalTaskCount} Aufgabe{totalTaskCount !== 1 ? "n" : ""} fällig
              {totalOverdueCount > 0 && (
                <span className="text-orange-600">
                  {" "}({totalOverdueCount} überfällig)
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/tasks/overview">
              <LayoutList className="h-4 w-4" />
              Übersicht
            </Link>
          </Button>
          <div className="h-5 w-px bg-border" />
          <Button
            size="sm"
            onClick={handleOpenCreateSheet}
            aria-label="Aufgabe hinzufügen"
          >
            <Plus className="h-4 w-4" />
            Aufgabe hinzufügen
          </Button>
        </div>
      </div>

      {/* Task Filter Bar */}
      {!loading && !error && totalTaskCount > 0 && (
        <TaskFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeStatuses={activeStatuses}
          onToggleStatus={handleToggleStatus}
          availableStatuses={availableStatuses}
          filteredCount={filteredTotalCount}
          totalCount={totalTaskCount}
          isFilterActive={isFilterActive}
          onResetFilters={resetFilters}
        />
      )}

      {/* Content */}
      {loading ? (
        <TasksPageSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-10 w-10 text-destructive/60" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => fetchTasks()}>
            Erneut versuchen
          </Button>
        </div>
      ) : totalTaskCount === 0 ? (
        <AllDoneState onGoToPlants={() => router.push("/plants")} />
      ) : isFilterActive && filteredTotalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-muted p-4 rounded-full mb-4">
            <Search className="h-10 w-10 text-muted-foreground/60" />
          </div>
          <h2 className="text-lg font-medium">Keine Aufgaben gefunden</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-xs">
            Keine Aufgaben entsprechen den aktiven Filtern.
          </p>
          <Button variant="outline" onClick={resetFilters}>
            Filter zurücksetzen
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Garden tasks section */}
          {filteredGardenTasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Shovel className="h-4 w-4" />
                Garten
              </div>
              <div className="space-y-2">
                {filteredGardenTasks.map((task) => {
                  const status = getDueStatus(task.next_due_date)
                  const isCompleting = completingIds.has(task.id)
                  return (
                    <Card
                      key={task.id}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-accent/50",
                        status === "overdue"
                          ? "border-orange-200/70 bg-orange-50/50"
                          : status === "today"
                          ? "border-primary/50 bg-primary/5"
                          : ""
                      )}
                      onClick={() => handleGardenTaskClick(task)}
                    >
                      <CardContent className="flex items-center gap-3 p-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGardenCompleteClick(task)
                          }}
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
                          <h3 className="font-medium text-sm truncate">{task.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {task.frequency !== "once" && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {GARDEN_FREQUENCY_LABELS[task.frequency as GardenTaskFrequency]}
                              </span>
                            )}
                            {task.frequency === "once" && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                Einmalig
                              </Badge>
                            )}
                            {task.active_month_start != null && task.active_month_end != null && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                {getSeasonBadgeLabel(task.active_month_start, task.active_month_end)}
                              </Badge>
                            )}
                            {status === "overdue" && (
                              <Badge className="text-xs px-1.5 py-0 bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-100">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Seit {formatDate(task.next_due_date)}
                              </Badge>
                            )}
                            {status === "upcoming" && (
                              <span>Fällig: {formatDate(task.next_due_date)}</span>
                            )}
                          </div>
                          {task.notes && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {task.notes}
                            </p>
                          )}
                        </div>
                        {/* Three-dot menu for garden tasks */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Aktionen für ${task.name}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleGardenTaskClick(task)}>
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeletingGardenTask(task)}
                            >
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Plant care tasks section */}
          {filteredCareTasks.length > 0 && (() => {
            const overdueGroups = sortedGroups.filter((g) =>
              g.tasks.some((t) => getDueStatus(t.next_due_date) === "overdue")
            )
            const upcomingGroups = sortedGroups.filter((g) =>
              g.tasks.every((t) => getDueStatus(t.next_due_date) !== "overdue")
            )
            return (
              <>
                {overdueGroups.length > 0 && (
                  <div className="space-y-4">
                    <div className="space-y-6">
                      {overdueGroups.map((group) => (
                        <PlantGroup
                          key={group.plantId}
                          group={group}
                          completingIds={completingIds}
                          onPlantClick={() => router.push(`/plants/${group.plantId}`)}
                          onCompleteClick={handleCompleteClick}
                          onEditClick={handleEditCareTask}
                          onDeleteClick={setDeletingCareTask}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {upcomingGroups.length > 0 && (
                  <div className="space-y-4">
                    {overdueGroups.length > 0 && (
                      <p className="text-sm font-medium text-muted-foreground">
                        Anstehende Aufgaben
                      </p>
                    )}
                    <div className="space-y-6">
                      {upcomingGroups.map((group) => (
                        <PlantGroup
                          key={group.plantId}
                          group={group}
                          completingIds={completingIds}
                          onPlantClick={() => router.push(`/plants/${group.plantId}`)}
                          onCompleteClick={handleCompleteClick}
                          onEditClick={handleEditCareTask}
                          onDeleteClick={setDeletingCareTask}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* Overdue completion confirmation dialog (care tasks) */}
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

      {/* Overdue completion confirmation dialog (garden tasks) */}
      <AlertDialog open={!!overdueGardenTask} onOpenChange={(open) => { if (!open) setOverdueGardenTask(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Überfällige Aufgabe erledigen</AlertDialogTitle>
            <AlertDialogDescription>
              Die Aufgabe &quot;{overdueGardenTask?.name}&quot; ist überfällig. Wie soll das nächste Fälligkeitsdatum berechnet werden?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="outline"
                onClick={() => overdueGardenTask && doGardenComplete(overdueGardenTask, "original")}
              >
                Im Original-Rhythmus
              </Button>
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => overdueGardenTask && doGardenComplete(overdueGardenTask, "today")}
            >
              Ab heute rechnen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog for care tasks */}
      <AlertDialog open={!!deletingCareTask} onOpenChange={(open) => { if (!open) setDeletingCareTask(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pflegeaufgabe löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Aufgabe &quot;{deletingCareTask?.name}&quot; wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCare}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCareTask}
              disabled={isDeletingCare}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingCare && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog for garden tasks (via menu) */}
      <AlertDialog open={!!deletingGardenTask} onOpenChange={(open) => { if (!open) setDeletingGardenTask(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gartenaufgabe löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Aufgabe &quot;{deletingGardenTask?.name}&quot; wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingGarden}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGardenTask}
              disabled={isDeletingGarden}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingGarden && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Garden task create/edit sheet */}
      <GardenTaskSheet
        open={gardenSheetOpen}
        onOpenChange={(open) => {
          setGardenSheetOpen(open)
          if (!open) setEditingGardenTask(null)
        }}
        task={editingGardenTask}
        onSuccess={handleGardenSheetSuccess}
      />

      {/* Task type picker sheet */}
      <TaskTypePicker
        open={typePickerOpen}
        onOpenChange={setTypePickerOpen}
        onSelectGeneral={handlePickerSelectGeneral}
        onSelectPlant={handlePickerSelectPlant}
      />

      {/* Care task sheet (for creating AND editing care tasks) */}
      <CareTaskSheet
        open={careSheetOpen}
        onOpenChange={(open) => {
          setCareSheetOpen(open)
          if (!open) {
            setCareSheetPlantId(null)
            setEditingCareTask(null)
          }
        }}
        plantId={lastCareSheetPlantIdRef.current ?? ''}
        task={editingCareTask ? {
          id: editingCareTask.id,
          plant_id: editingCareTask.plant_id,
          user_id: editingCareTask.user_id,
          name: editingCareTask.name,
          frequency: editingCareTask.frequency,
          interval_days: editingCareTask.interval_days,
          next_due_date: editingCareTask.next_due_date,
          notes: editingCareTask.notes,
          active_month_start: editingCareTask.active_month_start,
          active_month_end: editingCareTask.active_month_end,
          created_at: editingCareTask.created_at,
        } : undefined}
        onSuccess={handleCareEditSuccess}
      />
    </div>
  )
}

function PlantGroup({
  group,
  completingIds,
  onPlantClick,
  onCompleteClick,
  onEditClick,
  onDeleteClick,
}: {
  group: { plantId: string; plantName: string; tasks: TodayCareTask[] }
  completingIds: Set<string>
  onPlantClick: () => void
  onCompleteClick: (task: TodayCareTask) => void
  onEditClick: (task: TodayCareTask) => void
  onDeleteClick: (task: TodayCareTask) => void
}) {
  return (
    <div className="space-y-2">
      <button
        onClick={onPlantClick}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Leaf className="h-4 w-4" />
        {group.plantName}
      </button>
      <div className="space-y-2">
        {group.tasks.map((task) => {
          const status = getDueStatus(task.next_due_date)
          const isCompleting = completingIds.has(task.id)
          return (
            <Card
              key={task.id}
              className={
                status === "overdue"
                  ? "border-orange-200/70 bg-orange-50/50"
                  : status === "today"
                  ? "border-primary/50 bg-primary/5"
                  : ""
              }
            >
              <CardContent className="flex items-center gap-3 p-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full"
                  onClick={() => onCompleteClick(task)}
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
                    {task.active_month_start != null && task.active_month_end != null && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {getSeasonBadgeLabel(task.active_month_start, task.active_month_end)}
                      </Badge>
                    )}
                    {status === "overdue" && (
                      <Badge className="text-xs px-1.5 py-0 bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-100">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Seit {formatDate(task.next_due_date)}
                      </Badge>
                    )}
                    {status === "upcoming" && (
                      <span>Fällig: {formatDate(task.next_due_date)}</span>
                    )}
                  </div>
                  {task.notes && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {task.notes}
                    </p>
                  )}
                </div>
                {/* Three-dot menu for care tasks */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label={`Aktionen für ${task.name}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditClick(task)}>
                      Bearbeiten
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDeleteClick(task)}
                    >
                      Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function AllDoneState({ onGoToPlants }: { onGoToPlants: () => void }) {
  const monthName = new Date().toLocaleDateString("de-DE", { month: "long" })
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <PartyPopper className="h-10 w-10 text-primary/60" />
      </div>
      <h2 className="text-lg font-medium">Alles erledigt!</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-xs">
        Keine Aufgaben im {monthName} fällig. Entspann dich oder schau bei deinen Pflanzen vorbei.
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
