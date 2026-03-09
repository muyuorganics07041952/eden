# PROJ-13: Seasonal Task Scheduling

## Status: Deployed
**Created:** 2026-03-07
**Last Updated:** 2026-03-09

## Dependencies
- Requires: PROJ-4 (Care Management) — Pflegeaufgaben und `care_tasks`-Tabelle
- Requires: PROJ-11 (Standalone Garden Tasks) — allgemeine Aufgaben und `garden_tasks`-Tabelle

## Overview
Wiederkehrende Gartenaufgaben folgen oft einem saisonalen Rhythmus: "Rasen mähen alle 2 Wochen, aber nur von März bis Oktober." Bisher haben Aufgaben kein Saisonkonzept — sie erscheinen das ganze Jahr. Dieses Feature fügt einen optionalen Aktivzeitraum (Startmonat bis Endmonat) zu beiden Aufgabentypen hinzu. Außerhalb der Saison werden Aufgaben automatisch ausgeblendet. Wenn eine Saison beginnt, wird das Fälligkeitsdatum automatisch auf den ersten Tag der neuen Saison gesetzt.

## User Stories

- Als Gartenbesitzer möchte ich für eine Aufgabe festlegen können "aktiv von Monat X bis Monat Y", damit die Aufgabe nur in diesem Zeitraum in meiner Liste erscheint.
- Als Gartenbesitzer möchte ich, dass eine saisonale Aufgabe außerhalb der Saison automatisch verschwindet, damit meine Aufgabenliste übersichtlich bleibt.
- Als Gartenbesitzer möchte ich, dass das nächste Fälligkeitsdatum beim Saisonstart automatisch berechnet wird, damit ich es nicht jedes Jahr manuell anpassen muss.
- Als Gartenbesitzer möchte ich eine bestehende Aufgabe nachträglich mit einem Aktivzeitraum versehen können, damit ich alte Aufgaben auf saisonal umstellen kann.
- Als Gartenbesitzer möchte ich Aufgaben auch über den Jahreswechsel (z.B. November bis März) als saisonal markieren können, damit Winteraufgaben korrekt funktionieren.

## Acceptance Criteria

### Formular (Erstellen & Bearbeiten)
- [ ] Im GardenTaskSheet und CareTaskSheet gibt es ein optionales Feld "Aktivzeitraum"
- [ ] Das Feld besteht aus zwei Monatsauswahlen: "Aktiv von" und "Aktiv bis" (Dropdowns: Januar–Dezember)
- [ ] Wenn kein Zeitraum gesetzt ist, verhält sich die Aufgabe wie bisher (immer aktiv, ganzjährig)
- [ ] Beim Erstellen einer saisonalen Aufgabe außerhalb der Saison wird das Fälligkeitsdatum automatisch auf den 1. des Startmonats im nächsten Jahr gesetzt
- [ ] Beim Erstellen einer saisonalen Aufgabe innerhalb der Saison bleibt das vom Nutzer gewählte Fälligkeitsdatum erhalten
- [ ] Der Aktivzeitraum kann beim Bearbeiten geändert oder entfernt werden

### Anzeige auf der Task-Seite
- [ ] Aufgaben mit Aktivzeitraum werden NUR während der aktiven Monate in der Aufgabenliste angezeigt
- [ ] Außerhalb des Aktivzeitraums ist die Aufgabe unsichtbar (kein Abschnitt, kein leerer Eintrag)
- [ ] Eine Saison-Badge ("Mär–Okt") wird auf der Aufgabenkarte angezeigt, wenn ein Zeitraum gesetzt ist
- [ ] Überfällige saisonale Aufgaben werden wie normale überfällige Aufgaben behandelt (orange Hervorhebung)

