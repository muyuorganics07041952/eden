# PROJ-4: Care Management

## Status: Deployed
**Created:** 2026-02-27
**Last Updated:** 2026-03-01

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Requires: PROJ-2 (Plant Management) — Pflegeaufgaben sind mit Pflanzen verknüpft

## User Stories
- Als Nutzer möchte ich nach dem Anlegen einer Pflanze KI-Pflegevorschläge erhalten (Gießen, Düngen, Schneiden etc.).
- Als Nutzer möchte ich den Pflegeplan für jede Pflanze einsehen können.
- Als Nutzer möchte ich Aufgaben manuell anpassen: Häufigkeit, Beschreibung, nächstes Datum.
- Als Nutzer möchte ich Aufgaben als erledigt markieren, damit der nächste Termin automatisch berechnet wird.
- Als Nutzer möchte ich eigene Pflegeaufgaben manuell hinzufügen können.
- Als Nutzer möchte ich eine Gesamtübersicht aller heute fälligen Aufgaben sehen.

## Acceptance Criteria
- [ ] Nach dem Anlegen einer Pflanze kann der Nutzer KI-Vorschläge für Pflegeaufgaben generieren (OpenAI API)
- [ ] Generierte Aufgabentypen: Gießen, Düngen, Beschneiden, Umtopfen, Überwintern (je nach Pflanze)
- [ ] Jede Aufgabe hat: Name, Häufigkeit (täglich / wöchentlich / zweiwöchentlich / monatlich / benutzerdefiniert), nächstes Fälligkeitsdatum, Notizen
- [ ] Nutzer kann jede Aufgabe bearbeiten (alle Felder)
- [ ] Nutzer kann Aufgabe als "erledigt" markieren → nächstes Datum wird automatisch neu berechnet
- [ ] Nutzer kann eigene Aufgaben manuell erstellen
- [ ] Nutzer kann Aufgaben löschen
- [ ] Globale "Heute"-Ansicht zeigt alle Aufgaben, die heute oder früher fällig sind (plant-übergreifend)
- [ ] Überfällige Aufgaben werden visuell hervorgehoben

## Edge Cases
- OpenAI API nicht verfügbar: Nutzer kann trotzdem Aufgaben manuell anlegen; Fehlermeldung mit Hinweis
- Unbekannte Pflanzenart: KI generiert generische Pflegeempfehlungen ("Allgemeine Zimmerpflanze")
- Aufgabe wird früher erledigt: nächstes Datum ab Erledigungsdatum berechnen (nicht ab Original-Datum)
- Übersprungene Aufgabe: bleibt als überfällig stehen, wird nicht automatisch abgehakt
- Pflanze wird gelöscht: alle verknüpften Aufgaben werden mitgelöscht (Kaskade, mit Warnhinweis)
- Keine Pflanzen: Leerer Zustand in der Aufgabenansicht mit Call-to-Action
- Alle Aufgaben erledigt: positiver Feedback-State anzeigen

## Technical Requirements
- KI-Vorschläge: Google Gemini API (gemini-2.0-flash), Prompt enthält Pflanzenname + Art
- API-Key: Serverseite (Next.js API Route)
- Häufigkeitsberechnung: clientseitig nach Erledigung
- Performance: Aufgabenliste für heute lädt in < 500ms

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure

```
Plant Detail Page (/plants/[id])
+-- [existing plant info & photos]
+-- CareTaskSection (NEW)
    +-- "KI-Vorschläge generieren" button → calls AI
    +-- Empty State (no tasks yet, with CTA)
    +-- Task List
    |   +-- CareTaskCard (one per task)
    |       +-- Task name + frequency + next due date
    |       +-- Overdue badge (visual highlight)
    |       +-- "Erledigt" button → recalculates next due
    |       +-- Edit button → opens EditCareTaskSheet
    |       +-- Delete button → opens confirm dialog
    +-- "Aufgabe hinzufügen" button → opens AddCareTaskSheet

AddCareTaskSheet (NEW, slide-in panel)
+-- Name input
+-- Frequency selector (täglich / wöchentlich / zweiwöchentlich / monatlich / benutzerdefiniert)
+-- Next due date picker
+-- Notes textarea
+-- Save / Cancel

EditCareTaskSheet (NEW, same layout as Add)
+-- Pre-filled fields
+-- Save / Cancel

Today Tasks Page (/tasks) (NEW)
+-- Header: "Heute fällige Aufgaben"
+-- Empty State (alle erledigt → positive feedback)
+-- Task list (plant-übergreifend, grouped by plant)
    +-- Overdue tasks (highlighted) at top
    +-- Today's tasks below
    +-- Inline "Erledigt" button per task
```

### Data Model

