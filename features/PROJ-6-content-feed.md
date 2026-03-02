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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
