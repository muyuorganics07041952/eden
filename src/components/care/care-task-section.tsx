"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Sparkles,
  Loader2,
  AlertCircle,
  PartyPopper,
  Check,
  X,
  CheckCheck,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { CareTaskCard } from "@/components/care/care-task-card"
import { CareTaskSheet } from "@/components/care/care-task-sheet"
import { FREQUENCY_LABELS } from "@/lib/types/care"
import type { CareTask, CareSuggestion, CareFrequency } from "@/lib/types/care"

interface CareTaskSectionProps {
  plantId: string
}

export function CareTaskSection({ plantId }: CareTaskSectionProps) {
  const [tasks, setTasks] = useState<CareTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Suggestions preview state
  const [suggestions, setSuggestions] = useState<CareSuggestion[]>([])
  const [acceptingNames, setAcceptingNames] = useState<Set<string>>(new Set())
  const [acceptingAll, setAcceptingAll] = useState(false)
  const [acceptErrors, setAcceptErrors] = useState<Map<string, string>>(new Map())

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
      // Run task refresh and AI generation in parallel so the duplicate
      // check always uses fresh server data (BUG-2 fix)
      const [freshTasksRes, genRes] = await Promise.all([
        fetch(`/api/plants/${plantId}/care`),
        fetch(`/api/plants/${plantId}/care/generate`, { method: "POST" }),
      ])

      if (!genRes.ok) {
        const data = await genRes.json().catch(() => ({}))
        throw new Error(data.error || "Fehler bei der KI-Generierung.")
      }

      const newSuggestions: CareSuggestion[] = await genRes.json()

      // Use fresh task list for duplicate check; fall back to current state
      let existingNames = new Set(tasks.map((t) => t.name.toLowerCase()))
      if (freshTasksRes.ok) {
        const freshTasks: CareTask[] = await freshTasksRes.json()
        if (Array.isArray(freshTasks)) {
          setTasks(freshTasks)
          existingNames = new Set(freshTasks.map((t) => t.name.toLowerCase()))
        }
      }

      const filtered = newSuggestions.filter(
        (s) => !existingNames.has(s.name.toLowerCase())
      )

      if (filtered.length === 0) {
        setGenerateError("Alle KI-Vorschläge existieren bereits als Aufgaben.")
      } else {
        setSuggestions(filtered)
      }
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Fehler bei der KI-Generierung."
      )
    } finally {
      setGenerating(false)
    }
  }

  async function handleAcceptSuggestion(suggestion: CareSuggestion) {
    setAcceptingNames((prev) => new Set(prev).add(suggestion.name))
    setAcceptErrors((prev) => {
      const next = new Map(prev)
      next.delete(suggestion.name)
      return next
    })
    try {
      const res = await fetch(`/api/plants/${plantId}/care`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: suggestion.name,
          frequency: suggestion.frequency,
          interval_days: suggestion.interval_days,
          next_due_date: suggestion.next_due_date,
          notes: suggestion.notes,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Fehler beim Speichern")
      }
      const savedTask: CareTask = await res.json()
      setTasks((prev) => [...prev, savedTask])
      setSuggestions((prev) => prev.filter((s) => s.name !== suggestion.name))
    } catch (err) {
      setAcceptErrors((prev) => {
        const next = new Map(prev)
        next.set(suggestion.name, err instanceof Error ? err.message : "Fehler beim Speichern")
        return next
      })
    } finally {
      setAcceptingNames((prev) => {
        const next = new Set(prev)
        next.delete(suggestion.name)
        return next
      })
    }
  }

  function handleRejectSuggestion(suggestion: CareSuggestion) {
    setSuggestions((prev) => prev.filter((s) => s.name !== suggestion.name))
    setAcceptErrors((prev) => {
      const next = new Map(prev)
      next.delete(suggestion.name)
      return next
    })
  }

  async function handleAcceptAll() {
    setAcceptingAll(true)
    // BUG-1 fix: run all save requests in parallel instead of sequentially
    const results = await Promise.all(
      suggestions.map(async (suggestion) => {
        try {
          const res = await fetch(`/api/plants/${plantId}/care`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: suggestion.name,
              frequency: suggestion.frequency,
              interval_days: suggestion.interval_days,
              next_due_date: suggestion.next_due_date,
              notes: suggestion.notes,
            }),
          })
          if (!res.ok) throw new Error("Fehler")
          const savedTask: CareTask = await res.json()
          return { ok: true as const, task: savedTask, suggestion }
        } catch {
          return { ok: false as const, suggestion }
        }
      })
    )

    const accepted = results.filter((r) => r.ok).map((r) => (r as { ok: true; task: CareTask }).task)
    const failed = results.filter((r) => !r.ok).map((r) => r.suggestion)
    setTasks((prev) => [...prev, ...accepted])
    setSuggestions(failed)
    setAcceptingAll(false)
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

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pflegeaufgaben</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating || acceptingAll}
          >
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
        <div
          className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{generateError}</p>
        </div>
      )}

      {/* ── KI-Vorschläge (Suggestions) ── */}
      {suggestions.length > 0 && (
        <div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-primary">
                KI-Vorschläge ({suggestions.length})
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcceptAll}
              disabled={acceptingAll}
              aria-label="Alle Vorschläge übernehmen"
            >
              {acceptingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {acceptingAll ? "Wird übernommen..." : "Alle übernehmen"}
              </span>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Hake eine Aufgabe an um sie zu übernehmen, oder lehne sie mit ✕ ab.
          </p>

          <div className="space-y-2">
            {suggestions.map((suggestion) => {
              const isAccepting = acceptingNames.has(suggestion.name)
              const acceptError = acceptErrors.get(suggestion.name)
              return (
                <div
                  key={suggestion.name}
                  className={`flex items-start gap-3 rounded-md border bg-background p-3 ${
                    acceptError ? "border-destructive/50" : "border-border"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{suggestion.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {FREQUENCY_LABELS[suggestion.frequency as CareFrequency]}
                        {suggestion.frequency === "custom" &&
                          ` (${suggestion.interval_days} Tage)`}
                      </span>
                      {suggestion.notes && (
                        <span className="line-clamp-1">{suggestion.notes}</span>
                      )}
                    </div>
                    {acceptError && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {acceptError} – erneut versuchen
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleAcceptSuggestion(suggestion)}
                      disabled={isAccepting || acceptingAll}
                      aria-label={`${suggestion.name} übernehmen`}
                    >
                      {isAccepting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                      onClick={() => handleRejectSuggestion(suggestion)}
                      disabled={isAccepting || acceptingAll}
                      aria-label={`${suggestion.name} ablehnen`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Meine Aufgaben (Tasks) ── */}
      {suggestions.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <h3 className="text-sm font-semibold text-muted-foreground">Meine Aufgaben</h3>
          <Separator className="flex-1" />
        </div>
      )}

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
      ) : tasks.length === 0 && suggestions.length === 0 ? (
        <EmptyTasksState onAdd={handleOpenAdd} onGenerate={handleGenerate} generating={generating} />
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Noch keine Aufgaben – übernimm Vorschläge oder erstelle sie manuell.
        </p>
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
