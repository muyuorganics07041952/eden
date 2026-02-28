"use client"

import { useRouter } from "next/navigation"
import { Leaf, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Plant } from "@/lib/types/plants"

interface PlantCardProps {
  plant: Plant
}

export function PlantCard({ plant }: PlantCardProps) {
  const router = useRouter()
  const coverPhoto = plant.plant_photos?.find((p) => p.is_cover) ?? plant.plant_photos?.[0]

  return (
    <Card
      className="cursor-pointer shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      onClick={() => router.push(`/plants/${plant.id}`)}
      role="link"
      aria-label={`Pflanze ${plant.name} anzeigen`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          router.push(`/plants/${plant.id}`)
        }
      }}
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-primary/10">
        {coverPhoto ? (
          <img
            src={coverPhoto.url}
            alt={plant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="h-12 w-12 text-primary/40" />
          </div>
        )}
      </div>
      <CardContent className="p-3 space-y-1.5">
        <p className="font-medium truncate">{plant.name}</p>
        {plant.species && (
          <Badge variant="secondary" className="text-xs">
            {plant.species}
          </Badge>
        )}
        {plant.location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{plant.location}</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
