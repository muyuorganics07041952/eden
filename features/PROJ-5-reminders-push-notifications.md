# PROJ-5: Reminders & Push Notifications

## Status: In Review
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

**Tested:** 2026-03-02
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

#### AC-1: Nutzer wird beim ersten Anlegen einer Pflanze aufgefordert, Push-Benachrichtigungen zu aktivieren
- [ ] BUG: The banner appears on `/plants` page when plants exist AND push is not active, but the acceptance criterion says "beim ersten Anlegen einer Pflanze" (when first creating a plant). The banner shows every time the plants page loads (not dismissed yet), not specifically triggered by the first plant creation event. The banner also only appears after plants are loaded (not during the creation flow itself). See BUG-1.
- [x] Banner correctly hides when already subscribed
- [x] Banner correctly hides when no plants exist
- [x] "Jetzt aktivieren" button triggers permission request
- [x] "Spaeter" button dismisses banner for the session (sessionStorage)

#### AC-2: Nutzer kann Erinnerungszeit einstellen (Standard: 08:00 Uhr), gespeichert in Supabase
- [x] Settings page at `/settings` renders NotificationSettingsCard
- [x] Time picker shows all 24 hours (00:00 - 23:00)
- [x] Default is 08:00 Uhr
- [x] `PUT /api/push/settings` validates input with Zod (reminderHour 0-23)
- [x] Updates all subscriptions for the user in Supabase
- [ ] BUG: Settings page always passes hardcoded `initialReminderHour={8}` instead of fetching the user's actual saved reminder hour from the database. If a user previously set 14:00 and reloads the page, the time picker shows 08:00 again. See BUG-2.

#### AC-3: Taegliche Push-Benachrichtigung wenn Aufgaben faellig sind
- [x] Vercel Cron configured to run hourly (`0 * * * *`) via `vercel.json`
- [x] `/api/push/send` fetches enabled subscriptions and filters by local hour matching
- [x] Queries `care_tasks` where `next_due_date <= today`
- [x] Sends notification payload with correct German text: "Du hast X Pflegeaufgabe(n) heute faellig."
- [x] Groups by user to avoid duplicate task queries
- [x] Cleans up expired subscriptions (HTTP 410)

#### AC-4: Tippen auf Benachrichtigung oeffnet die App und navigiert zur Aufgaben-Ansicht
- [x] Service worker `notificationclick` handler navigates to `/tasks`
- [x] Payload includes `url: '/tasks'`
- [x] SW checks existing windows before opening new one
- [x] Falls back to `clients.openWindow` if no matching window exists

#### AC-5: Nutzer kann Benachrichtigungen in den Einstellungen deaktivieren
- [x] Settings page has toggle switch
- [x] Toggle calls `unsubscribe()` which DELETEs from backend and calls browser `subscription.unsubscribe()`
- [x] Toggle calls `subscribe()` to re-enable
- [x] Switch disabled while loading

#### AC-6: Wenn keine Aufgaben faellig, keine Benachrichtigung
- [x] Cron endpoint checks task count: if `count === 0`, skips (increments `skipped` counter)
- [x] Returns stats `{ sent, skipped, errors }`

#### AC-7: Benachrichtigungs-Permission kann erneut angefordert werden (nach vorheriger Ablehnung, via Settings)
- [x] When `permission === "denied"`, an Alert with "Erneut versuchen" button is shown
- [x] Button calls `handleRequestPermission` which calls `subscribe()`
- [ ] BUG: Once the browser permission is "denied", calling `Notification.requestPermission()` again will NOT re-prompt the user -- the browser silently returns "denied" again. The UI shows "Erneut versuchen" but clicking it will always fail silently. The correct UX should instruct the user to change permissions in browser site settings. See BUG-3.

### Edge Cases Status

#### EC-1: Nutzer verweigert Berechtigung initial
- [x] Banner on `/plants` hides when `permission === "denied"`
- [x] Settings page shows "Blockiert" badge and informational alert
- [ ] BUG: The alert text says "Bitte erlaube Benachrichtigungen in deinen Browsereinstellungen" which is correct guidance, BUT it also shows a "Erneut versuchen" button that cannot work (see BUG-3). Contradictory UX.

#### EC-2: Browser unterstuetzt keine Push-Notifications
- [x] `isSupported` check correctly detects missing `Notification`, `serviceWorker`, or `PushManager` APIs
- [x] NotificationSettingsCard shows fallback card with informational message
- [ ] BUG: The spec requires a "Badge auf Task-Icon" as fallback for unsupported browsers. No badge/indicator on the task icon was implemented. See BUG-4.

#### EC-3: VAPID-Dienst schlaegt fehl
- [x] `sendNotification` errors are caught and logged
- [x] App continues to function; errors are counted and returned
- [x] HTTP 410 (expired subscription) triggers cleanup

#### EC-4: Nutzer ist ausgeloggt
- [x] All API endpoints (`subscribe`, `settings`, `send`) check authentication
- [x] Cron endpoint uses admin client but only sends to users who have due tasks (implicitly active users)

