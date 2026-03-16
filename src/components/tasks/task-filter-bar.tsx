"use client"

import { X, Search, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type StatusFilter = "overdue" | "upcoming"

const STATUS_LABELS: Record<StatusFilter, string> = {
  overdue: "Überfällig",
  upcoming: "Anstehend",
}

const STATUS_STYLES: Record<StatusFilter, { active: string; inactive: string }> = {
  overdue: {
    active: "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-100",
    inactive: "bg-transparent text-muted-foreground border-border hover:bg-orange-50 hover:text-orange-700",
  },
  upcoming: {
    active: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100",
    inactive: "bg-transparent text-muted-foreground border-border hover:bg-blue-50 hover:text-blue-700",
  },
}

interface TaskFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeStatuses: Set<StatusFilter>
  onToggleStatus: (status: StatusFilter) => void
  availableStatuses: Set<StatusFilter>
  filteredCount: number
  totalCount: number
  isFilterActive: boolean
  onResetFilters: () => void
}

export function TaskFilterBar({
  searchQuery,
  onSearchChange,
  activeStatuses,
  onToggleStatus,
  availableStatuses,
  filteredCount,
  totalCount,
  isFilterActive,
  onResetFilters,
}: TaskFilterBarProps) {
  const statusEntries = (Object.keys(STATUS_LABELS) as StatusFilter[]).filter(
    (s) => availableStatuses.has(s)
  )

  return (
    <div className="space-y-3">
      {/* Status Chips */}
      {statusEntries.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Status filtern">
          {statusEntries.map((status) => {
            const isActive = activeStatuses.has(status)
            const styles = STATUS_STYLES[status]
            return (
              <Badge
                key={status}
                variant="outline"
                className={cn(
                  "cursor-pointer select-none transition-colors text-xs px-2.5 py-1",
                  isActive ? styles.active : styles.inactive
                )}
                onClick={() => onToggleStatus(status)}
                role="checkbox"
                aria-checked={isActive}
                aria-label={`Filter: ${STATUS_LABELS[status]}`}
              >
                {STATUS_LABELS[status]}
              </Badge>
            )
          })}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Aufgabe oder Pflanze suchen..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
          aria-label="Aufgaben durchsuchen"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Suche leeren"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Info Row */}
      {isFilterActive && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {filteredCount} von {totalCount} Aufgabe{totalCount !== 1 ? "n" : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={onResetFilters}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Filter zurücksetzen
          </Button>
        </div>
      )}
    </div>
  )
}
