"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, Loader2, AlertTriangle, RefreshCw, X, Check, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

export interface IdentifySuggestion {
  name: string
  species: string
  confidence: number
}

interface PlantIdentifySectionProps {
  onSelect: (suggestion: IdentifySuggestion) => void
  onPhotoReady: (file: File | null) => void
  onClear?: () => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const TARGET_SIZE = 1 * 1024 * 1024 // 1 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const API_TIMEOUT = 10_000 // 10 seconds

type IdentifyState =
  | { status: "idle" }
  | { status: "compressing" }
  | { status: "loading" }
  | { status: "results"; suggestions: IdentifySuggestion[]; lowConfidence: boolean }
  | { status: "no-results" }
  | { status: "error"; message: string; canRetry: boolean; retryAfter?: number }

/**
 * Compresses an image file using Canvas API to a target size.
 * Returns the compressed file or throws on failure.
 */
async function compressImage(file: File): Promise<File> {
  // If already under target, return as-is
  if (file.size <= TARGET_SIZE) {
    return file
  }

  return new Promise<File>((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      try {
        const canvas = document.createElement("canvas")
        let { width, height } = img

        // Scale down if very large (max 2048px on longest side)
        const maxDim = 2048
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas context not available"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Try 85% quality first, then reduce if still too large
        let quality = 0.85
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Compression failed"))
                return
              }

              if (blob.size <= TARGET_SIZE || quality <= 0.3) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                quality -= 0.1
                tryCompress()
              }
            },
            "image/jpeg",
            quality
          )
        }

        tryCompress()
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image"))
    }

    img.src = url
  })
}

