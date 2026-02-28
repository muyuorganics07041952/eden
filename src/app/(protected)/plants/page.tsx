"use client"

import { useState, useEffect, useCallback } from "react"
import { Leaf, Plus, AlertCircle } from "lucide-react"
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
import type { Plant, SortOption } from "@/lib/types/plants"

export default function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [sort, setSort] = useState<SortOption>("newest")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const fetchPlants = useCallback(async (sortOption: SortOption) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/plants?sort=${sortOption}`)
      if (!res.ok) throw new Error("Fehler beim Laden")
      const data = await res.json()
      setPlants(data.plants ?? [])
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

  function handlePlantAdded(plant: Plant) {
    // Optimistically add to list
    setPlants((prev) => [plant, ...prev])
  }

  function handleSortChange(value: string) {
    setSort(value as SortOption)
  }

  return (
    <div className="space-y-6">
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

      {/* Content */}
      {loading ? (
        <PlantGridSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchPlants(sort)} />
      ) : plants.length === 0 ? (
        <EmptyState onAdd={() => setSheetOpen(true)} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {plants.map((plant) => (
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
