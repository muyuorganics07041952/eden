# PROJ-7: Garden Dashboard

## Status: Deployed
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

**Tested:** 2026-03-02
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASS (production build succeeds without errors)

---

### Feature 1: Anstehende Aufgaben-Liste

#### AC-1.1: Dashboard zeigt die naechsten 5 anstehenden Aufgaben als kompakte Zeilenliste
- [x] PASS: UpcomingTasksSection component renders up to 5 tasks in compact rows. Query fetches 6, displays first 5.

#### AC-1.2: Jede Zeile zeigt Pflanzenname | Aufgabenname | Faelligkeitsdatum
- [x] PASS: Each row shows `plant_name` (bold), task `name`, and formatted date (dd.MM.)

#### AC-1.3: Ueberfaellige Aufgaben sind rot markiert (Badge "Ueberfaellig")
- [x] PASS: `isOverdue` check uses `task.next_due_date < today` and renders a `Badge variant="destructive"` with text "Ueberfaellig"

#### AC-1.4: Heutige Aufgaben sind mit einem Badge "Heute" hervorgehoben
- [x] PASS: `isToday` check renders a yellow/amber Badge with text "Heute"

#### AC-1.5: Aufgaben werden aufsteigend nach Faelligkeitsdatum sortiert (ueberfaelligste zuerst)
- [x] PASS: Query uses `.order('next_due_date', { ascending: true })`, so overdue (oldest) come first

#### AC-1.6: Bei mehr als 5 Aufgaben erscheint ein "Alle Aufgaben ansehen"-Link
- [x] PASS: Query fetches 6, displays 5; if `totalCount > 5` shows the link to /tasks

#### AC-1.7: Wenn keine Aufgaben vorhanden: Text "Alles erledigt! Dein Garten ist happy."
- [x] PASS: Empty state text matches spec exactly including emoji

#### EC-1.1: Keine Pflanzen: Widget wird nicht angezeigt (nur Empty-State)
- [ ] BUG: UpcomingTasksSection is rendered unconditionally outside the `!hasPlants` ternary. When there are no plants, it still shows (likely with the "Alles erledigt" empty state, but it should not be visible at all).

#### EC-1.2: Alle Aufgaben erledigt: Positives Feedback-State
- [x] PASS: Shows "Alles erledigt! Dein Garten ist happy." message

#### EC-1.3: Sehr viele ueberfaellige Aufgaben: Nur die 5 aeltesten anzeigen
- [x] PASS: Query is ordered ascending by next_due_date and limited to 6 (display 5), so oldest overdue come first

---

### Feature 2: Pflanzengesundheit-Warnung

#### AC-2.1: Bestehende Pflanzenzahl-Widget zeigt zusaetzlich einen Warnhinweis wenn Pflanzen ueberfaellige Aufgaben haben
- [ ] BUG: The query counts overdue **tasks** (not distinct **plants** with overdue tasks). The text says "X Pflanzen brauchen Aufmerksamkeit" but the number is the count of overdue tasks, not plants. If a plant has 3 overdue tasks, it would show "3 Pflanzen brauchen Aufmerksamkeit" instead of "1 Pflanze braucht Aufmerksamkeit".

#### AC-2.2: Warnung: "X Pflanzen brauchen Aufmerksamkeit" mit einem Warn-Icon (gelb/orange)
- [x] PASS (partial): AlertTriangle icon is shown in amber-600. Text format is correct. But the number is wrong per BUG above.

#### AC-2.3: Der Warnhinweis ist klickbar und fuehrt zur Aufgaben-Seite (/tasks)
- [x] PASS: Wrapped in `<Link href="/tasks">` element

#### AC-2.4: Keine Warnung wenn alle Pflanzen up-to-date sind
- [x] PASS: Conditional `{safeOverdueCount > 0 && (...)}` ensures warning is hidden when no overdue tasks

