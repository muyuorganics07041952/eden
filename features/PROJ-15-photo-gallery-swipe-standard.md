# PROJ-15: Swipe-Navigation in der Standardansicht der Fotogalerie

## Status: Deployed
**Created:** 2026-03-09
**Last Updated:** 2026-03-09

## Dependencies
- Requires: PROJ-14 (Photo Gallery Lightbox) — `photo-gallery.tsx` und `PhotoLightbox`-Komponente

## Overview
Die Standardansicht der Fotogalerie (großes Hauptfoto auf der Pflanzen-Detailseite) unterstützt nur einen statischen Foto-Anzeige. Dieses Feature erweitert die Standardansicht um horizontale Swipe-Navigation, sodass Nutzer auf Touch-Geräten direkt im Hauptbild durch alle Fotos blättern können – ohne die Vollbildansicht (Lightbox) öffnen zu müssen. Zusätzlich wird das Thumbnail-Highlight synchron mit dem aktuell angezeigten Foto aktualisiert.

## User Stories

- Als Gartenbesitzer möchte ich in der Standardansicht per horizontalem Swipe zwischen meinen Fotos wechseln können, damit ich schnell durch alle Fotos blättern kann ohne die Vollbildansicht öffnen zu müssen.
- Als Gartenbesitzer möchte ich visuelles Feedback sehen, welches Foto gerade in der Hauptansicht angezeigt wird (Thumbnail-Ring), damit ich immer weiß, an welcher Stelle in der Galerie ich mich befinde.
- Als Gartenbesitzer möchte ich durch Klick auf ein Thumbnail direkt zu diesem Foto in der Hauptansicht springen, damit ich gezielt ein bestimmtes Foto auswählen kann.
- Als Gartenbesitzer möchte ich dass beim Öffnen der Lightbox per Klick auf das Hauptfoto das aktuell angezeigte Foto (nicht zwingend das Cover) in der Lightbox erscheint.

## Acceptance Criteria

### Swipe-Navigation Hauptansicht
- [ ] Wischen nach links (Finger von rechts nach links) zeigt das nächste Foto in der Hauptansicht
- [ ] Wischen nach rechts (Finger von links nach rechts) zeigt das vorherige Foto in der Hauptansicht
- [ ] Der Swipe-Schwellenwert beträgt 50px (kürzere Wischbewegungen werden ignoriert)
- [ ] Am ersten Foto stoppt die Rückwärts-Navigation (kein Wrapping)
- [ ] Am letzten Foto stoppt die Vorwärts-Navigation (kein Wrapping)

### Thumbnail-Synchronisation
- [ ] Das Thumbnail-Ring (ring-2 ring-primary) zeigt immer das aktuell in der Hauptansicht angezeigte Foto
- [ ] Beim Swipe aktualisiert sich das Thumbnail-Highlight sofort
- [ ] Im Verwalten-Modus bleibt die Cover-Badge unabhängig vom Thumbnail-Highlight sichtbar

### Thumbnail-Klick
- [ ] Klick auf ein Thumbnail (normaler Modus) aktualisiert die Hauptansicht auf dieses Foto UND öffnet die Lightbox
- [ ] Klick auf ein Thumbnail (Verwalten-Modus) öffnet weder Hauptansicht-Update noch Lightbox (unverändert)

### Lightbox-Öffnung per Hauptfoto
- [ ] Klick auf das Hauptfoto öffnet die Lightbox beim aktuell angezeigten Foto (nicht zwingend dem Cover)

### Initialzustand
- [ ] Die Hauptansicht zeigt beim Laden das Cover-Foto (oder das erste Foto falls kein Cover gesetzt)

## Edge Cases

- **Nur 1 Foto:** Swipe-Gesten werden ignoriert (Schwellenwert-Logik verhindert Navigation), keine sichtbaren Auswirkungen.
- **Foto wird gelöscht:** `safeMainIndex = Math.min(mainPhotoIndex, photos.length - 1)` klemmt den Index automatisch auf das letzte verbleibende Foto.
- **Verwalten-Modus:** Swipe funktioniert auch im Verwalten-Modus (Hauptansicht wechselt), Thumbnail-Klicks navigieren aber nicht (wie bisher).
- **Desktop ohne Touch:** Swipe-Gesten werden nicht ausgelöst (Touch-Events nur auf Touch-Geräten). Navigation erfolgt über Thumbnail-Klick.
- **Kein Foto vorhanden:** Swipe-Handler registriert sich auf dem Container-Div, hat aber keinen Effekt, da `currentMainPhoto` null ist und kein Foto angezeigt wird.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_Dieses Feature ist eine rein frontendbasierte Erweiterung von `photo-gallery.tsx`. Kein Backend erforderlich._

**Geänderte Dateien:**
- `src/components/plants/photo-gallery.tsx`
  - Neuer `mainPhotoIndex`-State (init: Cover-Index oder 0)
  - Neuer `touchStartXMain`-Ref
  - `safeMainIndex` = `Math.min(mainPhotoIndex, Math.max(0, photos.length - 1))`
  - `handleMainTouchStart` / `handleMainTouchEnd` auf dem Hauptfoto-Container
  - `handleThumbnailClick` setzt `mainPhotoIndex` zusätzlich zu `lightboxIndex`
  - `handleMainPhotoClick` öffnet Lightbox bei `safeMainIndex`
  - Thumbnail-Ring: `index === safeMainIndex` statt `photo.is_cover`

## QA Test Results
_To be added by /qa_

## Deployment

- **Deployed:** 2026-03-09 (zusammen mit PROJ-14 Swipe-Fix, in `photo-gallery.tsx`)
- **Deployment Method:** Direkte Code-Änderung ohne separaten Deploy-Zyklus (da PROJ-14 bereits deployed war)
- **No database migrations required** (rein frontend)
