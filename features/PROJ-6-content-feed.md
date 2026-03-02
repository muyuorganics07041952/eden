# PROJ-6: Content Feed

## Status: Planned
**Created:** 2026-02-27
**Last Updated:** 2026-03-02

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Optional: PROJ-2 (Plant Management) — für personalisierten Bereich "Für deine Pflanzen"
- Optional: PROJ-4 (Care Management) — für Priorisierung von Pflanzen mit anstehenden Aufgaben

## User Stories
- Als Nutzer möchte ich einen Feed mit interessanten Gartentipps und Pflanzeninformationen sehen.
- Als Nutzer möchte ich Tipps sehen, die auf meine konkreten Pflanzen und deren anstehende Aufgaben zugeschnitten sind.
- Als Nutzer möchte ich einen Artikel vollständig in der App lesen können.
- Als Nutzer möchte ich, dass die Inhalte regelmäßig aktualisiert werden, damit der Feed immer frisch wirkt.
- Als Nutzer ohne Pflanzen möchte ich trotzdem allgemeine Gartentipps sehen.

## Acceptance Criteria

### Feed-Ansicht
- [ ] Zwei Bereiche: "Für deine Pflanzen" (oben, nur mit Pflanzen) und "Garten-Wissen" (immer sichtbar)
- [ ] Artikel-Karten zeigen: Titel, Kurztext (max. 150 Zeichen), Kategorie-Tag, geschätzte Lesezeit
- [ ] Kategorien: Bewässerung, Düngung, Schädlinge & Krankheiten, Saisonales, Allgemein
- [ ] Feed lädt in < 1 Sekunde (Inhalte kommen aus Supabase-Cache, nicht live generiert)
- [ ] Wenn noch keine Inhalte vorhanden: freundlicher "Inhalte werden vorbereitet"-State (kein Fehler)

### Artikel-Detail
- [ ] Tippen auf eine Karte öffnet eine Vollansicht des Artikels (in-app, eigene Route `/feed/[id]`)
- [ ] Artikel-Detail zeigt: Titel, vollständiger Text, Kategorie, Lesezeit, Datum
- [ ] Zurück-Navigation zum Feed

### Personalisierung (Pflanzenselektion)
- [ ] Bis zu 5 Pflanzen werden für die Personalisierung ausgewählt
- [ ] Priorisierung: Pflanzen mit anstehenden Aufgaben in den nächsten 14 Tagen werden bevorzugt
- [ ] Varietät: Wenn mehr als 5 Pflanzen mit Aufgaben, wird randomisiert ausgewählt (nicht immer dieselben)
- [ ] Falls < 5 Pflanzen mit Aufgaben: restliche Slots werden mit anderen Pflanzen (random) aufgefüllt

### Content-Generierung (Cron)
- [ ] Wöchentlicher Vercel Cron-Job generiert neue Artikel mit Google Gemini
- [ ] Pro Lauf: 3 allgemeine Artikel (verschiedene Kategorien) + 2 personalisierte Artikel pro aktiven Nutzer (max. 50 Nutzer)
- [ ] Inhalte werden in Supabase gecacht, nicht bei jedem Aufruf neu generiert
- [ ] Lesezeit wird automatisch berechnet (ca. 200 Wörter/Minute)
- [ ] Deduplizierung: Artikel mit gleichem Titel-Hash werden nicht erneut gespeichert

## Edge Cases
- Nutzer hat keine Pflanzen: Nur "Garten-Wissen"-Bereich wird gezeigt, kein personalisierter Bereich, keine Fehlermeldung
- Gemini API nicht verfügbar: Gecachte Inhalte aus Supabase zeigen; Cron loggt Fehler still, kein Nutzer-Impact
- Noch keine Inhalte in der Datenbank: Freundlicher leerer State "Dein Feed wird vorbereitet – schau bald wieder vorbei"
- Cron-Lauf schlägt für einzelne Nutzer fehl: Fehler loggen, anderen Nutzern nicht beeinflussen
- Langer Artikel: Scrollbares In-App-Lesefenster, keine Paginierung
- Doppelter Content: Deduplizierung beim Speichern via Titel-Hash
- Artikel wird aus DB gelöscht (manuell): Nutzer erhält 404-State auf Detail-Seite, kein Absturz

## Technical Requirements
- Content-Generierung: Google Gemini API (bereits im Stack vorhanden, kein neuer API-Key)
- Caching: Zwei Tabellen in Supabase: `content_articles` (allgemein) + `personalized_articles` (nutzerspezifisch)
- Content-Refresh: Vercel Cron Job (wöchentlich, z.B. Sonntag 06:00 UTC)
- Performance: Feed lädt gecachte Daten aus Supabase in < 1 Sekunde
- Lesezeit-Berechnung: automatisch serverseitig (Wortanzahl ÷ 200)
- **Kein Bookmarking in diesem Release** — wird separat als PROJ-10 geplant falls gewünscht

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Wie der Content Feed funktioniert (Übersicht)