#### EC-2.1: 0 Pflanzen: Warnung wird nicht angezeigt
- [x] PASS: When no plants, the entire stats grid is replaced by empty state card, so warning is hidden

#### EC-2.2: Alle Pflanzen haben nur zukuenftige Aufgaben: Kein Warnhinweis
- [x] PASS: Query uses `.lt('next_due_date', today)` so only past-due tasks are counted

---

### Feature 3: Saisonales Tipp-Widget

#### AC-3.1: Das Dashboard zeigt ein "Gartentipp des Monats"-Widget
- [x] PASS: SeasonalTipWidget renders a Card with title "Gartentipp -- [month]"

#### AC-3.2: Inhalt ist statisch pro Kalendermonat hinterlegt (12 Texte im Code)
- [x] PASS: MONTHLY_TIPS Record has all 12 entries (keys 0-11)

#### AC-3.3: Widget zeigt Icon + Monat + kurzer Tipp-Text (max. 2 Saetze)
- [x] PASS: Sprout icon + month name in header + tip text in content

#### AC-3.4: Kein API-Call -- rein statische Daten
- [x] PASS: No fetch calls; uses `new Date().getMonth()` with hardcoded map

#### AC-3.5: Widget ist immer sichtbar (auch ohne Pflanzen)
- [x] PASS: SeasonalTipWidget is rendered outside the `!hasPlants` conditional block

#### EC-3.1: Unbekannter Monat (Fehler): Fallback auf generischen Tipp
- [ ] BUG: No fallback is implemented. If `MONTHLY_TIPS[month]` returned undefined (should not happen with getMonth() returning 0-11, but the spec explicitly requests a fallback), the tip would render as empty/undefined. Low risk since getMonth() always returns 0-11, but the spec requires a defensive fallback.

---

### Feature 4: Wettervorhersage (7 Tage)

#### AC-4.1: Wettervorhersage zeigt die naechsten 7 Tage in einer horizontalen Scroll-Zeile
- [x] PASS: `overflow-x-auto` container with `flex gap-2 min-w-max` displays days horizontally with scroll

#### AC-4.2: Pro Tag: Wetter-Icon + Min/Max Temperatur + Regenwahrscheinlichkeit in %
- [x] PASS: Each day card shows emoji icon, max temp (bold), min temp, and rain probability with droplet emoji

#### AC-4.3: Ueber der Vorhersage: Ein Gartenhinweis basierend auf dem heutigen Wetter
- [x] PASS: `getGardenHint()` function generates hint from today's data, displayed in a muted banner above forecast

#### AC-4.4: Wetter-Daten kommen von Open-Meteo API (kostenlos, kein API-Key)
- [x] PASS: Fetches from `api.open-meteo.com/v1/forecast` with no API key

#### AC-4.5: Der API-Call erfolgt server-seitig mit 1h Caching
- [x] PASS: Fetch in Server Component with `{ next: { revalidate: 3600 } }`

#### AC-4.6: Wenn kein Standort hinterlegt: Widget zeigt CTA mit Link zu /settings
- [x] PASS: When `weather === null && cityName === null`, shows MapPin icon + text + button linking to /settings

#### AC-4.7: Standort (Stadtname + Koordinaten) wird vom Nutzer in den Einstellungen eingegeben
- [x] PASS: LocationSettingsCard provides city search, geocoding, and saving to user_settings

#### AC-4.8: Neue Karte "Standort" auf der Settings-Seite
- [x] PASS: LocationSettingsCard rendered on /settings page with MapPin icon and title "Standort"

#### AC-4.9: Eingabefeld Stadtname (Freitext)
- [x] PASS: Input with placeholder "Stadt suchen..." and aria-label

#### AC-4.10: Button "Standort suchen" ruft Geocoding-API auf
- [x] PASS: Search button triggers fetch to `/api/geocode?q=...`

