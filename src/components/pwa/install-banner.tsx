"use client"

import { useState, useEffect, useCallback } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePwaInstall } from "@/components/pwa/pwa-install-context"

const DISMISS_KEY = "eden-install-banner-dismissed"
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function isDismissed(): boolean {
  if (typeof window === "undefined") return true
  const dismissedAt = localStorage.getItem(DISMISS_KEY)
  if (!dismissedAt) return false
  const elapsed = Date.now() - Number(dismissedAt)
  return elapsed < DISMISS_DURATION_MS
}

export function InstallBanner() {
  const { canInstall, triggerInstall } = usePwaInstall()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isDismissed()) setDismissed(true)
  }, [])

  const handleInstall = useCallback(async () => {
    const outcome = await triggerInstall()
    if (outcome === "accepted") {
      setDismissed(true)
    }
  }, [triggerInstall])

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setDismissed(true)
  }, [])

  if (!canInstall || dismissed) return null

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
