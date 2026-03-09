# PROJ-14: Photo Gallery Lightbox

## Status: Planned
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
_To be added by /qa_

## Deployment
_To be added by /deploy_