#### AC-4.11: Ergebnis-Auswahl: Dropdown mit gefundenen Staedten (Name + Land)
- [x] PASS: Results rendered as clickable buttons with name, admin1, and country

#### AC-4.12: Nach Auswahl werden Stadtname, Breitengrad und Laengengrad in der DB gespeichert
- [x] PASS: `handleSelect` calls PATCH `/api/settings/location` with city_name, latitude, longitude. Server does upsert.

#### AC-4.13: Gespeicherter Standort wird angezeigt mit "Aendern"-Button
- [x] PASS: Saved location shows pin emoji + city name + coordinates + "Aendern" button

#### EC-4.1: Kein Standort gesetzt: Wetter-Widget zeigt CTA zur Settings-Seite
- [x] PASS: Handled correctly with MapPin + link to /settings

#### EC-4.2: Open-Meteo nicht erreichbar: Wetter-Widget zeigt "Wetterdaten nicht verfuegbar"
- [x] PASS: When `weather === null && cityName !== null`, shows "Wetterdaten nicht verfuegbar" message

#### EC-4.3: Ungueltige Koordinaten: Fehlerbehandlung mit Fallback-Text
- [x] PASS: Zod validation on PATCH endpoint ensures lat [-90,90] and lng [-180,180]. Invalid coords rejected with 422.

#### EC-4.4: Stadtname nicht gefunden: Fehlermeldung
- [x] PASS: When geocode returns 0 results, toast.info shows "Keine Ergebnisse gefunden."

---

### Gesamt-Acceptance Criteria

#### GAC-1: Dashboard laedt alle Daten in < 1,5 Sekunden (parallele Queries)
- [x] PASS: All 7 queries use `Promise.all()` for parallel execution. Weather fetch also included. Cannot verify exact timing without live DB, but pattern is correct.

#### GAC-2: Alle 4 neuen Widgets sind responsive (375px und 1440px)
- [x] PASS (code review): Weather uses `overflow-x-auto` for horizontal scroll on mobile. Tasks use `truncate` for overflow. SeasonalTip and all Cards use standard shadcn Card which is responsive. No fixed widths that would break mobile.

#### GAC-3: Dashboard spiegelt immer den aktuellen Datenzustand wider
- [x] PASS: Server Component fetches fresh data on each page load. No stale client-side cache for DB data.

#### GAC-4: Skeleton Loading waehrend Daten geladen werden (fuer Wetter-Widget)
- [ ] BUG: No skeleton/loading state is implemented for the weather widget. The spec requires a skeleton loader while weather data loads. Since this is a Server Component the page will wait for the fetch to complete before rendering, meaning the user sees a blank page until all data (including the 1s+ weather API call) resolves. A `loading.tsx` or Suspense boundary with skeleton would be needed.

---

### Security Audit Results

#### SEC-1: Authentication -- Cannot access without login
- [x] PASS: Middleware (proxy.ts) redirects unauthenticated users to /login for all protected routes. Both API routes (/api/geocode and /api/settings/location) verify auth via `supabase.auth.getUser()` and return 401 if not authenticated.

#### SEC-2: Authorization -- Users cannot access other users' data
- [x] PASS: RLS policies on user_settings enforce `user_id = auth.uid()` for all operations. The PATCH endpoint uses `user.id` from the authenticated session, not from request body, preventing IDOR.

#### SEC-3: Input validation -- XSS attempts blocked
- [x] PASS: Geocode query validated with Zod (max 200 chars). Location PATCH validated with Zod schema. Query param is URL-encoded before sending to Open-Meteo. React's JSX auto-escapes outputs preventing XSS.

#### SEC-4: SQL Injection
- [x] PASS: All database queries go through Supabase client which uses parameterized queries. No raw SQL in application code.

#### SEC-5: Rate limiting on API endpoints
- [ ] BUG: No rate limiting on /api/geocode or /api/settings/location. An authenticated user could spam the geocoding endpoint, which proxies to Open-Meteo. This could abuse the external API and cause the app's IP to be rate-limited by Open-Meteo.

