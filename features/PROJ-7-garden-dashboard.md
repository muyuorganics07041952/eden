# PROJ-7: Garden Dashboard

## Status: Planned
**Created:** 2026-02-27
**Last Updated:** 2026-03-02

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Requires: PROJ-2 (Plant Management) — Pflanzenzahl und Pflanzengesundheit
- Requires: PROJ-4 (Care Management) — Aufgabenstatus und nächste Termine
- Requires: PROJ-5 (Push Notifications) — Settings-Seite für Standorteingabe

## Context: Bereits implementiert
Das Dashboard (`/dashboard`) existiert bereits mit folgenden Elementen:
- Pflanzenzahl-Widget (Gesamtzahl aller Pflanzen)
- Heute-fällige-Aufgaben-Widget (nur Zahl, keine Details)
- Feed-Vorschau (3 neueste Artikel)
- Empty State (keine Pflanzen vorhanden)

PROJ-7 ergänzt das bestehende Dashboard um vier neue Features.

---

## Feature 1: Anstehende Aufgaben-Liste

### User Stories
- Als Nutzer möchte ich auf dem Dashboard sehen, welche Pflegeaufgaben als nächstes anstehen, damit ich meinen Gartenalltag planen kann.
- Als Nutzer möchte ich überfällige Aufgaben sofort erkennen, damit ich nichts vergesse.

### Acceptance Criteria
- [ ] Das Dashboard zeigt die nächsten 5 anstehenden Aufgaben als kompakte Zeilenliste
- [ ] Jede Zeile zeigt: Pflanzenname | Aufgabenname | Fälligkeitsdatum
- [ ] Überfällige Aufgaben sind rot markiert (Badge "Überfällig")
- [ ] Heutige Aufgaben sind mit einem Badge "Heute" hervorgehoben
- [ ] Aufgaben werden aufsteigend nach Fälligkeitsdatum sortiert (überfälligste zuerst)
- [ ] Bei mehr als 5 Aufgaben erscheint ein "Alle Aufgaben ansehen →"-Link
- [ ] Wenn keine Aufgaben vorhanden: Text "Alles erledigt! Dein Garten ist happy. 🌱"

### Edge Cases
- Keine Pflanzen: Widget wird nicht angezeigt (nur Empty-State)
- Alle Aufgaben erledigt: Positives Feedback-State
- Sehr viele überfällige Aufgaben: Nur die 5 ältesten anzeigen

---

## Feature 2: Pflanzengesundheit-Warnung

### User Stories
- Als Nutzer möchte ich auf einen Blick sehen, wie viele meiner Pflanzen gerade vernachlässigt werden (überfällige Aufgaben haben).

### Acceptance Criteria
- [ ] Das bestehende Pflanzenzahl-Widget zeigt zusätzlich einen Warnhinweis, wenn Pflanzen überfällige Aufgaben haben
- [ ] Warnung: "X Pflanzen brauchen Aufmerksamkeit" mit einem Warn-Icon (gelb/orange)
- [ ] Der Warnhinweis ist klickbar und führt zur Aufgaben-Seite (/tasks)
- [ ] Keine Warnung, wenn alle Pflanzen up-to-date sind

### Edge Cases
- 0 Pflanzen: Warnung wird nicht angezeigt
- Alle Pflanzen haben nur zukünftige Aufgaben: Kein Warnhinweis

---

## Feature 3: Saisonales Tipp-Widget

### User Stories
- Als Nutzer möchte ich monatliche Gartentipps auf dem Dashboard sehen, damit ich saisonal richtig handle.

### Acceptance Criteria
- [ ] Das Dashboard zeigt ein "Gartentipp des Monats"-Widget
- [ ] Inhalt ist statisch pro Kalendermonat hinterlegt (12 Texte im Code)
- [ ] Widget zeigt: Icon + Monat + kurzer Tipp-Text (max. 2 Sätze)
- [ ] Kein API-Call — rein statische Daten
- [ ] Widget ist immer sichtbar (auch ohne Pflanzen)