### Automatische Datumsberechnung beim Erledigen
- [ ] Wenn eine saisonale Aufgabe am Ende der Saison erledigt wird und das berechnete nächste Datum außerhalb der Saison liegt, wird das Fälligkeitsdatum automatisch auf den 1. des Startmonats im nächsten Aktivzeitraum gesetzt
- [ ] Wenn das nächste Datum innerhalb der Saison liegt, bleibt die normale Frequenzberechnung unverändert
- [ ] Einmalige Aufgaben (`once`) mit Aktivzeitraum werden nach dem Erledigen wie bisher gelöscht (kein Nächstesdatum)

### Jahreszyklus-Übergang (Winteraufgaben)
- [ ] Ein Zeitraum "November bis März" (Startmonat > Endmonat) wird als jahresübergreifend erkannt
- [ ] Im Dezember ist eine Nov–Mär-Aufgabe aktiv, im April ist sie inaktiv

### Authentifizierung & Sicherheit
- [ ] Nur eingeloggte Nutzer können Aufgaben mit Aktivzeitraum anlegen oder bearbeiten
- [ ] RLS schützt Aufgaben vor fremdem Zugriff (bestehende Policies unverändert)

## Edge Cases

- **Kein Zeitraum gesetzt:** Aufgabe verhält sich komplett wie bisher — keine Änderung am Verhalten
- **Jahresübergreifende Saison (z.B. Nov–Mär):** Aktiv wenn aktueller Monat >= Startmonat ODER <= Endmonat; inaktiv von April bis Oktober
- **Einmalaufgabe mit Saison:** Wird erstellt und erscheint nur in der Saison; nach Erledigen gelöscht (kein Nächstesdatum)
- **Saisonsstart = Saisonende (gleicher Monat):** Aufgabe ist genau einen Monat pro Jahr aktiv
- **Aufgabe wird außerhalb der Saison bearbeitet:** Das Sheet zeigt die Aufgabe korrekt an (auch wenn sie in der Liste nicht sichtbar ist — erreichbar über Monatspicker auf den Fälligkeitsmonat)
- **Fälligkeitsdatum bereits in der Saison beim Erstellen:** Nutzer-Datum bleibt unverändert
- **Fälligkeitsdatum außerhalb der Saison beim Erstellen:** System überschreibt mit 1. Startmonat (nächstes Jahr, falls Startmonat bereits vergangen)
- **Bestehende Aufgabe wird auf saisonal umgestellt:** Wenn aktueller Monat außerhalb der neuen Saison liegt, wird das Fälligkeitsdatum automatisch angepasst
- **Monatsfilter auf Task-Seite:** Wenn Nutzer z.B. "August" auswählt und eine Aufgabe im August aktiv ist (Saison März–Oktober), erscheint sie — saisonale Filterlogik und Monatsfilter arbeiten zusammen

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur

```
GardenTaskSheet (erweitert)
+-- Name, Häufigkeit, Datum, Notizen (unverändert)
+-- [NEU] "Aktivzeitraum" Sektion
    +-- Toggle "Saison aktivieren" (Switch)
    +-- [wenn aktiv] "Aktiv von" Monats-Dropdown (Januar–Dezember)
    +-- [wenn aktiv] "Aktiv bis" Monats-Dropdown (Januar–Dezember)
    +-- [Hinweis] "Nov–Mär = jahrübergreifende Saison"

CareTaskSheet (erweitert)
+-- Gleiche "Aktivzeitraum"-Sektion wie GardenTaskSheet

Tasks Page (Aufgabenkarte, minimal erweitert)
+-- [NEU] Saison-Badge "Mär–Okt" neben Frequenz-Badge (nur wenn gesetzt)
```

### Datenmodell

Zwei neue optionale Felder in **beiden** Tabellen (`garden_tasks` + `care_tasks`):

```
Jede Aufgabe hat (zusätzlich zu bestehenden Feldern):
- Aktiv ab Monat  (1 = Januar, 12 = Dezember, optional)
- Aktiv bis Monat (1 = Januar, 12 = Dezember, optional)

Beide Felder sind entweder gleichzeitig gesetzt oder beide leer.
Leer = keine Saison, ganzjährig aktiv (wie bisher).
```

