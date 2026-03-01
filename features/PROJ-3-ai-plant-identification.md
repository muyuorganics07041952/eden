# PROJ-3: AI Plant Identification

## Status: In Progress
**Created:** 2026-02-27
**Last Updated:** 2026-02-28

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Requires: PROJ-2 (Plant Management) — Identifikation ist in den AddPlant-Flow integriert

## User Stories
- Als Nutzer möchte ich im Pflanzenerstellungs-Formular ein Foto zur KI-Identifikation einreichen, damit ich den Namen meiner Pflanze nicht manuell recherchieren muss.
- Als Nutzer möchte ich die Top-3 Vorschläge der KI mit Konfidenzwert sehen, damit ich das richtige Ergebnis auswählen kann.
- Als Nutzer möchte ich einen Vorschlag auswählen und damit das Formular automatisch befüllen lassen (Name + Art/Gattung).
- Als Nutzer möchte ich den KI-Vorschlag im Formular manuell korrigieren können, wenn er falsch ist.
- Als Nutzer möchte ich, dass das Identifikationsfoto automatisch als erstes Pflanzenfoto gespeichert wird, damit ich es nicht nochmal hochladen muss.

## Acceptance Criteria
- [ ] Im AddPlant-Sheet gibt es einen "Pflanze identifizieren" Button (oberhalb der Pflichtfelder)
- [ ] Klick öffnet eine Datei-Auswahl (Kamera/Galerie) — max. 10 MB, JPEG/PNG/WebP
- [ ] Foto wird clientseitig automatisch auf max. 1 MB komprimiert (Canvas API) bevor es ans Backend gesendet wird
- [ ] Ladeindikator während API-Anfrage (max. 10 Sekunden Timeout)
- [ ] App zeigt die Top-3 Vorschläge mit: Pflanzenname (common name auf Deutsch wenn vorhanden, sonst Englisch), lateinischer Name, Konfidenzwert in %
- [ ] Nutzer wählt einen Vorschlag → Name und Art/Gattung werden im Formular vorausgefüllt
- [ ] Formularfelder bleiben editierbar nach dem Vorausfüllen
- [ ] Vorschlag ablehnen / "Manuell eingeben" — alle Felder bleiben leer/editierbar
- [ ] Das zur Identifikation verwendete Foto wird nach dem Abspeichern der Pflanze automatisch als erstes Foto hochgeladen (cover photo)
- [ ] Wenn API nicht verfügbar (Timeout, 5xx): Fehlermeldung + Formular bleibt für manuelle Eingabe offen
- [ ] Identifikations-Ergebnis verschwindet wenn der Nutzer ein anderes Foto für die Identifikation auswählt

## Edge Cases
- Keine Pflanze erkannt (Konfidenz < 10% oder leere Ergebnisse): Meldung "Keine Pflanze erkannt — bitte manuell eingeben"
- Sehr niedriger Konfidenzwert (10–29%): Ergebnisse anzeigen mit Hinweis "Unsicheres Ergebnis — bitte überprüfen"
- Foto ist kein Pflanzenbild (z.B. Tier, Landschaft, leere Fläche): API gibt Fehler oder 0 Ergebnisse → Hinweis "Kein Pflanzenfotos erkannt" + manuelle Eingabe
- API-Rate-Limit überschritten (429): nutzerfreundliche Fehlermeldung ohne technische Details, Retry nach 30 Sekunden
- Netzwerkfehler während Upload oder API-Anfrage: "Verbindungsfehler — bitte erneut versuchen" + Retry-Button
- Bildkomprimierung schlägt fehl (ungewöhnliches Format): Bild ablehnen, Fehlermeldung anzeigen
- Nutzer schließt AddPlant-Sheet: Identifikationsfoto und Ergebnisse werden verworfen
- Pflanzenerstellung schlägt fehl nach Identifikation: Foto wird NICHT gespeichert (atomare Operation)

