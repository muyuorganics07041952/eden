# PROJ-2: Plant Management

## Status: In Review
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
**Designed:** 2026-02-28

### Seitenstruktur (Routing)

```
app/
├── (protected)/
│   ├── plants/
│   │   ├── page.tsx          ← Pflanzen-Übersicht (Card-Grid)
│   │   └── [id]/
│   │       └── page.tsx      ← Pflanzendetail (Fotos + Infos + Bearbeiten)
```

### Komponenten-Baum

```
/plants (Pflanzen-Übersicht)
+-- Seitenkopf: "Meine Pflanzen" + "Neue Pflanze" Button
+-- Sortier-Dropdown (Neueste zuerst / Alphabetisch)
+-- PlantGrid
|   +-- PlantCard (je Pflanze)
|       +-- Cover-Foto (oder Platzhalter-Icon)
|       +-- Pflanzenname
|       +-- Art-Badge (optional)
|       +-- Standort-Tag (optional)
|       +-- Klick → /plants/[id]
+-- Empty State (wenn keine Pflanzen)
    +-- Illustration + Text + "Erste Pflanze anlegen" Button

AddPlantSheet (Schiebe-Formular, öffnet per Button)
+-- Name (Pflichtfeld)
+-- Art / Gattung
+-- Standort
+-- Pflanzdatum
+-- Notizen
+-- Speichern / Abbrechen

/plants/[id] (Pflanzendetail)
+-- Zurück-Button + Bearbeiten-Button + Löschen-Button
+-- Fotogalerie
|   +-- Hauptfoto (groß)
|   +-- Miniaturansichten (bis zu 5)
|   +-- "Foto hinzufügen" Button (wenn < 5 Fotos)
|   +-- "Als Hauptfoto setzen" Aktion per Klick
+-- Pflanzeninfos-Bereich
    +-- Alle Felder in lesbarer Darstellung

EditPlantSheet (wie AddPlantSheet, aber vorausgefüllt)
DeleteConfirmDialog (Bestätigungs-Dialog vor Löschen)
```

### Datenmodell

```
Tabelle "plants":
- ID (eindeutige Kennung)
- Nutzer-ID (verknüpft mit eingeloggtem Nutzer)
- Name (Pflichtfeld, max. 100 Zeichen)
- Art / Gattung (optional, max. 100 Zeichen)
- Standort im Garten (optional, max. 100 Zeichen)
- Pflanzdatum (optional)
- Notizen (optional, max. 1000 Zeichen)
- Erstellt am (automatisch gesetzt)
- Aktualisiert am (automatisch aktualisiert)

Tabelle "plant_photos":
- ID (eindeutige Kennung)
- Pflanzen-ID (verknüpft mit plants — wird beim Löschen der Pflanze mitgelöscht)
- Nutzer-ID (für schnelle Sicherheitsprüfung)
- Speicherpfad (Dateiort in Supabase Storage)
- Ist Hauptfoto (Ja/Nein — immer max. eines pro Pflanze)
- Erstellt am

Fotos in Supabase Storage:
- Bucket: "plant-photos"
- Pfad-Schema: {nutzer-id}/{pflanzen-id}/{dateiname}
- Max. 5 Fotos pro Pflanze, max. 5 MB pro Datei
- Formate: JPEG, PNG, WebP
```

### API-Routen

| Route | Methode | Funktion |
|---|---|---|
| `/api/plants` | GET | Alle Pflanzen des Nutzers abrufen (mit Sortierung) |
| `/api/plants` | POST | Neue Pflanze anlegen |
| `/api/plants/[id]` | GET | Einzelne Pflanze mit Fotos abrufen |
| `/api/plants/[id]` | PATCH | Pflanzendaten bearbeiten |
| `/api/plants/[id]` | DELETE | Pflanze + alle Fotos aus DB und Storage löschen |
| `/api/plants/[id]/photos` | POST | Foto hochladen (max. 5 MB, max. 5 Fotos) |
| `/api/plants/[id]/photos/[photoId]` | DELETE | Einzelnes Foto löschen |
| `/api/plants/[id]/photos/[photoId]/cover` | PATCH | Als Hauptfoto festlegen |

