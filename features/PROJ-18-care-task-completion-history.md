# PROJ-18: Aufgaben-Verlauf (Care Task Completion History)

## Status: Planned
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
