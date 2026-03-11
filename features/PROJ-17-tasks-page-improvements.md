# PROJ-17: Aufgaben-Seite Verbesserungen (Suche, Filter, Editierbarkeit)

## Status: Deployed
**Created:** 2026-03-11
**Last Updated:** 2026-03-11

## Dependencies
- Requires: PROJ-4 (Care Management) — Pflanzenpflege-Aufgaben und CareTaskSheet
- Requires: PROJ-11 (Standalone Garden Tasks) — Garten-Aufgaben und GardenTaskSheet
- Requires: PROJ-12 (Task Creation Flow) — TaskTypePicker, bestehende Aufgabenseite

## Overview
Die aktuelle Aufgabenseite zeigt alle fälligen Aufgaben gruppiert nach Pflanze, bietet aber keine Möglichkeit zu suchen, nach Status zu filtern oder Pflanzenpflege-Aufgaben direkt zu bearbeiten. Dieses Feature fügt Suche, Statusfilter und Pflanzenfilter hinzu, macht beide Aufgabentypen über ein ⋮-Menü editierbar und macht das UI konsistenter.

## User Stories

- Als Gartenbesitzer möchte ich auf der Aufgabenseite nach einer Aufgabe oder Pflanze suchen können, damit ich schnell die gesuchte Aufgabe finde.
- Als Gartenbesitzer möchte ich Aufgaben nach Status (Überfällig / Heute / Anstehend) filtern können, damit ich z.B. nur überfällige Aufgaben sehe.
- Als Gartenbesitzer möchte ich Aufgaben für eine bestimmte Pflanze filtern können, damit ich den kompletten Pflegebedarf dieser Pflanze auf einen Blick sehe.
- Als Gartenbesitzer möchte ich eine Pflanzenpflege-Aufgabe direkt auf der Aufgabenseite bearbeiten können (Name, Häufigkeit, Notizen), ohne zur Pflanzenseite navigieren zu müssen.
- Als Gartenbesitzer möchte ich eine Pflanzenpflege-Aufgabe von der Aufgabenseite löschen können.
- Als Gartenbesitzer möchte ich ein konsistentes ⋮-Menü auf allen Aufgabenkarten (Pflanzenpflege + Garten) haben, damit ich immer gleich weiß wie ich eine Aufgabe bearbeite.

## Acceptance Criteria

### Suchfeld
- [ ] Ein Suchfeld erscheint unterhalb der bestehenden Range-Tabs (Dieser Monat / Diese Woche / Heute)
- [ ] Die Suche filtert in Echtzeit (bei jeder Eingabe) nach Aufgabenname und Pflanzname (case-insensitive)
- [ ] Ein X-Button im Suchfeld löscht die Eingabe und zeigt wieder alle Aufgaben
- [ ] Leeres Suchfeld zeigt alle Aufgaben des aktuellen Zeitraums (kein aktiver Filter)

### Filter-Chips: Status
- [ ] Zwei Status-Chips erscheinen unterhalb des Suchfelds: "Überfällig", "Anstehend" _(Scope-Änderung: "Heute"-Chip entfernt auf Nutzerwunsch)_
- [ ] Klick auf einen Chip aktiviert den Filter; aktive Chips sind visuell hervorgehoben
- [ ] Mehrere Chips können gleichzeitig aktiv sein (OR-Logik: Aufgabe muss mindestens einem der aktiven Status entsprechen)
- [ ] Status-Chips werden nur angezeigt, wenn Aufgaben in dem jeweiligen Status existieren

### Filter: Pflanze
_(Scope-Änderung: Pflanzen-Filter entfernt auf Nutzerwunsch — Suche + Statusfilter sind ausreichend)_

### Kombinierte Filter
- [ ] Suche + Statusfilter werden gleichzeitig angewendet (AND-Logik zwischen Filtertypen)
- [ ] Die Anzahl der angezeigten Aufgaben ist sichtbar, wenn ein Filter aktiv ist (z.B. "5 von 12 Aufgaben")

### Kein Ergebnis
- [ ] Wenn keine Aufgaben den aktiven Filtern entsprechen, erscheint ein "Keine Aufgaben gefunden"-State
- [ ] Ein "Filter zurücksetzen"-Button setzt alle Filter (Suche, Status) zurück

