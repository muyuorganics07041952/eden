# PROJ-6: Content Feed

## Status: Planned
**Created:** 2026-02-27
**Last Updated:** 2026-02-27

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Optional: PROJ-2 (Plant Management) — für personalisierte Inhalte basierend auf den Pflanzen des Nutzers

## User Stories
- Als Nutzer möchte ich einen Feed mit interessanten Gartentipps und Pflanzeninformationen sehen.
- Als Nutzer möchte ich Tipps sehen, die auf meine konkreten Pflanzen zugeschnitten sind.
- Als Nutzer möchte ich einen Artikel in der App vollständig lesen können.
- Als Nutzer möchte ich interessante Artikel bookmarken, um sie später wieder zu lesen.

## Acceptance Criteria
- [ ] Content Feed zeigt Artikel-Karten mit: Titel, Kurztext (max. 150 Zeichen), Kategorie-Tag, Lesezeit
- [ ] Personalisierter Bereich "Für deine Pflanzen": Tipps basierend auf den Pflanzen des Nutzers (via OpenAI)
- [ ] Allgemeiner Bereich "Garten-Wissen": saisonale Tipps, allgemeine Gartenratschläge
- [ ] Inhalte werden in Supabase gecacht und nicht bei jedem Aufruf neu generiert
- [ ] Nutzer kann auf Karte tippen → vollständiger Artikel-Ansicht (in-app)
- [ ] Nutzer kann Artikel bookmarken/speichern
- [ ] Gespeicherte Artikel in separater "Gespeichert"-Ansicht
- [ ] Content wird periodisch aktualisiert (neue Inhalte mindestens wöchentlich)
- [ ] Kategorien: Bewässerung, Düngung, Schädlinge & Krankheiten, Saisonales, Allgemein

## Edge Cases
- Nutzer hat keine Pflanzen: Kein personalisierter Bereich, nur allgemeiner Content; keine Fehlermeldung
- OpenAI API nicht verfügbar: Gecachte Inhalte aus Supabase zeigen; kein Fehler für Nutzer
- Noch keine Inhalte in der Datenbank: freundlicher Ladeindikator und/oder "Inhalte werden vorbereitet"-State
- Langer Artikel: Scrollbares In-App-Lesefenster, keine Paginierung notwendig
- Doppelter Content: Deduplizierung beim Speichern in Supabase (nach Titel-Hash)
- Nutzer bookmarkt einen Artikel, der später gelöscht wird: Bookmark zeigt "Inhalt nicht mehr verfügbar"

## Technical Requirements
- Content-Generierung: OpenAI API (GPT-4o), serverseite API Route
- Caching: Inhalte in Supabase-Tabelle gespeichert (id, title, content, category, created_at, tags)
- Personalisierung: Pflanzenliste des Nutzers als Kontext-Prompt für OpenAI
- Content-Refresh: Supabase Edge Function oder Cron-Job (wöchentlich)
- Performance: Feed lädt in < 1 Sekunde (gecachte Daten aus Supabase)
- Lesezeit-Berechnung: ca. 200 Wörter/Minute, automatisch berechnet

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
