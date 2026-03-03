"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Leaf, CheckSquare, Newspaper, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Start", icon: Home },
  { href: "/plants", label: "Pflanzen", icon: Leaf },
  { href: "/tasks", label: "Aufgaben", icon: CheckSquare },
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/settings", label: "Einstellungen", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  const [taskBadge, setTaskBadge] = useState(false)

  useEffect(() => {
    const pushUnsupported =
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)

    if (!pushUnsupported) return

    fetch("/api/tasks/today")
      .then((r) => (r.ok ? r.json() : []))
      .then((tasks) => {
        if (Array.isArray(tasks) && tasks.length > 0) setTaskBadge(true)
      })
      .catch(() => {})
  }, [])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t sm:hidden"
      aria-label="Hauptnavigation"
    >
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href))
          const isTasksLink = href === "/tasks"

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] leading-none truncate max-w-full px-0.5">
                {label}
              </span>
              {isTasksLink && taskBadge && (
                <span
                  className="absolute top-1.5 left-1/2 ml-2 h-2 w-2 rounded-full bg-primary"
                  aria-label="Fällige Aufgaben vorhanden"
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
