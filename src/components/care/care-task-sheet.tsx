"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
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
import { FREQUENCY_OPTIONS } from "@/lib/types/care"
import type { CareTask, CareFrequency } from "@/lib/types/care"

interface CareTaskSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plantId: string
  /** If provided, we are editing an existing task */
  task?: CareTask | null
  onSuccess: (task: CareTask) => void
}

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0]
}

export function CareTaskSheet({
  open,
  onOpenChange,
  plantId,
  task,
  onSuccess,
}: CareTaskSheetProps) {
  const isEditing = !!task

  const [name, setName] = useState("")
  const [frequency, setFrequency] = useState<CareFrequency>("weekly")
  const [intervalDays, setIntervalDays] = useState<number>(7)
  const [nextDueDate, setNextDueDate] = useState(getTodayISO())
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when opening or when task changes
  useEffect(() => {
    if (open) {
      if (task) {
        setName(task.name)
        setFrequency(task.frequency)
        setIntervalDays(task.interval_days)
        setNextDueDate(task.next_due_date)
        setNotes(task.notes ?? "")
      } else {
        setName("")
        setFrequency("weekly")
        setIntervalDays(7)
        setNextDueDate(getTodayISO())
        setNotes("")
      }
      setError(null)
    }
  }, [open, task])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Name ist erforderlich.")
      return
    }

    if (frequency === "custom" && (!intervalDays || intervalDays < 1)) {
      setError("Bitte gib ein Intervall in Tagen an.")
      return
    }

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
        url = `/api/plants/${plantId}/care/${task.id}`
        method = "PUT"
        body.action = "edit"
      } else {
        url = `/api/plants/${plantId}/care`
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
      onSuccess(savedTask)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Aufgabe bearbeiten" : "Neue Pflegeaufgabe"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="care-name">Name</Label>
            <Input
              id="care-name"
              placeholder="z.B. Gießen, Düngen..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="care-frequency">Häufigkeit</Label>
            <Select
              value={frequency}
              onValueChange={(v) => setFrequency(v as CareFrequency)}
            >
              <SelectTrigger id="care-frequency" aria-label="Häufigkeit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((opt) => (
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
              <Label htmlFor="care-interval">Intervall (Tage)</Label>
              <Input
                id="care-interval"
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
            <Label htmlFor="care-due-date">Nächstes Fälligkeitsdatum</Label>
            <Input
              id="care-due-date"
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="care-notes">Notizen (optional)</Label>
            <Textarea
              id="care-notes"
              placeholder="Tipps oder Hinweise..."
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

          <SheetFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Speichern" : "Erstellen"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
