"use client"

import { useState } from "react"
import { MapPin, Search, Loader2, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface LocationSettingsCardProps {
  initialCityName: string | null
  initialLatitude: number | null
  initialLongitude: number | null
}

interface GeoResult {
  id: number
  name: string
  country: string
  latitude: number
  longitude: number
  admin1?: string
}

export function LocationSettingsCard({
  initialCityName,
  initialLatitude,
  initialLongitude,
}: LocationSettingsCardProps) {
  const [cityName, setCityName] = useState(initialCityName)
  const [latitude, setLatitude] = useState(initialLatitude)
  const [longitude, setLongitude] = useState(initialLongitude)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<GeoResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSearch, setShowSearch] = useState(!initialCityName)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchResults([])

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery.trim())}`)
      if (!res.ok) {
        toast.error("Fehler bei der Suche. Bitte versuche es erneut.")
        return
      }
      const data = await res.json()
      if (data.results.length === 0) {
        toast.info("Keine Ergebnisse gefunden. Versuche einen anderen Suchbegriff.")
      }
      setSearchResults(data.results)
    } catch {
      toast.error("Netzwerkfehler bei der Suche.")
    } finally {
      setIsSearching(false)
    }
  }

  async function handleSelect(result: GeoResult) {
    setIsSaving(true)
    try {
      const res = await fetch("/api/settings/location", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city_name: result.name,
          latitude: result.latitude,
          longitude: result.longitude,
        }),
      })

      if (!res.ok) {
        toast.error("Fehler beim Speichern des Standorts.")
        return
      }

      setCityName(result.name)
      setLatitude(result.latitude)
      setLongitude(result.longitude)
      setSearchResults([])
      setSearchQuery("")
      setShowSearch(false)
      toast.success(`Standort auf ${result.name} gesetzt.`)
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
          <MapPin className="h-5 w-5 text-primary" />
          Standort
        </CardTitle>
        <CardDescription>
          Dein Standort wird für die Wetteranzeige auf dem Dashboard verwendet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Saved location display */}
        {cityName && !showSearch && (
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <span aria-hidden="true">📍</span>
              <span className="font-medium">{cityName}</span>
              {latitude !== null && longitude !== null && (
                <span className="text-xs text-muted-foreground">
                  ({latitude.toFixed(2)}, {longitude.toFixed(2)})
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(true)}
            >
              Ändern
            </Button>
          </div>
        )}

        {/* Search form */}
        {showSearch && (
          <div className="space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Stadt suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSearching || isSaving}
                aria-label="Stadt suchen"
              />
              <Button type="submit" size="sm" disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-1 hidden sm:inline">Suchen</span>
              </Button>
              {cityName && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSearch(false)
                    setSearchResults([])
                    setSearchQuery("")
                  }}
                  aria-label="Suche abbrechen"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </form>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="rounded-md border divide-y" role="listbox" aria-label="Suchergebnisse">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between disabled:opacity-50"
                    onClick={() => handleSelect(result)}
                    disabled={isSaving}
                    role="option"
                    aria-selected={false}
                  >
                    <span>
                      <span className="font-medium">{result.name}</span>
                      {result.admin1 && (
                        <span className="text-muted-foreground">, {result.admin1}</span>
                      )}
                      <span className="text-muted-foreground"> — {result.country}</span>
                    </span>
                    {isSaving && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
