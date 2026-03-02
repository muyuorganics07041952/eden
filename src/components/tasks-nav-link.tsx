"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CheckSquare } from "lucide-react"

/**
 * Tasks nav link that shows a badge when the browser does not support push
 * notifications (so the user knows to check tasks manually).
 */
export function TasksNavLink() {
  const [showBadge, setShowBadge] = useState(false)

  useEffect(() => {
    const pushUnsupported =
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)

    if (!pushUnsupported) return

    // Only fetch task count for users who won't get push notifications
    fetch("/api/tasks/today")
      .then((r) => (r.ok ? r.json() : []))
      .then((tasks) => {
        if (Array.isArray(tasks) && tasks.length > 0) setShowBadge(true)
      })
      .catch(() => {})
  }, [])

  return (
    <Link
      href="/tasks"
      className="relative flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <CheckSquare className="h-4 w-4" />
      <span className="hidden sm:inline">Aufgaben</span>
      {showBadge && (
        <span
          className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-primary"
          aria-label="Fällige Aufgaben vorhanden"
        />
      )}
    </Link>
  )
}