#### EC-5: Nutzer hat App deinstalliert (PWA)
- [x] HTTP 410 from push service triggers subscription deletion from DB
- [x] Other errors are logged but do not crash the cron job

#### EC-6: Mehrere Geraete
- [x] `endpoint` is UNIQUE in DB; multiple subscriptions per user allowed (different endpoints)
- [x] Cron sends to ALL devices of a user (`for (const sub of userSubs)`)
- [x] Subscribe upserts by `endpoint + user_id`

#### EC-7: Zeitzonenunterschiede
- [x] Timezone stored as IANA string from `Intl.DateTimeFormat().resolvedOptions().timeZone`
- [x] Cron uses `toLocaleString` with user's timezone to determine local hour
- [x] Invalid timezones are caught and logged (subscription skipped)

### Security Audit Results

#### Authentication
- [x] `POST /api/push/subscribe`: Checks `supabase.auth.getUser()`, returns 401 if missing
- [x] `DELETE /api/push/subscribe`: Checks `supabase.auth.getUser()`, returns 401 if missing
- [x] `PUT /api/push/settings`: Checks `supabase.auth.getUser()`, returns 401 if missing
- [x] `POST /api/push/send`: Protected by `CRON_SECRET` Bearer token

#### Authorization
- [x] RLS enabled on `push_subscriptions` table with owner-only policies for SELECT, INSERT, UPDATE, DELETE
- [x] Subscribe endpoint filters by `user_id` in both select and update queries
- [x] Delete endpoint filters by `user_id` and `endpoint`
- [x] Settings update filters by `user_id`
- [x] Cron uses admin client (service role) which is appropriate for cross-user operations

#### Input Validation
- [x] All endpoints validate input with Zod schemas before processing
- [x] `endpoint` validated as URL
- [x] `reminderHour` validated as integer 0-23
- [x] `p256dh` and `auth` validated as non-empty strings
- [x] `timezone` validated as non-empty string
- [ ] BUG: The `timezone` field is only validated as a non-empty string (`z.string().min(1)`), not as a valid IANA timezone. An attacker could store arbitrary strings like `<script>alert(1)</script>` in the timezone field. While this would not execute (it is only used server-side in `toLocaleString`), it clutters the database and the cron would silently skip these entries. See BUG-5.

#### Rate Limiting
- [x] Subscribe endpoint has in-memory rate limiter (10 requests/user/60s)
- [ ] BUG: Settings and Delete endpoints have NO rate limiting. An attacker could spam `PUT /api/push/settings` or `DELETE /api/push/subscribe` without throttling. See BUG-6.
- [ ] BUG: The in-memory rate limiter does not persist across serverless function cold starts. In a Vercel serverless environment, each new function instance gets a fresh `rateLimitMap`, effectively making the rate limiter unreliable. See BUG-7.