### Technische Entscheidungen

| Entscheidung | Warum |
|---|---|
| Eigene `plant_photos`-Tabelle | Mehrere Fotos pro Pflanze tracken + Cover-Status verwalten |
| Supabase Storage für Fotos | Integriert mit DB, RLS-geschützt, CDN-Auslieferung weltweit |
| Server Components für Pflanzenliste | Schnellerer initialer Ladevorgang, kein Flimmern beim Laden |
| Sheet (Schiebepanel) für Formulare | Mobile-freundlich, Nutzer verlässt die Übersicht nicht |
| AlertDialog für Löschen | Verhindert versehentliches Löschen mit Cascade-Effekt |
| Kein Kompressions-Paket | MVP: Dateien > 5 MB werden mit klarer Fehlermeldung abgelehnt |
| RLS auf beiden Tabellen | Nutzer sehen/ändern ausschließlich ihre eigenen Pflanzen und Fotos |

### Neue Abhängigkeiten

Keine neuen Pakete erforderlich — alle benötigten shadcn/ui-Komponenten (Sheet, AlertDialog, Card, Badge, Skeleton, Select) sind bereits installiert.

## Backend Implementation
**Implemented:** 2026-02-28

### Datenbank
- Tabelle `plants` mit RLS (owner-only: SELECT, INSERT, UPDATE, DELETE)
- Tabelle `plant_photos` mit RLS (owner-only) und ON DELETE CASCADE
- Storage-Bucket `plant-photos` (privat, max. 5 MB, JPEG/PNG/WebP)
- Storage RLS: Zugriff nur auf eigene Dateien (`{user_id}/...`)

### API-Routen
| Route | Methode | Datei |
|---|---|---|
| `/api/plants` | GET | `src/app/api/plants/route.ts` |
| `/api/plants` | POST | `src/app/api/plants/route.ts` |
| `/api/plants/[id]` | GET | `src/app/api/plants/[id]/route.ts` |
| `/api/plants/[id]` | PATCH | `src/app/api/plants/[id]/route.ts` |
| `/api/plants/[id]` | DELETE | `src/app/api/plants/[id]/route.ts` |
| `/api/plants/[id]/photos` | POST | `src/app/api/plants/[id]/photos/route.ts` |
| `/api/plants/[id]/photos/[photoId]` | DELETE | `src/app/api/plants/[id]/photos/[photoId]/route.ts` |
| `/api/plants/[id]/photos/[photoId]/cover` | PATCH | `src/app/api/plants/[id]/photos/[photoId]/cover/route.ts` |

### Besonderheiten
- Foto-Upload: Direkter Multipart-Upload über API-Route (kein Signed-URL-Ansatz)
- Erstes Foto einer Pflanze wird automatisch als Cover gesetzt
- Beim Löschen des Covers wird das nächste Foto automatisch zum Cover
- Beim Löschen einer Pflanze werden Storage-Dateien vor dem DB-Löschen bereinigt
- Signed URLs (1h Gültigkeit) werden bei allen Foto-Responses generiert

## QA Test Results
**Tested:** 2026-02-28
**Tester:** QA Engineer (AI)
**Build:** Passing (Next.js 16.1.1 Turbopack, zero TypeScript errors)

