# PROJ-9: Care Management Improvements

## Status: Planned
**Created:** 2026-03-01

## Dependencies
- Requires: PROJ-4 (Care Management)

## Background
Verbesserungen an PROJ-4 basierend auf Nutzer-Feedback nach dem ersten produktiven Einsatz.

---

## Improvement 1: Tasks-Filter (Monat / Woche / Tag)

### User Story
Als Nutzer möchte ich auf der Aufgaben-Seite (/tasks) zwischen verschiedenen Zeiträumen filtern können, damit ich nicht von allen überfälligen Aufgaben überwältigt werde.

### Acceptance Criteria
- [ ] Filter-Optionen: "Dieser Monat", "Diese Woche", "Heute"
- [ ] Standard: "Dieser Monat" (zeigt alle Aufgaben fällig bis Ende des aktuellen Monats)
- [ ] Filter ist persistent während der Session (nicht nach Reload)
- [ ] Überfällige Aufgaben werden immer angezeigt, unabhängig vom Filter
- [ ] Filter-Auswahl ist visuell klar erkennbar (aktiver Zustand)

### Technical Notes
- API `GET /api/tasks/today` muss erweitert werden um einen `range`-Parameter: `today` | `week` | `month`
- Query-Änderung: statt `lte(today)` → `lte(endOfRange)` je nach Filter
- Frontend: Filter-Buttons (shadcn Tabs oder ToggleGroup) über der Aufgabenliste

---

## Improvement 2: KI-Vorschläge einzeln übernehmen

### User Story
Als Nutzer möchte ich KI-Pflegevorschläge einzeln prüfen und nur die gewünschten Aufgaben übernehmen, damit ich Kontrolle über meinen Pflegeplan habe.

### Current Behavior
KI generiert 3-5 Aufgaben → alle werden sofort in die Datenbank gespeichert.

### Desired Behavior
KI generiert 3-5 Vorschläge → werden als **Vorschau-Liste** angezeigt (noch nicht gespeichert) → Nutzer klickt "Übernehmen" pro Aufgabe → Aufgabe wird gespeichert und aus der Vorschau entfernt → Nutzer kann einzelne Vorschläge ablehnen (X-Button).

### Acceptance Criteria
- [ ] KI-Vorschläge werden zunächst als Vorschau-Liste angezeigt (nicht direkt gespeichert)
- [ ] Jeder Vorschlag hat einen "Übernehmen"-Button → speichert die Aufgabe, entfernt sie aus der Vorschau
- [ ] Jeder Vorschlag hat einen "Ablehnen"-Button (X) → entfernt ihn aus der Vorschau ohne zu speichern
- [ ] "Alle übernehmen"-Button speichert alle verbleibenden Vorschläge auf einmal
- [ ] Wenn alle Vorschläge übernommen oder abgelehnt wurden → Vorschau verschwindet
- [ ] Bereits vorhandene Aufgaben werden nicht erneut vorgeschlagen (Duplikat-Check nach Name)

### Technical Notes
- API `/api/plants/[id]/care/generate` gibt Vorschläge zurück ohne sie zu speichern (neues Verhalten)
- Vorschläge werden nur im Client-State gehalten (kein neuer DB-Table nötig)
- Neuer UI-State in `CareTaskSection`: `suggestions: GeminiTask[]`
- "Übernehmen" ruft `POST /api/plants/[id]/care` für einzelne Aufgabe auf
- "Alle übernehmen" ruft für jede Aufgabe einzeln die bestehende API auf (oder neuer Bulk-Endpoint)