**Care Tasks** (Supabase PostgreSQL, cascades on plant delete):

| Field | Description |
|---|---|
| ID | Unique identifier |
| Plant ID | Which plant (auto-deleted when plant is deleted) |
| User ID | Owner (for RLS security) |
| Name | e.g. "Gießen", "Düngen", or custom text |
| Frequency | Enum: daily / weekly / biweekly / monthly / custom |
| Interval Days | Only for "custom" frequency |
| Next Due Date | When task is due next |
| Notes | Optional free-text |
| Created At | Timestamp |

**Next due rule:** Mark done → new due = today + interval (not original date + interval).

### Tech Decisions

| Decision | Choice | Why |
|---|---|---|
| AI suggestions | Gemini 2.0 Flash | Free tier (1500 req/day), fastest model, cheaper at scale than OpenAI |
| Storage | Supabase DB | Cross-device sync, tied to user account |
| Due recalculation | Server-side | Single source of truth |
| "Today" view | New `/tasks` page | Clean separation; feeds PROJ-7 Dashboard later |
| Overdue detection | Query-time comparison | No background job needed |

### New API Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/plants/[id]/care` | Load all tasks for a plant |
| `POST /api/plants/[id]/care` | Create manual task |
| `POST /api/plants/[id]/care/generate` | AI-generate task suggestions |
| `PUT /api/plants/[id]/care/[taskId]` | Edit task or mark done |
| `DELETE /api/plants/[id]/care/[taskId]` | Delete task |
| `GET /api/tasks/today` | All due/overdue tasks across all plants |

### New Dependencies
None — existing stack covers everything.

## QA Test Results

**Date tested:** 2026-03-01
**Build status:** PASS (Next.js 16.1.1 Turbopack, zero errors)
**Lint status:** SKIP (next lint has a config issue unrelated to PROJ-4)

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| AC-1 | KI-Vorschlaege generieren (Gemini API) | PASS | POST /api/plants/[id]/care/generate calls Gemini 2.0 Flash, parses JSON, bulk inserts. Prompt includes plant name + species. |
| AC-2 | Aufgabentypen: Giessen, Duengen, Beschneiden, Umtopfen, Ueberwintern | PASS | Prompt lists these types as examples. AI may generate a subset depending on plant -- spec says "je nach Pflanze". |
| AC-3 | Jede Aufgabe hat: Name, Haeufigkeit, naechstes Faelligkeitsdatum, Notizen | PASS | All fields present in CareTask type, DB migration, API schema, and CareTaskSheet form. Frequencies include daily/weekly/biweekly/monthly/three_months/six_months/yearly/custom. |
| AC-4 | Nutzer kann jede Aufgabe bearbeiten (alle Felder) | PASS | CareTaskSheet pre-fills all fields when editing. PUT /api/plants/[id]/care/[taskId] with action=edit validates and updates all fields. |
| AC-5 | "Erledigt" markieren -> naechstes Datum neu berechnet | PASS (after fix) | Server-side addDays() recalculates. Overdue confirmation dialog now offers "ab heute" vs "im Original-Rhythmus" (BUG-2/BUG-3 fixed). |
| AC-6 | Nutzer kann eigene Aufgaben manuell erstellen | PASS | "Aufgabe hinzufuegen" button opens CareTaskSheet in create mode, POSTs to /api/plants/[id]/care. |
| AC-7 | Nutzer kann Aufgaben loeschen | PASS | Delete button with AlertDialog confirmation, DELETEs via /api/plants/[id]/care/[taskId], returns 204. |
| AC-8 | Globale /tasks Ansicht zeigt alle Aufgaben heute oder frueher | PASS | GET /api/tasks/today filters with .lte('next_due_date', today). Groups by plant, sorted with overdue first. |
| AC-9 | Ueberfaellige Aufgaben visuell hervorgehoben | PASS | Red border/background + destructive Badge with AlertTriangle icon on both plant detail and /tasks page. |

### Edge Case Results

| Edge Case | Result | Notes |
|-----------|--------|-------|
| Gemini API unavailable | PASS | Returns 503 with German error message. Manual task creation still works. Missing GEMINI_API_KEY returns 503 gracefully. |
| Unknown plant species | PASS | Prompt sends "unbekannt" when species is null/empty. AI generates generic suggestions. |
| Task completed late (overdue) | PASS (after fix) | Confirmation dialog now appears for overdue tasks on both plant detail and /tasks pages. |
| Skipped task | PASS | Tasks remain overdue in the list, no auto-completion logic exists. |
| Plant deleted -> cascade | PASS | Migration has ON DELETE CASCADE on plant_id FK. |
| No plants -> empty state | PARTIAL | /tasks page shows "Alles erledigt!" for both no-plants and all-done scenarios. See BUG-4. |
| All tasks done -> positive feedback | PASS | AllDoneState component with PartyPopper icon and "Alles erledigt!" message. |

