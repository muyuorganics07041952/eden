"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PlantPhoto } from "@/lib/types/plants"

interface PhotoLightboxProps {
  photos: PlantPhoto[]
  initialIndex: number
  onClose: () => void
}

export function PhotoLightbox({ photos, initialIndex, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const touchStartX = useRef<number | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const total = photos.length
  const isFirst = currentIndex === 0
  const isLast = currentIndex === total - 1
  const showIndicator = total > 1

  const goNext = useCallback(() => {
    if (!isLast) setCurrentIndex((i) => i + 1)
  }, [isLast])

  const goPrev = useCallback(() => {
    if (!isFirst) setCurrentIndex((i) => i - 1)
  }, [isFirst])

  // BUG-2: Move focus to close button when lightbox opens
  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  // Keyboard navigation + BUG-1: focus trap
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key === "ArrowLeft") {
        goPrev()
        return
      }
      if (e.key === "ArrowRight") {
        goNext()
        return
      }
      // Focus trap: keep Tab/Shift+Tab inside the dialog
      if (e.key === "Tab" && overlayRef.current) {
        const focusable = Array.from(
          overlayRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose, goNext, goPrev])

  // Lock body scroll when lightbox is open
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  // Touch swipe handling
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX
    const threshold = 50

    if (diff > threshold) {
      goNext()
    } else if (diff < -threshold) {
      goPrev()
    }

    touchStartX.current = null
  }

  // Close on overlay click (not on photo)
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  const currentPhoto = photos[currentIndex]
  if (!currentPhoto) return null

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Foto-Vollansicht"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={handleOverlayClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <Button
        ref={closeButtonRef}
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 h-10 w-10"
        aria-label="Lightbox schliessen"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Photo indicator */}
      {showIndicator && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/80 text-sm font-medium select-none">
          {currentIndex + 1} / {total}
        </div>
      )}

      {/* Previous button */}
      {!isFirst && (
        <Button
          variant="ghost"
          size="icon"
          onClick={goPrev}
          className="absolute left-2 md:left-4 z-10 text-white hover:bg-white/20 h-12 w-12"
          aria-label="Vorheriges Foto"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {/* Photo */}
      <img
        src={currentPhoto.url}
        alt={`Foto ${currentIndex + 1} von ${total}`}
        className="max-h-[85vh] max-w-[90vw] object-contain select-none"
        draggable={false}
      />

      {/* Next button */}
      {!isLast && (
        <Button
          variant="ghost"
          size="icon"
          onClick={goNext}
          className="absolute right-2 md:right-4 z-10 text-white hover:bg-white/20 h-12 w-12"
          aria-label="Naechstes Foto"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}
    </div>
  )
}
