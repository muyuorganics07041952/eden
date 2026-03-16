# PROJ-19: Community Plant Tips

## Status: In Progress
**Created:** 2026-03-16
**Last Updated:** 2026-03-16

## Overview
Wenn ein Nutzer eine Pflanze anlegt oder die Pflanzenseite öffnet, sieht er einen "Community Tipps"-Bereich mit echten Pflegetipps und Erfahrungen anderer Eden-Nutzer für dieselbe Pflanzenart. Das Feature ist ein USP der App: Nutzer lernen voneinander und teilen ihr Geheimwissen.

## Dependencies
- Requires: PROJ-1 (User Authentication) — Nutzer müssen eingeloggt sein
- Requires: PROJ-2 (Plant Management) — Tipps sind an die Pflanzenseite gebunden

---

## User Stories

### Tipps lesen
- Als Gartenbesitzer möchte ich auf der Seite meiner Monstera die Tipps anderer Nutzer sehen, damit ich von deren Erfahrungen profitiere.
- Als Nutzer möchte ich Tipps sehen, die zu meiner Pflanze passen – auch wenn ich den umgangssprachlichen Namen eingegeben habe (z. B. „Gummibaum" statt „Ficus elastica") – damit ich relevante Ergebnisse erhalte.
- Als Nutzer möchte ich sehen, wie viele Likes ein Tipp hat, damit ich die hilfreichsten Tipps schnell erkenne.

### Tipps teilen
- Als erfahrener Gärtner möchte ich einen Tipp zu meiner Pflanze schreiben und optional ein Foto anhängen, damit andere Nutzer von meinen Erfahrungen lernen können.
- Als Nutzer möchte ich eigene Tipps jederzeit löschen können, damit ich die Kontrolle über meine Inhalte behalte.

### Interaktion
- Als Nutzer möchte ich einen Tipp liken, um hilfreiche Beiträge hervorzuheben.
- Als Nutzer möchte ich einen Tipp kommentieren, um Rückfragen zu stellen oder Ergänzungen zu teilen.
- Als Nutzer möchte ich eigene Kommentare löschen können.

---

## Acceptance Criteria

### Tipps anzeigen
- [ ] Auf jeder Pflanzenseite gibt es einen Abschnitt „Community Tipps" unterhalb der Pflegeaufgaben.
- [ ] Tipps werden nach Pflanzenzugehörigkeit gematcht: primär über den wissenschaftlichen Namen, sekundär über den Allgemeinamen und die Pflanzenfamilie (case-insensitiv, Teilübereinstimmung zulässig).
- [ ] Tipps sind nach Likes absteigend sortiert (meiste Likes zuerst).
- [ ] Jeder Tipp zeigt: Autorenname, Datum, Text, optionales Foto, Anzahl Likes, Anzahl Kommentare.
- [ ] Wenn keine Tipps vorhanden sind, wird ein leerer Zustand mit CTA „Als Erster einen Tipp teilen" angezeigt.
- [ ] Kommentare zu einem Tipp sind einklappbar (standardmäßig geschlossen).

### Tipp einreichen
- [ ] Ein Button „+ Tipp teilen" öffnet ein Formular (Sheet oder Dialog).
- [ ] Das Formular hat: Textfeld (Pflichtfeld, max. 500 Zeichen) + optionaler Foto-Upload.
- [ ] Nach Absenden erscheint der Tipp sofort in der Liste.
- [ ] Ein Nutzer kann beliebig viele Tipps zu einer Pflanze einreichen.
- [ ] Eigene Tipps können über ein 3-Punkte-Menü gelöscht werden.

### Likes
- [ ] Ein eingeloggter Nutzer kann einen Tipp einmal liken (Toggle: Like → Unlike).
- [ ] Eigene Tipps können nicht geliked werden.
- [ ] Die Like-Anzahl wird optimistisch aktualisiert (kein Reload nötig).

### Kommentare
- [ ] Jeder eingeloggte Nutzer kann einen Kommentar zu einem Tipp hinterlassen (max. 300 Zeichen).
- [ ] Kommentare zeigen: Autorenname, Datum, Text.
- [ ] Eigene Kommentare können gelöscht werden.
- [ ] Kommentare sind chronologisch sortiert (älteste zuerst).

### Berechtigungen
- [ ] Nur eingeloggte Nutzer können Tipps, Likes und Kommentare sehen und einreichen.
- [ ] Nicht eingeloggte Nutzer sehen den Abschnitt nicht.

---

## Edge Cases