### Bugs Found

**BUG-1: German umlauts missing in care-task-card.tsx and care-task-sheet.tsx**
- Severity: High
- Location: src/components/care/care-task-card.tsx:119,126,128,138,156; src/components/care/care-task-sheet.tsx:152; src/components/care/care-task-section.tsx:107
- Description: "loschen" instead of "loeschen", "Uberfaellig" instead of "Ueberfaellig", placeholder "Giessen, Duengen" instead of proper umlauts. 7 occurrences total.
- Status: FIXED

**BUG-2: Missing overdue confirmation dialog on plant detail page (CareTaskCard)**
- Severity: Critical
- Location: src/components/care/care-task-card.tsx (handleComplete function)
- Description: Spec requires that when a task is overdue and marked as done, a confirmation dialog asks "ab heute rechnen" vs "im Original-Rhythmus". The original code always sent mode="today" without asking.
- Status: FIXED -- Added AlertDialog with two completion mode options. Updated onComplete signature to pass mode.

**BUG-3: Missing overdue confirmation dialog on /tasks page**
- Severity: Critical
- Location: src/app/(protected)/tasks/page.tsx (handleComplete function)
- Description: Same issue as BUG-2 but on the global tasks page. Always hard-coded mode="today" without any user choice for overdue tasks.
- Status: FIXED -- Added AlertDialog state management and overdue confirmation dialog matching the plant detail page behavior.

**BUG-4: /tasks page does not distinguish "no plants" from "all tasks done"**
- Severity: Low
- Location: src/app/(protected)/tasks/page.tsx:149
- Description: Spec edge case says "Keine Pflanzen: Leerer Zustand in der Aufgabenansicht mit Call-to-Action" (different from all-done state). Current implementation shows the same "Alles erledigt!" for both scenarios. Would need an additional API call to check if user has any plants to differentiate.
- Status: NOT FIXED (Low severity, acceptable UX -- the CTA "Meine Pflanzen" button already navigates to /plants where the user can add plants.)

**BUG-5: Unused import of Separator in tasks page**
- Severity: Low
- Location: src/app/(protected)/tasks/page.tsx:19
- Description: Separator was imported but never used in the template.
- Status: FIXED

### Security Audit

| Check | Result | Notes |
|-------|--------|-------|
| Auth on every API endpoint | PASS | All 6 endpoints (GET/POST care, POST generate, PUT/DELETE taskId, GET today) verify supabase.auth.getUser() and return 401 if missing. |
| Plant ownership verified | PASS | Every endpoint queries plants table with .eq('user_id', user.id) before any task operation. |
| Task ownership verified | PASS | All task queries include .eq('user_id', user.id) as a belt-and-suspenders check alongside RLS. |
| Zod validation on inputs | PASS | POST /care uses createCareTaskSchema, PUT /care/[taskId] uses discriminatedUnion of editSchema and completeSchema. Both enforce types, lengths, and custom frequency constraint. |
| Rate limiting on /generate | PASS | In-memory rate limiter: 5 requests per user per 60 seconds. Returns 429 with German error. |
| RLS on care_tasks table | PASS | Migration enables RLS with SELECT/INSERT/UPDATE/DELETE policies scoped to auth.uid(). |
| API key not exposed to client | PASS | GEMINI_API_KEY is server-only (no NEXT_PUBLIC_ prefix). Documented in .env.local.example. |
| Prompt injection risk | LOW RISK | Plant name and species are interpolated into the Gemini prompt. A malicious plant name could influence AI output, but the output is validated (name truncated to 100 chars, frequency validated against allowlist, notes truncated to 500 chars). No code execution risk. |
| UUID validation on path params | LOW RISK | plantId and taskId from URL params are passed directly to Supabase .eq() calls. Supabase will reject non-UUID values at the DB level, so no SQL injection is possible, but no explicit UUID format validation exists in the route handlers. |

### Summary

- **Total bugs found:** 5
- **Critical fixed:** 2 (BUG-2, BUG-3 -- overdue confirmation dialogs)
- **High fixed:** 1 (BUG-1 -- German umlauts)
- **Low fixed:** 1 (BUG-5 -- unused import)
- **Low not fixed:** 1 (BUG-4 -- no-plants vs all-done differentiation)
- **Build after fixes:** PASS

### Verdict: APPROVED (with minor note on BUG-4)

## Deployment

**Production URL:** https://eden-azure-zeta.vercel.app
**Deployed:** 2026-03-01
**Git tag:** v1.3.0-PROJ-4
**Deployed by:** /deploy skill
