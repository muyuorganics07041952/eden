"use client"

import { useState, useEffect } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { GARDEN_FREQUENCY_OPTIONS } from "@/lib/types/care"
import type { GardenTask, GardenTaskFrequency } from "@/lib/types/care"

interface GardenTaskSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** If provided, we are editing an existing task */
  task?: GardenTask | null
  onSuccess: (task: GardenTask | null, action: "created" | "updated" | "deleted") => void
}

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0]
}

export function GardenTaskSheet({
  open,
  onOpenChange,
  task,
  onSuccess,
}: GardenTaskSheetProps) {
  const isEditing = !!task

  const [name, setName] = useState("")
  const [frequency, setFrequency] = useState<GardenTaskFrequency>("once")
  const [intervalDays, setIntervalDays] = useState<number>(7)
  const [nextDueDate, setNextDueDate] = useState(getTodayISO())
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset form when opening or when task changes
  useEffect(() => {
    if (open) {
      if (task) {
        setName(task.name)
        setFrequency(task.frequency as GardenTaskFrequency)
        setIntervalDays(task.interval_days ?? 7)
        setNextDueDate(task.next_due_date)
        setNotes(task.notes ?? "")
      } else {
        setName("")
        setFrequency("once")
        setIntervalDays(7)
        setNextDueDate(getTodayISO())
        setNotes("")
      }
      setError(null)
      setNameError(null)
      setDateError(null)
    }
  }, [open, task])

  function validateForm(): boolean {
    let valid = true
    setNameError(null)
    setDateError(null)

    if (!name.trim()) {
      setNameError("Name ist erforderlich.")
      valid = false
    }

    if (!nextDueDate) {
      setDateError("Fälligkeitsdatum ist erforderlich.")
      valid = false
    }

    if (frequency === "custom" && (!intervalDays || intervalDays < 1)) {
      setError("Bitte gib ein Intervall in Tagen an.")
      valid = false
    }

    return valid
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    setSaving(true)

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        frequency,
        next_due_date: nextDueDate,
        notes: notes.trim() || null,
      }

      if (frequency === "custom") {
        body.interval_days = intervalDays
      }

      let url: string
      let method: string

      if (isEditing && task) {
        url = `/api/garden-tasks/${task.id}`
        method = "PUT"
        body.action = "edit"
      } else {
        url = `/api/garden-tasks`
        method = "POST"
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Fehler beim Speichern.")
      }

      const savedTask = await res.json()
      onSuccess(savedTask, isEditing ? "updated" : "created")
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!task) return
    setShowDeleteConfirm(false)
    setDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/garden-tasks/${task.id}`, {
        method: "DELETE",
      })

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Fehler beim Löschen.")
      }

      onSuccess(null, "deleted")
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Löschen.")
    } finally {
      setDeleting(false)
    }
  }

  const isBusy = saving || deleting

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {isEditing ? "Gartenaufgabe bearbeiten" : "Neue Gartenaufgabe"}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="garden-task-name">Name</Label>
              <Input
                id="garden-task-name"
                placeholder="z.B. Kompost umsetzen, Rasen mähen..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) setNameError(null)
                }}
                maxLength={200}
                autoFocus
                aria-invalid={!!nameError}
                aria-describedby={nameError ? "garden-task-name-error" : undefined}
              />
              {nameError && (
                <p id="garden-task-name-error" className="text-sm text-destructive" role="alert">
                  {nameError}
                </p>
              )}
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label htmlFor="garden-task-frequency">Häufigkeit</Label>
              <Select
                value={frequency}
                onValueChange={(v) => setFrequency(v as GardenTaskFrequency)}
              >
                <SelectTrigger id="garden-task-frequency" aria-label="Häufigkeit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GARDEN_FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom interval */}
            {frequency === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="garden-task-interval">Intervall (Tage)</Label>
                <Input
                  id="garden-task-interval"
                  type="number"
                  min={1}
                  max={365}
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(Number(e.target.value))}
                />
              </div>
            )}

            {/* Next due date */}
            <div className="space-y-2">
              <Label htmlFor="garden-task-due-date">Fälligkeitsdatum</Label>
              <Input
                id="garden-task-due-date"
                type="date"
                value={nextDueDate}
                onChange={(e) => {
                  setNextDueDate(e.target.value)
                  if (dateError) setDateError(null)
                }}
                aria-invalid={!!dateError}
                aria-describedby={dateError ? "garden-task-date-error" : undefined}
              />
              {dateError && (
                <p id="garden-task-date-error" className="text-sm text-destructive" role="alert">
                  {dateError}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="garden-task-notes">Notizen (optional)</Label>
              <Textarea
                id="garden-task-notes"
                placeholder="Zusätzliche Hinweise..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <SheetFooter className="flex-col gap-2 sm:flex-row">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isBusy}
                  className="sm:mr-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Löschen
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isBusy}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isBusy}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? "Speichern" : "Erstellen"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gartenaufgabe löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Aufgabe &quot;{task?.name}&quot; wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