### Acceptance Criteria
| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| AC-1 | Nutzer kann Pflanze anlegen (Name, Art, Standort, Datum, Notizen) | FAIL | Backend POST returns plant object directly, but frontend (`add-plant-sheet.tsx:79`) reads `data.plant` which is `undefined`. Plant is created in DB but never appears in the UI list. See BUG-1. |
| AC-2 | Nutzer kann bis zu 5 Fotos hochladen (Supabase Storage) | FAIL | Backend returns photo object directly, but frontend (`photo-gallery.tsx:57`) reads `data.photo` which is `undefined`. Upload succeeds server-side but new photo never renders. See BUG-2. |
| AC-3 | Nutzer kann Hauptfoto (Cover) festlegen | PASS | Cover PATCH endpoint works correctly. Frontend optimistically updates `is_cover` on all photos. API uses two-step clear+set (not atomic, but acceptable for MVP). |
| AC-4 | Card-Grid-Ansicht (Bild + Name + Art) | FAIL | Plants list page (`plants/page.tsx:32`) reads `data.plants` but backend returns the array directly (not wrapped in `{ plants: [...] }`). List will always be empty. See BUG-3. |
| AC-5 | Sortierung: Neueste / Alphabetisch | PASS | Sort query param is sent correctly. Backend handles `newest` (created_at DESC) and `alphabetical` (name ASC). Select dropdown wired properly. |
| AC-6 | Alle Felder bearbeiten | FAIL | Backend PATCH returns plant object directly, but frontend (`edit-plant-sheet.tsx:92`) reads `data.plant` which is `undefined`. `onSuccess` is called with `undefined`, corrupting plant state. See BUG-4. |
| AC-7 | Pflanze loschen (Bestatigungsdialog, Fotos mitgeloscht) | PASS | Delete dialog present with AlertDialog. Backend deletes storage files then DB rows (cascade). Frontend redirects to `/plants` on success. |
| AC-8 | Empty State mit Call-to-Action | PASS (conditional) | EmptyState component exists with icon, text, and "Erste Pflanze anlegen" button. However, due to BUG-3 the empty state will always show even when plants exist. |
| AC-9 | Pflanzenliste nur fur eingeloggte Nutzer | PASS | Protected layout checks `supabase.auth.getUser()` and redirects to `/login`. All API routes independently verify auth and return 401. |

### Edge Cases
| # | Edge Case | Status | Notes |
|---|-----------|--------|-------|
| EC-1 | Foto-Upload Fehler: Fehlermeldung + Retry | PASS | `photo-gallery.tsx` shows error message. User can click "Foto hinzufugen" again. Backend cleans up orphaned storage file on DB insert failure. |
| EC-2 | Grosse Fotos (>5 MB): Hinweis auf Limit | PASS | Client-side check in `photo-gallery.tsx:35-37`. Server-side check in `photos/route.ts:59-63`. Both show clear error messages. |
| EC-3 | Pflanze mit Pflegeaufgaben loschen | PASS | Care tasks (PROJ-4) do not exist yet. Delete works without errors. No warning needed at this stage. |
| EC-4 | Pflanze ohne Foto: Platzhalterbild | PASS | `plant-card.tsx:39-41` shows Leaf icon placeholder. `photo-gallery.tsx:114-118` shows "Kein Foto vorhanden" placeholder. |
| EC-5 | Mehr als 5 Fotos: Button deaktivieren + Hinweis | PARTIAL | Upload button is hidden when `photos.length >= 5` (`canAddMore` check). Counter text shows "5 von 5 Fotos". However, there is no explicit message telling the user the limit is reached -- the button simply disappears. See BUG-7. |
| EC-6 | Langer Pflanzenname: truncation | PASS | `plant-card.tsx:45` uses `truncate` CSS class. Plant detail page has no truncation but full width is available and `whitespace-pre-wrap` handles long content. |

