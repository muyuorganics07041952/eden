import { Leaf, Sun, Snowflake, Flower2 } from 'lucide-react'

type Season = 'spring' | 'summer' | 'autumn' | 'winter'

function getSeason(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

const SEASON_GRADIENT: Record<Season, string> = {
  spring: 'from-emerald-100 via-green-50 to-teal-50',
  summer: 'from-lime-100 via-green-100 to-emerald-50',
  autumn: 'from-green-200 via-emerald-100 to-teal-50',
  winter: 'from-teal-100 via-emerald-50 to-green-50',
}

function SeasonDecorations({ season }: { season: Season }) {
  if (season === 'spring') {
    return (
      <>
        <Flower2 className="absolute top-5 right-7 h-20 w-20 rotate-12 text-emerald-200/70" aria-hidden="true" />
        <Leaf className="absolute top-14 right-28 h-9 w-9 -rotate-6 text-green-200/60" aria-hidden="true" />
        <Flower2 className="absolute bottom-3 right-14 h-8 w-8 rotate-45 text-teal-200/40" aria-hidden="true" />
      </>
    )
  }
  if (season === 'summer') {
    return (
      <>
        <Sun className="absolute top-4 right-6 h-20 w-20 text-lime-200/70" aria-hidden="true" />
        <Leaf className="absolute bottom-4 right-28 h-10 w-10 rotate-12 text-green-200/60" aria-hidden="true" />
        <Leaf className="absolute top-10 right-32 h-6 w-6 -rotate-20 text-emerald-200/50" aria-hidden="true" />
      </>
    )
  }
  if (season === 'autumn') {
    return (
      <>
        <Leaf className="absolute top-4 right-6 h-20 w-20 rotate-45 text-green-300/60" aria-hidden="true" />
        <Leaf className="absolute top-10 right-28 h-9 w-9 -rotate-12 text-emerald-200/60" aria-hidden="true" />
        <Leaf className="absolute bottom-4 right-16 h-10 w-10 rotate-90 text-teal-200/50" aria-hidden="true" />
      </>
    )
  }
  // winter
  return (
    <>
      <Snowflake className="absolute top-5 right-7 h-20 w-20 text-teal-200/60" aria-hidden="true" />
      <Snowflake className="absolute bottom-4 right-24 h-8 w-8 text-green-200/40" aria-hidden="true" />
      <Snowflake className="absolute top-12 right-32 h-5 w-5 text-emerald-200/50" aria-hidden="true" />
    </>
  )
}

interface SeasonalCoverProps {
  name: string
  weatherSubtitle: string | null
}

export function SeasonalCover({ name, weatherSubtitle }: SeasonalCoverProps) {
  const month = new Date().getMonth() + 1 // 1–12
  const season = getSeason(month)
  const gradient = SEASON_GRADIENT[season]

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} px-6 pt-10 pb-6 min-h-[150px] flex flex-col justify-end`}
    >
      <SeasonDecorations season={season} />
      <div className="relative z-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hallo, {name} 👋
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          {weatherSubtitle ?? 'Willkommen in deinem Garten.'}
        </p>
      </div>
    </div>
  )
}
