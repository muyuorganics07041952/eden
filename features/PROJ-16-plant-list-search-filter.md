# PROJ-16: Pflanzen-Liste Suche & Filter

## Status: Planned
**Created:** 2026-03-10
**Last Updated:** 2026-03-10

## Dependencies
- Requires: PROJ-2 (Plant Management) — Pflanzen-Liste, AddPlantSheet, EditPlantSheet
- Requires: PROJ-4 (Care Management) — `care_tasks`-Tabelle für "Pflegebedarf heute"-Filter

## Overview
Die aktuelle Pflanzen-Listenansicht bietet nur eine Sortierung (Neueste / Alphabetisch). Bei vielen Pflanzen wird es schwer, gezielt eine Pflanze zu finden. Dieses Feature fügt eine Suchleiste (Name, Standort) und Filter-Chips (Standort, Pflegebedarf heute, Tags) hinzu. Tags werden als freie Felder in der Pflanzenverwaltung (Erstellen/Bearbeiten) erfasst und in einer neuen DB-Spalte gespeichert. Alle Filter laufen client-seitig.

## User Stories

- Als Gartenbesitzer möchte ich auf der Pflanzenliste nach einem Pflanzennamen suchen können, damit ich schnell eine bestimmte Pflanze finde.
- Als Gartenbesitzer möchte ich nach Standort suchen können (z. B. "Balkon"), damit ich alle Pflanzen an einem Ort auf einmal sehe.
- Als Gartenbesitzer möchte ich per Chip-Filter nach Standort filtern können, damit ich ohne Tippen schnell wechseln kann.
- Als Gartenbesitzer möchte ich einen "Pflege heute"-Filter aktivieren können, der nur Pflanzen mit fälliger Pflegeaufgabe zeigt, damit ich meinen Pflegeplan auf einen Blick sehe.
- Als Gartenbesitzer möchte ich meinen Pflanzen beim Erstellen und Bearbeiten freie Tags vergeben können (z. B. "Gemüse", "Kräuter"), damit ich sie kategorisieren kann.
- Als Gartenbesitzer möchte ich nach Tags filtern können, damit ich z. B. alle Gemüsepflanzen auf einmal sehe.
- Als Gartenbesitzer möchte ich mehrere Filter gleichzeitig anwenden können (z. B. Standort "Balkon" + Tag "Kräuter").

## Acceptance Criteria

### Suchfeld
- [ ] Ein Suchfeld erscheint oben auf der Pflanzen-Listenansicht (unterhalb des Headers)
- [ ] Die Suche filtert in Echtzeit (bei jeder Eingabe) nach Pflanzenname und Standort (case-insensitive)
- [ ] Ein leeres Suchfeld zeigt alle Pflanzen (kein aktiver Suchfilter)
- [ ] Ein X-Button im Suchfeld löscht die Eingabe

### Filter-Chips: Standort
- [ ] Unterhalb des Suchfelds erscheinen Filter-Chips für alle Standorte, die der Nutzer bei seinen Pflanzen eingetragen hat
- [ ] Klick auf einen Chip aktiviert den Standortfilter; aktive Chips sind visuell hervorgehoben
- [ ] Nur Pflanzen mit genau diesem Standort werden angezeigt
- [ ] Mehrere Standort-Chips können gleichzeitig aktiv sein (OR-Logik: Pflanze muss mindestens einen der aktiven Standorte haben)
- [ ] Hat der Nutzer keine Pflanzen mit Standort, werden keine Standort-Chips angezeigt

### Filter-Chip: Pflegebedarf heute
- [ ] Ein fixer Chip "Pflege heute" erscheint immer (wenn der Nutzer Pflanzen mit Pflegeaufgaben hat)
- [ ] Klick auf den Chip filtert die Liste auf Pflanzen mit mindestens einer fälligen oder überfälligen Pflegeaufgabe (next_due_date <= heute)
- [ ] Die benötigten Pflegedaten werden parallel zur Pflanzenliste geladen (Client-Join via plant_id)

### Filter-Chips: Tags
- [ ] Unterhalb der Standort-Chips erscheinen Filter-Chips für alle Tags, die der Nutzer vergeben hat
- [ ] Klick auf einen Tag-Chip filtert nach Pflanzen mit diesem Tag
- [ ] Mehrere Tag-Chips können gleichzeitig aktiv sein (OR-Logik)
- [ ] Hat der Nutzer noch keine Tags vergeben, wird kein Tag-Bereich angezeigt

### Tag-Verwaltung (AddPlantSheet & EditPlantSheet)
- [ ] Im "Pflanze hinzufügen" Sheet gibt es ein neues optionales Feld "Tags"
- [ ] Tags werden als kommagetrennte Eingabe oder als Chip-Input erfasst
- [ ] Im "Pflanze bearbeiten" Sheet können Tags angezeigt, ergänzt und entfernt werden
- [ ] Tags werden in der Datenbank als Array auf der `plants`-Tabelle gespeichert (`tags TEXT[]`)
- [ ] Tags werden auf der PlantCard kurz angezeigt (max. 2 Tags + "+N" falls mehr)

