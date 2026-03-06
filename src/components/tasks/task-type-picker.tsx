"use client"

import { useState, useEffect, useCallback } from "react"
import { Leaf, Shovel, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PlantPhoto {
  id: string
  storage_path: string
  is_cover: boolean
  url: string
}

interface Plant {
  id: string
  name: string
  species?: string | null
  plant_photos?: PlantPhoto[]
}

type PickerStep = "choose" | "plant-list"

interface TaskTypePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectGeneral: () => void
  onSelectPlant: (plantId: string) => void
}

export function TaskTypePicker({
  open,
  onOpenChange,
  onSelectGeneral,
  onSelectPlant,
}: TaskTypePickerProps) {
  const [step, setStep] = useState<PickerStep>("choose")
  const [plants, setPlants] = useState<Plant[]>([])
  const [loadingPlants, setLoadingPlants] = useState(false)
  const [plantError, setPlantError] = useState<string | null>(null)

  // Reset step when sheet opens
  useEffect(() => {
    if (open) {
      setStep("choose")
      setPlants([])
      setPlantError(null)
    }
  }, [open])

  const fetchPlants = useCallback(async () => {
    setLoadingPlants(true)
    setPlantError(null)
    try {
      const res = await fetch("/api/plants?sort=alphabetical")
      if (!res.ok) throw new Error("Fehler beim Laden")
      const data = await res.json()
      setPlants(Array.isArray(data) ? data : [])
    } catch {
      setPlantError("Pflanzen konnten nicht geladen werden.")
    } finally {
      setLoadingPlants(false)
    }
  }, [])

  function handleCareTaskClick() {
    setStep("plant-list")
    fetchPlants()
  }

  function handleGeneralClick() {
    onOpenChange(false)
    onSelectGeneral()
  }

  function handlePlantSelect(plantId: string) {
    onOpenChange(false)
    onSelectPlant(plantId)
  }

  function getCoverPhotoUrl(plant: Plant): string | null {
    const photos = plant.plant_photos ?? []
    const cover = photos.find((p) => p.is_cover)
    return cover?.url ?? photos[0]?.url ?? null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col" side="bottom">
        <SheetHeader>
          <SheetTitle>
            {step === "choose"
              ? "Aufgabe hinzufügen"
              : "Pflanze auswählen"}
          </SheetTitle>
        </SheetHeader>

        {step === "choose" && (
          <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2">
            <button
              onClick={handleGeneralClick}
              className="flex items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
              aria-label="Allgemeine Aufgabe erstellen"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                <Shovel className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Allgemeine Aufgabe</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Aufgabe ohne Pflanzenbezug
                </p>
              </div>
            </button>

            <button
              onClick={handleCareTaskClick}
              className="flex items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
              aria-label="Pflegeaufgabe für eine Pflanze erstellen"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Pflegeaufgabe</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Für eine konkrete Pflanze
                </p>
              </div>
            </button>
          </div>
        )}

        {step === "plant-list" && (
          <div className="flex-1 min-h-0 py-4">
            {loadingPlants ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : plantError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-destructive/10 p-3 rounded-full mb-3">
                  <AlertCircle className="h-8 w-8 text-destructive/60" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {plantError}
                </p>
                <Button variant="outline" size="sm" onClick={fetchPlants}>
                  Erneut versuchen
                </Button>
              </div>
            ) : plants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted p-3 rounded-full mb-3">
                  <Leaf className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">
                  Noch keine Pflanzen vorhanden
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Lege zuerst eine Pflanze an.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/plants">Zu meinen Pflanzen</Link>
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[50vh] max-h-[400px]">
                <div className="space-y-1 pr-4">
                  {plants.map((plant) => {
                    const coverUrl = getCoverPhotoUrl(plant)
                    return (
                      <button
                        key={plant.id}
                        onClick={() => handlePlantSelect(plant.id)}
                        className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent"
                        aria-label={`${plant.name} auswählen`}
                      >
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={plant.name}
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Leaf className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {plant.name}
                          </p>
                          {plant.species && (
                            <p className="text-xs text-muted-foreground truncate">
                              {plant.species}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            )}

            {/* Back button */}
            {!loadingPlants && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("choose")}
                  className="w-full"
                >
                  Zurück zur Auswahl
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