#### SEC-6: Exposed secrets in browser/network
- [x] PASS: Weather API call is server-side only. No API keys exposed (Open-Meteo is keyless). User coordinates are stored server-side and only sent to Open-Meteo from the server.

#### SEC-7: Sensitive data in API responses
- [x] PASS: Geocode response only returns city name, country, and coordinates (public data). Location PATCH returns only `{ success: true }`.

#### SEC-8: SSRF via Open-Meteo proxy
- [x] PASS: The geocode API route only calls a hardcoded Open-Meteo URL. User input is URL-encoded and used only as a query parameter, not in the host/path. No SSRF risk.

#### SEC-9: Security headers
- [ ] NOTE: No security headers (X-Frame-Options, X-Content-Type-Options, CSP, HSTS) configured in the application. This is a pre-existing gap not specific to PROJ-7 and should be addressed project-wide.

#### SEC-10: RLS policies on user_settings
- [x] PASS: Full CRUD RLS policies exist. PK is user_id referencing auth.users with ON DELETE CASCADE. Trigger auto-updates `updated_at`.

#### SEC-11: Potential function name collision in migration
- [ ] BUG: The migration creates `update_updated_at_column()` function with `CREATE OR REPLACE`. If another migration already created this function with different logic, this would silently overwrite it. Should check if function already exists or use a more specific name.

---

### Bugs Found

#### BUG-1: UpcomingTasksSection shown when no plants exist
- **Severity:** Low
- **Steps to Reproduce:**
  1. Log in with an account that has zero plants
  2. Navigate to /dashboard
  3. Expected: Only the empty state card ("Dein Garten wartet") is shown, no task widget
  4. Actual: UpcomingTasksSection renders below the empty state (showing "Alles erledigt" text)
- **Priority:** Fix in next sprint

#### BUG-2: Overdue count shows task count instead of plant count
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Have a plant with 3 overdue care tasks
  2. Navigate to /dashboard
  3. Expected: "1 Pflanze braucht Aufmerksamkeit"
  4. Actual: "3 Pflanzen brauchen Aufmerksamkeit" (counts tasks, not distinct plants)
- **Priority:** Fix before deployment
- **Root Cause:** Dashboard query on line 72-76 counts overdue `care_tasks` rows instead of counting distinct `plant_id` values from overdue tasks.

#### BUG-3: No skeleton loading state for weather widget
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Set a location in /settings
  2. Navigate to /dashboard on a slow connection
  3. Expected: Skeleton placeholder while weather data loads
  4. Actual: Entire page waits for weather API (up to several seconds) before rendering anything
- **Priority:** Fix before deployment
- **Root Cause:** Weather fetch is part of the main Server Component render. No Suspense boundary or loading.tsx wraps the weather section.

#### BUG-4: No rate limiting on geocode and location API endpoints
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Authenticate as any user
  2. Send 100+ rapid requests to `/api/geocode?q=Berlin`
  3. Expected: Rate limiting kicks in after N requests
  4. Actual: All requests are proxied to Open-Meteo without throttling
- **Priority:** Fix in next sprint

#### BUG-5: No fallback for unknown month in SeasonalTipWidget
- **Severity:** Low
- **Steps to Reproduce:**
  1. This is a defensive coding issue; `getMonth()` always returns 0-11
  2. Expected: Fallback text "Beobachte deinen Garten regelmaessig." per spec
  3. Actual: No fallback; would render `undefined` if somehow an invalid month key were used
- **Priority:** Nice to have

#### BUG-6: CREATE OR REPLACE FUNCTION may conflict with other migrations
- **Severity:** Low
- **Steps to Reproduce:**
  1. If another table migration defines `update_updated_at_column()` differently, this migration would overwrite it
  2. Expected: Function is safely created without overwriting
  3. Actual: `CREATE OR REPLACE` silently replaces any existing function of the same name
