# PROJ-5: Reminders & Push Notifications

## Status: Planned
**Created:** 2026-02-27
**Last Updated:** 2026-02-27

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Requires: PROJ-4 (Care Management) — Benachrichtigungen basieren auf fälligen Aufgaben

## User Stories
- Als Nutzer möchte ich Push-Benachrichtigungen erhalten, wenn Pflegeaufgaben fällig sind.
- Als Nutzer möchte ich die tägliche Erinnerungszeit selbst festlegen (z.B. 8:00 Uhr).
- Als Nutzer möchte ich Push-Benachrichtigungen in den Einstellungen aktivieren und deaktivieren können.
- Als Nutzer möchte ich durch Tippen auf die Benachrichtigung direkt zur Aufgabenliste gelangen.

## Acceptance Criteria
- [ ] Nutzer wird beim ersten Anlegen einer Pflanze aufgefordert, Push-Benachrichtigungen zu aktivieren
- [ ] Nutzer kann Erinnerungszeit einstellen (Standard: 08:00 Uhr), gespeichert in Supabase
- [ ] Tägliche Push-Benachrichtigung wenn Aufgaben fällig sind: "Du hast X Pflegeaufgaben heute"
- [ ] Tippen auf Benachrichtigung öffnet die App und navigiert zur Aufgaben-Ansicht
- [ ] Nutzer kann Benachrichtigungen in den Einstellungen deaktivieren
- [ ] Wenn keine Aufgaben fällig: keine Benachrichtigung
- [ ] Benachrichtigungs-Permission kann erneut angefordert werden (nach vorheriger Ablehnung, via Settings)

## Edge Cases
- Nutzer verweigert Berechtigung initial: In-App-Banner mit Möglichkeit, es später zu aktivieren; kein wiederholtes Anfragen
- Browser unterstützt keine Push-Notifications (älteres iOS Safari): Fallback auf In-App-Hinweis (Badge auf Task-Icon), keine Abstürze
- Benachrichtigungsdienst (VAPID) schlägt fehl: Stille Fehlerbehandlung, App funktioniert weiterhin
- Nutzer ist ausgeloggt: Keine Benachrichtigungen senden
- Nutzer hat App deinstalliert (PWA): Subscription wird inaktiv, keine Fehler
- Mehrere Geräte: Benachrichtigungen auf allen registrierten Geräten senden
- Zeitzonenunterschiede: Benachrichtigungszeit in lokaler Zeitzone des Nutzers

## Technical Requirements
- Standard: Web Push API + VAPID-Keys
- Service Worker für Empfang im Hintergrund
- Push-Subscription in Supabase gespeichert (user_id, endpoint, keys, reminder_time)
- Scheduling: Cron-Job oder Supabase Edge Function (täglich zur konfigurierten Zeit)
- VAPID-Keys: Server-seitig, nie im Browser-Code
- Browser-Support: Chrome 50+, Firefox 44+, Edge 17+, Safari 16.4+ (iOS)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
