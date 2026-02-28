"use client"

import { useState, useRef } from "react"
import { Leaf, Plus, X, Loader2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PlantPhoto } from "@/lib/types/plants"

interface PhotoGalleryProps {
  plantId: string
  photos: PlantPhoto[]
  onPhotosChange: (photos: PlantPhoto[]) => void
}

const MAX_PHOTOS = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export function PhotoGallery({ plantId, photos, onPhotosChange }: PhotoGalleryProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settingCover, setSettingCover] = useState<string | null>(null)
  const [removingPhoto, setRemovingPhoto] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const coverPhoto = photos.find((p) => p.is_cover) ?? photos[0] ?? null
  const canAddMore = photos.length < MAX_PHOTOS

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset the input so the same file can be selected again
    e.target.value = ""

    if (file.size > MAX_FILE_SIZE) {
      setError("Die Datei ist zu groß. Maximal 5 MB erlaubt.")
      return
    }

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/plants/${plantId}/photos`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error("Upload fehlgeschlagen")
      }

      const data = await res.json()
      onPhotosChange([...photos, data.photo])
    } catch {
      setError("Fehler beim Hochladen. Bitte versuche es erneut.")
    } finally {
      setUploading(false)
    }
  }

  async function handleSetCover(photoId: string) {
    setSettingCover(photoId)
    try {
      const res = await fetch(`/api/plants/${plantId}/photos/${photoId}/cover`, {
        method: "PATCH",
      })

      if (!res.ok) throw new Error("Fehler")

      const updated = photos.map((p) => ({
        ...p,
        is_cover: p.id === photoId,
      }))
      onPhotosChange(updated)
    } catch {
      setError("Fehler beim Setzen des Hauptfotos.")
    } finally {
      setSettingCover(null)
    }
  }

  async function handleRemovePhoto(photoId: string) {
    setRemovingPhoto(photoId)
    try {
      const res = await fetch(`/api/plants/${plantId}/photos/${photoId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Fehler")

      onPhotosChange(photos.filter((p) => p.id !== photoId))
    } catch {
      setError("Fehler beim Entfernen des Fotos.")
    } finally {
      setRemovingPhoto(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Main photo */}
      <div className="aspect-square relative rounded-lg overflow-hidden bg-primary/10">
        {coverPhoto ? (
          <img
            src={coverPhoto.url}
            alt="Hauptfoto"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-primary/40">
            <Leaf className="h-16 w-16" />
            <span className="text-sm text-muted-foreground">Kein Foto vorhanden</span>
          </div>
        )}
      </div>

      {/* Thumbnail row */}
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group shrink-0"
            >
              <button
                type="button"
                onClick={() => handleSetCover(photo.id)}
                disabled={settingCover === photo.id}
                className={cn(
                  "w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                  photo.is_cover || (photos.length === 1 && photos[0]?.id === photo.id)
                    ? "ring-2 ring-primary border-primary"
                    : "border-transparent hover:border-primary/50"
                )}
                title="Als Hauptfoto setzen"
                aria-label={`Foto als Hauptfoto setzen${photo.is_cover ? " (aktuelles Hauptfoto)" : ""}`}
              >
                {settingCover === photo.id ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
              {/* Remove button on hover */}
              <button
                type="button"
                onClick={() => handleRemovePhoto(photo.id)}
                disabled={removingPhoto === photo.id}
                className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                aria-label="Foto entfernen"
              >
                {removingPhoto === photo.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add photo button */}
      {canAddMore && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Foto auswählen"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {uploading ? "Wird hochgeladen..." : "Foto hinzufügen"}
          </Button>
        </>
      )}

      {/* Photo count info */}
      {photos.length > 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <ImageIcon className="h-3 w-3" />
          {photos.length} von {MAX_PHOTOS} Fotos
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
