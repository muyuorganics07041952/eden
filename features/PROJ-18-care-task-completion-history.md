# PROJ-18: Aufgaben-Verlauf (Care Task Completion History)

## Status: In Review
**Created:** 2026-03-13
**Last Updated:** 2026-03-13

## Dependencies
- Requires: PROJ-2 (Plant Management) — Pflanzenseite als Anzeigeort
- Requires: PROJ-4 (Care Management) — Pflegeaufgaben und Erledigen-Flow
- Requires: PROJ-9 (Care Management Improvements) — Erledigen-Dialog (AlertDialog für überfällige Aufgaben)

## Overview
Aktuell werden Erledigungen von Pflegeaufgaben nicht gespeichert — beim Erledigen wird nur das nächste Fälligkeitsdatum aktualisiert. Dieses Feature fügt eine Verlaufs-Datenbank hinzu und zeigt den Erledigungsverlauf auf der Pflanzenseite an. Beim Erledigen wird dem Nutzer außerdem angeboten, eine kurze Notiz zu hinterlassen.

## User Stories

- Als Gartenbesitzer möchte ich auf der Pflanzenseite sehen, wann ich eine Pflegeaufgabe zuletzt erledigt habe, damit ich die Pflegehistorie meiner Pflanze nachvollziehen kann.
- Als Gartenbesitzer möchte ich beim Erledigen einer Aufgabe optional eine kurze Notiz hinterlassen können (z.B. "Pflanze sieht trocken aus"), damit ich Beobachtungen dokumentieren kann.
- Als Gartenbesitzer möchte ich den vollständigen Erledigungsverlauf einer Pflanze in einer übersichtlichen Liste sehen.
- Als Gartenbesitzer möchte ich ältere Verlaufseinträge per "Mehr laden" nachladen können, ohne die ganze Seite neu zu laden.
- Als Gartenbesitzer möchte ich meine Notizen zu einer Erledigung im Verlauf wiederfinden, damit ich frühere Beobachtungen nachlesen kann.

## Acceptance Criteria

### Notiz-Dialog beim Erledigen einer Aufgabe
- [ ] Nach dem Erledigen (Klick auf ✓ und ggf. Modus-Auswahl) erscheint eine kurze Abfrage: "Möchtest du eine Notiz hinzufügen?"
- [ ] Zwei Optionen: "Notiz hinzufügen" und "Überspringen"
- [ ] Bei "Notiz hinzufügen": Ein Textfeld (max. 500 Zeichen) wird sichtbar; der Nutzer kann tippen und mit "Erledigen" bestätigen
- [ ] Bei "Überspringen": Aufgabe wird ohne Notiz erledigt
- [ ] Die Notiz ist vollständig optional — kein Pflichtfeld
- [ ] Der Zeichenzähler zeigt die verbleibenden Zeichen an (z.B. "480/500")
- [ ] Nach Bestätigung schließt sich der Dialog und die Erledigung wird gespeichert

### Verlauf-Sektion auf der Pflanzenseite
- [ ] Unterhalb der Pflegeaufgaben-Sektion erscheint ein "Verlauf"-Bereich
- [ ] Jeder Eintrag zeigt: Aufgabenname, Erledigungsdatum (relativ: "vor 3 Tagen" + absolut als Tooltip oder Subtext: "10. März 2026")
- [ ] Wenn eine Notiz vorhanden ist, wird sie als zweite Zeile unter Aufgabenname und Datum angezeigt
- [ ] Einträge sind nach Datum sortiert, neueste zuerst
- [ ] Initial werden 10 Einträge angezeigt
- [ ] Ein "Mehr laden"-Button lädt 10 weitere Einträge nach, bis alle angezeigt sind
- [ ] Hat die Pflanze noch keine Erledigungen, erscheint ein "Noch keine Erledigungen"-Empty-State

### Datenpersistenz (neue Tabelle)
- [ ] Jede Erledigung einer Pflegeaufgabe erstellt einen neuen Eintrag in `care_task_completions`
- [ ] Felder: Aufgaben-ID, Aufgabenname (Snapshot), Pflanzen-ID, Erledigungsdatum, optionale Notiz
- [ ] Der Aufgabenname wird als Snapshot gespeichert, damit der Verlauf auch nach Umbenennung oder Löschung einer Aufgabe korrekt angezeigt wird
- [ ] Erledigungen vor PROJ-18 (ohne Verlaufsdaten) erscheinen nicht im Verlauf — kein Backfill