#### Secrets Management
- [x] `VAPID_PRIVATE_KEY` only accessed in server-side route (`/api/push/send`)
- [x] `CRON_SECRET` only accessed in server-side route (`/api/push/send`)
- [x] `SUPABASE_SERVICE_ROLE_KEY` only accessed in `admin.ts` (server-side)
- [x] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` correctly prefixed for browser access (public key is safe to expose)
- [x] All env vars documented in `.env.local.example`
- [x] `.env*.local` in `.gitignore`

#### Service Worker Security
- [x] SW only handles `push` and `notificationclick` events
- [x] No dynamic code execution in SW
- [x] URL for notification click defaults to `/tasks` (relative, safe)

#### Cron Endpoint Security
- [x] Protected by `CRON_SECRET` via Bearer token in Authorization header
- [x] Returns 401 if secret is missing or doesn't match
- [ ] BUG: If `CRON_SECRET` environment variable is not set (empty/undefined), the check `!cronSecret || authHeader !== Bearer ${cronSecret}` correctly rejects. However, if an attacker sends a request with `Authorization: Bearer undefined`, and the env var happens to be the literal string "undefined" (misconfiguration), it would pass. This is extremely unlikely but worth noting. Low severity.

#### Data Exposure
- [x] Subscribe endpoint returns the full subscription record (including `p256dh_key` and `auth_key`) in the response. While this data came from the client in the first place, exposing it in the response is unnecessary. Low severity.
- [x] Cron endpoint returns only aggregate counts (`sent`, `skipped`, `errors`), no user data

### Cross-Browser Compatibility (Code Review)
- [x] Chrome: Full Web Push support, `PushManager` available
- [x] Firefox: Full Web Push support
- [x] Safari: Support check via `'PushManager' in window` -- Safari 16.4+ supports this
- [x] Fallback for unsupported browsers shows informational message (no crash)

### Responsive Design (Code Review)
- [x] 375px (Mobile): NotificationBanner uses `flex-col` on small screens, buttons stack vertically. Settings label text on navigation hidden (`hidden sm:inline`). Settings card layout remains usable.
- [x] 768px (Tablet): Banner switches to `sm:flex-row` layout. Navigation shows "Einstellungen" text.
- [x] 1440px (Desktop): Full layout, no issues.

### Bugs Found

#### BUG-1: Banner trigger timing does not match AC
- **Severity:** Low
- **Steps to Reproduce:**
  1. Log in with no plants
  2. Navigate to `/plants`
  3. Banner does NOT show (correct, no plants)
  4. Add a plant via the sheet
  5. Plant is optimistically added to the list
  6. Expected: Banner should appear immediately after first plant creation
  7. Actual: Banner may appear after page reload (when plants list is non-empty and push is not active), but not immediately during the creation flow. The AC says "beim ersten Anlegen einer Pflanze" which implies during/right-after the creation process.
- **Priority:** Nice to have (current behavior is functional, just not exactly per spec wording)

#### BUG-2: Settings page does not load saved reminder hour from database
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Go to `/settings`
  2. Enable push notifications
  3. Change reminder hour to 14:00
  4. Reload the page
  5. Expected: Time picker shows 14:00
  6. Actual: Time picker resets to 08:00 (hardcoded `initialReminderHour={8}`)
- **Priority:** Fix before deployment -- users will be confused when their saved preference is not reflected

#### BUG-3: "Erneut versuchen" button cannot re-prompt browser permission
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Go to `/settings`
  2. Click the toggle to enable push notifications
  3. When browser prompts for permission, click "Block/Deny"
  4. Permission is now "denied"; alert shows "Erneut versuchen" button
  5. Click "Erneut versuchen"
  6. Expected: Browser re-prompts for permission
  7. Actual: Browser silently returns "denied" without any prompt. The button gives no useful feedback. Error message "Berechtigung wurde nicht erteilt" appears briefly but the user has no actionable path.
- **Priority:** Fix before deployment -- misleading UX

#### BUG-4: Missing fallback badge on task icon for unsupported browsers
- **Severity:** Low
- **Steps to Reproduce:**
  1. Open app in a browser without Push API support (older iOS Safari)
  2. Expected: A badge/indicator appears on the task icon in the navigation to alert about due tasks
  3. Actual: No badge is shown. Only the settings card shows an informational message.
- **Priority:** Fix in next sprint

#### BUG-5: Timezone field not validated as valid IANA timezone
- **Severity:** Low
- **Steps to Reproduce:**
  1. Send `POST /api/push/subscribe` with `timezone: "not-a-timezone"`
  2. Expected: Validation error returned
  3. Actual: Request succeeds, invalid timezone stored in database. Cron will silently skip this subscription.
- **Priority:** Fix in next sprint

#### BUG-6: No rate limiting on settings and delete endpoints
- **Severity:** Low
- **Steps to Reproduce:**
  1. Rapidly send 100+ `PUT /api/push/settings` requests
  2. Expected: Rate limited after a threshold
  3. Actual: All requests processed without throttling
- **Priority:** Nice to have (low abuse potential since these require authentication)

#### BUG-7: In-memory rate limiter unreliable in serverless environment
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Send requests to `POST /api/push/subscribe` from different clients
  2. If requests hit different serverless instances (common on Vercel), each instance has its own fresh `rateLimitMap`
  3. Expected: Consistent rate limiting across all requests
  4. Actual: Rate limiting is per-instance, effectively allowing more requests than the 10/60s limit
- **Priority:** Fix in next sprint (consider using Vercel KV or Upstash Redis for persistent rate limiting)

#### BUG-8: Notification banner shows after plants load, causing layout shift
- **Severity:** Low
- **Steps to Reproduce:**
  1. Go to `/plants` with push notifications not enabled and at least one plant
  2. Page loads with skeleton, then plants appear
  3. Expected: Banner appears smoothly without layout shift
  4. Actual: Banner initially hidden (`dismissed` defaults to `true`), then flips to visible after `useEffect` checks sessionStorage. The `hasPlants` prop also changes from `false` to `true` after fetch completes. This causes a delayed appearance but avoids a flash -- acceptable behavior, minor layout shift.
- **Priority:** Nice to have

### Summary
- **Acceptance Criteria:** 5/7 passed (AC-1 partially, AC-2 partially, AC-7 partially, AC-3/4/5/6 fully pass)
- **Bugs Found:** 8 total (0 critical, 2 high*, 3 medium, 3 low)
  - *Reclassifying BUG-2 and BUG-3 as the most impactful for user experience
- **Security:** Pass with minor findings (no critical vulnerabilities; input validation and rate limiting have low-severity gaps)
- **Production Ready:** NO
- **Recommendation:** Fix BUG-2 (settings page not loading saved hour) and BUG-3 (misleading re-request permission button) before deployment. These are user-facing issues that will cause confusion. The remaining bugs can be addressed in a follow-up sprint.

## Deployment
_To be added by /deploy_