### Saisonlogik (Backend)

Wenn eine wiederkehrende saisonale Aufgabe erledigt wird:
1. Nächstes Datum wird wie bisher berechnet (+ Intervall in Tagen)
2. Liegt das neue Datum **außerhalb der Saison** → Datum auf **1. des Startmonats im nächsten Aktivzeitraum** setzen
3. Liegt es **innerhalb der Saison** → normales Datum beibehalten

Jahresübergreifende Saison (z.B. Nov–Mär): aktiv wenn `Monat >= Start` ODER `Monat <= Ende`

### Technische Entscheidungen

| Entscheidung | Empfehlung | Begründung |
|---|---|---|
| Wo speichern? | Neue Spalten in bestehenden Tabellen | Kein neues Schema; Saison ist ein Attribut der Aufgabe |
| API-Filter | Kein neuer Filter nötig | Saisonale Aufgaben außerhalb ihrer Saison haben `next_due_date` in der Zukunft — bestehende Datum-Filter blenden sie automatisch aus |
| Jahresübergreifende Saison | `start > end` = cross-year | Server prüft: `Monat >= start ODER Monat <= end` |
| UI-Monatspicker | shadcn `<Select>` (bereits installiert) | Kein neues Package nötig |

### Neue Dateien / Änderungen

| Was | Typ |
|---|---|
| Supabase Migration: 2 Spalten zu `garden_tasks` + `care_tasks` | Neu |
| `src/lib/types/care.ts` — `GardenTask` + `CareTask` erweitern | Klein |
| `/api/garden-tasks/route.ts` — POST: Datum auf Saisonstart anpassen | Erweitert |
| `/api/garden-tasks/[id]/route.ts` — PUT complete: Datum auf Saisonstart | Erweitert |
| `/api/plants/[id]/care/route.ts` — POST: Datum auf Saisonstart anpassen | Erweitert |
| `/api/plants/[id]/care/[taskId]/route.ts` — PUT complete: Datum auf Saisonstart | Erweitert |
| `src/components/tasks/garden-task-sheet.tsx` — Saison-Picker hinzufügen | Erweitert |
| `src/components/care/care-task-sheet.tsx` — Saison-Picker hinzufügen | Erweitert |
| `src/app/(protected)/tasks/page.tsx` — Saison-Badge auf Karten | Minimal |

### Neue Pakete
Keine — shadcn `<Select>` bereits installiert.

## QA Test Results

### Round 1 (2026-03-08) -- SUPERSEDED

Previous round found 4 bugs (BUG-1 through BUG-4). All were fixed in commit `5b04821`.

---

### Round 2 (2026-03-09) -- CURRENT

**Tested:** 2026-03-09
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASS (TypeScript compiles, production build succeeds)

### Acceptance Criteria Status

#### AC-1: Formular (Erstellen & Bearbeiten)

- [x] Im GardenTaskSheet und CareTaskSheet gibt es ein optionales Feld "Aktivzeitraum" -- Both sheets include a "Saisonale Aufgabe" toggle (Switch) with month dropdowns. Verified in `garden-task-sheet.tsx` (lines 334-408) and `care-task-sheet.tsx` (lines 256-331).
- [x] Das Feld besteht aus zwei Monatsauswahlen: "Aktiv von" und "Aktiv bis" (Dropdowns: Januar-Dezember) -- MONTH_OPTIONS array with values 1-12 and German labels present in both sheets.
- [x] Wenn kein Zeitraum gesetzt ist, verhalt sich die Aufgabe wie bisher (immer aktiv, ganzjahrig) -- When seasonEnabled=false, null values are sent. Backend `adjustDateForSeason` returns date unchanged when start/end are null. `isInSeason` returns true when start/end are null.
- [x] Beim Erstellen einer saisonalen Aufgabe ausserhalb der Saison wird das Falligkeitsdatum automatisch auf den 1. des Startmonats gesetzt -- `adjustDateForSeason` is called in POST handlers: `garden-tasks/route.ts` (line 172) and `plants/[id]/care/route.ts` (line 122).
- [x] Beim Erstellen einer saisonalen Aufgabe innerhalb der Saison bleibt das vom Nutzer gewahlte Falligkeitsdatum erhalten -- `adjustDateForSeason` returns the date unchanged when `isInSeason` returns true (season.ts line 56-58).
- [x] Der Aktivzeitraum kann beim Bearbeiten geandert oder entfernt werden -- Switch toggle resets months to null; edit action sends updated values via PUT endpoint.

