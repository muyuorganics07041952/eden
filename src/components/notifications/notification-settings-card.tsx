"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, AlertCircle, CheckCircle2, Loader2, Info, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePushNotifications } from "@/hooks/use-push-notifications"

interface NotificationSettingsCardProps {
  /** Initial reminder hour from the database, if any */
  initialReminderHour?: number
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: `${i.toString().padStart(2, "0")}:00 Uhr`,
}))

export function NotificationSettingsCard({
  initialReminderHour = 8,
}: NotificationSettingsCardProps) {
  const {
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    updateReminderHour,
    isSupported,
  } = usePushNotifications()

  const [reminderHour, setReminderHour] = useState(initialReminderHour)
  const [hourSaved, setHourSaved] = useState(false)
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "ok" | "error">("idle")
  const [testError, setTestError] = useState<string | null>(null)
  const [isStandalone, setIsStandalone] = useState(true)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIos(ios)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)
  }, [])

  async function handleToggle(checked: boolean) {
    if (checked) {
      await subscribe(reminderHour)
    } else {
      await unsubscribe()
    }
  }

  async function handleTestPush() {
    setTestStatus("sending")
    setTestError(null)
    try {
      const res = await fetch("/api/push/test", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setTestStatus("error")
        setTestError(data.error ?? "Fehler beim Senden.")
      } else {
        setTestStatus("ok")
        setTimeout(() => setTestStatus("idle"), 4000)
      }
    } catch {
      setTestStatus("error")
      setTestError("Netzwerkfehler.")
    }
  }

  async function handleHourChange(value: string) {
    const hour = parseInt(value, 10)
    setReminderHour(hour)
    setHourSaved(false)
    const success = await updateReminderHour(hour)
    if (success) {
      setHourSaved(true)
      setTimeout(() => setHourSaved(false), 2000)
    }
  }

  // Browser does not support push
  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            Push-Benachrichtigungen
          </CardTitle>
          <CardDescription>
            Dein Browser unterstützt keine Push-Benachrichtigungen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Push-Benachrichtigungen werden in Chrome, Firefox, Edge und Safari 16.4+
              unterstützt. Stelle sicher, dass du einen kompatiblen Browser verwendest.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Push-Benachrichtigungen
            </CardTitle>
            <CardDescription>
              Erhalte eine tägliche Erinnerung, wenn Pflegeaufgaben fällig sind.
            </CardDescription>
          </div>
          <StatusBadge
            permission={permission}
            isSubscribed={isSubscribed}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* iOS: must be installed as PWA on Home Screen */}
        {isIos && !isStandalone && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>iPhone:</strong> Push-Benachrichtigungen funktionieren nur wenn die App am Home-Bildschirm installiert ist. Tippe auf <strong>Teilen → Zum Home-Bildschirm</strong> und öffne die App von dort.
            </AlertDescription>
          </Alert>
        )}

        {/* Permission denied - browser won't re-prompt, guide user to site settings */}
        {permission === "denied" && !isSubscribed && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Benachrichtigungen wurden in diesem Browser blockiert. Um sie zu aktivieren,
              öffne die Seiteneinstellungen deines Browsers (Schloss-Symbol in der Adressleiste),
              setze Benachrichtigungen auf &quot;Erlauben&quot; und lade die Seite neu.
            </AlertDescription>
          </Alert>
        )}

        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-toggle" className="text-sm font-medium">
              Benachrichtigungen aktivieren
            </Label>
            <p className="text-xs text-muted-foreground">
              Auf diesem Gerät
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Switch
              id="push-toggle"
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={isLoading || permission === "denied"}
              aria-label="Push-Benachrichtigungen aktivieren oder deaktivieren"
            />
          </div>
        </div>

        {/* Reminder time */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="reminder-hour" className="text-sm font-medium">
              Erinnerungszeit
            </Label>
            <p className="text-xs text-muted-foreground">
              Wann möchtest du erinnert werden?
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hourSaved && (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            )}
            <Select
              value={reminderHour.toString()}
              onValueChange={handleHourChange}
              disabled={!isSubscribed || isLoading}
            >
              <SelectTrigger
                id="reminder-hour"
                className="w-[140px]"
                aria-label="Erinnerungszeit auswählen"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOUR_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Test push button — only shown when subscribed */}
        {isSubscribed && (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestPush}
              disabled={testStatus === "sending"}
              className="w-full"
            >
              {testStatus === "sending" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : testStatus === "ok" ? (
                <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {testStatus === "ok" ? "Test gesendet!" : "Test-Benachrichtigung senden"}
            </Button>
            {testStatus === "error" && testError && (
              <p className="text-xs text-destructive">{testError}</p>
            )}
            {testStatus === "ok" && (
              <p className="text-xs text-muted-foreground">Schau auf dein Gerät — die Notification sollte gleich erscheinen.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({
  permission,
  isSubscribed,
}: {
  permission: string
  isSubscribed: boolean
}) {
  if (isSubscribed) {
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Aktiv
      </Badge>
    )
  }

  if (permission === "denied") {
    return (
      <Badge variant="destructive" className="gap-1">
        <BellOff className="h-3 w-3" />
        Blockiert
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <BellOff className="h-3 w-3" />
      Inaktiv
    </Badge>
  )
}
