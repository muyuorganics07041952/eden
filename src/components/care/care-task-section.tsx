"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Sparkles, Loader2, AlertCircle, PartyPopper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { CareTaskCard } from "@/components/care/care-task-card"
import { CareTaskSheet } from "@/components/care/care-task-sheet"
import type { CareTask } from "@/lib/types/care"

interface CareTaskSectionProps {
  plantId: string
}

export function CareTaskSection({ plantId }: CareTaskSectionProps) {
  const [tasks, setTasks] = useState<CareTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<CareTask | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/plants/${plantId}/care`)
      if (!res.ok) throw new Error("Fehler beim Laden")
      const data = await res.json()
      setTasks(Array.isArray(data) ? data : [])
    } catch {
      setError("Fehler beim Laden der Pflegeaufgaben.")
    } finally {
      setLoading(false)
    }
  }, [plantId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  async function handleGenerate() {
    setGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch(`/api/plants/${plantId}/care/generate`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          data.error || "Fehler bei der KI-Generierung."
        )
      }
      const newTasks: CareTask[] = await res.json()
      setTasks((prev) => [...prev, ...newTasks])
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Fehler bei der KI-Generierung."
      )
    } finally {
      setGenerating(false)
    }
  }

  function handleOpenAdd() {
    setEditingTask(null)
    setSheetOpen(true)
  }

  function handleEdit(task: CareTask) {
    setEditingTask(task)
    setSheetOpen(true)
  }

  function handleTaskSaved(savedTask: CareTask) {
    setTasks((prev) => {
      const exists = prev.find((t) => t.id === savedTask.id)
      if (exists) {
        return prev.map((t) => (t.id === savedTask.id ? savedTask : t))
      }
      return [...prev, savedTask]
    })
  }

  async function handleComplete(taskId: string, mode: "today" | "original" = "today") {
    const res = await fetch(`/api/plants/${plantId}/care/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", mode }),
    })
    if (!res.ok) throw new Error("Fehler beim Markieren als erledigt")
    const updatedTask: CareTask = await res.json()
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    )
  }

  async function handleDelete(taskId: string) {
    const res = await fetch(`/api/plants/${plantId}/care/${taskId}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("Fehler beim Löschen")
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  return (
    <div className="space-y-4">
      <Separator />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pflegeaufgaben</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {generating ? "Wird generiert..." : "KI-Vorschläge"}
            </span>
          </Button>
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Aufgabe</span>
          </Button>
        </div>
      </div>

      {/* Generate error */}
      {generateError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{generateError}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <CareTaskSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="bg-destructive/10 p-3 rounded-full mb-3">
            <AlertCircle className="h-8 w-8 text-destructive/60" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchTasks}>
            Erneut versuchen
          </Button>
        </div>
      ) : tasks.length === 0 ? (
        <EmptyTasksState onAdd={handleOpenAdd} onGenerate={handleGenerate} generating={generating} />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <CareTaskCard
              key={task.id}
              task={task}
              plantId={plantId}
              onComplete={handleComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Sheet */}
      <CareTaskSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        plantId={plantId}
        task={editingTask}
        onSuccess={handleTaskSaved}
      />
    </div>
  )
}

function EmptyTasksState({
  onAdd,
  onGenerate,
  generating,
}: {
  onAdd: () => void
  onGenerate: () => void
  generating: boolean
}) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="bg-primary/10 p-3 rounded-full mb-3">
        <PartyPopper className="h-8 w-8 text-primary/40" />
      </div>
      <h3 className="text-sm font-medium">Noch keine Pflegeaufgaben</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-xs">
        Erstelle Pflegeaufgaben manuell oder lass sie von der KI generieren.
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onGenerate} disabled={generating}>
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          KI-Vorschläge
        </Button>
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Manuell erstellen
        </Button>
      </div>
    </div>
  )
}

function CareTaskSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 border rounded-lg">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}