### Security Audit
| # | Check | Status | Notes |
|---|-------|--------|-------|
| S-1 | Auth check on all API routes | PASS | All 8 route handlers (GET/POST/PATCH/DELETE) call `supabase.auth.getUser()` and return 401 on failure before any data access. |
| S-2 | RLS: users only see own plants | PASS | All queries include `.eq('user_id', user.id)`. RLS is also enabled on DB tables as defense-in-depth. |
| S-3 | File type validation (JPEG/PNG/WebP) | PASS | Server-side validation in `photos/route.ts:66-70` checks `file.type` against allowlist. Client-side `accept` attribute provides first filter. |
| S-4 | File size validation (max 5 MB) | PASS | Server-side check at `photos/route.ts:59-63`. Client-side check at `photo-gallery.tsx:35-37`. |
| S-5 | SQL injection protection | PASS | All queries use Supabase client with parameterized queries. No raw SQL. |
| S-6 | Input validation with Zod (POST/PATCH) | PASS | `createPlantSchema` and `updatePlantSchema` validate all fields with type/length constraints. 422 returned on validation failure. |
| S-7 | No secrets in source code | PASS | No hardcoded API keys or credentials found in any reviewed file. Environment variables used via Supabase client. |
| S-8 | Plant ownership verified before photo operations | PASS | Photo upload verifies plant ownership (`photos/route.ts:21-29`). Photo delete and cover-set verify via `user_id` filter. |
| S-9 | Storage path uses user ID namespace | PASS | Path format `{user_id}/{plantId}/{filename}` at `photos/route.ts:76`. Combined with storage RLS, prevents cross-user access. |
| S-10 | File extension derived from user input | LOW RISK | `photos/route.ts:74` extracts extension from `file.name.split('.').pop()`. A malicious filename like `../../etc/passwd` would be mitigated by Supabase Storage path handling, but no explicit sanitization of the extension exists. See BUG-8. |
| S-11 | IDOR on plant ID parameter | PASS | All routes filter by both `id` and `user_id`, preventing access to other users' plants even if their IDs are guessed. |
| S-12 | Rate limiting on upload endpoint | FAIL | No rate limiting implemented on the photo upload endpoint. An authenticated user could abuse storage by uploading repeatedly. See BUG-9. |
| S-13 | planted_at date validation | LOW RISK | The `planted_at` field accepts any string on the backend (Zod only checks `z.string()`). No date format validation. Arbitrary strings could be stored. See BUG-10. |

### Bugs Found

#### BUG-1: Plants list API response shape mismatch (plants page always empty)
- **Severity:** Critical
- **Priority:** P0
- **Location:** `src/app/(protected)/plants/page.tsx:32` vs `src/app/api/plants/route.ts:57`
- **Description:** The frontend reads `data.plants` from the API response, but the backend returns the array directly via `NextResponse.json(plantsWithUrls)`. The result is that `data.plants` is always `undefined`, and the fallback `?? []` means the plants list is always empty.
- **Steps to reproduce:** 1. Log in. 2. Create a plant via direct API call. 3. Navigate to `/plants`. 4. Observe the list is empty even though plants exist.
- **Expected:** Plants array is rendered in the grid.
- **Actual:** Empty state is shown regardless of how many plants exist.

#### BUG-2: Photo upload response shape mismatch (uploaded photo not shown)
- **Severity:** Critical
- **Priority:** P0
- **Location:** `src/components/plants/photo-gallery.tsx:57` vs `src/app/api/plants/[id]/photos/route.ts:113`
- **Description:** The frontend reads `data.photo` but the backend returns the photo object directly as `NextResponse.json({ ...photo, url: ... })`. So `data.photo` is `undefined` and `onPhotosChange` receives `[...photos, undefined]`.
- **Steps to reproduce:** 1. Navigate to plant detail. 2. Upload a photo. 3. Photo uploads to storage but does not appear in gallery.
- **Expected:** New photo appears in the thumbnail row.
- **Actual:** `undefined` is appended to photos array, likely causing a React rendering error.

#### BUG-3: Plant detail API response shape mismatch
- **Severity:** Critical
- **Priority:** P0
- **Location:** `src/app/(protected)/plants/[id]/page.tsx:37` vs `src/app/api/plants/[id]/route.ts:49`
- **Description:** The frontend reads `data.plant` but the backend returns the plant object directly. `setPlant(data.plant)` sets state to `undefined`, triggering the error state.
- **Steps to reproduce:** 1. Navigate to `/plants/{id}`. 2. Observe error state instead of plant details.
- **Expected:** Plant details are rendered.
- **Actual:** Error state shown because `plant` is `null`.

#### BUG-4: Edit plant response shape mismatch
- **Severity:** Critical
- **Priority:** P0
- **Location:** `src/components/plants/edit-plant-sheet.tsx:92` vs `src/app/api/plants/[id]/route.ts:91`
- **Description:** The frontend reads `data.plant` from the PATCH response, but backend returns the plant directly. `onSuccess(undefined)` is called, which would overwrite plant state with partial undefined data.
- **Steps to reproduce:** 1. Open plant detail. 2. Click edit. 3. Change a field and save. 4. Plant info disappears or shows error.
- **Expected:** Updated plant data renders correctly.
- **Actual:** Plant state is corrupted with undefined values.