- **Keine Übereinstimmung per Name:** Kann der Pflanzenname keiner Tipps-Sammlung zugeordnet werden, wird der Abschnitt ausgeblendet (kein leerer Kasten).
- **Fuzzy-Matching Konflikte:** Wenn mehrere Pflanzenarten denselben Allgemeinnamen haben (z. B. „Palme"), werden Tipps aller passenden Arten angezeigt, mit einem Hinweis „Tipps für ähnliche Pflanzen".
- **Foto-Upload schlägt fehl:** Tipp wird ohne Foto gespeichert; Nutzer erhält eine Fehlermeldung mit Hinweis, dass der Text gespeichert wurde.
- **Tipp löschen, der bereits Kommentare hat:** Tipp und alle zugehörigen Kommentare/Likes werden gelöscht.
- **Nutzer löscht seinen Account:** Tipps und Kommentare werden anonymisiert (Anzeigename: „Gelöschter Nutzer"), nicht gelöscht – damit das Wissen erhalten bleibt.
- **Sehr langer Tipptext:** Auf der Liste wird nach 3 Zeilen abgeschnitten mit „Mehr lesen"-Link.
- **Doppeltes Liken:** Zweimaliges Antippen des Like-Buttons entfernt das Like wieder (Toggle).
- **Offline:** Formular bleibt nutzbar, Absenden schlägt fehl mit einem klaren Hinweis „Keine Verbindung".

---

## Technical Requirements

- Authentifizierung: Alle Lese- und Schreibzugriffe erfordern eine aktive Supabase-Session.
- RLS: Row Level Security muss auf allen neuen Tabellen aktiviert sein.
- Performance: Tipps-Abfrage < 300 ms; max. 20 Tipps pro Pflanze in der Erstladung (Pagination optional).
- Foto-Upload: Max. 5 MB, Format JPEG/PNG/WEBP, gespeichert in Supabase Storage.
- Profanity/Moderation: Phase 1 ohne automatisches Filtern; Nutzer können Inhalte melden (Meldung wird in einer Tabelle gespeichert, kein Admin-UI in Phase 1).

---

<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Übersicht
Das Feature benötigt sowohl Backend (Datenbank, API-Endpunkte) als auch Frontend (neue UI-Sektion auf der Pflanzenseite). Es baut vollständig auf der bestehenden Supabase + Next.js-Architektur auf. Keine neuen externen Pakete erforderlich.

---

### A) Komponentenstruktur (UI-Baum)

```
Pflanzenseite /plants/[id]
+-- [bestehend] PhotoGallery
+-- [bestehend] CareTaskSection
+-- [bestehend] CompletionHistorySection
+-- [NEU] CommunityTipsSection
    +-- Sektions-Header ("Community Tipps" + "+ Tipp teilen"-Button)
    +-- TipCard (wiederholt, sortiert nach Likes)
    |   +-- AutorenInfo (Avatar-Initial, Name, Datum)
    |   +-- TipText (nach 3 Zeilen abgeschnitten → "Mehr lesen")
    |   +-- TipPhoto (optional, anklickbar)
    |   +-- LikeButton (Herz-Icon + Anzahl, optimistisches Update)
    |   +-- CommentsToggle (Kommentar-Icon + Anzahl → klappt auf)
    |   +-- ThreeDotMenu (nur für eigene Tipps: "Löschen")
    |   +-- [ausgeklappt] CommentsList
    |       +-- CommentItem (Name, Datum, Text)
    |       +-- AddCommentForm (Textarea + "Senden"-Button)
    +-- EmptyState ("Noch keine Tipps – sei der Erste!")
+-- [NEU] ShareTipSheet (Bottom-Sheet / Dialog)
    +-- Textfeld (Pflicht, max. 500 Zeichen)
    +-- Foto-Upload (optional, max. 5 MB)
    +-- "Tipp teilen"-Button + Abbrechen
```

**Wo wird die Sektion eingebunden?**
Die `CommunityTipsSection` wird als letzter Block auf der Pflanzenseite (`/plants/[id]/page.tsx`) hinzugefügt – nach `CompletionHistorySection`. Sie erhält `plant.name` und `plant.species` als Props für das Matching.

---

### B) Datenmodell

**Tabelle: `community_tips`**
Jeder Tipp, den ein Nutzer teilt:

| Feld | Beschreibung |
|---|---|
| `id` | Eindeutige ID |
| `user_id` | Autor (verknüpft mit Auth-User) |
| `plant_name` | Name der Pflanze beim Einreichen (z. B. „Gummibaum") |
| `plant_species` | Wissenschaftlicher Name beim Einreichen (z. B. „Ficus elastica"), kann leer sein |
| `text` | Tipp-Text (max. 500 Zeichen) |
| `photo_path` | Pfad in Supabase Storage (optional) |
| `likes_count` | Denormalisierte Zahl (für Performance, wird bei Like/Unlike automatisch aktualisiert) |
| `created_at` | Erstellungsdatum |

**Tabelle: `community_tip_likes`**
Welcher Nutzer welchen Tipp geliked hat:

| Feld | Beschreibung |
|---|---|
| `tip_id` | Verweis auf community_tips |
| `user_id` | Der likende Nutzer |
| Unique constraint | Pro Nutzer + Tipp nur ein Like möglich |

**Tabelle: `community_tip_comments`**
Kommentare zu Tipps:

| Feld | Beschreibung |
|---|---|
| `id` | Eindeutige ID |
| `tip_id` | Verweis auf community_tips |
| `user_id` | Autor |
| `text` | Kommentar-Text (max. 300 Zeichen) |
| `created_at` | Erstellungsdatum |

**Tabelle: `community_tip_reports`** *(Phase 1 minimal)*
Gemeldete Inhalte (kein Admin-UI, nur zur späteren Auswertung):

| Feld | Beschreibung |
|---|---|
| `tip_id` | Gemeldeter Tipp |
| `reporter_user_id` | Melder |
| `created_at` | Zeitstempel |

**Nutzerprofil-Anzeigename**
Für die Anzeige von Autornamen wird die bestehende Supabase Auth `user_metadata` (Displayname) verwendet. Kein separates Profil-Table nötig.

---

### C) API-Endpunkte (neu)

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/api/community/tips?plant_name=X&species=Y` | Tipps für eine Pflanze laden (Matching, sortiert nach Likes) |
| `POST` | `/api/community/tips` | Neuen Tipp einreichen (Text + optionales Foto) |
| `DELETE` | `/api/community/tips/[id]` | Eigenen Tipp löschen |
| `POST` | `/api/community/tips/[id]/like` | Like togglen (hinzufügen oder entfernen) |
| `GET` | `/api/community/tips/[id]/comments` | Kommentare zu einem Tipp laden |
| `POST` | `/api/community/tips/[id]/comments` | Kommentar hinzufügen |
| `DELETE` | `/api/community/tips/[id]/comments/[commentId]` | Eigenen Kommentar löschen |

---

### D) Matching-Strategie

Das Matching ist die Kernlogik dieses Features. Wenn Nutzer A einen Tipp für „Gummibaum" (Ficus elastica) schreibt und Nutzer B seine Pflanze „Ficus" nennt, soll Nutzer B den Tipp trotzdem sehen.

**Ansatz:** PostgreSQL `ILIKE`-Teilübereinstimmung (case-insensitiv) in beide Richtungen:
- Gefunden wird ein Tipp, wenn: der Tipp-`plant_name` die Suchanfrage enthält ODER die Suchanfrage den Tipp-`plant_name` enthält (und dasselbe für `species`)
- Beispiel: Plant „Ficus" matcht Tipp mit `plant_name = "Ficus elastica"` ✓
- Beispiel: Plant „Gummibaum" matcht Tipp mit `plant_name = "Rubber Plant"` ✗ (kein Match → Sektion wird ausgeblendet)

Keine zusätzliche Extension (pg_trgm) notwendig für Phase 1. Fuzzy-Levenshtein-Matching kann in Phase 2 ergänzt werden.

---

### E) Technische Entscheidungen (Begründung)

| Entscheidung | Warum |
|---|---|
| **Supabase DB** für alle 4 Tabellen | Bereits im Einsatz, RLS vorhanden, kein neuer Anbieter |
| **Supabase Storage** für Tipp-Fotos | Gleiche Infrastruktur wie Pflanzenfoto-Upload |
| **`likes_count` denormalisiert** | Verhindert langsame COUNT-Queries bei vielen Likes; wird via Trigger oder API-Update aktuell gehalten |
| **Kommentare lazy-load** | Erst beim Aufklappen eines Tipps geladen → schnellere Erstladung der Seite |
| **Optimistic UI** für Likes | Sofortiges visuelles Feedback, Rückgängig bei API-Fehler |
| **Bottom Sheet** für Tipp-Eingabe | Konsistentes UX-Pattern mit dem Rest der App (GardenTaskSheet, CareTaskSheet) |
| **Kein Realtime** in Phase 1 | Seite muss neu geladen werden für neue Tipps anderer Nutzer – akzeptabel für MVP |

---

### F) RLS-Regeln (Zusammenfassung)

| Tabelle | SELECT | INSERT | DELETE |
|---|---|---|---|
| `community_tips` | Jeder eingeloggte Nutzer | Nur eigene Zeilen | Nur eigene Zeilen |
| `community_tip_likes` | Jeder eingeloggte Nutzer | Nur eigene Zeilen | Nur eigene Zeilen |
| `community_tip_comments` | Jeder eingeloggte Nutzer | Nur eigene Zeilen | Nur eigene Zeilen |
| `community_tip_reports` | Niemand (nur Service Role) | Jeder eingeloggte Nutzer | Niemand |

---

### G) Neue Pakete
Keine neuen npm-Pakete notwendig. Alle UI-Elemente werden aus bestehenden shadcn/ui-Komponenten zusammengesetzt.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