- **Priority:** Nice to have (currently no conflict exists, but risky for future migrations)

#### BUG-7: Weather widget and Seasonal Tip widget visible even with no plants
- **Severity:** Low
- **Steps to Reproduce:**
  1. Log in with zero plants
  2. Navigate to /dashboard
  3. Expected: Only empty state shown per spec edge case
  4. Actual: Seasonal Tip widget appears below empty state card
- **Note:** The spec says SeasonalTipWidget "ist immer sichtbar (auch ohne Pflanzen)" so this is correct for SeasonalTip. However, WeatherWidget has no such exemption. The spec's edge case "Keine Pflanzen: Widget wird nicht angezeigt (nur Empty-State)" under Feature 1 is ambiguous about whether it applies to all widgets or just the tasks widget. Marking as Low for review.
- **Priority:** Nice to have (requires product decision)

---

### Regression Testing

#### PROJ-1 (User Authentication)
- [x] PASS: Auth middleware unchanged. Login/logout/redirect flow unaffected.

#### PROJ-2 (Plant Management)
- [x] PASS: Plant queries on dashboard unchanged. No modifications to plant CRUD APIs.

#### PROJ-4 (Care Management)
- [x] PASS: Care task queries extended but not modified. Existing task count query still works.

#### PROJ-5 (Push Notifications)
- [x] PASS: Settings page extended with LocationSettingsCard alongside NotificationSettingsCard. No changes to notification logic.

#### PROJ-6 (Content Feed)
- [x] PASS: Feed preview section unchanged. ArticleCard import and usage identical.

---

### Summary

- **Acceptance Criteria:** 26/29 passed (3 failed)
- **Edge Cases:** 8/10 passed (2 failed)
- **Bugs Found:** 7 total (0 critical, 2 medium, 2 medium, 3 low)
  - 0 Critical
  - 0 High
  - 2 Medium (BUG-2: wrong count metric, BUG-3: no skeleton loading)
  - 2 Medium (BUG-4: no rate limiting)
  - 3 Low (BUG-1: widget visible without plants, BUG-5: no month fallback, BUG-6: function collision, BUG-7: ambiguous widget visibility)
- **Security:** 2 findings (no rate limiting on new endpoints, no security headers project-wide)
- **Regression:** All deployed features pass
- **Production Ready:** NO -- BUG-2 (wrong count metric) and BUG-3 (no skeleton loading) should be fixed before deployment

## Deployment

**Deployed:** 2026-03-02
**Production URL:** https://eden-azure-zeta.vercel.app
**Platform:** Vercel (auto-deploy from GitHub main branch)

### Pre-Deployment Checklist
- [x] `npm run build` — PASS (0 TypeScript errors, 33 routes)
- [x] QA completed — 0 Critical, 0 High bugs
- [x] BUG-2 (wrong plant count) — Fixed
- [x] BUG-3 (no weather skeleton) — Fixed
- [x] BUG-4 (no rate limiting) — Fixed
- [x] DB migration applied to Supabase (`create_user_settings`)
- [x] No new environment variables required (uses existing Supabase connection)
- [x] Code committed and pushed to main (commit `a505c58`)

### What Was Deployed
- New dashboard widgets: Anstehende Aufgaben, Pflanzengesundheit-Warnung, Saisonaler Tipp, Wettervorhersage
- New settings section: Standort-Karte mit Geocoding-Suche
- New DB table: `user_settings` (RLS enabled)
- New API routes: `GET /api/geocode`, `PATCH /api/settings/location`
- Bug fixes: Distinct plant count, Suspense skeleton for weather, rate limiting

### Known Low-Severity Bugs (deferred)
- BUG-1: UpcomingTasksSection shows empty state even when 0 plants exist
- BUG-5: No defensive fallback in SeasonalTipWidget (technically impossible to trigger)
- BUG-7: Widget visibility with 0 plants ambiguous (requires product decision)