### Saisonale Inhalte (statisch)
| Monat | Tipp |
|-------|------|
| Januar | Saatgut-Kataloge studieren und Anzuchtplan erstellen. Werkzeug reinigen und für die Saison vorbereiten. |
| Februar | Erste Frühjahrsblüher wie Schneeglöckchen und Krokusse beobachten. Anzucht von Tomaten und Paprika starten. |
| März | Zeit zum Vorziehen von Tomaten, Paprika und Auberginen. Beete von Unkraut befreien und lockern. |
| April | Frostfreie Nächte abwarten, dann Freilandaussaat starten. Erdbeeren und Kräuter pflanzen. |
| Mai | Eisheiligen (11.–15. Mai) beachten, dann kälteempfindliche Pflanzen pflanzen. Regelmäßig gießen. |
| Juni | Tomaten, Gurken und Zucchini einpflanzen. Erste Ernte bei Salat und Radieschen. |
| Juli | Regelmäßig gießen bei Hitze, am besten morgens. Kräuter und erste Tomaten ernten. |
| August | Hochsaison: Täglich ernten verhindert Überreife. Herbstaussaat für Spinat und Feldsalat beginnen. |
| September | Ernte einlagern und einkochen. Stauden und Gehölze pflanzen, die sich bis Frost einwurzeln. |
| Oktober | Garten winterfest machen: Beete mulchen, empfindliche Pflanzen schützen. Blumenzwiebeln pflanzen. |
| November | Letztes Laub kompostieren. Gartengeräte reinigen und einlagern. Ruhe für den Boden. |
| Dezember | Planung für das neue Gartenjahr starten. Saatgut sichten und ergänzen. Vögel füttern. |

### Edge Cases
- Unbekannter Monat (Fehler): Fallback auf generischen Tipp "Beobachte deinen Garten regelmäßig."

---

## Feature 4: Wettervorhersage (7 Tage)

### User Stories
- Als Nutzer möchte ich die Wettervorhersage für die nächsten 7 Tage auf dem Dashboard sehen, damit ich meine Gartenarbeit besser planen kann.
- Als Nutzer möchte ich einen Gartenhinweis basierend auf dem Wetter erhalten (z.B. "Heute kein Gießen nötig – Regen erwartet").
- Als Nutzer möchte ich meinen Standort in den Einstellungen hinterlegen, damit die Vorhersage für meinen Garten stimmt.

### Acceptance Criteria
- [ ] Wettervorhersage zeigt die nächsten 7 Tage in einer horizontalen Scroll-Zeile
- [ ] Pro Tag: Wetter-Icon + Min/Max Temperatur + Regenwahrscheinlichkeit in %
- [ ] Über der Vorhersage: Ein Gartenhinweis basierend auf dem heutigen Wetter (z.B. "Heute Regen erwartet – Gießen nicht nötig")
- [ ] Wetter-Daten kommen von Open-Meteo API (kostenlos, kein API-Key)
- [ ] Der API-Call erfolgt server-seitig (Next.js Server Component oder API Route) mit 1h Caching
- [ ] Wenn kein Standort hinterlegt: Widget zeigt "Standort in den Einstellungen hinterlegen" mit Link zu /settings
- [ ] Standort (Stadtname + Koordinaten) wird vom Nutzer in den Einstellungen eingegeben

### Standort-Einstellungen (Settings-Seite /settings)
- [ ] Neue Karte "Standort" auf der Settings-Seite
- [ ] Eingabefeld: Stadtname (Freitext)
- [ ] Button "Standort suchen" ruft eine Geocoding-API auf (Open-Meteo Geocoding, kostenlos)
- [ ] Ergebnis-Auswahl: Dropdown mit gefundenen Städten (Name + Land)
- [ ] Nach Auswahl werden Stadtname, Breitengrad und Längengrad in der DB gespeichert
- [ ] Gespeicherter Standort wird angezeigt mit "Ändern"-Button

### Gartenhinweis-Logik (statisch, kein KI-Call)
| Bedingung | Hinweis |
|-----------|---------|
| Regen > 50% | "Heute Regen erwartet – Gießen nicht nötig." |
| Temperatur > 30°C | "Sehr heiß heute – Pflanzen morgens früh gießen." |
| Temperatur < 5°C | "Frost möglich – empfindliche Pflanzen schützen." |
| Temperatur 15–25°C, kein Regen | "Perfektes Gartenwetter heute!" |
| Sonstiges | "Beobachte deine Pflanzen heute." |

