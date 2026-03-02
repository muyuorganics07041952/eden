"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * The BeforeInstallPromptEvent is not yet in TypeScript's lib.dom.d.ts,
 * so we define it manually.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
  prompt(): Promise<void>
}

const DISMISS_KEY = "eden-install-banner-dismissed"
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function isDismissed(): boolean {
  if (typeof window === "undefined") return true
  const dismissedAt = localStorage.getItem(DISMISS_KEY)
  if (!dismissedAt) return false
  const elapsed = Date.now() - Number(dismissedAt)
  return elapsed < DISMISS_DURATION_MS
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}

export function InstallBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Do not show on standalone (already installed) or if previously dismissed
    if (isStandalone() || isDismissed()) return

    function handleBeforeInstallPrompt(e: Event) {
      // Prevent the browser's default install banner
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
      setIsVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      )
    }
  }, [])

  const handleInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current
    if (!prompt) return

    await prompt.prompt()
    const { outcome } = await prompt.userChoice

    if (outcome === "accepted") {
      setIsVisible(false)
    }

    deferredPromptRef.current = null
  }, [])

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setIsVisible(false)
    deferredPromptRef.current = null
  }, [])

  if (!isVisible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
      role="complementary"
      aria-label="App installieren"
    >
      <div className="max-w-lg mx-auto rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Download className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Eden installieren
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Nutze Eden wie eine native App auf deinem Gerät.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 -mt-1 -mr-1"
            onClick={handleDismiss}
            aria-label="Banner schließen"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-3 justify-end">
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Später
          </Button>
          <Button size="sm" onClick={handleInstall}>
            Installieren
          </Button>
        </div>
      </div>
    </div>
  )
}
