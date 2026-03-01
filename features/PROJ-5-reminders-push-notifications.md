# PROJ-5: Reminders & Push Notifications

## Status: In Progress (Backend done)
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

### Wie Push Notifications funktionieren (Übersicht)

```
Browser                    Server (Vercel)           Google/Mozilla Push Service
  |                              |                              |
  |-- Nutzer erlaubt Push -----> |                              |
  |<-- Subscription (endpoint) -|                              |
  |-- POST /api/push/subscribe ->|                              |
  |   (endpoint + timezone)      |                              |
  |                              |                              |
  |              Vercel Cron (stündlich)                        |
  |                    ↓                                        |
  |              Wer hat jetzt Reminder?                        |
  |                    ↓                                        |
  |              Hat der Nutzer Aufgaben heute?                 |
  |                    ↓                                        |
  |              POST → Push Service -------push message -----> |
  |<------------------------------------ Notification anzeigen--|
```

### Component Structure

```
/settings (NEUE Seite)
+-- NotificationSettingsCard
    +-- Toggle: Benachrichtigungen aktivieren/deaktivieren
    +-- TimePicker: Erinnerungszeit (Stunde, z.B. "08:00 Uhr")
    +-- Status: "Aktiv auf diesem Gerät" / "Nicht erlaubt"
    +-- Button: "Berechtigung erneut anfordern" (nur wenn verweigert)

NotificationBanner (NEU, eingebettet in /plants)
+-- Erscheint einmalig wenn: Pflanzen vorhanden + Push noch nicht aktiviert
+-- "Jetzt aktivieren" → fragt Permission an
+-- "Später" → blendet Banner für Session aus

Navigation (bestehend, erweitert)
+-- Neuer Link: "Einstellungen" → /settings
```

### Data Model

**Neue Tabelle: `push_subscriptions`**

| Feld | Beschreibung |
|------|--------------|
| ID | Eindeutige ID |
| User ID | Verknüpfung mit Nutzer (RLS) |
| Endpoint | URL des Browser-Push-Dienstes (gerätespezifisch) |
| P256DH Key | Verschlüsselungsschlüssel (vom Browser) |
| Auth Key | Auth-Token (vom Browser) |
| Timezone | IANA-Zeitzone des Nutzers (z.B. `"Europe/Berlin"`) |
| Reminder Hour | Stunde 0–23 in lokaler Zeit (z.B. `8` = 08:00 Uhr) |
| Enabled | Benachrichtigungen an/aus |
| Created At | Zeitstempel |

Ein Nutzer kann mehrere Subscriptions haben (Handy + Laptop). Alle aktiven Geräte bekommen die Benachrichtigung.

### Tech Decisions

| Entscheidung | Wahl | Warum |
|---|---|---|
| Scheduling | Vercel Cron Jobs (stündlich) | Bereits auf Vercel, kostenlos im Hobby-Plan, keine externe Infrastruktur |
| Push-Protokoll | Web Push API + VAPID | Web-Standard, funktioniert in Chrome, Firefox, Edge, Safari 16.4+ (iOS) |
| Granularität | reminder_hour (0–23) | Stundengenauigkeit reicht für tägliche Erinnerungen; Minuten-Cron wäre zu häufig |
| Zeitzone | Browser IANA-String | `Intl.DateTimeFormat().resolvedOptions().timeZone` — automatisch, kein manuelles Abfragen |
| VAPID Keys | Server-seitig | Privater Key bleibt auf Vercel, nur öffentlicher Key geht zum Browser |

### New API Endpoints

| Endpoint | Zweck |
|---|---|
| `POST /api/push/subscribe` | Subscription speichern/aktualisieren |
| `DELETE /api/push/subscribe` | Subscription löschen (Deaktivierung) |
| `PUT /api/push/settings` | Erinnerungszeit ändern |
| `POST /api/push/send` | Cron-Endpunkt: Benachrichtigungen versenden (gesichert via CRON_SECRET) |

### New Dependencies

| Paket | Zweck |
|-------|-------|
| `web-push` | Sendet VAPID-signierte Push-Nachrichten vom Server |

### New Environment Variables

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   ← für Browser (Subscribe)
VAPID_PRIVATE_KEY=...              ← nur Server (Senden)
VAPID_SUBJECT=mailto:...           ← E-Mail für VAPID-Identifikation
CRON_SECRET=...                    ← schützt /api/push/send vor fremden Aufrufen
```

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