### Neue Datenbank-Tabelle: user_settings
```
user_settings
- user_id (UUID, FK → auth.users, PK)
- city_name (TEXT, nullable)
- latitude (FLOAT8, nullable)
- longitude (FLOAT8, nullable)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Edge Cases
- Kein Standort gesetzt: Wetter-Widget zeigt CTA zur Settings-Seite
- Open-Meteo nicht erreichbar: Wetter-Widget zeigt "Wetterdaten nicht verfügbar"
- Ungültige Koordinaten: Fehlerbehandlung mit Fallback-Text
- Stadtname nicht gefunden: Fehlermeldung "Keine Stadt gefunden – bitte anders eingeben"

---

## Gesamt-Acceptance Criteria

- [ ] Dashboard lädt alle Daten in < 1,5 Sekunden (parallele Queries)
- [ ] Alle 4 neuen Widgets sind auf Mobile (375px) und Desktop (1440px) responsive
- [ ] Dashboard spiegelt immer den aktuellen Datenzustand wider
- [ ] Skeleton Loading während Daten geladen werden (für Wetter-Widget)

---

<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

**Erstellt:** 2026-03-02

---

### A) Komponenten-Struktur (Visual Tree)

```
/dashboard (Server Page — bestehend, wird erweitert)
│
├── Stats Grid (bestehend)
│   ├── PlantCountCard ← NEU: + Gesundheits-Warnbadge wenn Pflanzen überfällig
│   └── TasksDueCard (bestehend, unverändert)
│
├── UpcomingTasksSection (NEU — Server Component)
│   ├── UpcomingTaskRow × 5 (Pflanzenname | Aufgabe | Datum | Badge)
│   ├── "Alle Aufgaben ansehen →" Link (wenn > 5 Aufgaben)
│   └── EmptyState ("Alles erledigt! Dein Garten ist happy. 🌱")
│
├── SeasonalTipWidget (NEU — Server Component, statisch)
│   └── Icon + Monatsname + Tipp-Text (aus hartkodierter Liste)
│
├── WeatherWidget (NEU — Server Component)
│   ├── GardenHintBanner (z.B. "Heute Regen – Gießen nicht nötig")
│   ├── WeatherDayCard × 7 (Icon + Temp Min/Max + Regen%)
│   └── NoLocationCTA (wenn kein Standort gesetzt: Link zu /settings)
│
└── FeedPreview (bestehend, unverändert)

/settings (Server Page — bestehend, wird erweitert)
├── NotificationSettingsCard (bestehend)
└── LocationSettingsCard (NEU — Client Component)
    ├── CitySearchInput (Texteingabe + "Suchen"-Button)
    ├── SearchResultsList (Dropdown mit gefundenen Städten)
    └── SavedLocationDisplay ("📍 München — Ändern")
```

---

### B) Datenmodell

**Neue Datenbanktabelle: `user_settings`**

Speichert standortbezogene Nutzereinstellungen, die geräteübergreifend verfügbar sein sollen.

```
user_settings (1 Zeile pro Nutzer)
├── user_id     → eindeutige Nutzer-ID (Verknüpfung zu Auth)
├── city_name   → lesbarer Stadtname zur Anzeige (z.B. "München")
├── latitude    → Breitengrad (Dezimalzahl, z.B. 48.1374)
├── longitude   → Längengrad (Dezimalzahl, z.B. 11.5755)
└── updated_at  → wann zuletzt geändert
```

Sicherheitsregel (RLS): Jeder Nutzer kann nur seine eigene Zeile lesen und schreiben.

**Bestehende Tabellen, die erweitert abgefragt werden:**

```
care_tasks (bestehend)
→ Neue Query: Nächste 5 Aufgaben mit next_due_date ≥ heute (+ überfällige)
→ JOIN mit plants-Tabelle um Pflanzennamen zu holen

plants (bestehend)
→ Neue Query: Zähle Pflanzen mit mind. einer überfälligen care_task
→ Ergebnis fließt in den Gesundheits-Warnbadge
```

---

### C) Datenfluss: Wie kommt das Wetter auf die Seite?

```
Nutzer öffnet /dashboard
       ↓
