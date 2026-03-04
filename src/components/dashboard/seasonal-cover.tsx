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
      <div className="relative z-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hallo {name}
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          {weatherSubtitle ?? 'Willkommen in deinem Garten.'}
        </p>
      </div>
    </div>
  )
}