### Kombinierte Filter & Suche
- [ ] Alle aktiven Filter (Suche + Standort + Pflegebedarf + Tags) werden gleichzeitig angewendet (AND-Logik zwischen Filtertypen)
- [ ] Die Anzahl der angezeigten Pflanzen ist sichtbar (z. B. "3 von 12 Pflanzen")

### Kein Ergebnis
- [ ] Wenn keine Pflanze den aktiven Filtern entspricht, erscheint ein "Keine Pflanzen gefunden"-State
- [ ] Ein "Alle Filter zurücksetzen"-Button setzt Suche und alle Chips zurück

## Edge Cases

- **Pflanze ohne Standort:** Erscheint nicht in den Standort-Chips, aber in der Gesamtliste (und ist sichtbar wenn kein Standortfilter aktiv)
- **Pflanze ohne Tags:** Tags-Feld leer – erscheint nicht in Tag-Chips, trotzdem vollständig nutzbar
- **Tag mit Leerzeichen:** Tags werden getrimmt gespeichert; "  Kräuter  " → "Kräuter"
- **Großschreibung bei Tags:** Tags werden case-insensitiv dedupliziert für die Chip-Anzeige, aber case-sensensitiv gespeichert (z. B. "Gemüse" und "gemüse" erscheinen als ein Chip)
- **Pflegebedarf-Filter ohne Pflegeaufgaben:** Wenn keine Pflegeaufgaben existieren, werden auch keine Pflanzen angezeigt (leerer State)
- **Sehr viele Tags:** Chip-Reihe scrollt horizontal oder bricht um; kein Overflow
- **Seite neu laden:** Alle aktiven Filter werden zurückgesetzt (kein persistenter Filterzustand)

## Technical Requirements
- Filterlogik läuft vollständig client-seitig (keine neuen API-Queries bei Filter-Änderung)
- Neue DB-Migration: `tags TEXT[] DEFAULT '{}'` auf der `plants`-Tabelle
- Pflegedaten für "Pflege heute"-Filter: Laden aller `care_tasks` des Nutzers mit `next_due_date <= today` parallel zur Pflanzenliste
- Maximale Anzahl Tags pro Pflanze: 10 (Validierung client- und server-seitig)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
/plants Seite
+-- Header (Titel + "Neue Pflanze"-Button)
+-- PlantFilterBar  ← NEU
|   +-- SearchInput (Suchfeld + X-Clear-Button)
|   +-- FilterChipsRow
|       +-- "Pflege heute"-Chip (fix)
|       +-- Standort-Chips (dynamisch aus Pflanzen)
|       +-- Tag-Chips (dynamisch aus Pflanzen)
+-- Pflanzenanzahl-Zeile ("3 von 12 Pflanzen")
+-- Pflanzengitter / Kein-Ergebnis-State
    +-- PlantCard (+ Tag-Badges)

AddPlantSheet  ← + Tags-Eingabefeld
EditPlantSheet ← + Tags-Eingabefeld
```

### Datenmodell

**Neue DB-Spalte:**
- `plants.tags`: Liste von Texten (max. 10, Standard: leer)

**Erweiterter Plant-Typ:**
- `tags: string[]` (z.B. `["Gemüse", "Balkon"]`)

**Pflegedaten (Pflege-heute-Filter):**
- Beim Seitenaufruf parallel zur Pflanzenliste geladen
- Alle Pflegeaufgaben mit `next_due_date <= heute`
- Daraus: Set von `plant_id`s mit Pflegebedarf

### Geänderte Dateien

**Backend (1 Migration + Anpassungen):**
- DB-Migration: `tags TEXT[] DEFAULT '{}'` auf `plants`-Tabelle
- `src/lib/types/plants.ts`: `tags: string[]` im `Plant`-Typ
- `src/app/api/plants/route.ts` (POST): Tags entgegennehmen, validieren, speichern
- `src/app/api/plants/[id]/route.ts` (PUT): Tags updaten
- Zod-Schema: `tags` optional, max. 10 Einträge, je max. 50 Zeichen

**Frontend (neue + geänderte Dateien):**
- `src/components/plants/plant-filter-bar.tsx` ← NEU
- `src/app/(protected)/plants/page.tsx` ← Filter-State + paralleles Laden + Filterfunktion
- `src/components/plants/plant-card.tsx` ← Tag-Badges (max. 2 + "+N")
- `src/components/plants/add-plant-sheet.tsx` ← Tags-Eingabefeld
- `src/components/plants/edit-plant-sheet.tsx` ← Tags-Eingabefeld

### Tech-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| `tags TEXT[]` auf `plants`-Tabelle | Einfacher als eigene Tags-Tabelle; ausreichend für max. 10 Tags pro Pflanze |
| Client-seitige Filterung | Instant-Filterung ohne API-Calls; ideal bis ~200 Pflanzen |
| Paralleles Laden (Pflanzen + Pflegeaufgaben) | Minimiert Gesamtladezeit |
| Filterstate nicht persistiert | Einfacher; Listenansicht startet immer mit Überblick |
| Neuer `PlantFilterBar`-Komponent | Trennt Filter-Logik von der Seite |

### Pakete
Keine neuen Pakete nötig — `Input` und `Badge` aus shadcn/ui sind bereits installiert.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
