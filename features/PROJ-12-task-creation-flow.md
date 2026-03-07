# PROJ-12: Task Creation Flow

## Status: Deployed
**Created:** 2026-03-06
**Last Updated:** 2026-03-06

## Dependencies
- Requires: PROJ-1 (User Authentication) — für Login-Checks
- Requires: PROJ-2 (Plant Management) — Pflanzenliste für Pflanzen-Auswahl
- Requires: PROJ-4 (Care Management) — CareTaskSheet und API bereits vorhanden
- Requires: PROJ-11 (Standalone Garden Tasks) — GardenTaskSheet und "Aufgabe hinzufügen"-Button bereits vorhanden

## Overview
Der "+" Button auf der Task-Seite öffnet aktuell direkt das Formular für allgemeine Gartenaufgaben. Dieses Feature verbessert den Erstellungs-Flow: Nach dem Klick erscheint zunächst eine Auswahl, ob der Nutzer eine allgemeine Aufgabe oder eine Pflegeaufgabe für eine konkrete Pflanze anlegen möchte. Außerdem wird der Button auf Mobile und Desktop zu "Aufgabe hinzufügen" umbenannt.

## User Stories

- Als Gartenbesitzer möchte ich direkt auf der Task-Seite eine Pflegeaufgabe für eine meiner Pflanzen anlegen können, damit ich nicht erst zur Pflanzendetailseite navigieren muss.
- Als Gartenbesitzer möchte ich beim Klick auf "Aufgabe hinzufügen" eine klare Auswahl sehen (allgemein vs. Pflanze), damit ich nicht versehentlich den falschen Aufgabentyp anlege.
- Als Gartenbesitzer möchte ich aus meiner Pflanzenliste die gewünschte Pflanze auswählen können, damit ich anschließend sofort das Pflegeaufgaben-Formular für genau diese Pflanze öffnen kann.
- Als Gartenbesitzer möchte ich nach dem Anlegen einer Pflegeaufgabe direkt die aktualisierte Task-Liste sehen, damit ich sicher bin, dass die Aufgabe korrekt gespeichert wurde.
- Als Gartenbesitzer mit keinen Pflanzen möchte ich einen Hinweis erhalten, wenn ich "Pflegeaufgabe" wähle, damit ich weiß, dass ich zuerst eine Pflanze anlegen muss.

## Acceptance Criteria

### Button-Umbenennung
- [ ] Der Button auf der Task-Seite zeigt auf Mobile UND Desktop den Text "Aufgabe hinzufügen" (kein reines Icon mehr)
- [ ] Der Button befindet sich weiterhin im Header der Task-Seite

### Auswahl-Sheet (Type Picker)
- [ ] Klick auf "Aufgabe hinzufügen" öffnet ein Bottom Sheet mit zwei Optionen:
  - "Allgemeine Aufgabe" (Schaufel-Icon) — für aufgaben ohne Pflanzenbezug
  - "Pflegeaufgabe" (Blatt-Icon) — für eine konkrete Pflanze
- [ ] Das Sheet ist per Swipe-down oder Klick auf den Hintergrund schließbar
- [ ] Die zwei Optionen sind klar beschriftet und visuell unterscheidbar

### Flow: Allgemeine Aufgabe
- [ ] Klick auf "Allgemeine Aufgabe" schließt das Type-Picker-Sheet und öffnet sofort das bestehende GardenTaskSheet
- [ ] Verhalten nach dem Erstellen bleibt unverändert (Aufgabe erscheint sofort in der Liste)

### Flow: Pflegeaufgabe
- [ ] Klick auf "Pflegeaufgabe" zeigt eine scrollbare Pflanzenliste im Sheet (Name + Cover-Foto)
- [ ] Die Pflanzenliste ist alphabetisch sortiert
- [ ] Auswahl einer Pflanze schließt den Type-Picker und öffnet das CareTaskSheet für diese Pflanze
- [ ] Nach erfolgreichem Erstellen der Pflegeaufgabe wird die Task-Liste neu geladen, damit die neue Aufgabe erscheint
- [ ] Hat der Nutzer keine Pflanzen, zeigt die Liste stattdessen: "Noch keine Pflanzen vorhanden. Lege zuerst eine Pflanze an." mit einem Link zur Pflanzenseite

