# PROJ-7: Garden Dashboard

## Status: Planned
**Created:** 2026-02-27
**Last Updated:** 2026-02-27

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Requires: PROJ-2 (Plant Management) — Pflanzenzahl und Pflanzengesundheit
- Requires: PROJ-4 (Care Management) — Aufgabenstatus und nächste Termine

## User Stories
- Als Nutzer möchte ich eine Dashboard-Übersicht meines gesamten Gartens sehen, sobald ich die App öffne.
- Als Nutzer möchte ich auf einen Blick sehen, wie viele Pflanzen ich habe und welche gerade Pflege benötigen.
- Als Nutzer möchte ich die nächsten anstehenden Aufgaben direkt auf dem Dashboard sehen.
- Als Nutzer möchte ich saisonale Hinweise erhalten, was im Garten gerade zu tun ist.

## Acceptance Criteria
- [ ] Dashboard zeigt: Gesamtzahl Pflanzen, Aufgaben heute fällig, Aufgaben überfällig
- [ ] "Nächste Aufgaben"-Widget: zeigt die 3-5 nächsten Aufgaben mit Pflanzenbild + Aufgabenname + Datum
- [ ] Pflanzengesundheit-Übersicht: visuelle Markierung von Pflanzen mit überfälligen Aufgaben
- [ ] Saisonales Widget: generischer Monatshinweis (z.B. "März: Zeit zum Vorziehen von Tomaten")
- [ ] Quick-Actions: "Pflanze hinzufügen", "Aufgaben ansehen" als prominente Buttons
- [ ] Dashboard spiegelt immer den aktuellen Datenzustand wider
- [ ] Skeleton-Loading während Daten geladen werden

## Edge Cases
- Keine Pflanzen: Einladender Empty-State mit Call-to-Action "Erste Pflanze anlegen"
- Alle Aufgaben erledigt: Positives Feedback ("Alles erledigt! Dein Garten ist happy.")
- Sehr viele Pflanzen (>50): Nur Zusammenfassung, keine vollständige Liste
- Slow-Network: Skeleton-Platzhalter für alle Widgets

## Technical Requirements
- Performance: Dashboard-Daten in < 1 Sekunde laden
- Saisonale Hinweise: statisch in der App hinterlegt (12 Monatstexte), kein API-Aufruf

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
