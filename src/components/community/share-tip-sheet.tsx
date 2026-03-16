"use client"

import { useState, useRef } from "react"
import { ImagePlus, X, Loader2 } from "lucide-react"
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
import type { CommunityTip } from "@/lib/types/community"

const MAX_CHARS = 500
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

interface ShareTipSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plantName: string
  plantSpecies: string | null
  onSuccess: (tip: CommunityTip) => void
}

export function ShareTipSheet({
  open,
  onOpenChange,
  plantName,
  plantSpecies,
  onSuccess,
}: ShareTipSheetProps) {
  const [text, setText] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileError(null)

    if (file.size > MAX_FILE_SIZE) {
      setFileError("Bild darf maximal 5 MB gross sein.")
      return
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFileError("Nur JPEG, PNG und WebP sind erlaubt.")
      return
    }

    setPhoto(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleRemovePhoto() {
    setPhoto(null)
    setPhotoPreview(null)
    setFileError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setText("")
      setPhoto(null)
      setPhotoPreview(null)
      setFileError(null)
    }
    onOpenChange(nextOpen)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || submitting) return

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("plant_name", plantName)
      if (plantSpecies) formData.append("plant_species", plantSpecies)
      formData.append("text", text.trim())
      if (photo) formData.append("photo", photo)

      const res = await fetch("/api/community/tips", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Fehler beim Teilen des Tipps.")
      }

      const tip: CommunityTip = await res.json()
      toast.success("Tipp geteilt!")
      onSuccess(tip)
      handleClose(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Teilen.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Tipp teilen</SheetTitle>
          <SheetDescription>
            Teile deinen Tipp zu <span className="font-medium">{plantName}</span>
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Text input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Dein Pflegetipp..."
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              rows={4}
              required
              aria-label="Tipp-Text"
            />
            <p className="text-xs text-muted-foreground text-right">
              {text.length}/{MAX_CHARS}
            </p>
          </div>

          {/* Photo upload */}
          <div className="space-y-2">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Vorschau"
                  className="w-full max-h-48 object-cover rounded-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={handleRemovePhoto}
                  aria-label="Bild entfernen"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-muted-foreground/25 rounded-md text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-sm">Foto hinzufuegen (optional)</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Foto auswaehlen"
            />

            {fileError && (
              <p className="text-xs text-destructive">{fileError}</p>
            )}
          </div>

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
              disabled={!text.trim() || submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Tipp teilen
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