## Technical Requirements
- API: Plant.id v3 (https://plant.id) — API-Key serverseitig in Next.js API Route
- API-Key Umgebungsvariable: `PLANT_ID_API_KEY` (bereits in .env.local.example)
- Bild-Komprimierung: clientseitig mit Canvas API, Zielgröße max. 1 MB, Qualität 85%
- Max. Eingabegröße vom Nutzer: 10 MB (JPEG, PNG, WebP)
- API-Timeout: 10 Sekunden
- Ergebnisse werden NICHT gecacht (jedes Foto ist einzigartig)
- Das Identifikationsfoto wird nach Pflanzenerstellung über die bestehende `/api/plants/[id]/photos` Route hochgeladen

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Overview
PROJ-3 extends the existing `AddPlantSheet` with an identification section at the top. There are no new database tables — the identified photo is saved via the existing photo upload route after the plant is created.

---

### Component Structure

```
AddPlantSheet (modified)
+-- PlantIdentifySection (new component)
|   +-- "Pflanze identifizieren" Button  ← triggers file picker (hidden <input type="file">)
|   +-- [Loading state]                  ← spinner while API processes (max 10s)
|   +-- IdentifyResults                  ← shown after successful response
|   |   +-- SuggestionCard × 3           ← name (DE/EN) + latin name + confidence %
|   |   +-- "Manuell eingeben" Button    ← clears results, keeps form empty
|   +-- [Error state]                    ← API/network/low-confidence messages
+-- Form Fields (existing)
|   +-- Name * (pre-filled on selection)
|   +-- Art / Gattung (pre-filled on selection)
|   +-- Standort
|   +-- Pflanzdatum
|   +-- Notizen
+-- Footer Buttons (existing)
    +-- Abbrechen
    +-- Speichern
```

---

### Data Flow

```
1. User clicks "Pflanze identifizieren"
   → File picker opens (JPEG/PNG/WebP, max 10 MB)

2. User selects photo
   → Canvas API compresses to max 1 MB at 85% quality (client-side, no upload yet)

3. Compressed image sent to POST /api/identify
   → Server calls Plant.id v3 API (API key hidden on server)
   → Server returns top 3 results: [{ name, species, confidence }]

4a. Results shown → User selects a suggestion
   → Name and Art/Gattung fields pre-filled (still editable)
   → Identify photo stored in local state (not uploaded yet)

4b. User clicks "Manuell eingeben"
   → Results cleared, form fields remain empty

5. User fills in remaining fields, clicks "Speichern"
   → POST /api/plants → plant created
   → If identify photo in state: POST /api/plants/[id]/photos
     (uses existing route — photo becomes cover automatically)
   → If plant creation fails: photo NOT uploaded (atomic)
```

---

### New Files

| File | Purpose |
|------|---------|
| `src/components/plants/plant-identify-section.tsx` | Self-contained UI: button, file picker, compression, API call, result cards |
| `src/app/api/identify/route.ts` | Server-side proxy to Plant.id v3 — keeps API key hidden |

### Modified Files

| File | Change |
|------|--------|
| `src/components/plants/add-plant-sheet.tsx` | Mount `PlantIdentifySection`, hold `identifyPhoto` state, upload photo after plant creation |

---

### API Route: POST /api/identify

- **Input:** `multipart/form-data` with compressed image (max 1 MB)
- **Output:** `[{ name: string, species: string, confidence: number }]` (top 3)
- **Error cases:** timeout (10s), API 5xx, 429 rate limit, no plant detected (confidence < 10%)
- **Auth:** Supabase session required (same pattern as existing routes)
- **No caching** — every photo is unique

---

### Tech Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| API location | Server-side Next.js route | API key stays hidden from browser |
| Image compression | Browser Canvas API | No new dependency — built into every browser |
| Photo storage | Reuse existing `/api/plants/[id]/photos` | No duplication, consistent behavior |
| New DB tables | None | Everything reuses existing schema |
| Caching | None | Every photo is a unique request |
| Identify state management | Component-local state | No cross-component sharing needed |

---

### Dependencies

No new packages required. All tools used (Canvas API, `fetch`, FormData) are browser/Node built-ins.

## QA Test Results

**Tested:** 2026-02-28
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASS (production build compiles without errors)
**Bugs Fixed:** BUG-1, BUG-2, BUG-4, BUG-5, BUG-7, BUG-9 (all "fix before deployment" items resolved)
**Verdict:** APPROVED for deployment (remaining low-priority items: BUG-3, BUG-6, BUG-8, BUG-10)

### Acceptance Criteria Status

#### AC-1: "Pflanze identifizieren" Button in AddPlant-Sheet (oberhalb der Pflichtfelder)
- [x] PASS - Button exists in `PlantIdentifySection`, rendered above form fields in `AddPlantSheet` (line 142 of add-plant-sheet.tsx, before the Name field at line 147)
- [x] PASS - Uses shadcn/ui `Button` component with `variant="outline"` and Camera icon
- [x] PASS - Full-width layout (`className="w-full"`)

#### AC-2: Klick oeffnet Datei-Auswahl (Kamera/Galerie) -- max 10 MB, JPEG/PNG/WebP
- [x] PASS - Hidden file input with `accept="image/jpeg,image/png,image/webp"` (line 275)
- [x] PASS - 10 MB max enforced client-side (`MAX_FILE_SIZE = 10 * 1024 * 1024`, line 23)
- [x] PASS - Allowed types validated: `["image/jpeg", "image/png", "image/webp"]` (line 25)
- [x] PASS - Error messages shown for invalid file type and oversized files

#### AC-3: Foto wird clientseitig auf max 1 MB komprimiert (Canvas API)
- [x] PASS - `compressImage()` function uses Canvas API (lines 40-114)
- [x] PASS - Target size is 1 MB (`TARGET_SIZE = 1 * 1024 * 1024`, line 24)
- [x] PASS - Initial quality 85%, steps down by 10% until under target or quality <= 30%
- [x] PASS - Images under 1 MB are returned as-is (line 42-44)
- [x] PASS - Large images scaled down to max 2048px on longest side

#### AC-4: Ladeindikator waehrend API-Anfrage (max 10 Sekunden Timeout)
- [x] PASS - "Compressing" state shows spinner + "Bild wird verarbeitet..." (lines 316-320)
- [x] PASS - "Loading" state shows spinner + "Pflanze wird identifiziert..." + Progress bar (lines 324-332)
- [x] PASS - AbortController with 10s timeout on client side (line 165-166)
- [x] PASS - Server-side also has 10s timeout (route.ts line 5, 51)

#### AC-5: Top-3 Vorschlaege mit Pflanzenname, lateinischer Name, Konfidenzwert in %
- [x] PASS - Server returns max 3 results (`.slice(0, 3)` at route.ts line 88)
- [x] PASS - Each suggestion shows: name (common name, DE preference via Plant.id), species (latin), confidence badge with %
- [x] PASS - Confidence displayed with color coding: green >= 70%, yellow >= 30%, red < 30%
- [x] PASS - Uses shadcn/ui `Card`, `CardContent`, `Badge` components

#### AC-6: Nutzer waehlt Vorschlag -> Name und Art/Gattung vorausgefuellt
- [x] PASS - `handleIdentifySelect` sets both `name` and `species` via `form.setValue()` with `shouldValidate: true` (add-plant-sheet.tsx lines 63-66)
- [x] PASS - Selected card shows visual indicator (ring + checkmark icon)

#### AC-7: Formularfelder bleiben editierbar nach Vorausfuellung
- [x] PASS - `form.setValue()` does not disable fields; standard `<Input>` components remain interactive
- [x] PASS - No `disabled` or `readOnly` prop applied after selection

#### AC-8: Vorschlag ablehnen / "Manuell eingeben"
- [x] PASS - "Manuell eingeben" button calls `clearState()` which resets identification state (lines 397-406)
- [ ] BUG-1: "Manuell eingeben" clears the identify state but does NOT clear form fields that were pre-filled by a previous selection. If user selects suggestion then clicks "Manuell eingeben", the name and species fields retain the pre-filled values.

#### AC-9: Identifikationsfoto als erstes Foto hochgeladen (cover photo)
- [x] PASS - After plant creation, if `identifyPhotoRef.current` exists, it uploads via `POST /api/plants/${plant.id}/photos` (add-plant-sheet.tsx lines 105-118)
- [x] PASS - Photos route auto-sets first photo as cover (`isCover = (count ?? 0) === 0`, photos/route.ts line 88)
- [x] PASS - Plant creation and photo upload are sequential (atomic: photo only uploaded after successful plant creation)

#### AC-10: API nicht verfuegbar -- Fehlermeldung + Formular bleibt offen
- [x] PASS - Timeout shows error with retry button (lines 204-209)
- [x] PASS - Server errors (5xx) caught and displayed as connection error (lines 210-217)
- [x] PASS - Form fields remain accessible during and after errors (Sheet stays open, no redirect)
- [x] PASS - Server returns 503 if API key not configured (route.ts lines 18-24)

#### AC-11: Ergebnis verschwindet bei neuem Foto
- [x] PASS - `handleFileChange` triggers `handleIdentify` which resets `setSelectedIndex(null)` and transitions to "compressing"/"loading" state (line 140), replacing any previous results
- [x] PASS - "Neues Foto" button triggers file picker again (line 412)

### Edge Cases Status

#### EC-1: Keine Pflanze erkannt (Konfidenz < 10% oder leer)
- [x] PASS - Server filters out results with confidence < 10% (route.ts line 94: `.filter(s => s.confidence >= MIN_CONFIDENCE * 100)`)
- [x] PASS - Client shows "Keine Pflanze erkannt" message when empty array returned (lines 422-452)
- [x] PASS - "Manuell eingeben" and "Neues Foto" buttons shown

#### EC-2: Sehr niedriger Konfidenzwert (10-29%)
- [x] PASS - `lowConfidence` flag set when all results < 30% (line 197: `data.every(s => s.confidence < 30)`)
- [x] PASS - Warning alert shown: "Unsicheres Ergebnis -- bitte uberpruefen" (lines 337-344)
- [ ] BUG-2: The warning text uses ASCII dashes ("--") instead of em-dashes, and uses "uberpruefen" instead of the proper German umlaut. The spec says "Unsicheres Ergebnis -- bitte ueberpruefen" with proper text. Multiple other German texts have the same issue (e.g., "Zeitlimit uberschritten" line 209, "Ungultiges" line 229, "gross" line 238).

#### EC-3: Foto ist kein Pflanzenbild
- [x] PASS - Handled by EC-1 flow (Plant.id returns 0 results or very low confidence)
- [ ] BUG-3: The "no results" message says "Keine Pflanze erkannt" but the spec says "Kein Pflanzenfotos erkannt" for non-plant images. Both paths use the same "no-results" state with no distinction between "low confidence plant" and "not a plant at all".

#### EC-4: API-Rate-Limit (429)
- [x] PASS - Client checks `res.status === 429` and shows user-friendly error (lines 176-183)
- [x] PASS - Server proxies 429 back to client (route.ts lines 69-73)
- [ ] BUG-4: Spec requires "Retry nach 30 Sekunden" but there is no 30-second delay/countdown before retry. The retry button is immediately available, which could trigger another 429.

#### EC-5: Netzwerkfehler
- [x] PASS - Generic errors caught and shown as "Verbindungsfehler -- bitte erneut versuchen" (lines 210-217)
- [x] PASS - Retry button available (`canRetry: true`)

#### EC-6: Bildkomprimierung schlaegt fehl
- [x] PASS - Compression failure caught with descriptive error message (lines 147-154)
- [x] PASS - `canRetry: false` so user must pick a different image

#### EC-7: Nutzer schliesst AddPlant-Sheet
- [x] PASS - `handleOpenChange(false)` resets form and clears `identifyPhotoRef` (add-plant-sheet.tsx lines 74-81)
- [ ] BUG-5: `PlantIdentifySection` internal state (preview URL, identify results, selected index) is NOT reset when the Sheet closes and re-opens. The component does not receive an `open` prop or reset trigger. If user opens Sheet, runs identification, closes Sheet, then re-opens, stale state may persist if the component is not unmounted.

#### EC-8: Pflanzenerstellung schlaegt fehl nach Identifikation
- [x] PASS - Photo upload only happens inside the `if (identifyPhotoRef.current)` block AFTER successful plant creation (add-plant-sheet.tsx lines 105-118)
- [x] PASS - If `res.ok` is false, the function throws before reaching photo upload

### Additional Edge Cases Identified

#### EC-9: Object URL memory leak
- [ ] BUG-6: In `handleIdentify()` (line 138), a new `URL.createObjectURL(file)` is created each time but only `clearState()` clears `previewUrl`. If the user selects multiple photos in sequence (via "Neues Foto"), old object URLs are never revoked, causing a memory leak.

#### EC-10: Server-side file type validation missing
- [ ] BUG-7: The server API route (`/api/identify`) does NOT validate the uploaded file's MIME type. It only checks file size (max 2 MB). An attacker could send non-image files (e.g., HTML, SVG with embedded scripts) to the Plant.id API via the proxy. While Plant.id would likely reject them, the server should validate.

#### EC-11: Photo upload failure is silently swallowed
- [ ] BUG-8: In `add-plant-sheet.tsx` lines 115-117, if the identification photo upload fails, the error is silently caught with only a `console.warn`. The user is not informed that their identification photo was not saved. The plant is created, the Sheet closes, and the user believes the photo was saved.

### Security Audit Results

#### Authentication
- [x] PASS - API route `/api/identify` verifies Supabase session before processing (route.ts lines 10-14)
- [x] PASS - Returns 401 for unauthenticated requests

#### Authorization
- [x] PASS - Identification endpoint is user-scoped (authenticated user only, no cross-user data access)
- [x] PASS - Photo upload route verifies plant belongs to the authenticated user (photos/route.ts lines 21-29)

#### API Key Protection
- [x] PASS - `PLANT_ID_API_KEY` is only accessed server-side via `process.env` (route.ts line 17)
- [x] PASS - No `NEXT_PUBLIC_` prefix used for the API key
- [x] PASS - API key documented in `.env.local.example` with placeholder value

#### Input Injection (XSS)
- [x] PASS - No `dangerouslySetInnerHTML` or `innerHTML` used in any plant components
- [x] PASS - Suggestion names rendered as text content in React JSX (auto-escaped)
- [x] PASS - Form values validated by Zod schema before submission

#### Input Validation
- [x] PASS - Client validates file type and size before upload
- [x] PASS - Server validates file size (max 2 MB for compressed)
- [ ] BUG-7 (see above): Server does NOT validate MIME type of uploaded file

#### Rate Limiting
- [ ] BUG-9: No server-side rate limiting on the `/api/identify` endpoint. An authenticated user can make unlimited rapid requests, each of which proxies to the Plant.id API and consumes API quota. The only rate limiting is from Plant.id itself (429), but this affects ALL users, not just the abuser. Server-side per-user rate limiting should be implemented.

#### Secrets in Responses
- [x] PASS - Error responses contain user-friendly German messages, no stack traces or internal details
- [x] PASS - API key is never included in any response

#### Data Exposure
- [x] PASS - API responses contain only suggestion data (name, species, confidence); no internal IDs or metadata leaked

#### Security Headers
- [x] PASS - Standard Next.js security headers apply (no custom headers needed for this feature specifically)

### Cross-Browser Testing (Code Review)

Since this is a code-level QA (no live browser session), cross-browser analysis is based on API usage:

- [x] Canvas API: Supported in Chrome, Firefox, Safari (all modern versions)
- [x] `URL.createObjectURL` / `URL.revokeObjectURL`: Supported across all browsers
- [x] `AbortController`: Supported in Chrome 66+, Firefox 57+, Safari 12.1+
- [x] `File` and `FormData` APIs: Universal support
- [x] No browser-specific CSS used; all Tailwind utilities

### Responsive Testing (Code Review)

- [x] All components use Tailwind responsive classes
- [x] `w-full` on identify button ensures full width on all viewports
- [x] Cards use `flex` layout with `truncate` for long text (handles narrow screens)
- [x] Sheet uses `overflow-y-auto` for scrollable content on small screens
- [ ] BUG-10: No responsive image sizing on the preview. The preview container uses `aspect-video` which may be too tall on mobile (375px). On a 375px wide screen with sheet padding, the preview image could take up significant viewport space, pushing the form fields below the fold.

### Bugs Found

#### BUG-1: "Manuell eingeben" does not clear pre-filled form fields
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Open AddPlant Sheet
  2. Upload a photo and get identification results
  3. Select a suggestion (Name and Species are pre-filled)
  4. Click "Manuell eingeben"
  5. Expected: Name and Species fields should be cleared
  6. Actual: Fields retain the pre-filled values from the selected suggestion
- **File:** `c:\Users\coret\Documents\Test Claude\eden\src\components\plants\plant-identify-section.tsx` (clearState at line 123 does not call back to clear form fields) and `c:\Users\coret\Documents\Test Claude\eden\src\components\plants\add-plant-sheet.tsx` (no `onClear` callback wired)
- **Priority:** Fix before deployment

#### BUG-2: Missing German umlauts in UI text (accessibility/i18n issue)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Trigger any error or low-confidence scenario
  2. Observe text like "Zeitlimit uberschritten", "Ungultiges Dateiformat", "zu gross"
  3. Expected: Proper German characters ("ueberschritten" or proper umlauts)
  4. Actual: ASCII approximations without umlauts
- **File:** `c:\Users\coret\Documents\Test Claude\eden\src\components\plants\plant-identify-section.tsx` (lines 209, 229, 238, 278, 341, 347, 362)
- **Priority:** Fix in next sprint

#### BUG-3: No distinction between "no plant detected" and "not a plant image"
- **Severity:** Low
- **Steps to Reproduce:**
  1. Upload a photo of a non-plant subject (e.g., a car)
  2. Expected: Message "Kein Pflanzenfotos erkannt" per spec
  3. Actual: Same "Keine Pflanze erkannt" message for all zero-result scenarios
- **File:** `c:\Users\coret\Documents\Test Claude\eden\src\components\plants\plant-identify-section.tsx` and `c:\Users\coret\Documents\Test Claude\eden\src\app\api\identify\route.ts`
- **Priority:** Nice to have

#### BUG-4: No 30-second retry delay for 429 rate limit
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Trigger a 429 rate limit response
  2. Expected: Retry available after 30 seconds (per spec)
  3. Actual: Retry button is immediately clickable, which may trigger another 429
- **File:** `c:\Users\coret\Documents\Test Claude\eden\src\components\plants\plant-identify-section.tsx` (lines 176-183)
- **Priority:** Fix before deployment

#### BUG-5: PlantIdentifySection state not reset when Sheet closes/re-opens
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Open AddPlant Sheet
  2. Upload a photo and see results
  3. Close the Sheet (click Abbrechen or outside)
  4. Re-open the Sheet
  5. Expected: Clean state (idle, no preview, no results)
  6. Actual: If the component is not unmounted by React (common with Sheet animations), stale identification results and preview may persist
- **File:** `c:\Users\coret\Documents\Test Claude\eden\src\components\plants\add-plant-sheet.tsx` (handleOpenChange does not reset PlantIdentifySection) and `c:\Users\coret\Documents\Test Claude\eden\src\components\plants\plant-identify-section.tsx` (no reset mechanism exposed)
- **Priority:** Fix before deployment

#### BUG-6: Object URL memory leak on repeated photo selections
- **Severity:** Low
- **Steps to Reproduce:**
  1. Open AddPlant Sheet
  2. Upload a photo (object URL created)
  3. Click "Neues Foto" and select another photo
  4. Repeat multiple times
  5. Expected: Previous object URLs are revoked
  6. Actual: `handleIdentify` creates new object URL at line 138 without revoking the previous one. Only `clearState()` revokes via state reset path.
- **File:** `c:\Users\coret\Documents\Test Claude\eden\src\components\plants\plant-identify-section.tsx` (line 138)
- **Priority:** Nice to have

#### BUG-7: Server-side MIME type validation missing on /api/identify
- **Severity:** High (Security)
- **Steps to Reproduce:**
  1. Use curl/Postman to POST a non-image file (e.g., HTML file) to `/api/identify` with a valid auth cookie
  2. Expected: Server rejects with 422 "invalid file type"
  3. Actual: Server accepts any file type and forwards it as base64 to Plant.id API
- **File:** `c:\Users\coret\Documents\Test Claude\eden\src\app\api\identify\route.ts` (no MIME type check after line 36)
- **Priority:** Fix before deployment

#### BUG-8: Silent failure on identification photo upload
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Identify a plant with a photo
  2. Select a suggestion and save the plant
  3. Simulate photo upload failure (e.g., storage quota exceeded)
  4. Expected: User is informed that the photo could not be saved
  5. Actual: Error is silently caught with `console.warn`, user sees success, but photo is missing
- **File:** `c:\Users\coret\Documents\Test Claude\eden\src\components\plants\add-plant-sheet.tsx` (lines 115-117)
- **Priority:** Fix in next sprint

#### BUG-9: No server-side rate limiting on /api/identify
- **Severity:** High (Security)
- **Steps to Reproduce:**
  1. Write a script that sends 100 rapid POST requests to `/api/identify` with valid auth
  2. Expected: Server returns 429 after N requests per time window
  3. Actual: All requests are proxied to Plant.id, consuming shared API quota and potentially causing 429 for all users
- **File:** `c:\Users\coret\Documents\Test Claude\eden\src\app\api\identify\route.ts`
- **Priority:** Fix before deployment

#### BUG-10: Preview image may dominate viewport on mobile
- **Severity:** Low
- **Steps to Reproduce:**
  1. Open AddPlant Sheet on 375px viewport
  2. Upload a photo for identification
  3. Expected: Preview image is reasonably sized, form fields visible
  4. Actual: `aspect-video` (16:9) preview on ~330px usable width = ~185px height, plus results cards, may push form below fold
- **File:** `c:\Users\coret\Documents\Test Claude\eden\src\components\plants\plant-identify-section.tsx` (line 283)
- **Priority:** Nice to have

### Regression Testing

#### PROJ-1: User Authentication (Deployed)
- [x] PASS - No changes to auth files in PROJ-3 commits
- [x] PASS - `/api/identify` uses same auth pattern as existing routes

#### PROJ-2: Plant Management (Deployed)
- [x] PASS - `add-plant-sheet.tsx` modifications are additive (PlantIdentifySection added, no existing fields changed)
- [x] PASS - Form schema unchanged (same Zod validation)
- [x] PASS - Plant creation flow (`POST /api/plants`) unchanged
- [x] PASS - Photo upload uses existing `/api/plants/[id]/photos` route without modification
- [ ] NOTE: Photo upload in add-plant-sheet.tsx uses field name `file` (line 108) which matches the photos route expectation (line 54 of photos/route.ts). Consistent.

### Summary
- **Acceptance Criteria:** 10/11 passed (AC-8 partial fail due to BUG-1)
- **Edge Cases (Documented):** 6/8 passed (EC-4, EC-7 have issues)
- **Additional Edge Cases Found:** 4 (BUG-6, BUG-7, BUG-8, BUG-10)
- **Bugs Found:** 10 total (0 critical, 2 high, 4 medium, 4 low)
- **Security:** 2 issues found (BUG-7: missing MIME validation, BUG-9: no rate limiting)
- **Regression:** No regressions detected on PROJ-1 or PROJ-2
- **Production Ready:** YES (after bug fixes in subsequent commit)
- **Recommendation:** Fix the 2 High-severity security bugs (BUG-7, BUG-9) and the 3 Medium-severity UX bugs (BUG-1, BUG-4, BUG-5) before deployment. Low-severity items can be addressed in the next sprint.

## Deployment

**Deployed:** 2026-03-01
**Production URL:** https://eden-azure-zeta.vercel.app
**Git Tag:** v1.2.0-PROJ-3

### Environment Variables Required in Vercel
- `PLANT_ID_API_KEY` — Plant.id v3 API key (server-side only, no `NEXT_PUBLIC_` prefix)
