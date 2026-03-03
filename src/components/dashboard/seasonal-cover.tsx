import { Leaf, Sun, Snowflake, Flower2 } from 'lucide-react'

type Season = 'spring' | 'summer' | 'autumn' | 'winter'

function getSeason(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

const SEASON_GRADIENT: Record<Season, string> = {
  spring: 'from-pink-100 via-rose-50 to-emerald-50',
  summer: 'from-amber-100 via-yellow-50 to-lime-50',
  autumn: 'from-orange-100 via-amber-50 to-yellow-50',
  winter: 'from-blue-100 via-sky-50 to-indigo-50',
}

function SeasonDecorations({ season }: { season: Season }) {
  if (season === 'spring') {
    return (
      <>
        <Flower2 className="absolute top-5 right-7 h-20 w-20 rotate-12 text-pink-200/70" aria-hidden="true" />
        <Leaf className="absolute top-14 right-28 h-9 w-9 -rotate-6 text-green-200/60" aria-hidden="true" />
        <Flower2 className="absolute bottom-3 right-14 h-8 w-8 rotate-45 text-rose-200/40" aria-hidden="true" />
      </>
    )
  }
  if (season === 'summer') {
    return (
      <>
        <Sun className="absolute top-4 right-6 h-20 w-20 text-amber-200/80" aria-hidden="true" />
        <Leaf className="absolute bottom-4 right-28 h-10 w-10 rotate-12 text-lime-200/60" aria-hidden="true" />
        <Leaf className="absolute top-10 right-32 h-6 w-6 -rotate-20 text-green-200/50" aria-hidden="true" />
      </>
    )
  }
  if (season === 'autumn') {
    return (
      <>
        <Leaf className="absolute top-4 right-6 h-20 w-20 rotate-45 text-orange-200/70" aria-hidden="true" />
        <Leaf className="absolute top-10 right-28 h-9 w-9 -rotate-12 text-amber-200/60" aria-hidden="true" />
        <Leaf className="absolute bottom-4 right-16 h-10 w-10 rotate-90 text-red-200/50" aria-hidden="true" />
      </>
    )
  }
  // winter
  return (
    <>
      <Snowflake className="absolute top-5 right-7 h-20 w-20 text-blue-200/60" aria-hidden="true" />
      <Snowflake className="absolute bottom-4 right-24 h-8 w-8 text-indigo-200/40" aria-hidden="true" />
      <Snowflake className="absolute top-12 right-32 h-5 w-5 text-sky-200/50" aria-hidden="true" />
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
