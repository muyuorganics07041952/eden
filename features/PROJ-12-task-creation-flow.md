# PROJ-12: Task Creation Flow

## Status: Planned
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
