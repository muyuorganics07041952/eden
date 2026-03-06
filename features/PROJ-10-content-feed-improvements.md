# PROJ-10: Content Feed Improvements

## Status: In Progress
**Created:** 2026-03-06
**Last Updated:** 2026-03-06

## Dependencies
- Requires: PROJ-6 (Content Feed) — baut auf bestehender `feed_articles`-Tabelle und Cron-Infrastruktur auf

## User Stories
- Als Nutzer möchte ich täglich neue Artikel im Feed sehen, damit der Feed immer frisch und relevant bleibt.
- Als Nutzer möchte ich 10–15 Artikel auf einmal sehen, damit ich mehr Auswahl beim Lesen habe.
- Als Nutzer möchte ich keine veralteten Artikel aus dem letzten Monat sehen, damit der Feed aktuell wirkt.
- Als Nutzer möchte ich, dass personalisierte Artikel weiterhin zuerst erscheinen, damit ich relevante Inhalte sofort finde.

## Acceptance Criteria

### Feed-Häufigkeit
- [ ] Cron-Job läuft täglich (statt wöchentlich), z.B. um 07:00 UTC
- [ ] Pro Lauf: 2 allgemeine Artikel + 1 personalisierter Artikel pro aktivem Nutzer (max. 50 Nutzer)
- [ ] Deduplizierung bleibt aktiv (Titel-Hash), sodass kein Artikel doppelt gespeichert wird

### Artikel-Anzeige
- [ ] "Für deine Pflanzen" zeigt bis zu 5 personalisierte Artikel (bisher: 2)
- [ ] "Garten-Wissen" zeigt bis zu 10 allgemeine Artikel (bisher: 3)
- [ ] Gesamt max. 15 Artikel sichtbar im Feed
- [ ] Artikel sind absteigend nach `created_at` sortiert (neueste zuerst)

### 30-Tage-Fenster
- [ ] Nur Artikel der letzten 30 Tage werden im Feed angezeigt
- [ ] Cron-Job bereinigt bei jedem Lauf Artikel, die älter als 30 Tage sind (DELETE aus `feed_articles`)
- [ ] Das Löschen alter Artikel erfolgt vor der Generierung neuer Inhalte

### Bestehende Funktionen bleiben erhalten
- [ ] Artikeldetail-Seite `/feed/[id]` funktioniert weiterhin
- [ ] Personalisierungs-Logik (Pflanzenselektion) bleibt unverändert
- [ ] Leerer Feed-State ("Dein Feed wird vorbereitet") bleibt für neue Nutzer erhalten

## Edge Cases
- Noch keine 5 personalisierten Artikel vorhanden (neue Nutzer): Zeige was da ist, kein Fehler
- Noch keine 10 allgemeinen Artikel vorhanden: Zeige was da ist, kein Fehler
- Ein Artikel wird über den Direktlink aufgerufen, ist aber bereits älter als 30 Tage und gelöscht: Bestehender 404-State wird angezeigt
- Cron-Bereinigung schlägt fehl: Fehler wird geloggt, Generierung neuer Artikel läuft trotzdem weiter
- Gemini-API nicht verfügbar: Bereinigung findet trotzdem statt, Generierung schlägt still fehl — gecachte Artikel aus den letzten 30 Tagen bleiben sichtbar
- Nutzer ohne Pflanzen: Kein personalisierter Bereich, nur bis zu 10 allgemeine Artikel sichtbar

## Technical Requirements
- Cron: `vercel.json` Zeitplan von `0 6 * * 0` (wöchentlich) auf `0 7 * * *` (täglich) ändern
- DB: Kein Schema-Change nötig — `feed_articles`-Tabelle bleibt unverändert
- Query: Feed-Seite filtert mit `.gte('created_at', thirtyDaysAgo)` und erhöhten `.limit()`-Werten
- Cleanup: DELETE-Query in Cron vor der Generierung: `DELETE FROM feed_articles WHERE created_at < now() - interval '30 days'`
- Keine neuen Umgebungsvariablen nötig

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Überblick

PROJ-10 ist eine reine Backend-Änderung. Es gibt keine neuen UI-Komponenten, kein neues Datenbankschema und keine neuen API-Routen. Nur 3 bestehende Dateien werden angepasst.

### Ablauf-Vergleich

**Vorher (wöchentlich):**
```
Jeden Sonntag 06:00 UTC
  → 3 allgemeine Artikel generieren
  → 2 personalisierte Artikel pro Nutzer generieren
  → Speichern (ohne Altersfilter)

/feed lädt:
  → Bis zu 6 personalisierte Artikel (alle jemals erstellt)
  → Bis zu 9 allgemeine Artikel (alle jemals erstellt)
```

**Nachher (täglich):**
```
Jeden Tag 07:00 UTC
  → Schritt 0: Artikel > 30 Tage alt löschen (Bereinigung)
  → Schritt 1: 2 allgemeine Artikel generieren
  → Schritt 2: 1 personalisierten Artikel pro Nutzer generieren
  → Speichern (Deduplizierung via Titel-Hash wie bisher)

/feed lädt:
  → Bis zu 5 personalisierte Artikel der letzten 30 Tage
  → Bis zu 10 allgemeine Artikel der letzten 30 Tage
```

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `vercel.json` | Cron-Zeitplan: `0 6 * * 0` → `0 7 * * *` |
| `src/app/api/feed/generate/route.ts` | Bereinigung alter Artikel am Anfang des Runs; allgemeine Artikel: 3 → 2; personalisierte: 2 → 1 pro Nutzer |
| `src/app/(protected)/feed/page.tsx` | 30-Tage-Filter auf beide Abfragen; Limits: personalisiert 6 → 5, allgemein 9 → 10 |

### Warum diese Zahlen?

**Täglich 2 allgemein + 1 personalisiert:**
- Über 30 Tage entstehen ~60 allgemeine Artikel — ausreichend Puffer für .limit(10)
- Über 30 Tage entstehen ~30 personalisierte Artikel pro Nutzer — ausreichend für .limit(5)
- Kleinere Batches = weniger Timeout-Risiko und geringere Gemini-Kosten pro Cron-Lauf

**30-Tage-Fenster:**
- Feed zeigt immer saisonrelevante Inhalte
- Datenbank wächst auf ein stabiles Maximum (~60 + 30×Nutzeranzahl Artikel)
- Bereinigung läuft vor Generierung, damit DB-Platz zuerst freigegeben wird

### Keine neuen Abhängigkeiten

Alle nötigen Werkzeuge sind vorhanden: Supabase Admin Client (für Cleanup), Gemini API, Vercel Cron.

### Kein Datenbankschema-Change

`feed_articles` bleibt unverändert. Der 30-Tage-Filter verwendet das bereits vorhandene `created_at`-Feld.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
