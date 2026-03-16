"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, Plus, AlertCircle, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { TipCard } from "@/components/community/tip-card"
import { ShareTipSheet } from "@/components/community/share-tip-sheet"
import type { CommunityTip } from "@/lib/types/community"

interface CommunityTipsSectionProps {
  plantName: string
  plantSpecies: string | null
  currentUserId: string
}

export function CommunityTipsSection({
  plantName,
  plantSpecies,
  currentUserId,
}: CommunityTipsSectionProps) {
  const [tips, setTips] = useState<CommunityTip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const fetchTips = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ plant_name: plantName })
      if (plantSpecies) params.set("species", plantSpecies)
      const res = await fetch(`/api/community/tips?${params.toString()}`)
      if (!res.ok) throw new Error("Fehler beim Laden")
      const data: CommunityTip[] = await res.json()
      setTips(Array.isArray(data) ? data : [])
    } catch {
      setError("Community-Tipps konnten nicht geladen werden.")
    } finally {
      setLoading(false)
    }
  }, [plantName, plantSpecies])

  useEffect(() => {
    fetchTips()
  }, [fetchTips])

  function handleTipCreated(tip: CommunityTip) {
    setTips((prev) => [tip, ...prev])
  }

  function handleTipDeleted(id: string) {
    setTips((prev) => prev.filter((t) => t.id !== id))
  }

  function handleLikeToggled(id: string, liked: boolean, newCount: number) {
    setTips((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, has_liked: liked, likes_count: newCount }
          : t
      )
    )
  }

  // Don't render section at all if no plant name to match on
  if (!plantName) return null

  return (
    <div className="space-y-4">
      <Separator />

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Community Tipps</h2>
          {!loading && tips.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {tips.length}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSheetOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Tipp teilen</span>
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <TipsSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="bg-destructive/10 p-3 rounded-full mb-3">
            <AlertCircle className="h-8 w-8 text-destructive/60" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchTips}>
            Erneut versuchen
          </Button>
        </div>
      ) : tips.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="bg-primary/10 p-3 rounded-full mb-3">
            <MessageSquarePlus className="h-8 w-8 text-primary/40" />
          </div>
          <h3 className="text-sm font-medium">Noch keine Tipps</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-xs">
            Sei der Erste und teile deinen Pflegetipp fuer diese Pflanze!
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSheetOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Tipp teilen
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {tips.map((tip) => (
            <TipCard
              key={tip.id}
              tip={tip}
              currentUserId={currentUserId}
              onDeleted={handleTipDeleted}
              onLikeToggled={handleLikeToggled}
            />
          ))}
        </div>
      )}

      {/* Share tip sheet */}
      <ShareTipSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        plantName={plantName}
        plantSpecies={plantSpecies}
        onSuccess={handleTipCreated}
      />
    </div>
  )
}

function TipsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}
