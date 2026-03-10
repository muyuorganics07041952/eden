"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Leaf, Plus, AlertCircle, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlantCard } from "@/components/plants/plant-card"
import { AddPlantSheet } from "@/components/plants/add-plant-sheet"
import { PlantFilterBar } from "@/components/plants/plant-filter-bar"
import { NotificationBanner } from "@/components/notifications/notification-banner"
import type { Plant, SortOption } from "@/lib/types/plants"

type DueTask = { id: string; plant_id: string; next_due_date: string }

export default function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [sort, setSort] = useState<SortOption>("newest")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Care tasks due today (for "Pflege heute" filter)
  const [dueTasks, setDueTasks] = useState<DueTask[]>([])

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [activeLocations, setActiveLocations] = useState<Set<string>>(new Set())
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [careToday, setCareToday] = useState(false)

  const fetchPlants = useCallback(async (sortOption: SortOption) => {
    setLoading(true)
    setError(null)
    try {
      // Load plants and due care tasks in parallel
      const [plantsRes, careRes] = await Promise.all([
        fetch(`/api/plants?sort=${sortOption}`),
        fetch(`/api/care-tasks/due-today?date=${new Date().toLocaleDateString('en-CA')}`),
      ])

      if (!plantsRes.ok) throw new Error("Fehler beim Laden")
      const plantsData = await plantsRes.json()
      setPlants(Array.isArray(plantsData) ? plantsData : [])

      if (careRes.ok) {
        const careData = await careRes.json()
        setDueTasks(Array.isArray(careData) ? careData : [])
      }
    } catch {
      setError("Fehler beim Laden der Pflanzen")
      setPlants([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlants(sort)
  }, [sort, fetchPlants])

  // Derive set of plant IDs with care tasks due today
  const plantIdsWithCareDue = useMemo(() => {
    const ids = new Set<string>()
    for (const task of dueTasks) {
      ids.add(task.plant_id)
    }
    return ids
  }, [dueTasks])

  // Client-side filtering
  const filteredPlants = useMemo(() => {
    let result = plants

    // Search filter (name + location, case-insensitive)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.location && p.location.toLowerCase().includes(q))
      )
    }

    // Location filter (OR logic within locations)
    if (activeLocations.size > 0) {
      result = result.filter(
        (p) => p.location && activeLocations.has(p.location)
      )
    }

    // Tag filter (OR logic within tags)
    if (activeTags.size > 0) {
      result = result.filter(
        (p) =>
          p.tags &&
          p.tags.some((t) => activeTags.has(t.toLowerCase()))
      )
    }

    // Care today filter
    if (careToday) {
      result = result.filter((p) => plantIdsWithCareDue.has(p.id))
    }

    return result
  }, [plants, searchQuery, activeLocations, activeTags, careToday, plantIdsWithCareDue])

  function handlePlantAdded(plant: Plant) {
    setPlants((prev) => [plant, ...prev])
  }

  function handleSortChange(value: string) {
    setSort(value as SortOption)
  }

  function handleToggleLocation(location: string) {
    setActiveLocations((prev) => {
      const next = new Set(prev)
      if (next.has(location)) {
        next.delete(location)
      } else {
        next.add(location)
      }
      return next
    })
  }

  function handleToggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) {
        next.delete(tag)
      } else {
        next.add(tag)
      }
      return next
    })
  }

  function handleToggleCareToday() {
    setCareToday((prev) => !prev)
  }

  function handleResetAll() {
    setSearchQuery("")
    setActiveLocations(new Set())
    setActiveTags(new Set())
    setCareToday(false)
  }

  const hasActiveFilters =
    searchQuery.length > 0 ||
    activeLocations.size > 0 ||
    activeTags.size > 0 ||
    careToday

  return (
    <div className="space-y-6">
      {/* Push Notification Banner -- only show after loading to prevent layout shift */}
      <NotificationBanner hasPlants={!loading && plants.length > 0} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Meine Pflanzen</h1>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="h-4 w-4" />
          Neue Pflanze
        </Button>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <Select value={sort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[200px]" aria-label="Sortierung">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Neueste zuerst</SelectItem>
            <SelectItem value="alphabetical">Alphabetisch</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filter Bar -- only show when we have plants */}
      {!loading && plants.length > 0 && (
        <PlantFilterBar
          plants={plants}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeLocations={activeLocations}
          onToggleLocation={handleToggleLocation}
          activeTags={activeTags}
          onToggleTag={handleToggleTag}
          careToday={careToday}
          onToggleCareToday={handleToggleCareToday}
          hasCareTasksDue={plantIdsWithCareDue.size > 0}
          filteredCount={filteredPlants.length}
          totalCount={plants.length}
          onResetAll={handleResetAll}
        />
      )}

      {/* Content */}
      {loading ? (
        <PlantGridSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchPlants(sort)} />
      ) : plants.length === 0 ? (
        <EmptyState onAdd={() => setSheetOpen(true)} />
      ) : filteredPlants.length === 0 && hasActiveFilters ? (
        <NoFilterResultState onReset={handleResetAll} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredPlants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}

      {/* Add Plant Sheet */}
      <AddPlantSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={handlePlantAdded}
      />
    </div>
  )
}

function PlantGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[3/4] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <Leaf className="h-10 w-10 text-primary/40" />
      </div>
      <h2 className="text-lg font-medium">Noch keine Pflanzen</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Lege deine erste Pflanze an
      </p>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Erste Pflanze anlegen
      </Button>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-destructive/10 p-4 rounded-full mb-4">
        <AlertCircle className="h-10 w-10 text-destructive/60" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Erneut versuchen
      </Button>
    </div>
  )
}

function NoFilterResultState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted p-4 rounded-full mb-4">
        <SearchX className="h-10 w-10 text-muted-foreground/60" />
      </div>
      <h2 className="text-lg font-medium">Keine Pflanzen gefunden</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Keine Pflanze entspricht den aktiven Filtern
      </p>
      <Button variant="outline" onClick={onReset}>
        Alle Filter zurücksetzen
      </Button>
    </div>
  )
}
