"use client"

import { useState, useEffect } from "react"

/**
 * Returns true when the browser has no internet connection.
 * Uses navigator.onLine for initial state and listens to online/offline events.
 */
export function useOfflineStatus(): boolean {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)

    function handleOffline() { setIsOffline(true) }
    function handleOnline() { setIsOffline(false) }

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [])

  return isOffline
}