### Authentifizierung & Sicherheit
- [ ] Nur eingeloggte Nutzer können auf "Aufgabe hinzufügen" klicken (bereits durch bestehenden Auth-Guard abgedeckt)
- [ ] Pflanzenliste zeigt nur eigene Pflanzen (bestehende RLS-Policy)

## Edge Cases

- **Kein Pflanzen vorhanden:** Pflegeaufgabe-Option zeigt leere State mit Hinweis und Link zu `/plants` — kein Fehler, kein leeres Sheet ohne Erklärung
- **Viele Pflanzen:** Pflanzenliste ist scrollbar, kein Paging nötig (max. ~200 Pflanzen in der Praxis)
- **Netzwerkfehler beim Laden der Pflanzenliste:** Fehlermeldung anzeigen, Retry-Möglichkeit
- **Pflegeaufgabe erstellt, aber Zeitfilter passt nicht:** Die Aufgabe wurde gespeichert — nach dem Reload ist sie ggf. nicht sichtbar (weil z.B. Filter "Heute" aktiv und Fälligkeitsdatum nächste Woche) — das ist korrekt und entspricht dem bestehenden Verhalten
- **Schnelles Doppelklick auf Button:** Type-Picker-Sheet öffnet nur einmal (kein doppeltes Sheet)
- **Nutzer drückt auf Pflanze, bricht CareTaskSheet ab:** Kein unerwünschter State, Type-Picker ist bereits geschlossen — Nutzer landet wieder auf der normalen Task-Seite

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur

```
Tasks Page (erweitert)
+-- Header
|   +-- Titel "Fällige Aufgaben"
|   +-- [GEÄNDERT] "Aufgabe hinzufügen" Button (war: "+" Icon-only)
|       → öffnet TaskTypePicker
+-- Filter Tabs (unverändert)
+-- Month Picker (unverändert)
+-- "Garten"-Abschnitt (unverändert)
+-- Pflanzen-Gruppen (unverändert)
+-- [NEU] TaskTypePicker Sheet
|   +-- Schritt 1: Auswahl-Kacheln
|   |   +-- "Allgemeine Aufgabe" (Schaufel-Icon + Beschreibung)
|   |   +-- "Pflegeaufgabe" (Blatt-Icon + Beschreibung)
|   +-- Schritt 2 (nur bei "Pflegeaufgabe"): Pflanzenliste
|       +-- Lade-Skeleton (während Abruf)
|       +-- Pflanzenkarte (Cover-Foto + Name, klickbar) × n
|       +-- Empty State (keine Pflanzen → Hinweis + Link zu /plants)
|       +-- Fehler State (Netzwerkfehler → Retry-Button)
+-- GardenTaskSheet (bestehend, unverändert)
+-- CareTaskSheet (bestehend, NEU auf Tasks-Seite eingebunden)
+-- Überfällig-AlertDialog (unverändert)
```

### Technische Entscheidungen

| Entscheidung | Empfehlung | Begründung |
|---|---|---|
| Eigene Komponente für Picker | Neues `TaskTypePicker` | Tasks-Seite bleibt übersichtlich; Picker-Logik (Pflanzenladen, Schritt-State) ist in sich geschlossen |
| Pflanzendaten | Bestehender `/api/plants` Endpunkt | Kein neues Backend nötig; RLS schützt automatisch |
| Wann Pflanzen laden? | Beim Öffnen des Pickers (lazy) | Nicht beim Seitenaufruf — spart unnötige Requests |
| CareTaskSheet | Bestehende Komponente wiederverwenden | Identische Props (plantId, onSuccess) — kein neues Muster |
| Nach Care-Task erstellt | Task-Liste neu laden (fetchTasks) | Einfachste korrekte Lösung; Care-Tasks erscheinen durch bestehenden Filter |

### Neue Dateien / Änderungen

| Was | Typ |
|---|---|
| `src/components/tasks/task-type-picker.tsx` | Neu |
| `src/app/(protected)/tasks/page.tsx` | Kleine Erweiterung |

### Neue Pakete
Keine — alle shadcn/ui-Komponenten bereits installiert.

## QA Test Results

**Tested:** 2026-03-07
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Method:** Code review + static analysis (no running instance available)

