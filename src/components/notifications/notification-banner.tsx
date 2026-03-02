"use client"

import { useState, useEffect } from "react"
import { Bell, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePushNotifications } from "@/hooks/use-push-notifications"

const BANNER_DISMISSED_KEY = "eden-push-banner-dismissed"

interface NotificationBannerProps {
  /** Whether the user has any plants (only show banner if true) */
  hasPlants: boolean
}

export function NotificationBanner({ hasPlants }: NotificationBannerProps) {
  const {
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    isSupported,
  } = usePushNotifications()

  const [dismissed, setDismissed] = useState(true) // Default to hidden to avoid flash

  useEffect(() => {
    // Only check sessionStorage on mount
    const wasDismissed = sessionStorage.getItem(BANNER_DISMISSED_KEY) === "true"
    setDismissed(wasDismissed)
  }, [])

  // Don't show if:
  // - No plants yet
  // - Already subscribed
  // - Browser doesn't support push
  // - Permission was explicitly denied
  // - Dismissed this session
  if (
    !hasPlants ||
    isSubscribed ||
    !isSupported ||
    permission === "denied" ||
    dismissed
  ) {
    return null
  }

  function handleDismiss() {
    sessionStorage.setItem(BANNER_DISMISSED_KEY, "true")
    setDismissed(true)
  }

  async function handleActivate() {
    const success = await subscribe()
    if (success) {
      handleDismiss()
    }
  }

  return (
    <Alert className="relative border-primary/30 bg-primary/5">
      <Bell className="h-4 w-4 text-primary" />
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pr-8">
        <span className="text-sm">
          Aktiviere Benachrichtigungen, damit du keine Pflegeaufgabe verpasst.
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            disabled={isLoading}
          >
            Später
          </Button>
          <Button
            size="sm"
            onClick={handleActivate}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            Jetzt aktivieren
          </Button>
        </div>
      </AlertDescription>
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Banner schließen"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  )
}