#### AC-2: Anzeige auf der Task-Seite

- [x] Aufgaben mit Aktivzeitraum werden NUR wahrend der aktiven Monate in der Aufgabenliste angezeigt -- Garden tasks: `garden-tasks/route.ts` line 127-128 filters by `isInSeason`. Care tasks: `tasks/today/route.ts` lines 125-128 filters by `isInSeason`. (BUG-1 from Round 1 is FIXED.)
- [x] Ausserhalb des Aktivzeitraums ist die Aufgabe unsichtbar -- Both APIs filter out-of-season tasks server-side before returning results. No empty sections appear because the frontend groups/renders based on returned data.
- [x] Eine Saison-Badge ("Mar-Okt") wird auf der Aufgabenkarte angezeigt, wenn ein Zeitraum gesetzt ist -- `getSeasonBadgeLabel` renders for garden tasks (tasks/page.tsx line 419-422) and care tasks (line 646-649). TASK_SELECT now includes `active_month_start` and `active_month_end` (tasks/today/route.ts lines 43-44), so the data is available. (BUG-3 from Round 1 is FIXED.)
- [x] Uberfallige saisonale Aufgaben werden wie normale uberfallige Aufgaben behandelt (orange Hervorhebung) -- Same `getDueStatus` logic and orange styling applies regardless of season fields.

#### AC-3: Automatische Datumsberechnung beim Erledigen

- [x] Wenn eine saisonale Aufgabe am Ende der Saison erledigt wird und das berechnete nachste Datum ausserhalb der Saison liegt, wird das Falligkeitsdatum automatisch auf den 1. des Startmonats im nachsten Aktivzeitraum gesetzt -- `adjustDateForSeason` called in complete action for both `garden-tasks/[id]/route.ts` (line 160) and `plants/[id]/care/[taskId]/route.ts` (line 151).
- [x] Wenn das nachste Datum innerhalb der Saison liegt, bleibt die normale Frequenzberechnung unverandert -- `adjustDateForSeason` returns date unchanged when in season (season.ts line 56-58).
- [x] Einmalige Aufgaben (once) mit Aktivzeitraum werden nach dem Erledigen wie bisher geloscht (kein Nachstesdatum) -- Garden tasks with frequency 'once' are deleted on completion (garden-tasks/[id]/route.ts lines 135-147).

#### AC-4: Jahreszyklus-Ubergang (Winteraufgaben)

- [x] Ein Zeitraum "November bis Marz" (Startmonat > Endmonat) wird als jahresubergreifend erkannt -- `isInSeason` handles start > end with OR logic: `month >= start || month <= end` (season.ts line 27).
- [x] Im Dezember ist eine Nov-Mar-Aufgabe aktiv, im April ist sie inaktiv -- December(12) >= 11 is true; April(4) is neither >= 11 nor <= 3.

#### AC-5: Authentifizierung & Sicherheit

- [x] Nur eingeloggte Nutzer konnen Aufgaben mit Aktivzeitraum anlegen oder bearbeiten -- All endpoints check `supabase.auth.getUser()` and return 401 if not authenticated.
- [x] RLS schutzt Aufgaben vor fremdem Zugriff (bestehende Policies unverandert) -- All queries filter by `user_id`. Migration only adds columns, no RLS changes.

### Edge Cases Status

