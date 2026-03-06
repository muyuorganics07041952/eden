# PROJ-11: Standalone Garden Tasks

## Status: In Review
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

**Tested:** 2026-03-06
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

#### AC-1: Erstellen

- [x] Ein "+" Button auf der Task-Seite (im Header) oeffnet ein Formular fuer neue allgemeine Aufgaben -- Button vorhanden mit Plus-Icon und aria-label, oeffnet GardenTaskSheet
- [x] Formularfelder: Name (Pflichtfeld, max. 200 Zeichen), Faelligkeitsdatum (Pflichtfeld), Frequenz (einmalig / taeglich / woechentlich / alle 2 Wochen / monatlich / vierteljaehrlich / jaehrlich / benutzerdefiniert), Notizen (optional, max. 500 Zeichen) -- Alle Felder vorhanden, maxLength-Attribute korrekt gesetzt (200 / 500), GARDEN_FREQUENCY_OPTIONS enthaelt alle 9 Optionen inkl. "once"
- [x] Einmalige Aufgaben haben keine Frequenzauswahl (oder Frequenz = "einmalig") -- Default ist "once" (Einmalig), Frequenz-Select ist immer sichtbar, Benutzer kann "Einmalig" waehlen
- [x] Speichern fuegt die Aufgabe sofort zur Liste hinzu (kein Seiten-Reload) -- handleGardenSheetSuccess ruft fetchTasks auf bei "created", kein Reload
- [x] Name darf nicht leer sein -- Validierungsfehler wird inline angezeigt (nameError state, role="alert")
- [x] Faelligkeitsdatum darf nicht leer sein -- Validierungsfehler wird inline angezeigt (dateError state, role="alert")

#### AC-2: Anzeige auf der Task-Seite

- [x] Allgemeine Aufgaben erscheinen in einem eigenen Abschnitt "Garten" auf der Task-Seite -- Shovel-Icon + "Garten" Header, eigene Sektion
- [x] Der Abschnitt "Garten" respektiert denselben Zeitfilter (Heute / Diese Woche / Dieser Monat / Monatspicker) -- gardenUrl verwendet dieselben range/month-Parameter
- [x] Ueberfaellige allgemeine Aufgaben werden orange hervorgehoben (wie Pflegeaufgaben) -- border-orange-200/70 bg-orange-50/50, orange Badge mit AlertTriangle-Icon
- [x] Allgemeine Aufgaben zeigen: Name, Frequenz (wenn wiederkehrend), Faelligkeitsdatum, Notizen (einzeilig, abgeschnitten) -- Name als truncate h3, Frequenz via GARDEN_FREQUENCY_LABELS (nur wenn nicht "once"), Datum, Notizen via line-clamp-1
- [x] Der "Garten"-Abschnitt ist ausgeblendet, wenn keine allgemeinen Aufgaben im gewaehlten Zeitraum vorhanden sind -- gardenTasks.length > 0 Bedingung korrekt

#### AC-3: Erledigen

- [x] Erledigen-Button (Haken) markiert eine Aufgabe als abgeschlossen -- Check-Icon Button mit stopPropagation, sendet PUT mit action: "complete"
- [x] Einmalige Aufgaben werden nach dem Erledigen dauerhaft geloescht -- Backend prueft frequency === 'once' und fuehrt DELETE aus, gibt { deleted: true } zurueck
- [x] Wiederkehrende Aufgaben berechnen das naechste Faelligkeitsdatum -- Backend berechnet newDueDate via addDays basierend auf interval_days
- [x] Bei ueberfaelligen Aufgaben erscheint derselbe AlertDialog ("Im Original-Rhythmus" vs. "Ab heute rechnen") -- overdueGardenTask AlertDialog vorhanden, identisches Pattern wie Care-Tasks
- [x] Die Aufgabe verschwindet sofort aus der aktuellen Listenansicht nach dem Erledigen -- setGardenTasks filter entfernt Task sofort

#### AC-4: Bearbeiten und Loeschen

- [x] Tippen auf eine allgemeine Aufgabe oeffnet ein Edit-Sheet mit denselben Feldern -- handleGardenTaskClick setzt editingGardenTask und oeffnet Sheet, useEffect setzt Felder aus task
- [x] Alle Felder koennen im Sheet bearbeitet werden -- Name, Frequenz, Datum, Notizen alle editierbar
- [x] Das Sheet enthaelt einen "Loeschen"-Button mit Bestaetigungsdialog -- Trash2-Icon Button, AlertDialog mit "Gartenaufgabe loeschen?" Bestaetigung
- [x] Aenderungen werden sofort in der Liste reflektiert (kein Seiten-Reload) -- handleGardenSheetSuccess mapped updated task in state
- [x] Nach dem Loeschen verschwindet die Aufgabe sofort aus der Liste -- filter entfernt Task via editingGardenTask.id

