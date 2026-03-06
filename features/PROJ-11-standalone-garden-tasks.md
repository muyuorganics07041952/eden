# PROJ-11: Standalone Garden Tasks

## Status: In Progress
**Created:** 2026-03-06
**Last Updated:** 2026-03-06

## Dependencies
- Requires: PROJ-1 (User Authentication) — für Login-Checks
- Requires: PROJ-4 (Care Management) — Task-Seite und Erledigen-Logik bereits vorhanden

## Overview
Gartenbesitzer haben regelmäßig Aufgaben, die nicht einer einzelnen Pflanze zugeordnet werden können — z.B. "Kompost umsetzen", "Mähroboter ins Winterquartier stellen", "Bewässerung winterfest machen". Aktuell gibt es keinen Ort für solche Aufgaben in der App. Dieses Feature ermöglicht das Erstellen, Bearbeiten und Erledigen von allgemeinen Gartenaufgaben direkt auf der Task-Seite.

## User Stories

- Als Gartenbesitzer möchte ich allgemeine Gartenaufgaben (ohne Pflanzenbezug) anlegen können, damit ich alle Gartenpflichten an einem Ort verwalten kann.
- Als Gartenbesitzer möchte ich eine einmalige Aufgabe abhaken und sie damit dauerhaft entfernen können, damit meine Liste übersichtlich bleibt.
- Als Gartenbesitzer möchte ich wiederkehrende allgemeine Aufgaben anlegen (z.B. "Rasen mähen" wöchentlich), damit das nächste Fälligkeitsdatum automatisch berechnet wird.
- Als Gartenbesitzer möchte ich ein Fälligkeitsdatum setzen können, damit allgemeine Aufgaben im gleichen Zeitfilter wie Pflegeaufgaben erscheinen.
- Als Gartenbesitzer möchte ich eine allgemeine Aufgabe nachträglich bearbeiten oder löschen können, damit ich Fehler korrigieren oder nicht mehr relevante Aufgaben entfernen kann.
- Als Gartenbesitzer möchte ich überfällige allgemeine Aufgaben genauso wie Pflegeaufgaben behandeln (mit Wahl des neuen Fälligkeitsdatums), damit der Rhythmus konsistent bleibt.

## Acceptance Criteria

### Erstellen
- [ ] Ein "+" Button auf der Task-Seite (im Header) öffnet ein Formular für neue allgemeine Aufgaben
- [ ] Formularfelder: Name (Pflichtfeld, max. 200 Zeichen), Fälligkeitsdatum (Pflichtfeld), Frequenz (optional: einmalig / täglich / wöchentlich / alle 2 Wochen / monatlich / vierteljährlich / jährlich / benutzerdefiniert), Notizen (optional, max. 500 Zeichen)
- [ ] Einmalige Aufgaben haben keine Frequenzauswahl (oder Frequenz = "einmalig")
- [ ] Speichern fügt die Aufgabe sofort zur Liste hinzu (kein Seiten-Reload)
- [ ] Name darf nicht leer sein — Validierungsfehler wird inline angezeigt
- [ ] Fälligkeitsdatum darf nicht leer sein — Validierungsfehler wird inline angezeigt

### Anzeige auf der Task-Seite
- [ ] Allgemeine Aufgaben erscheinen in einem eigenen Abschnitt "Garten" auf der Task-Seite
- [ ] Der Abschnitt "Garten" respektiert denselben Zeitfilter (Heute / Diese Woche / Dieser Monat / Monatspicker)
- [ ] Überfällige allgemeine Aufgaben werden orange hervorgehoben (wie Pflegeaufgaben)
- [ ] Allgemeine Aufgaben zeigen: Name, Frequenz (wenn wiederkehrend), Fälligkeitsdatum, Notizen (einzeilig, abgeschnitten)
- [ ] Der "Garten"-Abschnitt ist ausgeblendet, wenn keine allgemeinen Aufgaben im gewählten Zeitraum vorhanden sind

### Erledigen
- [ ] Erledigen-Button (Haken) markiert eine Aufgabe als abgeschlossen
- [ ] Einmalige Aufgaben werden nach dem Erledigen dauerhaft gelöscht
- [ ] Wiederkehrende Aufgaben berechnen das nächste Fälligkeitsdatum (wie Pflegeaufgaben) und bleiben erhalten
- [ ] Bei überfälligen Aufgaben erscheint derselbe AlertDialog wie bei Pflegeaufgaben ("Im Original-Rhythmus" vs. "Ab heute rechnen")
- [ ] Die Aufgabe verschwindet sofort aus der aktuellen Listenansicht nach dem Erledigen

### Bearbeiten & Löschen
- [ ] Tippen auf eine allgemeine Aufgabe öffnet ein Edit-Sheet mit denselben Feldern wie beim Erstellen
- [ ] Alle Felder können im Sheet bearbeitet werden
- [ ] Das Sheet enthält einen "Löschen"-Button mit Bestätigungsdialog
- [ ] Änderungen werden sofort in der Liste reflektiert (kein Seiten-Reload)
- [ ] Nach dem Löschen verschwindet die Aufgabe sofort aus der Liste

### Authentifizierung & Sicherheit
- [ ] Nur eingeloggte Nutzer können allgemeine Aufgaben erstellen, lesen, bearbeiten und löschen
- [ ] Nutzer können nur ihre eigenen Aufgaben sehen und bearbeiten (Row Level Security)

