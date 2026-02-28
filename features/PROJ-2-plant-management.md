# PROJ-2: Plant Management

## Status: Planned
**Created:** 2026-02-27
**Last Updated:** 2026-02-28

## Dependencies
- Requires: PROJ-1 (User Authentication) — Pflanzen sind nutzergebunden

## User Stories
- Als Nutzer möchte ich eine neue Pflanze mit Name, Art und Standort anlegen, damit ich meinen Garten dokumentiere.
- Als Nutzer möchte ich bis zu 5 Fotos pro Pflanze hochladen, damit ich den Zustand der Pflanze festhalten kann.
- Als Nutzer möchte ich alle meine Pflanzen in einer Übersicht sehen, damit ich schnell den Überblick habe.
- Als Nutzer möchte ich Pflanzendaten bearbeiten können, wenn sich etwas ändert (z.B. Standort, Notizen).
- Als Nutzer möchte ich eine Pflanze löschen können, wenn ich sie nicht mehr habe.
- Als Nutzer möchte ich ein Hauptfoto für die Pflanzenkarte festlegen können.

## Acceptance Criteria
- [ ] Nutzer kann eine Pflanze anlegen mit: Name (Pflichtfeld), Art/Gattung, Standort im Garten, Pflanzdatum, Notizen
- [ ] Nutzer kann bis zu 5 Fotos pro Pflanze hochladen (Supabase Storage)
- [ ] Nutzer kann ein Hauptfoto (Cover) festlegen, das auf der Karte angezeigt wird
- [ ] Pflanzen werden in einer Card-Grid-Ansicht dargestellt (Bild + Name + Art)
- [ ] Nutzer kann die Liste sortieren: Zuletzt hinzugefügt / Alphabetisch (Sortier-Dropdown)
- [ ] Nutzer kann alle Felder einer Pflanze bearbeiten
- [ ] Nutzer kann eine Pflanze löschen (mit Bestätigungs-Dialog) — Fotos werden sofort mitgelöscht
- [ ] Leerer Zustand (keine Pflanzen): freundliche Empty-State-Ansicht mit Call-to-Action
- [ ] Pflanzenliste ist nur für eingeloggte Nutzer sichtbar

## Edge Cases
- Foto-Upload schlägt fehl: Fehlermeldung anzeigen, Retry ermöglichen
- Sehr große Fotos (>5 MB): Hinweis auf Größenlimit oder clientseitige Komprimierung
- Pflanze mit aktiven Pflegeaufgaben löschen: Warnung anzeigen, Kaskaden-Löschung der Aufgaben
- Pflanze ohne Foto: Platzhalter-Bild anzeigen
- Mehr als 5 Fotos: Upload-Button deaktivieren und Hinweis anzeigen
- Sehr langer Pflanzenname: UI bricht nicht, Text wird abgeschnitten (Tooltip/Titel)

## Technical Requirements
- Fotos: Supabase Storage, Bucket pro User isoliert (RLS)
- Max. Dateigröße: 5 MB pro Foto
- Unterstützte Formate: JPEG, PNG, WebP
- Performance: Pflanzenliste lädt in < 1 Sekunde bei bis zu 50 Pflanzen

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
