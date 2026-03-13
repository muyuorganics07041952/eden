"use client"

import { useState } from "react"
import { Check, Pencil, Trash2, Clock, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { FREQUENCY_LABELS } from "@/lib/types/care"
import type { CareTask, CareFrequency } from "@/lib/types/care"

const MAX_NOTE_LENGTH = 500

interface CareTaskCardProps {
  task: CareTask
  plantId: string
  onComplete: (taskId: string, mode: "today" | "original", notes?: string) => Promise<void>
  onEdit: (task: CareTask) => void
  onDelete: (taskId: string) => Promise<void>
}

function getDueStatus(nextDueDate: string): "overdue" | "today" | "upcoming" {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(nextDueDate + "T00:00:00")
  if (due < today) return "overdue"
  if (due.getTime() === today.getTime()) return "today"
  return "upcoming"
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function CareTaskCard({
  task,
  plantId,
  onComplete,
  onEdit,
  onDelete,
}: CareTaskCardProps) {
  const [completing, setCompleting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [overdueDialogOpen, setOverdueDialogOpen] = useState(false)
  // Note dialog state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [pendingMode, setPendingMode] = useState<"today" | "original">("today")

  const status = getDueStatus(task.next_due_date)

  async function handleCompleteClick() {
    if (status === "overdue") {
      setOverdueDialogOpen(true)
      return
    }
    // Non-overdue: show note dialog directly
    openNoteDialog("today")
  }

  function openNoteDialog(mode: "today" | "original") {
    setPendingMode(mode)
    setNoteText("")
    setShowNoteInput(false)
    setOverdueDialogOpen(false)
    setNoteDialogOpen(true)
  }

  async function doComplete(notes?: string) {
    setCompleting(true)
    setNoteDialogOpen(false)
    try {
      await onComplete(task.id, pendingMode, notes)
    } catch {
      toast.error("Aufgabe konnte nicht erledigt werden. Bitte überprüfe deine Verbindung.")
    } finally {
      setCompleting(false)
      setNoteText("")
      setShowNoteInput(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete(task.id)
    } finally {
      setDeleting(false)
    }
  }

  function handleNoteDialogOpenChange(open: boolean) {
    if (!open) {
      // User closed dialog without choosing - do NOT complete
      setNoteDialogOpen(false)
      setNoteText("")
      setShowNoteInput(false)
    }
  }

  return (
    <Card
      className={
        status === "overdue"
          ? "border-destructive/50 bg-destructive/5"
          : status === "today"
          ? "border-primary/50 bg-primary/5"
          : ""
      }
    >
      <CardContent className="flex items-start gap-3 p-4">
        {/* Complete button */}
        <Button
          variant="outline"
          size="icon"
          className="mt-0.5 h-8 w-8 shrink-0 rounded-full"
          onClick={handleCompleteClick}
          disabled={completing}
          aria-label={`${task.name} als erledigt markieren`}
        >
          <Check className={`h-4 w-4 ${completing ? "animate-spin" : ""}`} />
        </Button>

        {/* Task info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm leading-tight">{task.name}</h3>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(task)}
                aria-label={`${task.name} bearbeiten`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    aria-label={`${task.name} löschen`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Aufgabe löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Die Pflegeaufgabe &quot;{task.name}&quot; wird unwiderruflich gelöscht.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? "Wird gelöscht..." : "Löschen"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {FREQUENCY_LABELS[task.frequency as CareFrequency]}
              {task.frequency === "custom" && ` (${task.interval_days} Tage)`}
            </span>

            {status === "overdue" && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Überfällig
              </Badge>
            )}
            {status === "today" && (
              <Badge className="text-xs px-1.5 py-0 bg-primary">
                Heute fällig
              </Badge>
            )}
            {status === "upcoming" && (
              <span>Fällig: {formatDate(task.next_due_date)}</span>
            )}
          </div>

          {task.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.notes}
            </p>
          )}
        </div>
      </CardContent>

      {/* Overdue completion confirmation dialog */}
      <AlertDialog open={overdueDialogOpen} onOpenChange={setOverdueDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Überfällige Aufgabe erledigen</AlertDialogTitle>
            <AlertDialogDescription>
              Die Aufgabe &quot;{task.name}&quot; ist überfällig. Wie soll das nächste Fälligkeitsdatum berechnet werden?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel disabled={completing}>Abbrechen</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => openNoteDialog("original")}
              disabled={completing}
            >
              Im Original-Rhythmus
            </Button>
            <Button
              onClick={() => openNoteDialog("today")}
              disabled={completing}
            >
              Ab heute rechnen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Note dialog - appears after mode selection or direct complete */}
      <AlertDialog open={noteDialogOpen} onOpenChange={handleNoteDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aufgabe erledigt</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du eine Notiz zu dieser Erledigung hinzufügen?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {showNoteInput ? (
            <div className="space-y-2">
              <Textarea
                placeholder="z.B. Pflanze sieht trocken aus..."
                value={noteText}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_NOTE_LENGTH) {
                    setNoteText(e.target.value)
                  }
                }}
                className="min-h-[80px] resize-none"
                aria-label="Notiz zur Erledigung"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-right">
                {noteText.length}/{MAX_NOTE_LENGTH}
              </p>
            </div>
          ) : null}

          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            {showNoteInput ? (
              <>
                <AlertDialogCancel
                  onClick={() => {
                    setShowNoteInput(false)
                    setNoteText("")
                  }}
                >
                  Abbrechen
                </AlertDialogCancel>
                <Button
                  onClick={() => doComplete(noteText.trim() || undefined)}
                  disabled={completing}
                >
                  {completing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Erledigen
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => doComplete(undefined)}
                  disabled={completing}
                >
                  {completing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Überspringen
                </Button>
                <Button
                  onClick={() => setShowNoteInput(true)}
                >
                  Notiz hinzufügen
                </Button>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
