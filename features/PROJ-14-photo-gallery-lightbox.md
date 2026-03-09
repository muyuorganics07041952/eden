# PROJ-14: Photo Gallery Lightbox

## Status: Deployed
**Created:** 2026-03-09
**Last Updated:** 2026-03-09

## Dependencies
- Requires: PROJ-2 (Plant Management) — `plant_photos`-Tabelle und bestehende Upload-API

## Overview
Die aktuelle Fotogalerie auf der Pflanzen-Detailseite erlaubt Upload, Thumbnail-Ansicht und Hauptfoto-Auswahl. Fotos können aber nicht vergrößert oder im Vollbild betrachtet werden. Dieses Feature ersetzt das bisherige Thumbnail-Klick-Verhalten durch einen Lightbox-Viewer und führt einen dedizierten "Verwalten"-Modus für Lösch- und Cover-Aktionen ein.

## User Stories

- Als Gartenbesitzer möchte ich ein Foto durch Klick auf die Thumbnail-Leiste in voller Größe betrachten können, damit ich Details erkennen kann.
- Als Gartenbesitzer möchte ich in der Lightbox per Pfeil-Buttons zwischen meinen Fotos navigieren können, damit ich alle Fotos einer Pflanze bequem durchblättern kann.
- Als Gartenbesitzer möchte ich auf dem Smartphone per Swipe-Geste in der Lightbox zwischen Fotos wechseln können.
- Als Gartenbesitzer möchte ich die Lightbox per ESC-Taste oder Klick auf den Schließen-Button schließen können.
- Als Gartenbesitzer möchte ich über einen "Fotos verwalten"-Button in einen Verwaltungsmodus wechseln, in dem ich Fotos löschen und das Hauptfoto auswählen kann.
- Als Gartenbesitzer möchte ich im normalen Modus keine Lösch-Buttons auf den Thumbnails sehen, damit die Galerie aufgeräumt wirkt.

## Acceptance Criteria

### Lightbox