#### AC-5: Authentifizierung und Sicherheit

- [x] Nur eingeloggte Nutzer koennen allgemeine Aufgaben erstellen, lesen, bearbeiten und loeschen -- Alle API-Routes (GET, POST, PUT, DELETE) pruefen supabase.auth.getUser() und geben 401 zurueck
- [x] Nutzer koennen nur ihre eigenen Aufgaben sehen und bearbeiten (Row Level Security) -- RLS-Policies fuer SELECT, INSERT, UPDATE, DELETE mit user_id = auth.uid(), zusaetzlich .eq('user_id', user.id) in Queries

### Edge Cases Status

#### EC-1: Leere Liste im gewaehlten Zeitraum
- [x] Korrekt behandelt -- gardenTasks.length > 0 Bedingung versteckt den Garten-Abschnitt, und totalTaskCount === 0 zeigt "Alles erledigt!" Zustand

#### EC-2: Einmalige Aufgabe nach ueberfaelligem Erledigen
- [x] Korrekt behandelt -- handleGardenCompleteClick prueft task.frequency === "once" und ruft direkt doGardenComplete(task, "today") auf, ohne AlertDialog anzuzeigen. Backend loescht die einmalige Aufgabe.

#### EC-3: Sehr langer Aufgabenname
- [x] Korrekt behandelt -- CSS class "truncate" auf h3, maxLength=200 auf Input

#### EC-4: Kein Faelligkeitsdatum gesetzt
- [x] Korrekt behandelt -- Server-side Zod-Validierung prueft next_due_date als Pflichtfeld mit Regex-Pattern

#### EC-5: Monatspicker zeigt keine allgemeinen Aufgaben
- [x] Korrekt behandelt -- Leerer Array wird zurueckgegeben, Abschnitt wird nicht angezeigt

#### EC-6: Gleichzeitiger Edit auf zwei Geraeten
- [x] Korrekt behandelt -- Letzte Schreiboperation gewinnt (Standard-Supabase-Verhalten)

#### EC-7: Offline-Verhalten
- [x] Korrekt behandelt -- fetch-Fehler werden gecatcht, Error-State wird gesetzt, Task bleibt in der Liste. next.config.ts hat NetworkOnly fuer /api/ Routen.

### Security Audit Results

- [x] Authentication: Alle 4 API-Endpunkte (GET, POST, PUT, DELETE) pruefen auth.getUser() und geben 401 zurueck bei fehlendem Login
- [x] Authorization: RLS-Policies auf Datenbankebene erzwingen user_id = auth.uid(). API-Queries verwenden zusaetzlich .eq('user_id', user.id) als doppelte Absicherung
- [x] Input validation (Server): Zod-Schemas validieren Name (1-200 Zeichen), Frequenz (enum), Datum (YYYY-MM-DD regex), Notizen (max 500), interval_days (1-365 integer)
- [x] Input validation (Client): maxLength auf Input-Feldern, inline Fehlermeldungen
- [x] SQL Injection: Supabase verwendet parametrisierte Queries, kein Risiko
- [x] Security Headers: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, HSTS korrekt konfiguriert in next.config.ts
- [ ] BUG: Keine UUID-Validierung auf taskId-Parameter in PUT/DELETE-Endpunkten (siehe BUG-1)
- [ ] BUG: Keine Laengenbeschraenkung auf Datenbankebene fuer name und notes Spalten (siehe BUG-2)
- [ ] BUG: Kein Rate Limiting auf den garden-tasks API-Endpunkten (siehe BUG-3)
- [x] XSS: React escaped Output automatisch, keine dangerouslySetInnerHTML verwendet
- [x] CSRF: Next.js API Routes sind per Default nicht anfaellig, Cookies werden Server-seitig gelesen

### Regression Testing

- [x] Build erfolgreich: `npm run build` kompiliert ohne Fehler, alle Routen korrekt registriert
- [x] Care Tasks (PROJ-4): Bestehende `/api/tasks/today` Route unberuehrt, PlantGroup-Komponente unveraendert, Overdue-Dialog fuer Care-Tasks weiterhin vorhanden
- [x] Task-Seite: Filter Tabs, Month Picker, PlantGroup-Rendering und Care-Task-Completion weiterhin in page.tsx vorhanden und unveraendert
- [x] Types: CareFrequency, CareTask, FREQUENCY_LABELS etc. unveraendert, GardenTask-Typen additiv hinzugefuegt

### Bugs Found

#### BUG-1: Keine UUID-Validierung auf taskId-Pfadparameter
- **Severity:** Low
- **Steps to Reproduce:**
  1. Sende PUT-Request an `/api/garden-tasks/not-a-uuid` mit gueltigem Body
  2. Expected: 400 Bad Request mit Validierungsfehler
  3. Actual: Request wird an Supabase weitergeleitet, Supabase gibt Datenbankfehler zurueck (vermutlich 500 statt 400)
