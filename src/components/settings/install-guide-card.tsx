"use client"

import { useState, useEffect } from "react"
import { Smartphone, Share } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone === true)
  )
}

export function InstallGuideCard() {
  const [showGuide, setShowGuide] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const installed = isStandalone()
    setIsInstalled(installed)
    // Show guide on iOS when not installed, or always show if installed (as info)
    setShowGuide(isIOS() || installed)
  }, [])

  if (!showGuide) return null

  if (isInstalled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-5 w-5 text-primary" />
            App installiert
          </CardTitle>
          <CardDescription>
            Eden ist als App auf deinem Gerät installiert.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone className="h-5 w-5 text-primary" />
          Eden als App installieren
        </CardTitle>
        <CardDescription>
          Nutze Eden wie eine native App auf deinem iPhone oder iPad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              1
            </span>
            <span>
              Tippe auf das{" "}
              <Share className="inline h-4 w-4 -mt-0.5" aria-hidden="true" />{" "}
              <strong>Teilen</strong>-Symbol in der Safari-Symbolleiste.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              2
            </span>
            <span>
              Scrolle nach unten und tippe auf{" "}
              <strong>&quot;Zum Home-Bildschirm&quot;</strong>.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              3
            </span>
            <span>
              Bestätige mit <strong>&quot;Hinzufügen&quot;</strong> — Eden
              erscheint als App-Icon auf deinem Homescreen.
            </span>
          </li>
        </ol>
      </CardContent>
    </Card>
  )
}