## Edge Cases

- **Aufgabe gelöscht:** Verlaufseinträge bleiben erhalten; der gespeicherte Aufgabenname (Snapshot) wird angezeigt
- **Pflanze gelöscht:** Verlaufseinträge werden kaskadierend mitgelöscht (ON DELETE CASCADE)
- **Kein Verlauf:** "Noch keine Erledigungen"-Empty-State statt leerem Bereich
- **Sehr viele Einträge:** Pagination (10 pro Seite) verhindert Performance-Probleme bei Pflanzen mit jahrelanger Historie
- **Notiz-Eingabe sehr lang:** Zeichenbegrenzung (500) mit Zähler; Eingabe wird abgeschnitten/gesperrt bei Überschreitung
- **Notiz-Dialog abbrechen (Back-Button / außerhalb klicken):** Aufgabe wird NICHT erledigt — der Nutzer muss explizit "Überspringen" oder "Erledigen" wählen
- **Offline:** Erledigen schlägt fehl; Fehlermeldung "Keine Verbindung"

## Technical Requirements
- Neue Tabelle `care_task_completions` in Supabase mit RLS (user_id)
- `PUT /api/plants/[id]/care/[taskId]` (action: complete) wird erweitert: akzeptiert optionales `notes`-Feld und schreibt in `care_task_completions`
- Neuer API-Endpunkt `GET /api/plants/[id]/completions` mit Pagination (`limit`, `offset`)
- Kein Backfill bestehender Erledigungen

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
Pflanzenseite (/plants/[id]/page.tsx)
+-- ... (bestehende Sektionen: Header, Fotos, Tags)
+-- CareTaskSection  ← GEÄNDERT
|   +-- CareTaskCard  ← GEÄNDERT
|       +-- [bestehend] Überfällig-Dialog (Modus-Auswahl)
|       +-- [NEU] Notiz-Dialog (erscheint nach Modus-Auswahl / direktem Erledigen)
|           +-- "Notiz hinzufügen" Button → zeigt Textarea
|           +-- "Überspringen" Button → erledigt ohne Notiz
|           +-- Textarea (max. 500 Zeichen, optional)
|           +-- Zeichenzähler ("480/500")
|           +-- "Erledigen"-Button → erledigt mit Notiz
+-- CompletionHistorySection  ← NEU (unterhalb CareTaskSection)
    +-- Verlauf-Liste
    |   +-- CompletionHistoryEntry (pro Erledigung)
    |       +-- Aufgabenname + relatives Datum ("vor 3 Tagen")
    |       +-- Absolutes Datum als Subtext ("10. März 2026")
    |       +-- Notiz (falls vorhanden)
    +-- "Mehr laden"-Button (wenn weitere Einträge vorhanden)
    +-- Empty-State ("Noch keine Erledigungen")
