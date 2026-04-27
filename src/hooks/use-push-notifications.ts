"use client"

import { useState, useEffect, useCallback } from "react"

export type PushPermissionState = "default" | "granted" | "denied" | "unsupported"

interface PushNotificationState {
  /** Browser permission state or 'unsupported' if Web Push is not available */
  permission: PushPermissionState
  /** Whether a subscription exists on this device (registered with our backend) */
  isSubscribed: boolean
  /** Loading state for async operations */
  isLoading: boolean
  /** Error message from the last operation, or null */
  error: string | null
  /** Subscribe this device for push notifications */
  subscribe: (reminderHour?: number) => Promise<boolean>
  /** Unsubscribe this device */
  unsubscribe: () => Promise<boolean>
  /** Update the reminder hour for all subscriptions of this user */
  updateReminderHour: (hour: number) => Promise<boolean>
  /** Whether the browser supports push notifications */
  isSupported: boolean
}

function getPermission(): PushPermissionState {
  if (typeof window === "undefined") return "unsupported"
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported"
  }
  return Notification.permission as PushPermissionState
}

/**
 * Converts a base64 VAPID public key to a Uint8Array for the Web Push API.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function swReady(timeoutMs = 10000): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Service Worker nicht bereit. Bitte App neu starten.")), timeoutMs)
    ),
  ])
}

export function usePushNotifications(): PushNotificationState {
  const [permission, setPermission] = useState<PushPermissionState>("unsupported")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupported = permission !== "unsupported"

  // Check initial state
  useEffect(() => {
    const perm = getPermission()
    setPermission(perm)

    if (perm === "unsupported") return

    // Check if we already have a subscription
    swReady()
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        setIsSubscribed(!!subscription)
      })
      .catch(() => {
        // Silently fail - SW might not be registered yet
      })
  }, [])

  const subscribe = useCallback(async (reminderHour: number = 8): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        setError("Push-Benachrichtigungen sind nicht konfiguriert.")
        return false
      }

      const registration = await swReady()

      // Request permission if needed
      const result = await Notification.requestPermission()
      setPermission(result as PushPermissionState)

      if (result !== "granted") {
        setError("Berechtigung wurde nicht erteilt.")
        return false
      }

      // Clear any existing subscription first (handles VAPID key rotation)
      const existing = await registration.pushManager.getSubscription()
      if (existing) {
        await existing.unsubscribe()
      }

      // Subscribe with the push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      })

      const json = subscription.toJSON()
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

      // Send subscription to our backend
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
          timezone,
          reminderHour,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Fehler beim Speichern der Subscription.")
      }

      setIsSubscribed(true)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler."
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const registration = await swReady()
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Delete from backend
        const res = await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        if (!res.ok && res.status !== 204) {
          throw new Error("Fehler beim Entfernen der Subscription.")
        }

        // Unsubscribe from browser
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler."
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateReminderHour = useCallback(async (hour: number): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/push/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderHour: hour }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Fehler beim Aktualisieren.")
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler."
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    updateReminderHour,
    isSupported,
  }
}