## Edge Cases

- **Leere Liste im gewählten Zeitraum:** Wenn keine allgemeinen Aufgaben im gefilterten Zeitraum vorhanden sind, wird der "Garten"-Abschnitt nicht angezeigt (kein leerer Header)
- **Einmalige Aufgabe nach überf. Erledigen:** Bei Wahl "Im Original-Rhythmus" gibt es kein "Original" für einmalige Aufgaben — in diesem Fall wird die Aufgabe einfach gelöscht (keine Verschiebung)
- **Sehr langer Aufgabenname:** Wird mit Zeilenumbruch oder Ellipsis abgekürzt, kein Layout-Bruch
- **Kein Fälligkeitsdatum gesetzt:** Serverseitige Validierung lehnt die Anfrage ab (Pflichtfeld)
- **Monatspicker zeigt keine allgemeinen Aufgaben:** Wenn im gewählten Monat keine allgemeinen Aufgaben fällig sind, bleibt der Abschnitt ausgeblendet (kein Fehler)
- **Gleichzeitiger Edit auf zwei Geräten:** Letzte Schreiboperation gewinnt (keine Konflikterkennung nötig)
- **Offline-Verhalten:** Erledigen/Erstellen schlägt fehl — Fehlermeldung wird angezeigt, Zustand bleibt unverändert

## Technical Requirements
- Authentifizierung erforderlich für alle Operationen
- Row Level Security auf neuer Tabelle (oder Erweiterung bestehender Tabelle)
- Gleiche API-Antwortzeit wie bestehende `/api/tasks/today` (< 300ms)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur

```
Tasks Page (bestehend, erweitert)
+-- Header
|   +-- Titel "Fällige Aufgaben"
|   +-- [NEU] "+" Button → öffnet GardenTaskSheet
+-- Filter Tabs (unverändert)
+-- Month Picker (unverändert)
+-- [NEU] "Garten"-Abschnitt (ausgeblendet wenn leer)
|   +-- Abschnittsheader: Schaufel-Icon + "Garten"
|   +-- GardenTaskCard (pro Aufgabe, klickbar)
|       +-- Erledigen-Button (Haken)
|       +-- Aufgabenname
|       +-- Frequenz-Badge (nur bei wiederkehrend)
|       +-- Fälligkeitsdatum
|       +-- Notizen-Vorschau (optional)
+-- Pflanzen-Gruppen (unverändert)
+-- [NEU] GardenTaskSheet (Erstellen / Bearbeiten)
|   +-- Namensfeld (Pflichtfeld)
|   +-- Häufigkeit (Einmalig / Täglich / ... / Benutzerdefiniert)
|   +-- Tagesintervall (nur bei "Benutzerdefiniert")
|   +-- Fälligkeitsdatum (Pflichtfeld)
|   +-- Notizen (optional)
|   +-- [nur Bearbeitungsmodus] Löschen-Button mit Bestätigung
+-- Überfällig-AlertDialog (bestehend, wiederverwendet)
```

### Datenmodell

Neue Tabelle `garden_tasks` in Supabase:
- **ID** — eindeutig, automatisch
- **User ID** — Eigentümer, Pflichtfeld (RLS: nur eigene Zeilen sichtbar)
- **Name** — Pflichtfeld, max 200 Zeichen
- **Häufigkeit** — `'once'` (einmalig) oder bestehende Frequenz-Werte (weekly, monthly, …)
- **Intervall in Tagen** — nur relevant bei `'custom'`-Frequenz
- **Fälligkeitsdatum** — Pflichtfeld, YYYY-MM-DD
- **Notizen** — optional, max 500 Zeichen
- **Erstellt am** — automatisch

### Technische Entscheidungen

| Entscheidung | Empfehlung | Begründung |
|---|---|---|
| Wo speichern? | Neue Tabelle `garden_tasks` | Kein Risiko für bestehende `care_tasks`-Logik (PROJ-4); eigene RLS-Regeln |
| Einmalige Aufgaben | Neuer Frequenzwert `'once'` | Konsistent mit bestehendem Frequenz-System; Backend entscheidet: Löschen (once) vs. Datum fortschreiben (wiederkehrend) |
| API-Struktur | Neue Endpunkte `/api/garden-tasks` | Bestehender `/api/tasks/today` bleibt unberührt |
| Neue UI-Komponenten | `GardenTaskSheet` nach Vorbild von `CareTaskSheet` | ~80% des Codes identisch; kein neues Muster nötig |
| Überfällig-Dialog | Bestehende `AlertDialog`-Logik wiederverwenden | Identisches UX-Muster |
| Neue Pakete | Keine | Alle shadcn/ui-Komponenten bereits installiert |

### Neue Dateien / Änderungen

| Was | Typ |
|---|---|
| Supabase-Tabelle `garden_tasks` (mit RLS-Policies) | Neu |
| `src/lib/types/care.ts` — `'once'` zu `CareFrequency` | Kleine Erweiterung |
| `/api/garden-tasks/route.ts` (GET + POST) | Neu |
| `/api/garden-tasks/[id]/route.ts` (PUT + DELETE) | Neu |
| `src/components/tasks/garden-task-sheet.tsx` | Neu |
| `src/app/(protected)/tasks/page.tsx` | Erweitert |

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