```

### Datenmodell

**Neue Tabelle `care_task_completions`:**

| Feld | Beschreibung |
|------|-------------|
| id | Eindeutige ID (automatisch generiert) |
| user_id | Zu welchem Nutzer gehört dieser Eintrag |
| plant_id | Zu welcher Pflanze gehört dieser Eintrag |
| task_id | Zu welcher Aufgabe (wird NULL wenn Aufgabe gelöscht wird) |
| task_name | Name der Aufgabe zum Zeitpunkt der Erledigung (Snapshot) |
| completed_at | Datum und Uhrzeit der Erledigung |
| notes | Optionale Notiz (max. 500 Zeichen, nullable) |

**Beziehungen:**
- Pflanze gelöscht → alle Erledigungen dieser Pflanze werden mitgelöscht (CASCADE)
- Aufgabe gelöscht → `task_id` wird NULL, Eintrag bleibt erhalten (dank `task_name` Snapshot)

### Geänderte Dateien

**Neue Dateien:**
- `src/components/care/completion-history-section.tsx` — Verlauf-Sektion mit Liste, Pagination, Empty-State
- `src/app/api/plants/[id]/completions/route.ts` — GET-Endpunkt mit `limit`/`offset` Pagination

**Geänderte Dateien:**
- `src/components/care/care-task-card.tsx` — Notiz-Dialog als 2. Schritt nach der Erledigung
- `src/components/care/care-task-section.tsx` — leitet optionales `notes` an API weiter
- `src/app/api/plants/[id]/care/[taskId]/route.ts` — `action: complete` akzeptiert optional `notes`, schreibt in `care_task_completions`
- `src/app/(protected)/plants/[id]/page.tsx` — bindet `CompletionHistorySection` unterhalb `CareTaskSection` ein

**Supabase-Migration:**
- Neue Tabelle `care_task_completions` + RLS-Policies (user_id) + Index auf `(plant_id, completed_at DESC)`

### Tech-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Notiz-Dialog in `CareTaskCard` | Die ✓-Button-Interaktion gehört zur Karte — konsistent mit dem bestehenden Überfällig-Dialog |
| `task_name` Snapshot statt JOIN | Aufgaben können umbenannt oder gelöscht werden — Snapshot garantiert dauerhaft lesbare Einträge |
| `ON DELETE SET NULL` für `task_id` | Verlaufseinträge überleben das Löschen einer Aufgabe |
| Offset-Pagination (10 pro Seite) | Einfach und ausreichend; Cursor-Pagination wäre Over-Engineering für Pflegeverlauf |
| Verlauf als separate Sektion | Klare Trennung: "Pflegeaufgaben" = was kommt noch, "Verlauf" = was war |
| `notes` rückwärtskompatibel optional | Bestehende Stellen (z.B. Aufgabenseite ✓-Button) funktionieren ohne Änderung weiterhin |

### Pakete
Keine neuen — `Textarea`, `AlertDialog`, `Button`, `Badge`, `Separator` bereits via shadcn/ui installiert.

## QA Test Results

**Tested:** 2026-03-13
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Method:** Code review + build verification (no live browser session)

### Acceptance Criteria Status

#### AC-1: Notiz-Dialog beim Erledigen einer Aufgabe

- [x] Nach dem Erledigen (Klick auf Checkmark und ggf. Modus-Auswahl) erscheint eine kurze Abfrage: "Moechtest du eine Notiz hinzufuegen?" -- Dialog text reads "Moechtest du eine Notiz zu dieser Erledigung hinzufuegen?" (slightly different wording but intent matches)
- [x] Zwei Optionen: "Notiz hinzufuegen" und "Ueberspringen" -- Both buttons present in the AlertDialogFooter
- [x] Bei "Notiz hinzufuegen": Ein Textfeld (max. 500 Zeichen) wird sichtbar; der Nutzer kann tippen und mit "Erledigen" bestaetigen -- Textarea with MAX_NOTE_LENGTH=500 and "Erledigen" button confirmed
- [x] Bei "Ueberspringen": Aufgabe wird ohne Notiz erledigt -- `doComplete(undefined)` is called
- [x] Die Notiz ist vollstaendig optional -- kein Pflichtfeld -- Confirmed, notes field is optional throughout
- [ ] **BUG-1:** Der Zeichenzaehler zeigt die verbleibenden Zeichen an (z.B. "480/500") -- The counter shows `{noteText.length}/{MAX_NOTE_LENGTH}` which displays "0/500", "20/500" etc. (current/max), NOT remaining characters as specified ("480/500" remaining). The spec says "verbleibenden Zeichen" (remaining characters).
- [x] Nach Bestaetigung schliesst sich der Dialog und die Erledigung wird gespeichert -- `doComplete()` sets `setNoteDialogOpen(false)` then calls `onComplete`

#### AC-2: Verlauf-Sektion auf der Pflanzenseite

- [x] Unterhalb der Pflegeaufgaben-Sektion erscheint ein "Verlauf"-Bereich -- `CompletionHistorySection` rendered below `CareTaskSection` in page.tsx (line 226)
- [x] Jeder Eintrag zeigt: Aufgabenname, Erledigungsdatum relativ + absolut als Tooltip oder Subtext -- Both relative date (with Tooltip for absolute) AND absolute date as subtext are shown
- [x] Wenn eine Notiz vorhanden ist, wird sie als zweite Zeile unter Aufgabenname und Datum angezeigt -- Conditional render `{completion.notes && ...}` confirmed
- [x] Eintraege sind nach Datum sortiert, neueste zuerst -- API orders by `completed_at DESC`
- [x] Initial werden 10 Eintraege angezeigt -- PAGE_SIZE = 10
- [x] Ein "Mehr laden"-Button laedt 10 weitere Eintraege nach, bis alle angezeigt sind -- `hasMore` logic and `handleLoadMore` with offset pagination confirmed
- [x] Hat die Pflanze noch keine Erledigungen, erscheint ein "Noch keine Erledigungen"-Empty-State -- Empty state with "Noch keine Erledigungen" text confirmed

#### AC-3: Datenpersistenz (neue Tabelle)

- [x] Jede Erledigung einer Pflegeaufgabe erstellt einen neuen Eintrag in `care_task_completions` -- INSERT in PUT handler confirmed (line 168-176 of taskId/route.ts)
- [x] Felder: Aufgaben-ID, Aufgabenname (Snapshot), Pflanzen-ID, Erledigungsdatum, optionale Notiz -- All fields present in migration and insert
- [x] Der Aufgabenname wird als Snapshot gespeichert -- `task_name: currentTask.name` confirmed
- [x] Erledigungen vor PROJ-18 erscheinen nicht im Verlauf -- kein Backfill -- No backfill migration exists, confirmed

### Edge Cases Status

#### EC-1: Aufgabe geloescht
- [x] Handled correctly -- Migration uses `ON DELETE SET NULL` for task_id, task_name snapshot preserved

#### EC-2: Pflanze geloescht
- [x] Handled correctly -- Migration uses `ON DELETE CASCADE` for plant_id

#### EC-3: Kein Verlauf
- [x] Handled correctly -- Empty state "Noch keine Erledigungen" renders when completions.length === 0

#### EC-4: Sehr viele Eintraege
- [x] Handled correctly -- Pagination with PAGE_SIZE=10, API limits to max 50 via `Math.min(..., 50)`

#### EC-5: Notiz-Eingabe sehr lang
- [x] Handled correctly -- Client enforces 500 char limit via onChange guard, server validates with Zod `.max(500)`, DB has CHECK constraint `char_length(notes) <= 500`

#### EC-6: Notiz-Dialog abbrechen (Back-Button / ausserhalb klicken)
- [x] Handled correctly -- `handleNoteDialogOpenChange` does NOT call doComplete when dialog is dismissed

#### EC-7: Offline
- [ ] **BUG-2:** No specific offline error message "Keine Verbindung" is shown. The generic `catch` block in `handleComplete` throws `new Error("Fehler beim Markieren als erledigt")` -- there is no specific offline detection or user-facing error toast for network failures in this flow. The error is thrown but not caught by the CareTaskCard (only `finally` runs). The user sees no feedback.

### Cross-Browser Testing (Code Review)
- [x] No browser-specific APIs used (standard fetch, DOM, React)
- [x] CSS uses Tailwind utility classes only -- cross-browser compatible
- [x] No CSS features requiring vendor prefixes beyond what Tailwind handles

### Responsive Testing (Code Review)
- [x] AlertDialog footer uses `flex-col gap-2 sm:flex-row` for mobile stacking
- [x] CompletionHistoryEntry uses `truncate` on task_name and `whitespace-nowrap` on date
- [x] No fixed widths that would break on 375px

### Security Audit Results

- [x] Authentication: All API endpoints verify `supabase.auth.getUser()` before processing
- [x] Authorization: Plant ownership verified via `.eq('user_id', user.id)` in both completions GET and care task PUT
- [x] RLS enabled: `care_task_completions` has RLS with SELECT, INSERT, DELETE policies for own user
- [x] Input validation: Zod schema validates `notes` field with `.max(500)` and `action` with `.literal('complete')`
- [x] SQL injection: Supabase client uses parameterized queries
- [x] XSS: React auto-escapes all rendered text (no `dangerouslySetInnerHTML` used)
- [x] Pagination limits: API caps `limit` at 50 and `offset` at 0 minimum
- [ ] **BUG-3 (Security):** No RLS UPDATE policy on `care_task_completions` -- While no application code currently performs UPDATE operations on this table, the absence of an UPDATE policy means the default-deny behavior of RLS will block updates. This is safe by default BUT if an UPDATE policy is accidentally added later, or if someone uses the Supabase dashboard to edit rows, there is no guardrail. Best practice per project rules: explicitly define policies for all CRUD operations.
- [ ] **BUG-4 (Security):** No UUID validation on `plantId` path parameter in `GET /api/plants/[id]/completions` -- The `plantId` is used directly from the URL params without validating it is a valid UUID format. While Supabase will reject invalid UUIDs at the query level, the error would be a generic 500 rather than a clean 400. The PUT endpoint for care tasks also lacks this validation but this is a pre-existing issue.
- [ ] **BUG-5 (Security):** Completion insert failure is silently swallowed -- In the PUT handler (line 178-182), if the INSERT into `care_task_completions` fails, the error is logged but the response returns success (200). The user has no indication that their completion was not recorded in the history. This could lead to data loss of history records without the user knowing.
- [x] No secrets exposed in client-side code
- [x] No sensitive data leakage in API responses

### Bugs Found

#### BUG-1: Zeichenzaehler zeigt aktuelle statt verbleibende Zeichen
- **Severity:** Low
- **Steps to Reproduce:**
  1. Go to a plant detail page
  2. Click the checkmark on a care task
  3. Click "Notiz hinzufuegen"
  4. Type some text
  5. Expected: Counter shows remaining characters, e.g. "480/500"
  6. Actual: Counter shows current length, e.g. "20/500"
- **Code Location:** `src/components/care/care-task-card.tsx` line 268-270
- **Priority:** Fix in next sprint (cosmetic, does not affect functionality)

#### BUG-2: Fehlende Offline-Fehlermeldung bei Erledigung — FIXED
- **Severity:** Medium
- **Fix:** `doComplete()` now has a `catch` block that calls `toast.error("Aufgabe konnte nicht erledigt werden. Bitte überprüfe deine Verbindung.")` when the API call fails.

#### BUG-3: Fehlende RLS UPDATE Policy auf care_task_completions
- **Severity:** Low
- **Steps to Reproduce:**
  1. Review `supabase/migrations/20260313_care_task_completions.sql`
  2. Note: SELECT, INSERT, DELETE policies exist but no UPDATE policy
  3. Expected: Either an UPDATE policy or an explicit comment explaining it is intentionally omitted
  4. Actual: UPDATE policy is missing without documentation
- **Code Location:** `supabase/migrations/20260313_care_task_completions.sql`
- **Priority:** Nice to have (RLS default-deny is safe, but explicit is better)

#### BUG-4: Fehlende UUID-Validierung auf plantId Pfadparameter
- **Severity:** Low
- **Steps to Reproduce:**
  1. Send GET request to `/api/plants/not-a-uuid/completions`
  2. Expected: 400 Bad Request with clear error message
  3. Actual: Supabase query fails, returns 404 (plant not found) or 500 depending on Supabase error type
- **Code Location:** `src/app/api/plants/[id]/completions/route.ts` line 8
- **Priority:** Nice to have (defense in depth, does not cause security issue)

#### BUG-5: Completion-Insert-Fehler wird stillschweigend geschluckt — FIXED
- **Severity:** Medium
- **Fix:** API now returns `{ ...updatedTask, completionHistoryFailed: true }` when the history INSERT fails. `CareTaskSection.handleComplete` checks this flag and calls `toast.warning("Aufgabe erledigt, aber Verlaufseintrag konnte nicht gespeichert werden.")`. The task state is still updated correctly.

### Build Verification
- [x] `npm run build` completes successfully with no errors
- [x] New route `/api/plants/[id]/completions` appears in build output
- [x] No TypeScript compilation errors

### Regression Check
- [x] `CareTaskSection` still passes `onComplete` with the new 3-parameter signature (taskId, mode, notes)
- [x] Existing care task edit flow unchanged (edit schema and handler untouched)
- [x] Existing delete flow unchanged
- [x] Plant detail page structure preserved, new section appended at end
- [ ] **NOTE:** The tasks page (`/tasks`) uses a different completion flow that bypasses `CareTaskCard`. Need to verify manually that completing tasks from the tasks page still works (no note dialog expected there, but completion records should still be written if the tasks page calls the same API).

### Summary
- **Acceptance Criteria:** 13/14 passed (1 low-severity cosmetic issue)
- **Bugs Found:** 5 total (0 critical, 0 high, 2 medium, 3 low)
- **Security:** Minor findings only (no critical vulnerabilities)
- **Production Ready:** NO -- 2 medium bugs should be fixed first
- **Recommendation:** Fix BUG-2 (silent offline failure) and BUG-5 (silent completion insert failure) before deployment. BUG-1, BUG-3, BUG-4 can be addressed in a follow-up.

## Deployment
_To be added by /deploy_
