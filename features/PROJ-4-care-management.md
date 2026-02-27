# PROJ-4: Care Management

## Status: Planned
**Created:** 2026-02-27
**Last Updated:** 2026-02-27

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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