Dashboard Server Component startet 5 parallele Datenbankabfragen:
  1. Pflanzenzahl (bestehend)
  2. Überfällige Aufgaben-Zahl (bestehend)
  3. Anstehende Aufgaben (NEU — nächste 5)
  4. Anzahl Pflanzen mit überfälligen Aufgaben (NEU)
  5. Nutzer-Standort aus user_settings (NEU)
       ↓
Wenn Standort vorhanden:
  → Open-Meteo API-Call (server-seitig, 1h gecacht)
  → Gibt 7-Tages-Forecast zurück (Temp, Regen%, WMO-Wettercode)
       ↓
Saisonaler Tipp:
  → Aktuellen Monat aus Datum lesen
  → Passenden Text aus hardkodierter Liste im Code wählen (kein API-Call!)
       ↓
Alle Daten werden als Props an Unterkomponenten übergeben
```

**Warum server-seitig für Wetter?**
- Kein API-Key erforderlich, aber trotzdem kein Wunsch, Koordinaten im Browser zu exponieren
- Next.js-nativer Fetch-Cache (`revalidate: 3600`) — keine externe Cache-Library nötig
- Seite ist vollständig vorgerendert, kein Client-Side Loading-Flicker

---

### D) Neue API-Routen

```
GET /api/geocode?q={suchbegriff}
→ Ruft Open-Meteo Geocoding API auf
→ Gibt Liste von Städten mit Koordinaten zurück
→ Nur von eingeloggten Nutzern nutzbar

PATCH /api/settings/location
→ Speichert ausgewählten Stadtname + Koordinaten in user_settings
→ Upsert (erstellt oder aktualisiert)
→ Nur für den eingeloggten Nutzer selbst
```

---

### E) Wetter-Icon-Mapping

Open-Meteo gibt WMO-Wettercodes zurück (internationale Norm). Diese werden im Frontend auf Emojis gemappt — keine externe Icon-Library nötig:

```
WMO 0       → ☀️ Klarer Himmel
WMO 1–3     → 🌤️ Leicht bewölkt / bewölkt
WMO 51–67   → 🌧️ Regen
WMO 71–77   → ❄️ Schnee
WMO 80–82   → 🌦️ Schauer
WMO 95–99   → ⛈️ Gewitter
```

---

### F) Gartenhinweis-Logik

Rein regelbasiert, kein KI-Call:

```
Wenn Regenwahrscheinlichkeit heute > 50%  → "Gießen nicht nötig – Regen erwartet"
Wenn Temperatur heute > 30°C              → "Sehr heiß – morgens früh gießen"
Wenn Temperatur heute < 5°C              → "Frost möglich – Pflanzen schützen"
Sonst schönes Wetter (15–25°C, wenig Regen) → "Perfektes Gartenwetter!"
Fallback                                  → "Beobachte deine Pflanzen heute"
```

---

### G) Neue Pakete

**Keine neuen Pakete notwendig.**

| Bedarf | Lösung |
|--------|--------|
| Wetter-API | `fetch()` (native, kein SDK) |
| Geocoding-API | `fetch()` (native) |
| Wetter-Icons | Emoji-Mapping (kein Icon-Paket) |
| Datumsformatierung | `date-fns` (bereits installiert) |
| UI-Komponenten | Bestehende shadcn/ui Komponenten (Card, Badge, ScrollArea, Input, Button) |

---

### H) Übersicht: Was wird gebaut?

| Komponente | Typ | Neu/Geändert |
|-----------|-----|-------------|
| `/dashboard/page.tsx` | Server Page | Erweitert |
| `UpcomingTasksSection` | Server Component | Neu |
| `SeasonalTipWidget` | Server Component | Neu |
| `WeatherWidget` | Server Component | Neu |
| `WeatherDayCard` | Server Component | Neu |
| `PlantCountCard` (Gesundheitsbadge) | Server Component | Geändert |
| `/settings/page.tsx` | Server Page | Erweitert |
| `LocationSettingsCard` | Client Component | Neu |
| `/api/geocode` | API Route | Neu |
| `/api/settings/location` | API Route | Neu |
| `user_settings` DB-Tabelle | Supabase Migration | Neu |

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
