import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { WeatherWidget } from './weather-widget'

interface WeatherSectionProps {
  latitude: number
  longitude: number
  cityName: string
}

interface WeatherDaily {
  time: string[]
  weathercode: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_probability_max: number[]
}

export async function WeatherSection({ latitude, longitude, cityName }: WeatherSectionProps) {
  let weatherData: { daily: WeatherDaily } | null = null

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe/Berlin&forecast_days=7`,
      { next: { revalidate: 3600 } }
    )
    if (res.ok) {
      const json = await res.json()
      weatherData = { daily: json.daily }
    }
  } catch {
    // weatherData stays null — WeatherWidget handles the error state
  }

  return <WeatherWidget weather={weatherData} cityName={cityName} />
}

export function WeatherSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-9 w-full rounded-md" />
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-[4.5rem] flex-shrink-0 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