- [ ] Klick auf ein Thumbnail öffnet die Lightbox mit dem angeklickten Foto in voller Größe
- [ ] Klick auf das große Hauptfoto (nicht im Verwalten-Modus) öffnet die Lightbox
- [ ] Die Lightbox rendert als Vollbild-Overlay über dem gesamten Seiteninhalt
- [ ] Die Lightbox zeigt Pfeil-Buttons links und rechts zur Navigation (sichtbar, tappbar)
- [ ] Auf Touch-Geräten kann per horizontalem Swipe zum nächsten/vorherigen Foto gewechselt werden
- [ ] Auf Desktop navigieren die Pfeiltasten (←/→) zwischen Fotos; ESC schließt die Lightbox
- [ ] Die Lightbox zeigt einen Schließen-Button (×) oben rechts
- [ ] Die Lightbox zeigt einen Foto-Indikator (z. B. „2 / 4") um die aktuelle Position anzuzeigen
- [ ] Beim ersten und letzten Foto sind die entsprechenden Navigations-Pfeile deaktiviert oder ausgeblendet
- [ ] Die Lightbox enthält keine Lösch- oder Cover-Aktionen (reine Ansicht)
- [ ] Klick auf den Overlay-Hintergrund (außerhalb des Fotos) schließt die Lightbox

### Verwalten-Modus

- [ ] Unterhalb der Thumbnail-Leiste gibt es einen Button "Fotos verwalten"
- [ ] Klick auf "Fotos verwalten" wechselt in den Verwalten-Modus; der Button zeigt nun "Fertig"
- [ ] Im Verwalten-Modus zeigt jedes Thumbnail ein "×"-Löschen-Icon
- [ ] Im Verwalten-Modus zeigt jedes Thumbnail (außer dem aktuellen Cover) einen "Hauptfoto"-Button
- [ ] Das aktuelle Cover-Thumbnail ist im Verwalten-Modus markiert (z. B. Badge "Cover")
- [ ] Klick auf "×" im Verwalten-Modus löscht das Foto (mit Ladeindikator)
- [ ] Klick auf "Hauptfoto" im Verwalten-Modus setzt das Foto als Cover (mit Ladeindikator)
- [ ] Im Verwalten-Modus öffnet Klick auf ein Thumbnail NICHT die Lightbox
- [ ] Klick auf "Fertig" beendet den Verwalten-Modus

### Normaler Modus (kein Verwalten-Modus)

- [ ] Im normalen Modus sind keine Lösch-Buttons auf den Thumbnails sichtbar
- [ ] Im normalen Modus sind keine "Hauptfoto setzen"-Buttons auf den Thumbnails sichtbar
- [ ] Klick auf Thumbnail öffnet die Lightbox

### Foto hinzufügen (unverändert)

- [ ] Der "Foto hinzufügen"-Button bleibt in beiden Modi an der gleichen Stelle
- [ ] Das Limit von 5 Fotos pro Pflanze bleibt unverändert

## Edge Cases

- **Nur 1 Foto:** Lightbox zeigt keine Navigationspfeile (oder deaktiviert), kein Indikator „1 / 1" (oder weglassen)
- **Letztes Foto wird gelöscht:** Nach dem Löschen verbleibt kein Cover-Foto — falls noch Fotos vorhanden, wird das erste automatisch Cover (bestehende Logik)
- **Foto wird in der Lightbox gezeigt und extern gelöscht:** Kein Fehler — beim Schließen der Lightbox aktualisiert sich die Galerie durch `onPhotosChange`
- **Swipe auf Desktop:** Swipe-Geste wird ignoriert (keine Mausevents), Tastatur-Navigation bleibt
- **Swipe auf Mobile ohne Touch-Events:** Graceful degradation — Navigation nur per Pfeile
- **Kein Foto vorhanden:** "Kein Foto vorhanden"-Platzhalter bleibt, kein Lightbox-Trigger, Verwalten-Button ausgeblendet
- **Verwalten-Modus bei 1 Foto:** Thumbnail zeigt "×" (löschen) aber keinen "Hauptfoto"-Button (da es bereits Cover ist)
- **Seite neu laden während Verwalten-Modus offen:** Verwalten-Modus startet im Standard-Zustand (geschlossen)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur

```
PlantDetailPage (unverändert)
+-- PhotoGallery (stark erweitert)
    +-- Hauptfoto (großes Bild)
    |   +-- Klick öffnet Lightbox [nur Normal-Modus]
    |
    +-- Thumbnail-Leiste
    |   +-- [Normal-Modus] Klick → Lightbox öffnen
    |   +-- [Verwalten-Modus] Jedes Thumbnail zeigt:
    |       +-- × Löschen-Button
    |       +-- "Hauptfoto"-Button (außer bei aktuellem Cover)
    |       +-- "Cover"-Badge (beim aktuellen Hauptfoto)
    |
    +-- "Foto hinzufügen"-Button (unverändert)
    +-- "Fotos verwalten" / "Fertig"-Toggle-Button [NEU]
    |
    +-- PhotoLightbox [NEU — nur sichtbar wenn ein Foto geöffnet ist]
        +-- Vollbild-Overlay (dunkler Hintergrund, Klick schließt)
        +-- Foto (maximal groß, Seitenverhältnis erhalten)
        +-- ← Pfeil-Button (ausgeblendet beim ersten Foto)
        +-- → Pfeil-Button (ausgeblendet beim letzten Foto)
        +-- × Schließen-Button (oben rechts)
        +-- Foto-Indikator "2 / 4" (ausgeblendet bei nur 1 Foto)
```

### Datenmodell

Kein neues Datenmodell notwendig. Alle Daten kommen aus dem bestehenden `PlantPhoto`-Typ:

```
Jedes Foto hat (unverändert):
- Eindeutige ID
- URL (signierter Supabase-Link)
- is_cover (ob es das Hauptfoto ist)
- plant_id und user_id

Kein neues Backend — alle bestehenden API-Endpunkte bleiben unverändert.
```

Zwei neue **UI-Zustände** werden lokal in `PhotoGallery` verwaltet:

```
managingMode: ja/nein — ob der Verwalten-Modus aktiv ist
lightboxIndex: Nummer des geöffneten Fotos (oder "kein Foto geöffnet")
```

### Technische Entscheidungen

| Entscheidung | Empfehlung | Begründung |
|---|---|---|
| Lightbox-Overlay | Eigenes `fixed`-Overlay (kein shadcn Dialog) | Dialog hat Padding-Grenzen; für Vollbild-Fotos brauchen wir ein reines schwarzes Overlay ohne Einschränkungen |
| Swipe-Erkennung | Native Browser-Touch-Events | Kein neues Paket nötig — einfaches "Startposition merken, Endposition vergleichen" |
| Keyboard-Navigation | Native `keydown`-Event im Lightbox-Component | Standardmuster, kein extra Paket |
| Verwalten-Modus | Lokaler Boolean-State in PhotoGallery | Kein Server-State; rein visuell |
| Hintergrund-Klick | Prüfen ob Klick direkt auf Overlay traf (nicht auf Foto) | Verhindert Schließen beim Klick auf das Foto selbst |

### Neue Dateien / Änderungen

| Was | Typ |
|---|---|
| `src/components/plants/photo-lightbox.tsx` | Neu |
| `src/components/plants/photo-gallery.tsx` — Verwalten-Toggle, Lightbox-Trigger, Thumbnail-Logik umbauen | Erweitert |

### Neue Pakete
Keine — alles mit nativen Browser-Events und bestehendem Tailwind CSS umsetzbar.

## QA Test Results

**Tested:** 2026-03-09
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASS (production build compiles successfully)

### Acceptance Criteria Status

#### AC-1: Lightbox

- [x] Klick auf ein Thumbnail oeffnet die Lightbox mit dem angeklickten Foto in voller Groesse -- `handleThumbnailClick(index)` sets `lightboxIndex` which renders `PhotoLightbox` with `initialIndex`
- [x] Klick auf das grosse Hauptfoto (nicht im Verwalten-Modus) oeffnet die Lightbox -- `handleMainPhotoClick()` checks `!managingMode` and sets `lightboxIndex` to the cover photo index
- [x] Die Lightbox rendert als Vollbild-Overlay ueber dem gesamten Seiteninhalt -- Uses `fixed inset-0 z-50` CSS classes
- [x] Die Lightbox zeigt Pfeil-Buttons links und rechts zur Navigation (sichtbar, tappbar) -- ChevronLeft/ChevronRight buttons with `h-12 w-12` size
- [x] Auf Touch-Geraeten kann per horizontalem Swipe zum naechsten/vorherigen Foto gewechselt werden -- `onTouchStart`/`onTouchEnd` handlers with 50px threshold
- [x] Auf Desktop navigieren die Pfeiltasten zwischen Fotos; ESC schliesst die Lightbox -- `useEffect` with `keydown` listener for ArrowLeft, ArrowRight, Escape
- [x] Die Lightbox zeigt einen Schliessen-Button oben rechts -- X button with `absolute top-4 right-4`
- [x] Die Lightbox zeigt einen Foto-Indikator (z. B. "2 / 4") -- Renders `{currentIndex + 1} / {total}` when `showIndicator` is true
- [x] Beim ersten und letzten Foto sind die entsprechenden Navigations-Pfeile ausgeblendet -- Conditional rendering: `{!isFirst && ...}` and `{!isLast && ...}`
- [x] Die Lightbox enthaelt keine Loesch- oder Cover-Aktionen (reine Ansicht) -- PhotoLightbox component contains no delete/cover functionality
- [x] Klick auf den Overlay-Hintergrund (ausserhalb des Fotos) schliesst die Lightbox -- `handleOverlayClick` checks `e.target === overlayRef.current`

#### AC-2: Verwalten-Modus

- [x] Unterhalb der Thumbnail-Leiste gibt es einen Button "Fotos verwalten" -- Button rendered when `photos.length > 0`
- [x] Klick auf "Fotos verwalten" wechselt in den Verwalten-Modus; der Button zeigt nun "Fertig" -- `onClick={() => setManagingMode(!managingMode)}` with conditional text
- [x] Im Verwalten-Modus zeigt jedes Thumbnail ein "x"-Loeschen-Icon -- Delete button rendered inside `{managingMode && ...}` block
- [x] Im Verwalten-Modus zeigt jedes Thumbnail (ausser dem aktuellen Cover) einen "Hauptfoto"-Button -- `{!photo.is_cover && ...}` conditional rendering
- [x] Das aktuelle Cover-Thumbnail ist im Verwalten-Modus markiert (z. B. Badge "Cover") -- `{photo.is_cover && <Badge>Cover</Badge>}`
- [x] Klick auf "x" im Verwalten-Modus loescht das Foto (mit Ladeindikator) -- `handleRemovePhoto` sets `removingPhoto` state, shows Loader2 spinner
- [x] Klick auf "Hauptfoto" im Verwalten-Modus setzt das Foto als Cover (mit Ladeindikator) -- `handleSetCover` sets `settingCover` state, shows Loader2 spinner
- [x] Im Verwalten-Modus oeffnet Klick auf ein Thumbnail NICHT die Lightbox -- `handleThumbnailClick` returns early if `managingMode`
- [x] Klick auf "Fertig" beendet den Verwalten-Modus -- Same toggle button sets `managingMode` to false

#### AC-3: Normaler Modus (kein Verwalten-Modus)

- [x] Im normalen Modus sind keine Loesch-Buttons auf den Thumbnails sichtbar -- Delete buttons only rendered inside `{managingMode && ...}`
- [x] Im normalen Modus sind keine "Hauptfoto setzen"-Buttons auf den Thumbnails sichtbar -- "Hauptfoto" buttons only rendered inside `{managingMode && ...}`
- [x] Klick auf Thumbnail oeffnet die Lightbox -- `handleThumbnailClick` calls `setLightboxIndex(index)`

#### AC-4: Foto hinzufuegen (unveraendert)

- [x] Der "Foto hinzufuegen"-Button bleibt in beiden Modi an der gleichen Stelle -- Button is in the action buttons row, always visible when `canAddMore`
- [x] Das Limit von 5 Fotos pro Pflanze bleibt unveraendert -- `MAX_PHOTOS = 5` constant unchanged, server-side also enforces

### Edge Cases Status

#### EC-1: Nur 1 Foto
- [x] Lightbox zeigt keine Navigationspfeile -- `isFirst` and `isLast` are both true, both arrows hidden
- [x] Kein Indikator "1 / 1" -- `showIndicator = total > 1` is false when only 1 photo

#### EC-2: Letztes Foto wird geloescht
- [x] Falls noch Fotos vorhanden, wird das erste automatisch Cover -- `handleRemovePhoto` logic sets `remaining[0].is_cover = true`; server-side also handles this

#### EC-3: Foto wird in der Lightbox gezeigt und extern geloescht
- [x] Kein Fehler -- `currentPhoto = photos[currentIndex]`, if null returns null; gallery updates via `onPhotosChange`

#### EC-4: Swipe auf Desktop
- [x] Swipe-Geste wird ignoriert (keine Mausevents) -- Touch events only, no mouse drag handlers

#### EC-5: Swipe auf Mobile ohne Touch-Events
- [x] Graceful degradation -- Arrow buttons are always visible as fallback

#### EC-6: Kein Foto vorhanden
- [x] "Kein Foto vorhanden"-Platzhalter bleibt -- Rendered when `!coverPhoto`
- [x] Kein Lightbox-Trigger -- `handleMainPhotoClick` returns early if `!coverPhoto`
- [x] Verwalten-Button ausgeblendet -- Only rendered when `photos.length > 0`

#### EC-7: Verwalten-Modus bei 1 Foto
- [x] Thumbnail zeigt "x" (loeschen) -- Always shown in managing mode
- [x] Keinen "Hauptfoto"-Button (da es bereits Cover ist) -- `{!photo.is_cover && ...}` hides it for the cover photo

#### EC-8: Seite neu laden waehrend Verwalten-Modus offen
- [x] Verwalten-Modus startet im Standard-Zustand (geschlossen) -- `useState(false)` initializes to closed

### Additional Edge Cases Identified by QA

#### EC-9: Lightbox index out of bounds after photo deletion
- [ ] BUG: If the lightbox is open showing photo at index 3 (out of 4) and a photo is deleted externally (e.g., in another tab), `photos[currentIndex]` may be undefined. The component handles this with `if (!currentPhoto) return null`, but the lightbox disappears without user feedback. The `lightboxIndex` state in `PhotoGallery` is not reset, so the lightbox remains "open" with a null render until the user interacts again.

#### EC-10: Manage mode delete button overlaps thumbnail boundary
- [x] The delete button positioned at `-top-1.5 -right-1.5` extends outside the thumbnail's bounding box -- This is intentional per design (standard pattern for floating close buttons)

### Security Audit Results

- [x] Authentication: All photo API endpoints (POST, DELETE, PATCH) verify user session via `supabase.auth.getUser()`
- [x] Authorization: All API endpoints filter by `user_id` -- users cannot access other users' photos
- [x] Input validation (upload): Server validates file size (5MB max), file type (JPEG/PNG/WebP only), and photo count (max 5)
- [x] Input validation (client): Client validates file size before upload
- [x] No new API endpoints introduced -- existing endpoints are reused
- [x] XSS: Photo URLs come from Supabase signed URLs, not user-controllable strings rendered as HTML
- [x] No sensitive data exposed in lightbox component
- [x] Body scroll lock properly cleaned up on unmount
- [x] COVERED: Global rate limiter in `proxy.ts` (30 req/10s per IP) covers all `/api/` routes including photo DELETE and PATCH endpoints

#### Security Notes (Informational)
- The `img` tag in the lightbox uses `src={currentPhoto.url}` with signed Supabase URLs. These URLs expire after 3600 seconds (1 hour). If a user keeps the lightbox open for more than 1 hour, the image will fail to load. This is not a security issue but a UX consideration.
- The lightbox uses `draggable={false}` on images which prevents drag-and-drop but does not prevent right-click "Save Image As". This is expected behavior and not a security concern for a personal plant photo app.

### Cross-Browser Testing (Code Review)

- [x] Chrome: Standard React event handlers, no browser-specific APIs used
- [x] Firefox: Touch events may not fire on Firefox desktop (expected -- desktop uses keyboard nav)
- [x] Safari: `TouchEvent` API is supported; `fixed` positioning works correctly in modern Safari
- [ ] BUG: Safari iOS -- `overflow: hidden` on `document.body` may not fully prevent background scrolling on iOS Safari. The standard workaround requires also setting `position: fixed` on the body and restoring scroll position on close.

### Responsive Testing (Code Review)

- [x] Mobile (375px): Arrow buttons use `left-2`/`right-2` for mobile, adequate tap targets at `h-12 w-12`
- [x] Tablet (768px): Photo scales with `max-h-[85vh] max-w-[90vw]`, works well at tablet sizes
- [x] Desktop (1440px): Arrow buttons use `md:left-4`/`md:right-4` for desktop spacing
- [ ] BUG: Thumbnail manage mode buttons ("Hauptfoto") at `text-[9px]` may be too small for mobile tap targets (recommended minimum 44x44px per WCAG). The button has `h-5` (20px) which is below the recommended minimum.

### Accessibility Review

- [x] Lightbox has `role="dialog"` and `aria-modal="true"`
- [x] Close button has `aria-label="Lightbox schliessen"`
- [x] Navigation buttons have aria-labels ("Vorheriges Foto", "Naechstes Foto")
- [x] Main photo button has `aria-label="Foto in Vollansicht oeffnen"`
- [x] FIXED (BUG-1): Focus trap implemented via Tab/Shift+Tab intercept in keydown handler; cycles through focusable elements inside the overlay
- [x] FIXED (BUG-2): On mount, `useEffect` focuses the close button via `closeButtonRef`

### Bugs Found

#### BUG-1: No focus trap in lightbox dialog
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Go to a plant detail page with multiple photos
  2. Click a thumbnail to open the lightbox
  3. Press Tab repeatedly
  4. Expected: Focus cycles through lightbox controls only (close, prev, next)
  5. Actual: Focus escapes to elements behind the overlay
- **Priority:** ~~Fix in next sprint~~ **FIXED** — Tab/Shift+Tab intercepted in keydown handler

#### BUG-2: Focus not moved to lightbox on open
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Navigate to a plant detail page using keyboard
  2. Click a thumbnail to open the lightbox
  3. Expected: Focus moves to the lightbox (close button or the dialog itself)
  4. Actual: Focus remains on the thumbnail behind the overlay
- **Priority:** ~~Fix in next sprint~~ **FIXED** — `useEffect` focuses close button on mount

#### BUG-3: iOS Safari background scroll not fully prevented
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Open the app on an iPhone (Safari)
  2. Navigate to a plant detail page with photos
  3. Tap a thumbnail to open the lightbox
  4. Try scrolling by swiping on the overlay background
  5. Expected: Background content does not scroll
  6. Actual: Background content may scroll through the overlay on iOS Safari
- **Priority:** Fix in next sprint

#### BUG-4: Small touch targets for "Hauptfoto" button in manage mode on mobile
- **Severity:** Low
- **Steps to Reproduce:**
  1. Open the app on a mobile device (375px viewport)
  2. Navigate to a plant with multiple photos
  3. Tap "Fotos verwalten"
  4. Try to tap the "Hauptfoto" button on a non-cover thumbnail
  5. Expected: Button is easily tappable
  6. Actual: Button is only 20px tall with 9px font, difficult to tap accurately
- **Priority:** Fix in next sprint

#### BUG-5: No rate limiting on photo DELETE and cover PATCH endpoints
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Open browser dev tools Network tab
  2. Rapidly send DELETE requests to `/api/plants/{id}/photos/{photoId}`
  3. Expected: Rate limiting returns 429 after excessive requests
  4. Actual: All requests are processed without throttling
- **Priority:** ~~Fix in next sprint~~ **COVERED** — Global rate limiter in `proxy.ts` (30 req/10s per IP) applies to all `/api/` routes

#### BUG-6: Lightbox index not reset when photos array changes
- **Severity:** Low
- **Steps to Reproduce:**
  1. Open lightbox on the last photo (e.g., photo 4 of 4)
  2. In another tab, delete that photo from the same plant
  3. Return to the first tab
  4. Expected: Lightbox adjusts to show a valid photo or closes gracefully
  5. Actual: Lightbox renders null (blank) since `photos[3]` no longer exists; the lightbox overlay remains visible but empty
- **Priority:** Nice to have

### Summary
- **Acceptance Criteria:** 26/26 passed
- **Edge Cases:** 12/13 passed (1 minor edge case bug)
- **Bugs Found:** 6 total (0 critical, 0 high, 4 medium, 2 low)
- **Security:** 1 medium issue (no rate limiting on photo endpoints)
- **Accessibility:** 2 medium issues (no focus trap, no focus management)
- **Production Ready:** YES (conditionally)
- **Recommendation:** All acceptance criteria pass. The bugs found are medium/low severity and relate to accessibility improvements, iOS Safari edge case, and rate limiting. None block deployment. Recommend deploying and addressing the medium bugs (BUG-1, BUG-2, BUG-3, BUG-5) in the next sprint.

## Deployment

- **Production URL:** https://eden-garden.vercel.app
- **Deployed:** 2026-03-09
- **Deployment Method:** Push to `main` → Vercel auto-deploy
- **Git Tag:** `v1.14.0-PROJ-14`
- **No database migrations required** (frontend-only feature)
- **Bugs fixed before deploy:** BUG-1 (focus trap), BUG-2 (focus on open), BUG-5 (covered by global rate limiter)
- **Remaining open bugs:** BUG-3 (iOS Safari scroll), BUG-4 (small tap targets), BUG-6 (lightbox index out of bounds) — addressed in future sprint