- **Impact:** Kein Sicherheitsrisiko dank RLS, aber unnoetiger Datenbankaufruf und unpassender HTTP-Statuscode (500 statt 400)
- **Priority:** Nice to have

#### BUG-2: Keine Laengenbeschraenkung auf Datenbankebene fuer name/notes
- **Severity:** Low
- **Steps to Reproduce:**
  1. Die Supabase-Migration definiert `name text NOT NULL` und `notes text` ohne CHECK-Constraint fuer Laenge
  2. Zod validiert max 200/500 Zeichen auf API-Ebene
  3. Expected: Datenbank erzwingt zusaetzlich die Laengenbeschraenkung (Defense in Depth)
  4. Actual: Nur die API-Schicht validiert die Laenge. Direkter Supabase-Client-Zugriff koennte laengere Strings einfuegen (nur durch RLS und Zod geschuetzt)
- **Impact:** Gering, da RLS + Zod als primaere Schicht greifen. Aber der Datenbankschicht fehlt die letzte Verteidigungslinie.
- **Priority:** Nice to have

#### BUG-3: Kein Rate Limiting auf garden-tasks API-Endpunkten
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Sende 1000 POST-Requests an `/api/garden-tasks` in schneller Folge
  2. Expected: Rate Limiting greift nach einer bestimmten Anzahl
  3. Actual: Alle Requests werden verarbeitet, Benutzer kann unbegrenzt Aufgaben erstellen
- **Impact:** Potentielles DoS-Risiko (Datenbank-Spam). Die security.md Regeln fordern Rate Limiting explizit fuer Auth-Endpoints, aber es ist generell empfehlenswert auch fuer CRUD-Endpunkte.
- **Priority:** Fix in next sprint

#### BUG-4: GET-Endpoint laedt alle Tasks bei Monatsfilter und filtert client-seitig
- **Severity:** Low
- **Steps to Reproduce:**
  1. Rufe GET `/api/garden-tasks?month=3` auf
  2. Expected: Supabase-Query filtert direkt nach Monat
  3. Actual: Die Query laedt alle 200 Tasks des Benutzers und filtert dann im JavaScript-Code nach Monat (Zeile 56-72 in route.ts)
- **Impact:** Bei vielen Tasks (bis 200) wird unnoetig viel Daten aus der Datenbank geladen. Funktional korrekt, aber ineffizient.
- **Priority:** Nice to have

#### BUG-5: Fehlende Frequenz "vierteljaehrlich" in Acceptance Criteria vs. Implementierung
- **Severity:** Low
- **Steps to Reproduce:**
  1. Acceptance Criteria erwaehnt "vierteljaehrlich" als Frequenzoption
  2. Implementierung bietet "Alle 3 Monate" (three_months) und "Alle 6 Monate" (six_months)
  3. Expected: Exakte Uebereinstimmung mit AC-Terminologie
  4. Actual: "Alle 3 Monate" deckt "vierteljaehrlich" ab, ist semantisch korrekt. Kein "Alle 6 Monate" in den Acceptance Criteria explizit erwaehnt, aber als Bonus vorhanden.
- **Impact:** Rein kosmetisch, Funktionalitaet ist vollstaendig abgedeckt.
- **Priority:** Nice to have (kein Fix noetig)

### Cross-Browser and Responsive

#### Cross-Browser (Code Review)
- [x] Chrome: Verwendet Standard-HTML, shadcn/ui, und Tailwind CSS -- keine browser-spezifischen APIs
- [x] Firefox: Keine Webkit-spezifischen Features verwendet
- [x] Safari: date-Input wird nativ unterstuetzt, Sheet/Dialog verwenden Radix-Primitives die cross-browser getestet sind

#### Responsive (Code Review)
- [x] 375px (Mobile): SheetContent hat overflow-y-auto, Button zeigt nur Plus-Icon (span hat hidden sm:inline), SheetFooter hat flex-col gap-2 sm:flex-row
- [x] 768px (Tablet): Layout skaliert korrekt, Header hat sm:flex-row sm:items-center
- [x] 1440px (Desktop): Card-basiertes Layout skaliert auf volle Breite, kein max-width Problem

### Summary

- **Acceptance Criteria:** 21/21 passed
- **Edge Cases:** 7/7 passed
- **Bugs Found:** 5 total (0 critical, 0 high, 1 medium, 4 low)
- **Security:** Grundlegend solide (Auth, RLS, Zod-Validierung, Security Headers). Kleinere Verbesserungen moeglich (Rate Limiting, UUID-Validierung, DB-Constraints).
- **Production Ready:** YES
- **Recommendation:** Deploy. Die gefundenen Bugs sind alle Low/Medium-Severity und blockieren kein Deployment. BUG-3 (Rate Limiting) sollte im naechsten Sprint adressiert werden.

## Deployment
_To be added by /deploy_
