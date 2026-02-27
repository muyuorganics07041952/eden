# PROJ-8: Offline & PWA Optimization

## Status: Planned
**Created:** 2026-02-27
**Last Updated:** 2026-02-27

## Dependencies
- Requires: PROJ-1 bis PROJ-6 (alle P0-Features) — PWA-Optimierung setzt vollständige App voraus

## User Stories
- Als Nutzer möchte ich die App auf meinem Homescreen installieren können, wie eine native App.
- Als Nutzer möchte ich meine Pflanzenliste auch ohne Internetverbindung einsehen können.
- Als Nutzer möchte ich, dass die App auch bei schlechter Verbindung schnell lädt.
- Als Nutzer möchte ich, dass offline gemachte Änderungen synchronisiert werden, wenn ich wieder online bin.

## Acceptance Criteria
- [ ] App hat ein valides Web App Manifest (Name, Icons, Theme-Color, display: standalone)
- [ ] Service Worker cached: App-Shell, Pflanzenliste, Pflanzfotos
- [ ] Pflanzenliste und Pflanzendetails sind offline abrufbar (read-only)
- [ ] Offline-Banner wird angezeigt, wenn keine Verbindung besteht
- [ ] Offline gemachte Änderungen werden in einer Queue gespeichert und nach Reconnect synchronisiert
- [ ] App besteht Lighthouse PWA-Audit mit Score > 90
- [ ] App ist installierbar auf: Chrome/Edge (Desktop + Android), Safari (iOS 16.4+)

## Edge Cases
- Nutzer legt offline eine Pflanze an: Änderung wird in Queue gespeichert und nach Reconnect synchronisiert
- Sync-Konflikt (gleiche Pflanze auf zwei Geräten bearbeitet): Last-write-wins, Nutzer wird informiert
- Cache-Daten veraltet: Refresh-Hinweis anzeigen
- Speicherquote überschritten: Alten Cache leeren, Nutzer informieren
- iOS PWA-Einschränkungen (z.B. kein Background Sync auf iOS < 16.4): Einschränkungen dokumentieren, kein Fehler
- PWA-Installation nicht verfügbar (z.B. Firefox Desktop): In-App-Anleitung für manuelle Installation

## Technical Requirements
- Service Worker: next-pwa oder custom Workbox-Konfiguration
- Cache-Strategie: Cache-first für statische Assets, Network-first für API-Daten
- Background Sync API für Offline-Queuing (wo verfügbar)
- Icons: 192x192 und 512x512 PNG
- Lighthouse Score: PWA > 90, Performance > 80, Accessibility > 90

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
