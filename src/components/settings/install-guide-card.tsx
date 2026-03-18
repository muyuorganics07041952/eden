"use client"

import { useState, useEffect } from "react"
import { Smartphone, Share, Download, Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePwaInstall } from "@/components/pwa/pwa-install-context"

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function InstallGuideCard() {
  const { canInstall, isInstalled, triggerInstall } = usePwaInstall()
  const [mounted, setMounted] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Avoid SSR/hydration mismatch — all logic is client-only
  if (!mounted) return null

  // Already installed — same UI for all platforms
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

  // iOS: manual Safari guide
  if (isIOS()) {
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

  // Android / Desktop: native install prompt
  if (canInstall) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-5 w-5 text-primary" />
            Eden als App installieren
          </CardTitle>
          <CardDescription>
            Installiere Eden als App auf deinem Gerät – ohne Play Store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={async () => {
              setInstalling(true)
              await triggerInstall()
              setInstalling(false)
            }}
            disabled={installing}
            className="w-full sm:w-auto"
          >
            {installing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {installing ? "Wird installiert…" : "Jetzt installieren"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // No install option available (Firefox Android, etc.)
  return null
}
