"use client"

import { useMemo } from "react"
import { Search, X, Droplets } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Plant } from "@/lib/types/plants"

interface PlantFilterBarProps {
  plants: Plant[]
  searchQuery: string
  onSearchChange: (query: string) => void
  activeLocations: Set<string>
  onToggleLocation: (location: string) => void
  activeTags: Set<string>
  onToggleTag: (tag: string) => void
  careToday: boolean
  onToggleCareToday: () => void
  hasCareTasksDue: boolean
  filteredCount: number
  totalCount: number
  onResetAll: () => void
}

export function PlantFilterBar({
  plants,
  searchQuery,
  onSearchChange,
  activeLocations,
  onToggleLocation,
  activeTags,
  onToggleTag,
  careToday,
  onToggleCareToday,
  hasCareTasksDue,
  filteredCount,
  totalCount,
  onResetAll,
}: PlantFilterBarProps) {
  // Derive unique locations from plants
  const locations = useMemo(() => {
    const locs = new Set<string>()
    for (const p of plants) {
      if (p.location) locs.add(p.location)
    }
    return Array.from(locs).sort((a, b) => a.localeCompare(b, "de"))
  }, [plants])

  // Derive unique tags (case-insensitive deduplicated, display first occurrence)
  const tags = useMemo(() => {
    const seen = new Map<string, string>() // lowercase -> display form
    for (const p of plants) {
      if (p.tags) {
        for (const t of p.tags) {
          const lower = t.toLowerCase()
          if (!seen.has(lower)) seen.set(lower, t)
        }
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "de"))
  }, [plants])

  const hasActiveFilters =
    searchQuery.length > 0 ||
    activeLocations.size > 0 ||
    activeTags.size > 0 ||
    careToday

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="text"
          placeholder="Pflanze oder Standort suchen..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
          aria-label="Pflanzen durchsuchen"
        />
        {searchQuery.length > 0 && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Suche leeren"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      {(hasCareTasksDue || locations.length > 0 || tags.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {/* Care Today Chip */}
          {hasCareTasksDue && (
            <Badge
              variant={careToday ? "default" : "outline"}
              className="cursor-pointer select-none gap-1"
              onClick={onToggleCareToday}
              role="checkbox"
              aria-checked={careToday}
              aria-label="Filter: Pflege heute"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onToggleCareToday()
                }
              }}
            >
              <Droplets className="h-3 w-3" aria-hidden="true" />
              Pflege heute
            </Badge>
          )}

          {/* Location Chips */}
          {locations.map((loc) => (
            <Badge
              key={`loc-${loc}`}
              variant={activeLocations.has(loc) ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => onToggleLocation(loc)}
              role="checkbox"
              aria-checked={activeLocations.has(loc)}
              aria-label={`Standort-Filter: ${loc}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onToggleLocation(loc)
                }
              }}
            >
              {loc}
            </Badge>
          ))}

          {/* Tag Chips */}
          {tags.map((tag) => {
            const isActive = activeTags.has(tag.toLowerCase())
            return (
              <Badge
                key={`tag-${tag}`}
                variant={isActive ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => onToggleTag(tag.toLowerCase())}
                role="checkbox"
                aria-checked={isActive}
                aria-label={`Tag-Filter: ${tag}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onToggleTag(tag.toLowerCase())
                  }
                }}
              >
                {tag}
              </Badge>
            )
          })}
        </div>
      )}

      {/* Result Count + Reset */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredCount} von {totalCount} Pflanzen
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetAll}
            className="h-auto px-2 py-1 text-xs"
          >
            Alle Filter zurücksetzen
          </Button>
        </div>
      )}
    </div>
  )
}
