"use client"

import { useState } from "react"
import { User, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface ProfileSettingsCardProps {
  initialDisplayName: string | null
}

export function ProfileSettingsCard({ initialDisplayName }: ProfileSettingsCardProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "")
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = displayName.trim()
    if (!trimmed) return

    setIsSaving(true)
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: trimmed }),
      })

      if (!res.ok) {
        toast.error("Fehler beim Speichern des Namens.")
        return
      }

      setDisplayName(trimmed)
      toast.success("Name gespeichert.")
    } catch {
      toast.error("Netzwerkfehler beim Speichern.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Profil
        </CardTitle>
        <CardDescription>
          Dein Anzeigename wird zur Begrüßung auf dem Dashboard verwendet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="display-name">Anzeigename</Label>
            <Input
              id="display-name"
              placeholder="z.B. Maria"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              disabled={isSaving}
            />
          </div>
          <Button
            type="submit"
            disabled={isSaving || !displayName.trim() || displayName.trim() === (initialDisplayName ?? "")}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Speichern"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