#### BUG-5: Location field max length mismatch between frontend and backend
- **Severity:** Medium
- **Priority:** P2
- **Location:** `src/components/plants/add-plant-sheet.tsx:31` and `src/components/plants/edit-plant-sheet.tsx:31` (max 200) vs `src/app/api/plants/route.ts:8` (max 100)
- **Description:** Frontend Zod schema allows `location` up to 200 characters, but backend Zod schema only allows 100 characters. A user entering 101-200 characters for location would pass client validation but get a 422 error from the backend with no clear UX explanation.
- **Steps to reproduce:** 1. Open add plant form. 2. Enter a location string of 150 characters. 3. Submit. 4. Backend returns 422 but frontend shows generic "Fehler beim Speichern" on the name field.
- **Expected:** Consistent validation limits; clear error message for location field.
- **Actual:** Silent backend rejection with misleading error on wrong field.

#### BUG-6: Delete dialog shows no error message on failure
- **Severity:** Medium
- **Priority:** P2
- **Location:** `src/components/plants/delete-plant-dialog.tsx:45-47`
- **Description:** The catch block in `handleDelete` only calls `setIsDeleting(false)` but does not display any error message to the user. If the delete API call fails (network error, server error), the dialog simply re-enables the button with no feedback.
- **Steps to reproduce:** 1. Simulate a network failure. 2. Attempt to delete a plant. 3. Dialog button re-enables but no error text appears.
- **Expected:** An error message is shown (e.g., "Fehler beim Loschen. Bitte versuche es erneut.").
- **Actual:** Silent failure; user does not know deletion failed.

#### BUG-7: No explicit "limit reached" message when 5 photos exist
- **Severity:** Low
- **Priority:** P3
- **Location:** `src/components/plants/photo-gallery.tsx:174`
- **Description:** When 5 photos exist, the upload button is hidden entirely. The counter "5 von 5 Fotos" is shown, but there is no explicit message like "Maximale Anzahl erreicht". The user might be confused about why the upload button disappeared.
- **Steps to reproduce:** 1. Upload 5 photos. 2. Upload button disappears. 3. No explanatory text visible.
- **Expected:** A message like "Maximale Anzahl von 5 Fotos erreicht" is shown.
- **Actual:** Button simply disappears; only counter text remains.

#### BUG-8: No sanitization of file extension from user-provided filename
- **Severity:** Low
- **Priority:** P3
- **Location:** `src/app/api/plants/[id]/photos/route.ts:74`
- **Description:** The file extension is extracted from `file.name.split('.').pop()` without sanitization. While Supabase Storage likely handles path traversal, a file named `photo.exe` or `photo.svg` would pass the MIME type check (if spoofed) but store with a misleading extension. The MIME type check is the primary defense, but defense-in-depth suggests also validating the extension.
- **Steps to reproduce:** 1. Craft a request with `Content-Type: image/jpeg` but filename `malicious.html`. 2. File is stored as `.html` extension in storage.
- **Expected:** Extension is validated against an allowlist (jpg, jpeg, png, webp).
- **Actual:** Any extension is accepted as long as MIME type passes.

#### BUG-9: No rate limiting on photo upload endpoint
- **Severity:** Low
- **Priority:** P3
- **Location:** `src/app/api/plants/[id]/photos/route.ts`
- **Description:** There is no rate limiting on the photo upload endpoint. An authenticated user could create many plants and upload 5 photos each in rapid succession, consuming significant storage. The per-plant limit of 5 is enforced, but there is no global or per-user upload rate limit.
- **Steps to reproduce:** 1. Authenticate. 2. Script rapid creation of plants + photo uploads. 3. Storage usage grows unbounded.
- **Expected:** Rate limiting or a global per-user storage quota.
- **Actual:** Only per-plant photo count is limited.