```
Wöchentlicher Cron (Sonntag 06:00 UTC)
  |
  +-- Gemini generiert 3 allgemeine Artikel (alle Nutzer)
  |
  +-- Für jeden aktiven Nutzer (max. 50):
      +-- Wählt bis zu 5 Pflanzen aus (Priorisierung: anstehende Aufgaben)
      +-- Gemini generiert 2 personalisierte Artikel
      +-- Speichert alles in Supabase (mit Deduplizierung)

Nutzer öffnet /feed
  |
  +-- Lädt sofort aus Supabase-Cache (< 1 Sekunde)
  +-- "Für deine Pflanzen" (personalisiert, oben)
  +-- "Garten-Wissen" (allgemein, unten)

Nutzer tippt auf Artikel → /feed/[id]
  +-- Vollständiger Artikel-Text
  +-- Zurück-Button → /feed
```

### Component Structure

```
/feed (neue Seite)
+-- FeedPage (Server Component)
    +-- PersonalizedSection (nur wenn Nutzer Pflanzen hat)
    |   +-- Abschnitts-Header "Für deine Pflanzen"
    |   +-- ArticleCard ×2
    |       +-- Kategorie-Badge (farblich)
    |       +-- Titel + Kurztext (max. 150 Zeichen)
    |       +-- Lesezeit-Chip (z.B. "3 Min. Lesezeit")
    +-- GeneralSection
    |   +-- Abschnitts-Header "Garten-Wissen"
    |   +-- ArticleCard ×3
    +-- EmptyFeedState (wenn noch keine Inhalte generiert)
        +-- Freundliche Meldung: "Dein Feed wird vorbereitet..."

/feed/[id] (neue Seite)
+-- ArticleDetailPage (Server Component)
    +-- Zurück-Button → /feed
    +-- Artikel-Header (Titel, Kategorie-Badge, Lesezeit, Datum)
    +-- Artikel-Body (vollständiger Text, scrollbar)
    +-- ArticleNotFoundState (bei ungültiger ID)
```

### Data Model

**Neue Tabelle: `feed_articles`** (eine Tabelle für allgemein + personalisiert)

| Feld | Beschreibung |
|------|--------------|
| ID | Eindeutige ID |
| User ID | `null` = allgemeiner Artikel (für alle); gesetzt = personalisierter Artikel (nur für diesen Nutzer) |
| Title | Artikeltitel (max. 200 Zeichen) |
| Summary | Kurztext für Karten-Ansicht (max. 150 Zeichen) |
| Content | Vollständiger Artikeltext |
| Category | Kategorie: Bewässerung · Düngung · Schädlinge & Krankheiten · Saisonales · Allgemein |
| Reading Time | Lesezeit in Minuten (automatisch berechnet: Wörter ÷ 200) |
| Title Hash | SHA-256-Hash des Titels für Deduplizierung |
| Plant Context | Welche Pflanzen den Artikel beeinflusst haben (nur bei personalisierten) |
| Created At | Erstellungszeitpunkt |

RLS-Regeln:
- Allgemeine Artikel (User ID = null): alle eingeloggten Nutzer können lesen
- Personalisierte Artikel (User ID gesetzt): nur der jeweilige Nutzer kann lesen

### Pflanzenselektion für Personalisierung

Der Cron wählt pro Nutzer bis zu 5 Pflanzen nach dieser Logik:
1. Finde Pflanzen mit Aufgaben fällig in den **nächsten 14 Tagen** → sortiert nach frühestem Fälligkeitsdatum
2. Wenn > 5 solche Pflanzen → **zufällig 5** davon (für Varietät, nicht immer dieselben)
3. Wenn < 5 → alle nehmen + **zufällig auffüllen** aus den restlichen Pflanzen des Nutzers

### Tech Decisions

| Entscheidung | Wahl | Warum |
|---|---|---|
| Eine vs. zwei Tabellen | Eine Tabelle `feed_articles` mit optionalem `user_id` | Einfachere Abfragen, weniger Wartung, gleiche Funktionalität |
| Content-Generierung | Gemini 2.5 Flash | Bereits im Stack, kein neuer API-Key, gut für Artikel-Texte |
| Cron | Vercel Cron (wöchentlich) | Infrastruktur bereits von PROJ-5 vorhanden, keine neuen Tools |
| Caching | Supabase-Tabelle | Feed lädt sofort aus DB, keine Live-API-Calls beim Nutzer |
| Deduplizierung | Titel-Hash (SHA-256) | Verhindert exakte Duplikate bei mehreren Cron-Läufen |
| Navigation | Neuer "Feed"-Link mit Newspaper-Icon | Konsistent mit bestehendem Nav-Pattern |
| Seiten-Typ | Server Components | Feed-Daten kommen aus DB, kein Client-State nötig → schnelleres Laden |

### New API Endpoints

| Endpoint | Zweck |
|---|---|
| `GET /api/feed` | Allgemeine + personalisierte Artikel des Nutzers laden |
| `GET /api/feed/[id]` | Einzelnen Artikel laden |
| `POST /api/feed/generate` | Cron-Endpunkt: Artikel generieren (gesichert via CRON_SECRET) |

### New Dependencies

Keine — Google Gemini und CRON_SECRET sind bereits im Stack vorhanden.

### New Environment Variables

Keine — `GEMINI_API_KEY` und `CRON_SECRET` existieren bereits.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
