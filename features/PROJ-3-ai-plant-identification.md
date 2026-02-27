# PROJ-3: AI Plant Identification

## Status: Planned
**Created:** 2026-02-27
**Last Updated:** 2026-02-27

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Requires: PROJ-2 (Plant Management) — Identifikation führt zu Pflanzenerstellung

## User Stories
- Als Nutzer möchte ich ein Foto meiner Pflanze aufnehmen oder hochladen und die App soll mir sagen, um welche Pflanze es sich handelt.
- Als Nutzer möchte ich die Top-3 Vorschläge der KI mit Konfidenzwert sehen, damit ich die richtige Pflanze auswählen kann.
- Als Nutzer möchte ich einen Vorschlag auswählen und damit das Pflanzenerstellungsformular automatisch ausfüllen lassen.
- Als Nutzer möchte ich den KI-Vorschlag manuell korrigieren können, wenn er falsch ist.

## Acceptance Criteria
- [ ] Nutzer kann im Pflanzenerstellungsflow ein Foto zur Identifikation einreichen
- [ ] Foto wird an Plant.id API gesendet
- [ ] App zeigt die Top 3 Vorschläge mit: Pflanzenname (deutsch + lateinisch), Konfidenzwert (in %)
- [ ] Nutzer kann einen Vorschlag auswählen → füllt im Formular vor: Name, Art/Gattung, kurze Beschreibung
- [ ] Nutzer kann Vorschlag ablehnen → manuelle Eingabe bleibt möglich
- [ ] Wenn API nicht verfügbar: Fehlermeldung + Fallback zur manuellen Eingabe
- [ ] Identifikationsergebnis kann nach Auswahl manuell überschrieben werden
- [ ] Ladeindikator während API-Anfrage

## Edge Cases
- Keine Pflanze erkannt (Konfidenz < 10%): Meldung "Keine Pflanze erkannt" + Möglichkeit zur manuellen Eingabe
- Sehr niedriger Konfidenzwert (< 30%): Ergebnisse mit Hinweis "Unsicheres Ergebnis" anzeigen
- API-Rate-Limit überschritten: nutzerfreundliche Fehlermeldung ohne technische Details
- Schlechte Fotoqualität: Hinweis "Bitte klares Foto aufnehmen" + Möglichkeit, Foto zu wechseln
- Exotische Pflanze nicht in Datenbank: ähnlichste Pflanze vorschlagen mit entsprechendem Hinweis
- Netzwerkfehler während Upload: Retry-Option anbieten
- Foto ist kein Pflanzenbild (z.B. Tier, Landschaft): API gibt Fehler → Hinweis und manuelle Eingabe

## Technical Requirements
- API: Plant.id (https://plant.id) oder vergleichbarer Dienst
- API-Key: Serverseite (Next.js API Route), nie im Browser
- Max. Bildgröße für API-Anfrage: 1 MB (ggf. clientseitig komprimieren)
- Timeout: 10 Sekunden, danach Fehlermeldung
- Ergebnisse werden NICHT gecacht (jedes Foto ist einzigartig)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