### ⋮-Menü auf Pflanzenpflege-Aufgabenkarten
- [ ] Jede Pflanzenpflege-Aufgabenkarte hat ein ⋮-Menü-Icon (Dropdown)
- [ ] Menü enthält: "Bearbeiten" und "Löschen"
- [ ] "Bearbeiten" öffnet das bestehende CareTaskSheet mit den aktuellen Aufgabendaten zum Bearbeiten
- [ ] Nach erfolgreichem Bearbeiten wird die Aufgabe in der Liste aktualisiert (oder entfernt, wenn neues Fälligkeitsdatum außerhalb des Zeitraums)
- [ ] "Löschen" öffnet einen Bestätigungs-Dialog
- [ ] Nach Bestätigung wird die Aufgabe gelöscht und aus der Liste entfernt
- [ ] Der Abschluss-Button (✓) bleibt auf der Karte und funktioniert weiterhin separat vom ⋮-Menü

### ⋮-Menü auf Garten-Aufgabenkarten (konsistentes UI)
- [ ] Garten-Aufgabenkarten erhalten ebenfalls ein ⋮-Menü mit "Bearbeiten" und "Löschen"
- [ ] Klick auf die Karte öffnet weiterhin das Edit-Sheet (bestehende Funktionalität bleibt)
- [ ] Das ⋮-Menü bietet eine alternative, explizite Möglichkeit zum Bearbeiten/Löschen

## Edge Cases

- **Filterstate bei Tab-Wechsel:** Suche und Statusfilter werden zurückgesetzt wenn der Nutzer zwischen den Range-Tabs (Monat/Woche/Heute) oder Monats-Buttons wechselt
- **Aufgabe nach Edit aus Liste verschwunden:** Wenn die bearbeitete Aufgabe ein neues Fälligkeitsdatum hat, das außerhalb des aktuellen Zeitraums liegt, verschwindet sie aus der Liste (fetchTasks nach jedem Edit)
- **Alle Aufgaben einer Pflanze gelöscht:** Die Pflanzengruppe verschwindet automatisch
- **Kein aktiver Status-Chip:** Alle Status-Typen sind sichtbar (kein Filter aktiv)
- **Mobile:** ⋮-Menü und Filter-Chips müssen auf kleinen Bildschirmen (375px) bedienbar sein