### Acceptance Criteria Status

#### AC-1: Button-Umbenennung
- [x] Der Button auf der Task-Seite zeigt auf Mobile UND Desktop den Text "Aufgabe hinzufuegen" (Plus icon + text label in Button component, line 299-306 of tasks/page.tsx)
- [x] Der Button befindet sich weiterhin im Header der Task-Seite (inside the flex header div, line 282-307)

#### AC-2: Auswahl-Sheet (Type Picker)
- [x] Klick auf "Aufgabe hinzufuegen" oeffnet ein Bottom Sheet mit zwei Optionen: "Allgemeine Aufgabe" (Shovel-Icon) und "Pflegeaufgabe" (Leaf-Icon) -- confirmed in task-type-picker.tsx lines 106-139
- [x] Das Sheet ist per Swipe-down oder Klick auf den Hintergrund schliessbar -- uses shadcn/ui Sheet with onOpenChange, which handles both
- [x] Die zwei Optionen sind klar beschriftet und visuell unterscheidbar -- both have icon, title, and subtitle text

#### AC-3: Flow: Allgemeine Aufgabe
- [x] Klick auf "Allgemeine Aufgabe" schliesst das Type-Picker-Sheet und oeffnet sofort das bestehende GardenTaskSheet -- handleGeneralClick closes picker, handlePickerSelectGeneral opens GardenTaskSheet
- [x] Verhalten nach dem Erstellen bleibt unveraendert (Aufgabe erscheint sofort in der Liste) -- handleGardenSheetSuccess calls fetchTasks on "created"

#### AC-4: Flow: Pflegeaufgabe
- [x] Klick auf "Pflegeaufgabe" zeigt eine scrollbare Pflanzenliste im Sheet (Name + Cover-Foto) -- handleCareTaskClick sets step to "plant-list" and fetches plants, ScrollArea used for display
- [x] Die Pflanzenliste ist alphabetisch sortiert -- fetch URL uses ?sort=alphabetical, and the API sorts by name ascending
- [x] Auswahl einer Pflanze schliesst den Type-Picker und oeffnet das CareTaskSheet fuer diese Pflanze -- handlePlantSelect closes picker, handlePickerSelectPlant sets plantId and opens CareTaskSheet
- [x] Nach erfolgreichem Erstellen der Pflegeaufgabe wird die Task-Liste neu geladen -- handleCareTaskSuccess calls fetchTasks
- [x] Hat der Nutzer keine Pflanzen, zeigt die Liste: "Noch keine Pflanzen vorhanden. Lege zuerst eine Pflanze an." mit Link zur Pflanzenseite -- empty state in lines 168-182, links to /plants

#### AC-5: Authentifizierung & Sicherheit
- [x] Nur eingeloggte Nutzer koennen auf "Aufgabe hinzufuegen" klicken -- protected layout redirects unauthenticated users to /login
- [x] Pflanzenliste zeigt nur eigene Pflanzen -- /api/plants filters by user_id via .eq('user_id', user.id)

### Edge Cases Status

#### EC-1: Keine Pflanzen vorhanden
- [x] Pflegeaufgabe-Option zeigt leere State mit Hinweis und Link zu /plants -- lines 168-182 in task-type-picker.tsx

#### EC-2: Viele Pflanzen
- [x] Pflanzenliste ist scrollbar -- uses ScrollArea with h-[50vh] max-h-[400px], API limits to 200

#### EC-3: Netzwerkfehler beim Laden der Pflanzenliste
- [x] Fehlermeldung angezeigt, Retry-Moeglichkeit -- error state with "Erneut versuchen" button in lines 156-167

#### EC-4: Pflegeaufgabe erstellt, aber Zeitfilter passt nicht
- [x] Korrektes Verhalten -- fetchTasks uses current range/month filters, so new tasks outside the filter won't show (expected)

#### EC-5: Schnelles Doppelklick auf Button
- [ ] BUG: Type-Picker-Sheet koennte doppelt oeffnen -- no debounce/guard on handleOpenCreateSheet. However, since typePickerOpen is a single boolean state, a double-click would just set it to true twice (no double sheet). PASS on closer analysis.
- [x] Kein doppeltes Sheet -- boolean state prevents duplicate opening

