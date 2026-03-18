"use client"

import { useState } from "react"
import { Loader2, Bug, Lightbulb, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { toast } from "sonner"

const MIN_CHARS = 10
const MAX_CHARS = 1000

type FeedbackType = "bug" | "idea" | "praise"

interface FeedbackTypeOption {
  value: FeedbackType
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const feedbackTypes: FeedbackTypeOption[] = [
  { value: "bug", label: "Bug", icon: Bug },
  { value: "idea", label: "Idee", icon: Lightbulb },
  { value: "praise", label: "Lob", icon: Heart },
]

interface FeedbackSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pageUrl: string
}

export function FeedbackSheet({ open, onOpenChange, pageUrl }: FeedbackSheetProps) {
  const [type, setType] = useState<FeedbackType>("idea")
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedText = text.trim()
  const isValid = trimmedText.length >= MIN_CHARS && trimmedText.length <= MAX_CHARS
  const showMinError = trimmedText.length > 0 && trimmedText.length < MIN_CHARS

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setText("")
      setType("idea")
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          text: trimmedText,
          page_url: pageUrl,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 429) {
          throw new Error(
            data.error || "Du hast heute schon 50 Feedbacks gesendet. Bitte versuche es morgen wieder."
          )
        }
        throw new Error(data.error || "Konnte Feedback nicht senden. Bitte versuche es erneut.")
      }

      toast.success("Danke für dein Feedback!")
      handleClose(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Konnte Feedback nicht senden. Bitte versuche es erneut.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Feedback geben</SheetTitle>
          <SheetDescription>
            Hilf uns, Eden besser zu machen. Dein Feedback ist uns wichtig.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Type selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Was möchtest du teilen?
            </label>
            <div className="flex gap-2">
              {feedbackTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors border ${
                    type === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                  }`}
                  aria-pressed={type === value}
                  aria-label={`Typ: ${label}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Text input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Beschreibe dein Feedback..."
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              rows={4}
              required
              minLength={MIN_CHARS}
              maxLength={MAX_CHARS}
              aria-label="Feedback-Text"
              aria-describedby="feedback-char-count"
            />
            <div className="flex items-center justify-between">
              {showMinError ? (
                <p className="text-xs text-destructive">
                  Bitte gib mindestens {MIN_CHARS} Zeichen ein
                </p>
              ) : (
                <span />
              )}
              <p
                id="feedback-char-count"
                className={`text-xs ${
                  trimmedText.length >= MAX_CHARS
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {trimmedText.length}/{MAX_CHARS}
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleClose(false)}
              disabled={submitting}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!isValid || submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Absenden
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
