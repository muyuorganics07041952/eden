"use client"

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react"
import { History, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Completion {
  id: string
  task_id: string | null
  task_name: string
  completed_at: string
  notes: string | null
}

interface CompletionHistorySectionProps {
  plantId: string
}

export interface CompletionHistoryRef {
  refresh: () => void
}

const PAGE_SIZE = 10

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return "Gerade eben"
  if (diffMinutes < 60) return `vor ${diffMinutes} ${diffMinutes === 1 ? "Minute" : "Minuten"}`
  if (diffHours < 24) return `vor ${diffHours} ${diffHours === 1 ? "Stunde" : "Stunden"}`
  if (diffDays === 1) return "Gestern"
  if (diffDays < 7) return `vor ${diffDays} Tagen`
  if (diffDays < 14) return "vor 1 Woche"
  if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`
  if (diffDays < 60) return "vor 1 Monat"
  if (diffDays < 365) return `vor ${Math.floor(diffDays / 30)} Monaten`
  return `vor ${Math.floor(diffDays / 365)} ${Math.floor(diffDays / 365) === 1 ? "Jahr" : "Jahren"}`
}

function formatAbsoluteDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const CompletionHistorySection = forwardRef<CompletionHistoryRef, CompletionHistorySectionProps>(
  function CompletionHistorySection({ plantId }, ref) {
    const [completions, setCompletions] = useState<Completion[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchCompletions = useCallback(async (offset = 0, append = false) => {
      if (!append) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)

      try {
        const res = await fetch(
          `/api/plants/${plantId}/completions?limit=${PAGE_SIZE}&offset=${offset}`
        )
        if (!res.ok) throw new Error("Fehler beim Laden")
        const data = await res.json()

        if (append) {
          setCompletions((prev) => [...prev, ...data.completions])
        } else {
          setCompletions(data.completions)
        }
        setTotal(data.total)
      } catch {
        setError("Fehler beim Laden des Verlaufs.")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    }, [plantId])

    useEffect(() => {
      fetchCompletions()
    }, [fetchCompletions])

    // Expose refresh method to parent
    useImperativeHandle(ref, () => ({
      refresh: () => fetchCompletions(0, false),
    }))

    const hasMore = completions.length < total

    function handleLoadMore() {
      fetchCompletions(completions.length, true)
    }

    return (
      <div className="space-y-4">
        <Separator />

        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Verlauf</h2>
          {total > 0 && (
            <span className="text-sm text-muted-foreground">({total})</span>
          )}
        </div>

        {loading ? (
          <CompletionHistorySkeleton />
        ) : error ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="bg-destructive/10 p-3 rounded-full mb-3">
              <AlertCircle className="h-8 w-8 text-destructive/60" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchCompletions()}>
              Erneut versuchen
            </Button>
          </div>
        ) : completions.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="bg-muted p-3 rounded-full mb-3">
              <History className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-medium">Noch keine Erledigungen</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Wenn du Pflegeaufgaben erledigst, erscheint der Verlauf hier.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <TooltipProvider>
              {completions.map((completion) => (
                <CompletionHistoryEntry key={completion.id} completion={completion} />
              ))}
            </TooltipProvider>

            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Mehr laden
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)

function CompletionHistoryEntry({ completion }: { completion: Completion }) {
  const relativeDate = formatRelativeDate(completion.completed_at)
  const absoluteDate = formatAbsoluteDate(completion.completed_at)

  return (
    <div className="flex items-start gap-3 rounded-md px-3 py-2.5 hover:bg-muted/50 transition-colors">
      <div className="mt-0.5 h-2 w-2 rounded-full bg-primary/60 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="text-sm font-medium truncate">{completion.task_name}</h4>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 cursor-default">
                {relativeDate}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{absoluteDate}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-xs text-muted-foreground">
          {absoluteDate}
        </p>
        {completion.notes && (
          <p className="text-xs text-muted-foreground mt-1 italic">
            {completion.notes}
          </p>
        )}
      </div>
    </div>
  )
}

function CompletionHistorySkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-3 py-2.5">
          <Skeleton className="h-2 w-2 rounded-full mt-1.5 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      ))}
    </div>
  )
}
