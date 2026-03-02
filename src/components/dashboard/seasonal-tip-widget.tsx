import { Sprout } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const MONTHLY_TIPS: Record<number, string> = {
  0: 'Saatgut-Kataloge studieren und Anzuchtplan erstellen. Werkzeug reinigen und für die Saison vorbereiten.',
  1: 'Erste Frühjahrsblüher beobachten. Jetzt ist Zeit für die Anzucht von Tomaten und Paprika.',
  2: 'Zeit zum Vorziehen von Tomaten, Paprika und Auberginen. Beete von Unkraut befreien und lockern.',
  3: 'Frostfreie Nächte abwarten, dann Freilandaussaat starten. Erdbeeren und Kräuter pflanzen.',
  4: 'Eisheiligen (11.–15. Mai) beachten, dann kälteempfindliche Pflanzen pflanzen. Regelmäßig gießen.',
  5: 'Tomaten, Gurken und Zucchini einpflanzen. Erste Ernte bei Salat und Radieschen genießen.',
  6: 'Regelmäßig gießen bei Hitze, am besten morgens. Kräuter und erste Tomaten ernten.',
  7: 'Hochsaison: Täglich ernten verhindert Überreife. Herbstaussaat für Spinat und Feldsalat beginnen.',
  8: 'Ernte einlagern und einkochen. Stauden und Gehölze pflanzen, die sich bis Frost einwurzeln.',
  9: 'Garten winterfest machen: Beete mulchen, empfindliche Pflanzen schützen. Blumenzwiebeln pflanzen.',
  10: 'Letztes Laub kompostieren. Gartengeräte reinigen und einlagern. Ruhe für den Boden.',
  11: 'Planung für das neue Gartenjahr starten. Saatgut sichten und ergänzen. Vögel füttern.',
}

const MONTH_NAMES: Record<number, string> = {
  0: 'Januar',
  1: 'Februar',
  2: 'März',
  3: 'April',
  4: 'Mai',
  5: 'Juni',
  6: 'Juli',
  7: 'August',
  8: 'September',
  9: 'Oktober',
  10: 'November',
  11: 'Dezember',
}

export function SeasonalTipWidget() {
  const month = new Date().getMonth()
  const monthName = MONTH_NAMES[month]
  const tip = MONTHLY_TIPS[month]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
        <Sprout className="h-5 w-5 text-primary" aria-hidden="true" />
        <CardTitle className="text-lg font-semibold">
          Gartentipp – {monthName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
      </CardContent>
    </Card>
  )
}
