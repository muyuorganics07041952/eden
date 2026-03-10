"use client"

import { useState, useRef } from "react"
import { Leaf, Plus, X, Loader2, ImageIcon, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PhotoLightbox } from "@/components/plants/photo-lightbox"
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
  const [managingMode, setManagingMode] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [mainPhotoIndex, setMainPhotoIndex] = useState(() => {
    const idx = photos.findIndex((p) => p.is_cover)
    return idx >= 0 ? idx : 0
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const touchStartXMain = useRef<number | null>(null)
  const didSwipeMain = useRef(false)

  const safeMainIndex = Math.min(mainPhotoIndex, Math.max(0, photos.length - 1))
  const currentMainPhoto = photos[safeMainIndex] ?? null
  const canAddMore = photos.length < MAX_PHOTOS

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset the input so the same file can be selected again
    e.target.value = ""

    if (file.size > MAX_FILE_SIZE) {
      setError("Die Datei ist zu gross. Maximal 5 MB erlaubt.")
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
      onPhotosChange([...photos, data])
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

      const deletedPhoto = photos.find((p) => p.id === photoId)
      const remaining = photos.filter((p) => p.id !== photoId)
      // If the deleted photo was the cover, assign cover to the next remaining photo
      if (deletedPhoto?.is_cover && remaining.length > 0) {
        remaining[0] = { ...remaining[0], is_cover: true }
      }
      onPhotosChange(remaining)
    } catch {
      setError("Fehler beim Entfernen des Fotos.")
    } finally {
      setRemovingPhoto(null)
    }
  }

  function handleMainTouchStart(e: React.TouchEvent) {
    touchStartXMain.current = e.touches[0].clientX
    didSwipeMain.current = false
  }

  function handleMainTouchEnd(e: React.TouchEvent) {
    if (touchStartXMain.current === null) return
    const diff = touchStartXMain.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 10) {
      didSwipeMain.current = true
    }
    if (diff > 50 && safeMainIndex < photos.length - 1) {
      setMainPhotoIndex(safeMainIndex + 1)
    } else if (diff < -50 && safeMainIndex > 0) {
      setMainPhotoIndex(safeMainIndex - 1)
    }
    touchStartXMain.current = null
  }

  function handleThumbnailClick(index: number) {
    if (managingMode) return
    setMainPhotoIndex(index)
  }

  function handleMainPhotoClick() {
    if (managingMode || !currentMainPhoto) return
    if (didSwipeMain.current) {
      didSwipeMain.current = false
      return
    }
    setLightboxIndex(safeMainIndex)
  }

  return (
    <div className="space-y-3">
      {/* Main photo */}
      <div className="aspect-square relative rounded-lg overflow-hidden bg-primary/10">
        {currentMainPhoto ? (
          <button
            type="button"
            onClick={handleMainPhotoClick}
            onTouchStart={handleMainTouchStart}
            onTouchEnd={handleMainTouchEnd}
            className={cn(
              "w-full h-full block",
              !managingMode && "cursor-pointer"
            )}
            aria-label="Foto in Vollansicht oeffnen"
          >
            <img
              src={currentMainPhoto.url}
              alt="Hauptfoto"
              className="w-full h-full object-cover"
            />
          </button>
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
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative shrink-0"
            >
              <button
                type="button"
                onClick={() => handleThumbnailClick(index)}
                disabled={managingMode}
                className={cn(
                  "w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                  index === safeMainIndex
                    ? "ring-2 ring-primary border-primary"
                    : "border-transparent hover:border-primary/50",
                  !managingMode && "cursor-pointer"
                )}
                aria-label={
                  managingMode
                    ? `Foto ${index + 1}${photo.is_cover ? " (Hauptfoto)" : ""}`
                    : `Foto ${index + 1} in Vollansicht oeffnen`
                }
              >
                <img
                  src={photo.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>

              {/* Manage mode overlay */}
              {managingMode && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                  {/* Cover badge */}
                  {photo.is_cover && (
                    <Badge
                      variant="secondary"
                      className="absolute top-0.5 left-0.5 text-[10px] px-1 py-0 leading-tight"
                    >
                      Cover
                    </Badge>
                  )}

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    disabled={removingPhoto === photo.id}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                    aria-label="Foto entfernen"
                  >
                    {removingPhoto === photo.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>

                  {/* Set as cover button (only if not already cover) */}
                  {!photo.is_cover && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSetCover(photo.id)}
                      disabled={settingCover === photo.id}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0 h-5 whitespace-nowrap"
                    >
                      {settingCover === photo.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Hauptfoto"
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons row */}
      <div className="flex gap-2">
        {/* Add photo button */}
        {canAddMore && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Foto auswaehlen"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {uploading ? "Wird hochgeladen..." : "Foto hinzufuegen"}
            </Button>
          </>
        )}

        {/* Manage photos toggle button */}
        {photos.length > 0 && (
          <Button
            type="button"
            variant={managingMode ? "default" : "outline"}
            size="sm"
            onClick={() => setManagingMode(!managingMode)}
            className={cn(!canAddMore && "flex-1")}
          >
            <Settings className="h-4 w-4" />
            {managingMode ? "Fertig" : "Fotos verwalten"}
          </Button>
        )}
      </div>

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

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