#### EC-1: Kein Zeitraum gesetzt
- [x] Handled correctly -- `adjustDateForSeason` and `isInSeason` return passthrough values when start/end are null.

#### EC-2: Jahresubergreifende Saison (z.B. Nov-Mar)
- [x] Handled correctly -- `isInSeason` uses OR logic for start > end.

#### EC-3: Einmalaufgabe mit Saison
- [x] Handled correctly -- Once-frequency tasks are deleted on completion; season fields are stored but do not affect deletion.

#### EC-4: Saisonsstart = Saisonende (gleicher Monat)
- [x] Handled correctly -- When start === end, `isInSeason` returns `month >= start && month <= end`, which equals `month === start`. Task is active for exactly one month.

#### EC-5: Aufgabe wird ausserhalb der Saison bearbeitet
- [x] Handled correctly -- Out-of-season tasks are hidden from the default list, but can be reached via the month picker (selecting the month where the due date falls). The edit sheet loads the task data correctly including season fields.

#### EC-6: Falligkeitsdatum bereits in der Saison beim Erstellen
- [x] Handled correctly -- `adjustDateForSeason` passes through when in season.

#### EC-7: Falligkeitsdatum ausserhalb der Saison beim Erstellen
- [x] Handled correctly -- `adjustDateForSeason` adjusts to next season start.

#### EC-8: Bestehende Aufgabe wird auf saisonal umgestellt
- [x] FIXED -- Both edit endpoints now call `adjustDateForSeason` before saving: `garden-tasks/[id]/route.ts` line 84 and `plants/[id]/care/[taskId]/route.ts` line 96. (BUG-2 from Round 1 is FIXED.)

#### EC-9: Monatsfilter auf Task-Seite
- [x] FIXED -- Both garden tasks (`garden-tasks/route.ts` line 80) and care tasks (`tasks/today/route.ts` line 79) apply `isInSeason` check in the month filter. (BUG-4 from Round 1 is FIXED.)

### Security Audit Results

- [x] Authentication: All API endpoints verify user session via `supabase.auth.getUser()` before processing
- [x] Authorization: All queries use `.eq('user_id', user.id)` to scope data to the authenticated user; care task endpoints additionally verify plant ownership
- [x] Input validation: Zod schemas validate `active_month_start`/`active_month_end` as integers 1-12, with `.refine()` ensuring both-or-neither constraint. Both create and edit schemas enforce this.
- [x] SQL injection: Supabase parameterized queries protect against injection; no raw SQL
- [x] XSS: Month labels are hardcoded constants, not user input. Task names are rendered as text content via React (auto-escaped), not via `dangerouslySetInnerHTML`
- [x] Database constraints: CHECK constraints enforce valid month range (1-12) and both-or-neither at the database level (migration lines 6-14 and 18-26)
- [x] No new secrets or environment variables introduced
- [x] Rate limiting: No new endpoints introduced; existing rate limiting applies
- [x] Data exposure: API responses only return the user's own data; no cross-user data leakage possible due to `.eq('user_id', user.id)` on every query

### Bugs Found (NEW in Round 2)

#### BUG-5: Dashboard overdue count does not filter by season
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Create a care task with seasonal range "Jun-Sep" and a due date in the past (e.g., 2026-08-01)
  2. Navigate to the dashboard (/dashboard) in March (outside the season)
  3. Expected: The overdue banner should NOT count this care task because it is out of season
  4. Actual: The dashboard directly queries `care_tasks` with `.lt('next_due_date', today)` (dashboard/page.tsx line 64) without any season filtering, so out-of-season tasks with past due dates will incorrectly appear in the "Pflanzen brauchen Aufmerksamkeit" banner
- **Root Cause:** The dashboard page uses a direct Supabase query (`src/app/(protected)/dashboard/page.tsx` line 61-64) rather than the `/api/tasks/today` endpoint, so the season filtering logic is not applied. Garden tasks are also not included in this query at all (separate issue from PROJ-11).
- **Priority:** Fix in next sprint (low user impact since `adjustDateForSeason` on completion prevents most out-of-season due dates)

