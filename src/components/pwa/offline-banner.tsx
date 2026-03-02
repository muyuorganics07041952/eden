"use client"

import { WifiOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useOfflineStatus } from "@/hooks/use-offline-status"

export function OfflineBanner() {
  const isOffline = useOfflineStatus()

  if (!isOffline) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50"
      role="status"
      aria-live="polite"
    >
      <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 border-amber-200 text-amber-900">
        <div className="flex items-center gap-2 max-w-5xl mx-auto">
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          <AlertDescription className="text-sm">
            Du bist offline. Diese Inhalte stammen aus dem Cache.
          </AlertDescription>
        </div>
      </Alert>
    </div>
  )
}
