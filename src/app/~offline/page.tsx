"use client"

import { WifiOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <WifiOff
              className="h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <CardTitle className="text-xl">Du bist offline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Diese Seite ist nicht im Cache verfügbar. Stelle eine
            Internetverbindung her und versuche es erneut.
          </p>
          <p className="text-xs text-muted-foreground">
            Tipp: Seiten, die du zuvor besucht hast, sind auch offline
            verfügbar.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              if (typeof window !== "undefined") window.location.reload()
            }}
          >
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
