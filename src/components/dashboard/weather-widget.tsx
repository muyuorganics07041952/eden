import { Cloud, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface WeatherData {
  daily: {
    time: string[]
    weathercode: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
  }
}

interface WeatherWidgetProps {
  weather: WeatherData | null
  cityName: string | null
}

const WEEKDAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code === 1) return '🌤️'
  if (code === 2) return '⛅'
  if (code === 3) return '☁️'
  if (code === 45 || code === 48) return '🌫️'
  if ([51, 53, 55, 61, 63, 65, 66, 67].includes(code)) return '🌧️'
  if ([71, 73, 75, 77].includes(code)) return '❄️'
  if ([80, 81, 82].includes(code)) return '🌦️'
  if ([85, 86].includes(code)) return '🌨️'
  if ([95, 96, 99].includes(code)) return '⛈️'
  return '🌡️'
}

function getGardenHint(daily: WeatherData['daily']): string {
  const rainProb = daily.precipitation_probability_max[0]
  const maxTemp = daily.temperature_2m_max[0]
  const minTemp = daily.temperature_2m_min[0]

  if (rainProb > 50) return 'Heute Regen erwartet – Gießen nicht nötig.'
  if (maxTemp > 30) return 'Sehr heiß heute – Pflanzen morgens früh gießen.'
  if (minTemp < 5) return 'Frost möglich heute Nacht – empfindliche Pflanzen schützen.'
  if (maxTemp >= 15 && maxTemp <= 25 && rainProb <= 30) return 'Perfektes Gartenwetter heute!'
  return 'Beobachte deine Pflanzen heute.'
}

export function WeatherWidget({ weather, cityName }: WeatherWidgetProps) {
  // No location set
  if (weather === null && cityName === null) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground/40 mb-3" aria-hidden="true" />
          <p className="text-sm text-muted-foreground mb-3">
            Standort in den Einstellungen hinterlegen, um Wetterdaten zu sehen.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/settings">Zu den Einstellungen</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Location set but fetch failed
  if (weather === null && cityName !== null) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
          <Cloud className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-lg font-semibold">Wetter – {cityName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Wetterdaten nicht verfügbar. Bitte versuche es später erneut.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Weather data available
  const { daily } = weather!
  const hint = getGardenHint(daily)
  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
        <Cloud className="h-5 w-5 text-primary" aria-hidden="true" />
        <CardTitle className="text-lg font-semibold">Wetter – {cityName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Garden hint banner */}
        <div className="rounded-md bg-muted px-3 py-2">
          <p className="text-sm font-medium">{hint}</p>
        </div>

        {/* 7-day forecast */}
        <div className="overflow-x-auto -mx-6 px-6" role="table" aria-label="7-Tage-Wettervorhersage">
          <div className="flex gap-2 min-w-max pb-1">
            {daily.time.map((time, i) => {
              const isToday = time === todayStr
              const dayName = WEEKDAY_NAMES[new Date(time + 'T00:00:00').getDay()]

              return (
                <div
                  key={time}
                  className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 min-w-[4.5rem] text-center ${
                    isToday ? 'bg-primary/10 ring-1 ring-primary/20' : ''
                  }`}
                >
                  <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {isToday ? 'Heute' : dayName}
                  </span>
                  <span className="text-xl" aria-label={`Wettercode ${daily.weathercode[i]}`}>
                    {getWeatherEmoji(daily.weathercode[i])}
                  </span>
                  <span className="text-sm font-semibold">
                    {Math.round(daily.temperature_2m_max[i])}°
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(daily.temperature_2m_min[i])}°
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    💧 {daily.precipitation_probability_max[i]}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