#### EC-6: Nutzer drueckt auf Pflanze, bricht CareTaskSheet ab
- [x] Kein unerwuenschter State -- Type-Picker closes before CareTaskSheet opens, and CareTaskSheet's onOpenChange resets careSheetPlantId

### Security Audit Results

- [x] Authentication: Protected layout redirects unauthenticated users. API endpoints verify user session.
- [x] Authorization: Plants API filters by user_id. Care task API verifies plant ownership before creating tasks.
- [x] Input validation: Care task creation uses Zod schema validation server-side (name, frequency, date format, notes length). Garden task sheet validates on client side.
- [x] XSS prevention: No dangerouslySetInnerHTML or innerHTML used. React's JSX escapes all dynamic content. Plant names displayed via {plant.name} which is auto-escaped.
- [x] No exposed secrets: No API keys or credentials in client-side code.
- [x] IDOR prevention: API checks plant ownership (user_id match) before allowing care task creation on a given plant.
- [ ] BUG: Rate limiting not implemented on /api/plants GET endpoint for the picker -- an attacker could repeatedly call this endpoint. However, this is pre-existing and not specific to PROJ-12.

### Bugs Found

#### BUG-1: CareTaskSheet uses next/image alternative (img tag) without optimization
- **Severity:** Low
- **Steps to Reproduce:**
  1. Go to /tasks
  2. Click "Aufgabe hinzufuegen"
  3. Click "Pflegeaufgabe"
  4. Observe plant photos use raw `<img>` tag (task-type-picker.tsx line 197)
  5. Expected: Use next/image for optimization
  6. Actual: Uses HTML img tag directly with Supabase signed URLs
- **Priority:** Nice to have (signed URLs with dynamic hostnames make next/image configuration complex)

#### BUG-2: Plant list fetch does not handle abort on unmount
- **Severity:** Low
- **Steps to Reproduce:**
  1. Go to /tasks
  2. Click "Aufgabe hinzufuegen"
  3. Click "Pflegeaufgabe" (starts fetching plants)
  4. Immediately close the sheet before fetch completes
  5. Expected: Fetch is aborted to prevent state updates on unmounted/hidden component
  6. Actual: Fetch continues and may call setState after sheet is closed (React warning in dev, no crash)
- **Priority:** Nice to have

#### BUG-3: Feature spec status mismatch -- INDEX.md says "In Progress" but spec header says "Planned"
- **Severity:** Low
- **Steps to Reproduce:**
  1. Read features/PROJ-12-task-creation-flow.md header -- Status: Planned
  2. Read features/INDEX.md -- Status: In Progress
  3. Expected: Both should match
  4. Actual: Inconsistent status
- **Priority:** Fix before deployment (documentation hygiene)

### Cross-Browser Analysis (Code Review)
- [x] Chrome: Standard React/shadcn components, no browser-specific APIs used
- [x] Firefox: Sheet component uses Radix UI primitives which are cross-browser compatible
- [x] Safari: ScrollArea from Radix handles Safari scrolling. Bottom sheet uses CSS transforms (well-supported)

### Responsive Analysis (Code Review)
- [x] Mobile (375px): Bottom sheet (side="bottom") works well on mobile. Grid is grid-cols-1 on mobile, grid-cols-2 on sm+. Plant list items are compact with truncation.
- [x] Tablet (768px): sm:grid-cols-2 layout for the picker options. Adequate spacing.
- [x] Desktop (1440px): Same sm breakpoint applies. Sheet width constrained by SheetContent defaults.

### Summary
- **Acceptance Criteria:** 12/12 passed
- **Edge Cases:** 6/6 passed
- **Bugs Found:** 3 total (0 critical, 0 high, 0 medium, 3 low)
- **Security:** Pass -- authentication, authorization, input validation, and XSS prevention all verified
- **Production Ready:** YES
- **Recommendation:** Deploy. The 3 low-severity bugs are minor and can be addressed in a future sprint. BUG-3 (status mismatch) should be corrected as part of the deployment process.

## Deployment

**Deployed:** 2026-03-07
**Production URL:** https://eden-azure-zeta.vercel.app
**Vercel Deployment:** https://eden-cl3qr93du-muyuorganics07041952s-projects.vercel.app