#### BUG-6: Season badge missing on plant detail page care task cards
- **Severity:** Low
- **Steps to Reproduce:**
  1. Create a care task with seasonal range (e.g., Mar-Oct) for a specific plant
  2. Navigate to the plant detail page (/plants/[id])
  3. Expected: Season badge ("Mar-Okt") appears on the care task card, consistent with the /tasks page
  4. Actual: No season badge is shown because `care-task-card.tsx` and `care-task-section.tsx` do not render the `active_month_start`/`active_month_end` fields
- **Root Cause:** The `CareTaskCard` component (`src/components/care/care-task-card.tsx`) was not updated to display the season badge. The API (`/api/plants/[id]/care/route.ts`) does return the season fields via `select('*')`, so the data is available -- only the UI rendering is missing.
- **Priority:** Nice to have (cosmetic inconsistency, all functionality works correctly)

### Previously Fixed Bugs (from Round 1)

- BUG-1 (Critical): Care tasks not filtered by season -- FIXED in commit `5b04821`
- BUG-2 (High): Edit action does not adjust due date -- FIXED in commit `5b04821`
- BUG-3 (High): TASK_SELECT missing season columns -- FIXED in commit `5b04821`
- BUG-4 (Medium): Care tasks month filter missing isInSeason -- FIXED in commit `5b04821`

### Cross-Browser Testing

Testing is code-review based due to standard HTML/CSS usage:
- [x] Chrome: shadcn Select components use Radix UI primitives, compatible
- [x] Firefox: Standard HTML date input and Radix Select are compatible
- [x] Safari: Radix UI Select is Safari-compatible; HTML date inputs work on Safari

### Responsive Testing

- [x] 375px (Mobile): Season toggle and month dropdowns use `grid-cols-2` layout with `gap-3`, fits on mobile. SheetContent has `overflow-y-auto` for scrollability.
- [x] 768px (Tablet): Layout scales naturally with the grid and flex layouts.
- [x] 1440px (Desktop): No issues, sufficient space for all form elements.

### Regression Testing

- [x] PROJ-4 (Care Management): Care tasks still load, complete, and delete correctly on plant detail pages
- [x] PROJ-11 (Standalone Garden Tasks): Garden tasks still load, complete, create, edit, and delete correctly on /tasks page
- [x] PROJ-12 (Task Creation Flow): TaskTypePicker still opens correctly; creating both task types works
- [x] PROJ-7 (Garden Dashboard): Dashboard loads; overdue banner displays (note BUG-5 for season filtering)
- [x] PROJ-1 (User Authentication): Auth flow unaffected; all endpoints still check authentication

### Summary

- **Acceptance Criteria:** 15/15 passed (all previously failed criteria now pass after bug fixes)
- **Bugs Found (Round 2):** 2 new (0 critical, 0 high, 1 medium, 1 low)
- **Bugs Fixed (from Round 1):** 4 (1 critical, 2 high, 1 medium) -- all verified as fixed
- **Security:** No security vulnerabilities found. Auth, RLS, input validation, and database constraints are all solid.
- **Production Ready:** YES (no critical or high bugs remaining)
- **Recommendation:** Deploy. BUG-5 (dashboard season filtering) and BUG-6 (plant detail season badge) are non-blocking and can be addressed in a future sprint.

## Deployment

- **Deployed:** 2026-03-09
- **Production URL:** https://eden-gamma-two.vercel.app
- **Git Tag:** v1.13.0-PROJ-13
- **Commits:** `c3676de` → `5b04821` (4 commits: spec, tech design, implementation, bug fixes)
- **Migration Applied:** `add_seasonal_columns_to_tasks` (Supabase project `atyfrfoihmjkzpgelnmr`)
- **Open non-blocking bugs:** BUG-5 (dashboard season count), BUG-6 (plant detail season badge)
