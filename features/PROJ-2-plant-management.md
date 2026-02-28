# PROJ-2: Plant Management

## Status: Planned
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
_To be added by /qa_

## Deployment
_To be added by /deploy_
