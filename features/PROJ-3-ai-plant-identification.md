# PROJ-3: AI Plant Identification

## Status: Planned
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
_To be added by /qa_

## Deployment
_To be added by /deploy_
