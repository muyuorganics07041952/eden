"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Pencil, Trash2, Leaf, MapPin, Calendar, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { PhotoGallery } from "@/components/plants/photo-gallery"
import { EditPlantSheet } from "@/components/plants/edit-plant-sheet"
import { DeletePlantDialog } from "@/components/plants/delete-plant-dialog"
import type { Plant, PlantPhoto } from "@/lib/types/plants"

export default function PlantDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [plant, setPlant] = useState<Plant | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const fetchPlant = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const res = await fetch(`/api/plants/${params.id}`)
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      if (!res.ok) throw new Error("Fehler beim Laden")
      const data = await res.json()
      setPlant(data)
    } catch {
      setError("Fehler beim Laden der Pflanze")
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchPlant()
  }, [fetchPlant])

  function handlePlantUpdated(updatedPlant: Plant) {
    setPlant((prev) => ({
      ...updatedPlant,
      plant_photos: prev?.plant_photos ?? [],
    }))
  }

  function handlePhotosChange(photos: PlantPhoto[]) {
    setPlant((prev) => prev ? { ...prev, plant_photos: photos } : null)
  }

  function handleDeleted() {
    router.push("/plants")
  }

  // Loading state
  if (loading) {
    return <PlantDetailSkeleton />
  }

  // Not found state
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <Leaf className="h-10 w-10 text-primary/40" />
        </div>
        <h2 className="text-lg font-medium">Pflanze nicht gefunden</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Diese Pflanze existiert nicht oder wurde gelöscht.
        </p>
        <Button variant="outline" onClick={() => router.push("/plants")}>
          <ArrowLeft className="h-4 w-4" />
          Zurück zu Meine Pflanzen
        </Button>
      </div>
    )
  }

  // Error state
  if (error || !plant) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <AlertCircle className="h-10 w-10 text-destructive/60" />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {error ?? "Fehler beim Laden der Pflanze"}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/plants")}>
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
          <Button variant="outline" onClick={fetchPlant}>
            Erneut versuchen
          </Button>
        </div>
      </div>
    )
  }

  const photos = plant.plant_photos ?? []

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/plants")}
          aria-label="Zurück zu Meine Pflanzen"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Bearbeiten</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Löschen</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Photo Gallery */}
        <PhotoGallery
          plantId={plant.id}
          photos={photos}
          onPhotosChange={handlePhotosChange}
        />

        {/* Plant Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{plant.name}</h1>
            {plant.species && (
              <Badge variant="secondary" className="mt-2">
                {plant.species}
              </Badge>
            )}
          </div>

          <Separator />

          <dl className="space-y-3">
            {plant.location && (
              <div className="flex items-start gap-2">
                <dt className="sr-only">Standort</dt>
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <dd className="text-sm">{plant.location}</dd>
              </div>
            )}
            {plant.planted_at && (
              <div className="flex items-start gap-2">
                <dt className="sr-only">Pflanzdatum</dt>
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <dd className="text-sm">
                  {new Date(plant.planted_at).toLocaleDateString("de-DE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </dd>
              </div>
            )}
          </dl>

          {plant.notes && (
            <>
              <Separator />
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-1">Notizen</h2>
                <p className="text-sm whitespace-pre-wrap">{plant.notes}</p>
              </div>
            </>
          )}

          {/* Show when plant was created */}
          <div className="pt-4">
            <p className="text-xs text-muted-foreground">
              Erstellt am{" "}
              {new Date(plant.created_at).toLocaleDateString("de-DE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Sheet */}
      <EditPlantSheet
        plant={plant}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={handlePlantUpdated}
      />

      {/* Delete Dialog */}
      <DeletePlantDialog
        plantName={plant.name}
        plantId={plant.id}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={handleDeleted}
      />
    </div>
  )
}

function PlantDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  )
}
