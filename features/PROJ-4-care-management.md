# PROJ-4: Care Management

## Status: In Progress
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
- KI-Vorschläge: OpenAI API (GPT-4o-mini), Prompt enthält Pflanzenname + Art
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
| AI suggestions | OpenAI GPT-4o-mini | PRD requirement, cheap, fast |
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
_To be added by /qa_

## Deployment
_To be added by /deploy_