export function PlantIdentifySection({ onSelect, onPhotoReady, onClear }: PlantIdentifySectionProps) {
  const [state, setState] = useState<IdentifyState>({ status: "idle" })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [retryCountdown, setRetryCountdown] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastFileRef = useRef<File | null>(null)

  // Countdown timer for 429 rate limit retry
  useEffect(() => {
    if (retryCountdown <= 0) return
    const timer = setTimeout(() => setRetryCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [retryCountdown])

  const clearState = useCallback(() => {
    setState({ status: "idle" })
    setPreviewUrl(null)
    setSelectedIndex(null)
    onPhotoReady(null)
    onClear?.()
    lastFileRef.current = null
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [onPhotoReady, onClear])

  async function handleIdentify(file: File) {
    lastFileRef.current = file

    // Show preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setSelectedIndex(null)

    // Compress
    setState({ status: "compressing" })
    let compressed: File
    try {
      compressed = await compressImage(file)
    } catch {
      setState({
        status: "error",
        message: "Bild konnte nicht verarbeitet werden. Bitte verwende ein anderes Format (JPEG, PNG, WebP).",
        canRetry: false,
      })
      return
    }

    // Store the compressed file for later upload
    onPhotoReady(compressed)

    // Call API
    setState({ status: "loading" })
    const formData = new FormData()
    formData.append("image", compressed)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), API_TIMEOUT)

      const res = await fetch("/api/identify", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (res.status === 429) {
        setRetryCountdown(30)
        setState({
          status: "error",
          message: "Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.",
          canRetry: true,
          retryAfter: 30,
        })
        return
      }

      if (res.status === 503) {
        setState({
          status: "error",
          message: "Pflanzenidentifikation ist derzeit nicht verfügbar. Bitte versuche es später erneut.",
          canRetry: false,
        })
        return
      }

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const data: IdentifySuggestion[] = await res.json()

      if (!data || data.length === 0) {
        setState({ status: "no-results" })
        return
      }

      // Check if all results have very low confidence
      const lowConfidence = data.every((s) => s.confidence < 30)

      setState({
        status: "results",
        suggestions: data,
        lowConfidence,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setState({
          status: "error",
          message: "Zeitlimit überschritten. Bitte versuche es erneut.",
          canRetry: true,
        })
      } else {
        setState({
          status: "error",
          message: "Verbindungsfehler -- bitte erneut versuchen.",
          canRetry: true,
        })
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    if (!ALLOWED_TYPES.includes(file.type)) {
      setState({
        status: "error",
        message: "Ungültiges Dateiformat. Erlaubt: JPEG, PNG, WebP.",
        canRetry: false,
      })
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setState({
        status: "error",
        message: "Die Datei ist zu groß. Maximal 10 MB erlaubt.",
        canRetry: false,
      })
      return
    }

    handleIdentify(file)
  }

  function handleRetry() {
    if (lastFileRef.current) {
      handleIdentify(lastFileRef.current)
    }
  }

  function handleSelectSuggestion(suggestion: IdentifySuggestion, index: number) {
    setSelectedIndex(index)
    onSelect(suggestion)
  }

  function getConfidenceColor(confidence: number): string {
    if (confidence >= 70) return "text-green-600 dark:text-green-400"
    if (confidence >= 30) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-500 dark:text-red-400"
  }

  function getConfidenceBadgeVariant(confidence: number): "default" | "secondary" | "destructive" {
    if (confidence >= 70) return "default"
    if (confidence >= 30) return "secondary"
    return "destructive"
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Pflanzenfoto zur Identifikation auswählen"
      />

      {/* Preview image */}
      {previewUrl && (
        <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
          <img
            src={previewUrl}
            alt="Pflanzenfoto zur Identifikation"
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 rounded-full"
            onClick={clearState}
            aria-label="Foto entfernen"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Idle state: show button */}
      {state.status === "idle" && !previewUrl && (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
          Pflanze identifizieren
        </Button>
      )}

      {/* Compressing state */}
      {state.status === "compressing" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Bild wird verarbeitet...
        </div>
      )}

      {/* Loading state */}
      {state.status === "loading" && (
        <div className="space-y-2 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Pflanze wird identifiziert...
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse w-3/5" />
          </div>
        </div>
      )}

      {/* Results */}
      {state.status === "results" && (
        <div className="space-y-2">
          {state.lowConfidence && (
            <Alert variant="default" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-sm">
                Unsicheres Ergebnis – bitte überprüfen
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm font-medium text-muted-foreground">
            Vorschläge (tippe zum Auswählen)
          </p>

          <div className="space-y-2">
            {state.suggestions.map((suggestion, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
                  selectedIndex === index
                    ? "ring-2 ring-primary bg-primary/5"
                    : ""
                }`}
                onClick={() => handleSelectSuggestion(suggestion, index)}
                role="button"
                tabIndex={0}
                aria-label={`${suggestion.name} auswählen, ${suggestion.confidence}% Konfidenz`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleSelectSuggestion(suggestion, index)
                  }
                }}
              >
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {selectedIndex === index && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <p className="font-medium text-sm truncate">
                        {suggestion.name}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground italic truncate">
                      {suggestion.species}
                    </p>
                  </div>
                  <Badge
                    variant={getConfidenceBadgeVariant(suggestion.confidence)}
                    className="shrink-0"
                  >
                    <span className={getConfidenceColor(suggestion.confidence)}>
                      {suggestion.confidence}%
                    </span>
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={clearState}
            >
              Manuell eingeben
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Neues Foto
            </Button>
          </div>
        </div>
      )}

      {/* No results */}
      {state.status === "no-results" && (
        <div className="space-y-2">
          <Alert>
            <Leaf className="h-4 w-4" />
            <AlertDescription>
              Keine Pflanze erkannt -- bitte manuell eingeben oder ein anderes Foto versuchen.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={clearState}
            >
              Manuell eingeben
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Neues Foto
            </Button>
          </div>
        </div>
      )}

      {/* Error state */}
      {state.status === "error" && (
        <div className="space-y-2">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
          <div className="flex gap-2">
            {state.canRetry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleRetry}
                disabled={retryCountdown > 0}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {retryCountdown > 0 ? `Warten (${retryCountdown}s)` : "Erneut versuchen"}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              Anderes Foto
            </Button>
          </div>
        </div>
      )}

      {/* Separator before form fields */}
      {(state.status !== "idle" || previewUrl) && <Separator />}
    </div>
  )
}
