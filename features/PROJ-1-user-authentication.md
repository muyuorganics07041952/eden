# PROJ-1: User Authentication

## Status: Planned
**Created:** 2026-02-27
**Last Updated:** 2026-02-27

## Dependencies
- None

## User Stories
- Als neuer Nutzer möchte ich mich mit E-Mail und Passwort registrieren, damit meine Gartendaten sicher gespeichert sind.
- Als wiederkehrender Nutzer möchte ich mich einloggen, damit ich auf meine Pflanzen und Aufgaben zugreifen kann.
- Als Nutzer möchte ich mein Passwort zurücksetzen können, wenn ich es vergessen habe.
- Als Nutzer möchte ich mich ausloggen können, damit mein Konto auf geteilten Geräten sicher ist.
- Als Nutzer möchte ich, dass meine Sitzung erhalten bleibt, damit ich mich nicht bei jedem Besuch neu einloggen muss.

## Acceptance Criteria
- [ ] Nutzer kann sich mit E-Mail + Passwort registrieren
- [ ] Nutzer kann sich mit E-Mail + Passwort einloggen
- [ ] Nutzer kann Passwort-Reset per E-Mail anfordern
- [ ] Nutzer kann sich ausloggen
- [ ] Session bleibt über Browser-Schließen hinweg erhalten
- [ ] Falsche Zugangsdaten zeigen eine klare Fehlermeldung
- [ ] Nicht-eingeloggte Nutzer werden bei geschützten Seiten zur Login-Seite weitergeleitet
- [ ] Formular-Validierung: E-Mail-Format, Passwort min. 8 Zeichen

## Edge Cases
- Doppelte E-Mail bei Registrierung: Fehlermeldung "E-Mail bereits registriert" anzeigen
- Ungültiges E-Mail-Format: Inline-Validierung vor Absenden
- Passwort zu kurz: Hinweis mit Mindestanforderung
- Abgelaufener Reset-Link: Klare Fehlermeldung mit Möglichkeit, neuen Link anzufordern
- Nutzer versucht auf geschützte Seite zuzugreifen ohne Login: Redirect zur Login-Seite, nach Login Redirect zurück zur ursprünglichen Seite

## Technical Requirements
- Auth-Provider: Supabase Auth (E-Mail/Passwort)
- Session-Management: Supabase Session-Tokens (automatisch)
- Passwort-Reset: Supabase eingebauter Flow
- Kein OAuth / Social Login in dieser Version

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