## Technical Requirements
- Filterlogik läuft vollständig client-seitig (keine neuen API-Queries bei Filter-Änderung)
- CareTaskSheet muss im Edit-Modus (mit bestehender Task) aufgerufen werden können — prüfen ob bestehende Prop-Schnittstelle ausreicht
- Löschen von Pflanzenpflege-Aufgaben: DELETE `/api/plants/[id]/care/[taskId]` (Route prüfen ob vorhanden)
- Filterstate: nur in React state (kein URL-Param, keine Persistenz)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
/tasks Seite (page.tsx)
+-- Header (bestehend: Titel + "Aufgabe hinzufügen"-Button)
+-- Range-Tabs (bestehend: Dieser Monat / Diese Woche / Heute)
+-- Monats-Picker (bestehend: J F M A M J J A S O N D)
+-- TaskFilterBar  ← NEU (eigene Komponente)
|   +-- SearchInput (Suchfeld + X-Clear-Button)
|   +-- Status-Chips ("Überfällig", "Heute", "Anstehend")
|   +-- Pflanzen-Chips (dynamisch aus geladenen Aufgaben)
|   +-- Aufgaben-Zähler ("5 von 12 Aufgaben", nur wenn Filter aktiv)
|   +-- "Filter zurücksetzen"-Button (nur wenn Filter aktiv)
+-- Content-Bereich
|   +-- Garten-Aufgaben-Sektion
|   |   +-- Garten-Aufgabenkarte (✓-Button + ⋮-Menü)  ← GEÄNDERT
|   |       +-- ⋮-DropdownMenu: "Bearbeiten", "Löschen"
|   +-- Pflanzenpflege-Aufgaben-Sektion
|       +-- PlantGroup
|           +-- Pflanzenpflege-Aufgabenkarte (✓-Button + ⋮-Menü)  ← GEÄNDERT
|               +-- ⋮-DropdownMenu: "Bearbeiten", "Löschen"
+-- Kein-Ergebnis-State  ← angepasst (unterscheidet: keine Daten vs. kein Filterergebnis)
+-- CareTaskSheet (bestehend, jetzt auch mit task-Prop für Edit)  ← GEÄNDERT
+-- AlertDialog (Bestätigung: Aufgabe löschen)  ← NEU
+-- GardenTaskSheet (bestehend)
+-- TaskTypePicker (bestehend)
+-- AlertDialog (bestehend: überfällige Aufgabe erledigen)
```

### Datenmodell

Keine neuen Datenbankfelder — alle Verbesserungen sind rein client-seitig.

**Neuer Filter-State auf der Seite:**
- Suchtext: Freitext (leer = kein Filter)
- Aktive Status: Menge von {"Überfällig", "Heute", "Anstehend"} (leer = alle zeigen)
- Aktive Pflanzen: Menge von Pflanzen-IDs (leer = alle zeigen)

**Gefilterte Listen (berechnet, nicht gespeichert):**
- `gefilterte Pflanzenpflege-Aufgaben` = alle care tasks, die Suchtext + Status + Pflanzen-Filter bestehen
- `gefilterte Garten-Aufgaben` = alle garden tasks, die Suchtext + Status-Filter bestehen (Pflanzen-Filter ignoriert)

**Bestehende APIs genutzt (keine neuen benötigt):**
- Bearbeiten: `PUT /api/plants/[id]/care/[taskId]` mit `action: "edit"` — schon vorhanden ✅
- Löschen: `DELETE /api/plants/[id]/care/[taskId]` — schon vorhanden ✅

### Geänderte Dateien

**Neue Datei:**
- `src/components/tasks/task-filter-bar.tsx` — Suchfeld + Status-Chips + Pflanzen-Chips

**Geänderte Dateien:**
- `src/app/(protected)/tasks/page.tsx` — Filter-State + useMemo für gefilterte Listen + Edit/Löschen-Handler für care tasks + AlertDialog für Lösch-Bestätigung + ⋮-Menü auf beiden Kartentypen
- `src/components/tasks/garden-task-sheet.tsx` — wird geprüft ob Änderungen nötig (voraussichtlich keine)

### Tech-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| `DropdownMenu` (shadcn/ui) | Bereits installiert; Standard-Pattern für ⋮-Aktionsmenüs |
| Client-seitige Filterung | Daten sind bereits geladen — keine neuen API-Aufrufe nötig; Instant-Responsivität |
| `useMemo` für gefilterte Listen | Berechneter Wert aus State, kein extra State — gleicher Ansatz wie PROJ-16 |
| CareTaskSheet im Edit-Modus | Die Komponente hat bereits einen `task?`-Prop für Edit — kein neues Sheet nötig |
| DELETE-Endpoint wiederverwenden | Endpoint existiert bereits und ist abgesichert (Auth + User-Check) |
| Filterstate bei Tab-Wechsel zurücksetzen | Vermeidet verwirrende Filter-Kombinationen nach dem Zeitraum-Wechsel |
| Pflanzen-Filter ignoriert Garten-Aufgaben | Garten-Aufgaben haben keinen Pflanzenbezug — Trennung ist semantisch korrekt |

### Pakete
Keine neuen Pakete — `DropdownMenu`, `AlertDialog`, `Input`, `Badge` bereits via shadcn/ui installiert.

## QA Test Results

**Tested:** 2026-03-11
**App URL:** http://localhost:3000/tasks
**Tester:** QA Engineer (AI)
**Build Status:** PASS (production build compiles without errors)

### Scope Changes (Intentional Deviations from Spec)

The following acceptance criteria were **intentionally removed** per user feedback (commit `77fc4bd`). The spec should be updated to reflect these scope changes:
- "Heute" status chip removed (only "Ueberfaellig" and "Anstehend" remain)
- Plant filter chips entirely removed
- This affects AC sections: Status-Chips, Filter: Pflanze, Kombinierte Filter, and related edge cases

---

### Acceptance Criteria Status

#### AC-1: Suchfeld
- [x] Ein Suchfeld erscheint unterhalb der bestehenden Range-Tabs (Dieser Monat / Diese Woche / Heute) -- TaskFilterBar renders below tabs/month-picker when tasks exist (line 490-502)
- [x] Die Suche filtert in Echtzeit (bei jeder Eingabe) nach Aufgabenname und Pflanzname (case-insensitive) -- `filteredCareTasks` filters by `t.name` and `t.plant_name`, `filteredGardenTasks` by `t.name`, all `.toLowerCase()` (lines 208-232)
- [x] Ein X-Button im Suchfeld loescht die Eingabe und zeigt wieder alle Aufgaben -- X button renders when `searchQuery` is truthy, calls `onSearchChange("")` (task-filter-bar.tsx line 66-74)
- [x] Leeres Suchfeld zeigt alle Aufgaben des aktuellen Zeitraums (kein aktiver Filter) -- `isFilterActive` is false when `searchQuery.length === 0` and `activeStatuses.size === 0` (line 205)

#### AC-2: Filter-Chips: Status
- [x] Status-Chips erscheinen unterhalb des Suchfelds -- Rendered in TaskFilterBar below search input (task-filter-bar.tsx lines 78-101)
- [x] Klick auf einen Chip aktiviert den Filter; aktive Chips sind visuell hervorgehoben -- `isActive` toggles styling via `STATUS_STYLES[status].active/inactive` (task-filter-bar.tsx lines 86-89)
- [x] Mehrere Chips koennen gleichzeitig aktiv sein (OR-Logik) -- `activeStatuses` is a `Set`, filter uses `.has()` (lines 216-218, 228-230)
- [x] Status-Chips werden nur angezeigt, wenn Aufgaben in dem jeweiligen Status existieren -- `availableStatuses` computed from actual tasks, chips filtered by `availableStatuses.has(s)` (lines 192-203, task-filter-bar.tsx line 50-52)
- [ ] SCOPE CHANGE: Spec requires three chips ("Ueberfaellig", "Heute", "Anstehend") but only two are implemented ("Ueberfaellig", "Anstehend"). "Heute" was intentionally removed per user feedback.

#### AC-3: Filter: Pflanze
- [ ] SCOPE CHANGE: Entire plant filter section was intentionally removed per user feedback (commit 77fc4bd). No plant chips, no plant filter state, no plant filter logic exists in the code.

#### AC-4: Kombinierte Filter
- [x] Suche + Statusfilter werden gleichzeitig angewendet (AND-Logik zwischen Filtertypen) -- Both `filteredCareTasks` and `filteredGardenTasks` apply search AND status filters sequentially (lines 208-232)
- [x] Die Anzahl der angezeigten Aufgaben ist sichtbar, wenn ein Filter aktiv ist (z.B. "5 von 12 Aufgaben") -- Rendered as `{filteredCount} von {totalCount} Aufgabe(n)` when `isFilterActive` (task-filter-bar.tsx lines 104-108)
- [ ] SCOPE CHANGE: Plant filter was removed, so the spec's three-way AND (search + status + plant) is now two-way AND (search + status).

#### AC-5: Kein Ergebnis
- [x] Wenn keine Aufgaben den aktiven Filtern entsprechen, erscheint ein "Keine Aufgaben gefunden"-State -- Rendered when `isFilterActive && filteredTotalCount === 0` (lines 519-532)
- [x] Ein "Filter zuruecksetzen"-Button setzt alle Filter (Suche, Status) zurueck -- Button calls `resetFilters()` which clears `searchQuery` and `activeStatuses` (lines 529, 162-165)

#### AC-6: Three-dot-Menue auf Pflanzenpflege-Aufgabenkarten
- [x] Jede Pflanzenpflege-Aufgabenkarte hat ein three-dot-Menue-Icon (Dropdown) -- DropdownMenu with MoreVertical icon on each care task card (PlantGroup, lines 934-956)
- [x] Menue enthaelt: "Bearbeiten" und "Loeschen" -- Two DropdownMenuItems: "Bearbeiten" and "Loeschen" (lines 946-954)
- [x] "Bearbeiten" oeffnet das bestehende CareTaskSheet mit den aktuellen Aufgabendaten zum Bearbeiten -- `handleEditCareTask` sets `editingCareTask` and opens CareTaskSheet with `task` prop mapped to CareTask shape (lines 342-347, 832-844)
- [x] Nach erfolgreichem Bearbeiten wird die Aufgabe in der Liste aktualisiert -- `handleCareEditSuccess` updates the task in-place via `setTasks` (lines 349-366)
- [x] "Loeschen" oeffnet einen Bestaetigungs-Dialog -- `setDeletingCareTask(task)` opens AlertDialog (lines 757-777)
- [x] Nach Bestaetigung wird die Aufgabe geloescht und aus der Liste entfernt -- `handleDeleteCareTask` calls DELETE API and removes from state (lines 368-384)
- [x] Der Abschluss-Button bleibt auf der Karte und funktioniert weiterhin separat vom three-dot-Menue -- Check button is separate from DropdownMenu, uses `onCompleteClick` (lines 891-904)

#### AC-7: Three-dot-Menue auf Garten-Aufgabenkarten (konsistentes UI)
- [x] Garten-Aufgabenkarten erhalten ebenfalls ein three-dot-Menue mit "Bearbeiten" und "Loeschen" -- DropdownMenu with MoreVertical on garden task cards (lines 613-636)
- [x] Klick auf die Karte oeffnet weiterhin das Edit-Sheet (bestehende Funktionalitaet bleibt) -- Card onClick still calls `handleGardenTaskClick` (line 557)
- [x] Das three-dot-Menue bietet eine alternative, explizite Moeglichkeit zum Bearbeiten/Loeschen -- Menu "Bearbeiten" calls same `handleGardenTaskClick`, "Loeschen" opens delete dialog (lines 626-634)

### Edge Cases Status

#### EC-1: Filterstate bei Tab-Wechsel
- [x] Suche und Statusfilter werden zurueckgesetzt wenn der Nutzer zwischen Range-Tabs oder Monats-Buttons wechselt -- `handleRangeChange` and `handleMonthClick` both call `resetFilters()` (lines 167-176)

#### EC-2: Aufgabe nach Edit aus Liste verschwunden
- [ ] BUG: When a care task is edited and the due date moves outside the current time range, the task is NOT automatically removed from the visible list. `handleCareEditSuccess` simply updates the task in-place (line 354-358) without checking if the new `next_due_date` falls within the current range/month. The task will remain visible with the wrong date until the user refreshes or changes the tab. See BUG-1 below.

#### EC-3: Alle Aufgaben einer Pflanze geloescht
- [x] The plant group disappears when all its tasks are removed -- grouping is computed from `filteredCareTasks` via `reduce`, so an empty group is never created (lines 403-416)

#### EC-4: Kein aktiver Status-Chip
- [x] When no status chips are active, all task types are visible (no filter applied) -- `activeStatuses.size === 0` means the status filter block is skipped (lines 216-218)

#### EC-5: Mobile three-dot-Menue und Filter-Chips
- [x] Three-dot-menu uses `h-8 w-8` button size which is sufficiently tappable on mobile (44px equivalent with padding). Filter chips use `px-2.5 py-1` which provides adequate touch targets. Search input is full-width.

#### EC-6: Sehr langer Pflanzename (N/A -- plant chips removed)
- [x] Not applicable since plant filter chips were removed from scope.

### Security Audit Results

#### Authentication
- [x] Care task PUT endpoint (`/api/plants/[id]/care/[taskId]`) verifies `supabase.auth.getUser()` and returns 401 if not authenticated (route.ts lines 58-61)
- [x] Care task DELETE endpoint verifies authentication (route.ts lines 176-179)
- [x] Garden task PUT endpoint verifies authentication (garden-tasks/[id]/route.ts lines 58-61)
- [x] Garden task DELETE endpoint verifies authentication (garden-tasks/[id]/route.ts lines 183-186)

#### Authorization (IDOR Protection)
- [x] Care task PUT: Verifies plant belongs to user (`eq('user_id', user.id)` on plant query, lines 64-69), AND verifies task belongs to user (`.eq('user_id', user.id)` on update, line 115)
- [x] Care task DELETE: Same double-check on plant ownership + task ownership (lines 186-198)
- [x] Garden task PUT: Verifies task belongs to user (`.eq('user_id', user.id)`, line 109)
- [x] Garden task DELETE: Verifies task belongs to user before deletion (lines 190-205)
- [x] No IDOR vulnerabilities found -- all endpoints properly scope queries to the authenticated user

#### Input Validation
- [x] Care task edit: Zod schema validates name (1-100 chars), frequency (enum), date format (YYYY-MM-DD), notes (max 500), months (1-12), custom interval (positive int) with refinement rules
- [x] Garden task edit: Same level of Zod validation with name max 200
- [x] Invalid JSON body returns 400
- [x] Schema validation failure returns 422 with details
- [ ] BUG: No XSS sanitization on task name or notes before storage -- however, React auto-escapes JSX output, so this is mitigated at the rendering layer. Supabase parameterized queries prevent SQL injection. Low risk. See BUG-3 below.

#### Rate Limiting
- [ ] BUG: No rate limiting on DELETE endpoints. A malicious user could rapidly delete all their tasks. However, since the operations are scoped to the authenticated user's own data, this is self-harm only (not affecting other users). See BUG-4 below.

#### Data Exposure
- [x] API responses return only the task data, no sensitive fields leaked
- [x] Error messages are generic, do not expose internal details
- [x] Delete handlers silently fail on error (no error details exposed to client)

#### Client-Side Security
- [x] Filter logic is entirely client-side, no additional API calls made when filtering
- [x] `e.stopPropagation()` used on dropdown triggers and content to prevent click-through on garden task cards (lines 619, 625)

### Bugs Found

#### BUG-1: Edited care task with out-of-range due date remains visible — FIXED
- **Severity:** Medium
- **Fix:** `handleCareEditSuccess` now always calls `fetchTasks(range, selectedMonth)` instead of doing an in-place update. Tasks with an out-of-range due date disappear immediately after edit.
- **Commit:** `eef9eef fix(PROJ-17): Refetch tasks after care task edit to remove out-of-range tasks`

#### BUG-2: Silent failure on delete errors (no user feedback)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Go to /tasks
  2. Click three-dot menu on any task, then "Loeschen", then confirm
  3. If the API returns an error (e.g., network failure), the dialog closes but the task remains
  4. Expected: User sees an error toast or message indicating deletion failed
  5. Actual: Dialog closes silently, task stays in the list. No feedback that anything went wrong.
- **Root Cause:** Both `handleDeleteCareTask` (line 379) and `handleDeleteGardenTask` (line 334) have empty `catch` blocks that silently swallow errors.
- **Priority:** Fix in next sprint

#### BUG-3: No server-side HTML/XSS sanitization on task names and notes
- **Severity:** Low
- **Steps to Reproduce:**
  1. Edit a task and set the name to `<script>alert('xss')</script>` or `<img onerror=alert(1) src=x>`
  2. Save the task
  3. Expected: Input is sanitized before storage
  4. Actual: Raw HTML is stored in the database. However, React's JSX auto-escaping prevents execution at render time.
- **Root Cause:** Zod schemas validate length and format but do not sanitize HTML entities. The risk is mitigated by React's rendering but would be dangerous if data is consumed by non-React clients in the future.
- **Priority:** Nice to have (React mitigates at render layer)

#### BUG-4: No rate limiting on task delete/edit endpoints
- **Severity:** Low
- **Steps to Reproduce:**
  1. Rapidly call DELETE `/api/plants/{id}/care/{taskId}` or `/api/garden-tasks/{id}` in a loop
  2. Expected: Rate limiting kicks in after N requests
  3. Actual: All requests are processed without throttling
- **Root Cause:** No rate limiting middleware on these endpoints. Since operations are user-scoped, impact is limited to self-harm.
- **Priority:** Nice to have

#### BUG-5: Spec not updated to reflect scope changes — FIXED
- **Severity:** Low
- **Fix:** Acceptance criteria updated to reflect intentional scope changes: "Heute" chip removed, plant filter section removed, combined filter reduced to two-way AND (search + status).

### Cross-Browser Assessment (Code Review)
- [x] Chrome: Uses standard shadcn/ui components (Radix UI primitives) -- compatible
- [x] Firefox: No browser-specific APIs used -- compatible
- [x] Safari: No flexbox/grid quirks detected; `date` input type used for date picker which has Safari support

### Responsive Assessment (Code Review)
- [x] 375px (Mobile): Layout uses `flex flex-col` and `flex-wrap` patterns. Filter chips wrap naturally. Three-dot menu button is 32px (h-8 w-8) -- adequate touch target. Header uses `sm:flex-row` breakpoint.
- [x] 768px (Tablet): Standard layout, no issues anticipated
- [x] 1440px (Desktop): Content area respects parent layout. No max-width issues.

### Summary
- **Acceptance Criteria:** 19/23 passed (4 are intentional scope changes, not bugs)
- **Bugs Found:** 5 total (0 critical, 0 high, 1 medium, 4 low)
- **Security:** Pass (all auth/authz checks solid, Zod validation in place, no IDOR vulnerabilities)
- **Production Ready:** CONDITIONAL YES -- Fix BUG-1 (medium: edited task stays visible with out-of-range date) and BUG-5 (update spec) before deployment. The remaining low-severity bugs can be addressed in a follow-up.
- **Recommendation:** Fix BUG-1 and BUG-5, then deploy. Other bugs are nice-to-haves.

## Deployment

- **Deployed:** 2026-03-11
- **Method:** Push to main → Vercel auto-deploy
- **Commits:** `52c11c8` → `eef9eef` (feat + fix commits for PROJ-17)
- **Tag:** `v1.17.0-PROJ-17`