#### BUG-10: No date format validation on planted_at field
- **Severity:** Low
- **Priority:** P3
- **Location:** `src/app/api/plants/route.ts:9` and `src/app/api/plants/[id]/route.ts:9`
- **Description:** The `planted_at` field uses `z.string()` without any date format validation. An arbitrary string like "not-a-date" would be accepted and stored. The frontend uses `<Input type="date">` which provides browser-level formatting, but direct API calls could inject invalid date strings.
- **Steps to reproduce:** 1. POST to `/api/plants` with `planted_at: "garbage"`. 2. Value is stored. 3. Detail page calls `new Date("garbage").toLocaleDateString()` which returns "Invalid Date".
- **Expected:** Backend validates date format (ISO 8601 or rejects invalid strings).
- **Actual:** Any string accepted; "Invalid Date" may render in UI.

#### BUG-11: Frontend photo delete does not reassign cover locally
- **Severity:** Medium
- **Priority:** P2
- **Location:** `src/components/plants/photo-gallery.tsx:95`
- **Description:** When a cover photo is deleted, the backend (`photos/[photoId]/route.ts:44-59`) reassigns the cover to the next photo in the database. However, the frontend at line 95 only filters the deleted photo out: `photos.filter((p) => p.id !== photoId)`. It does not update `is_cover` on the remaining photos. This means after deleting the cover photo, no photo has `is_cover: true` in the local state, and the cover display relies on the fallback `photos[0]` at line 25. While this accidentally works for display, the thumbnail ring indicator (line 135) will not highlight any photo as the cover until the page is refreshed.
- **Steps to reproduce:** 1. Have 3 photos, first is cover. 2. Delete the cover photo. 3. Second photo displays as main image (via fallback) but no thumbnail has the ring indicator.
- **Expected:** After deleting cover, the next photo should show the cover ring indicator.
- **Actual:** No photo shows the cover ring indicator until page refresh.

### Integration Summary

The most critical issue is a systematic **response shape mismatch** between frontend and backend across 4 different endpoints. The backend returns data objects directly (e.g., `NextResponse.json(plant)`), while the frontend consistently expects them wrapped in a named property (e.g., `data.plant`, `data.plants`, `data.photo`). This means:

- The plants list page will always show empty state (BUG-1/BUG-3)
- Adding a plant appears to fail from the user's perspective (BUG-1)
- Plant detail page shows error state (BUG-3)
- Editing a plant corrupts local state (BUG-4)
- Photo upload appears broken (BUG-2)

**Either the backend must wrap responses (e.g., `{ plant: data }`) or the frontend must read the response directly (e.g., `setPlants(data)` instead of `setPlants(data.plants)`).**

### Summary
- **Acceptance Criteria:** 4/9 Pass (AC-3, AC-5, AC-7, AC-9), 4 Fail (AC-1, AC-2, AC-4, AC-6), 1 Conditional (AC-8)
- **Edge Cases:** 5/6 Pass, 1 Partial (EC-5)
- **Security Checks:** 11/13 Pass, 1 Low Risk, 1 Fail (rate limiting)
- **Critical bugs:** 4 (BUG-1, BUG-2, BUG-3, BUG-4) -- all same root cause: response shape mismatch
- **Medium bugs:** 3 (BUG-5, BUG-6, BUG-11)
- **Low bugs:** 4 (BUG-7, BUG-8, BUG-9, BUG-10)

**QA Verdict: BLOCKED -- fix critical bugs first** _(initial verdict — bugs fixed in commit `1c6b5a1`)_

**QA Verdict (after fixes): ✓ Approved for deployment**

All critical and medium bugs fixed:
- BUG-1/2/3/4 (Critical): Response shape mismatch fixed in frontend
- BUG-5 (Medium): Location max length aligned to 100 in both forms
- BUG-6 (Medium): Delete dialog now shows error message on failure
- BUG-11 (Medium): Cover reassigned locally after cover photo deletion

Remaining low-severity bugs (BUG-7/8/9/10) are acceptable for MVP deployment.

## Deployment
**Deployed:** 2026-02-28
**Production URL:** https://eden-azure-zeta.vercel.app/plants
**Platform:** Vercel (auto-deploy on push to main)
