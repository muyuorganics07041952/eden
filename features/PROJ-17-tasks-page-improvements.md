# PROJ-17: Aufgaben-Seite Verbesserungen (Suche, Filter, Editierbarkeit)

## Status: Planned
**Created:** 2026-03-11
**Last Updated:** 2026-03-11

## Dependencies
- Requires: PROJ-4 (Care Management) — Pflanzenpflege-Aufgaben und CareTaskSheet
- Requires: PROJ-11 (Standalone Garden Tasks) — Garten-Aufgaben und GardenTaskSheet
- Requires: PROJ-12 (Task Creation Flow) — TaskTypePicker, bestehende Aufgabenseite

## Overview
Die aktuelle Aufgabenseite zeigt alle fälligen Aufgaben gruppiert nach Pflanze, bietet aber keine Möglichkeit zu suchen, nach Status zu filtern oder Pflanzenpflege-Aufgaben direkt zu bearbeiten. Dieses Feature fügt Suche, Statusfilter und Pflanzenfilter hinzu, macht beide Aufgabentypen über ein ⋮-Menü editierbar und macht das UI konsistenter.

## User Stories

- Als Gartenbesitzer möchte ich auf der Aufgabenseite nach einer Aufgabe oder Pflanze suchen können, damit ich schnell die gesuchte Aufgabe finde.
- Als Gartenbesitzer möchte ich Aufgaben nach Status (Überfällig / Heute / Anstehend) filtern können, damit ich z.B. nur überfällige Aufgaben sehe.
- Als Gartenbesitzer möchte ich Aufgaben für eine bestimmte Pflanze filtern können, damit ich den kompletten Pflegebedarf dieser Pflanze auf einen Blick sehe.
- Als Gartenbesitzer möchte ich eine Pflanzenpflege-Aufgabe direkt auf der Aufgabenseite bearbeiten können (Name, Häufigkeit, Notizen), ohne zur Pflanzenseite navigieren zu müssen.
- Als Gartenbesitzer möchte ich eine Pflanzenpflege-Aufgabe von der Aufgabenseite löschen können.
- Als Gartenbesitzer möchte ich ein konsistentes ⋮-Menü auf allen Aufgabenkarten (Pflanzenpflege + Garten) haben, damit ich immer gleich weiß wie ich eine Aufgabe bearbeite.

## Acceptance Criteria

### Suchfeld
- [ ] Ein Suchfeld erscheint unterhalb der bestehenden Range-Tabs (Dieser Monat / Diese Woche / Heute)
- [ ] Die Suche filtert in Echtzeit (bei jeder Eingabe) nach Aufgabenname und Pflanzname (case-insensitive)
- [ ] Ein X-Button im Suchfeld löscht die Eingabe und zeigt wieder alle Aufgaben
- [ ] Leeres Suchfeld zeigt alle Aufgaben des aktuellen Zeitraums (kein aktiver Filter)

### Filter-Chips: Status
- [ ] Drei Status-Chips erscheinen unterhalb des Suchfelds: "Überfällig", "Heute", "Anstehend"
- [ ] Klick auf einen Chip aktiviert den Filter; aktive Chips sind visuell hervorgehoben
- [ ] Mehrere Chips können gleichzeitig aktiv sein (OR-Logik: Aufgabe muss mindestens einem der aktiven Status entsprechen)
- [ ] Status-Chips werden nur angezeigt, wenn Aufgaben in dem jeweiligen Status existieren

### Filter: Pflanze
- [ ] Ein Pflanze-Filter zeigt alle Pflanzen, die im aktuellen Zeitraum Aufgaben haben
- [ ] Klick auf eine Pflanze filtert die Pflanzenpflege-Aufgaben auf diese Pflanze(n)
- [ ] Mehrere Pflanzen können gleichzeitig ausgewählt sein (OR-Logik)
- [ ] Garten-Aufgaben werden vom Pflanzen-Filter nicht beeinflusst (sie haben keine Pflanzenzugehörigkeit)
- [ ] Hat der Nutzer keine Pflanzen mit Aufgaben im aktuellen Zeitraum, wird kein Pflanzen-Filter angezeigt

### Kombinierte Filter
- [ ] Suche + Statusfilter + Pflanzenfilter werden gleichzeitig angewendet (AND-Logik zwischen Filtertypen)
- [ ] Die Anzahl der angezeigten Aufgaben ist sichtbar, wenn ein Filter aktiv ist (z.B. "5 von 12 Aufgaben")

### Kein Ergebnis
- [ ] Wenn keine Aufgaben den aktiven Filtern entsprechen, erscheint ein "Keine Aufgaben gefunden"-State
- [ ] Ein "Filter zurücksetzen"-Button setzt alle Filter (Suche, Status, Pflanze) zurück

### ⋮-Menü auf Pflanzenpflege-Aufgabenkarten
- [ ] Jede Pflanzenpflege-Aufgabenkarte hat ein ⋮-Menü-Icon (Dropdown)
- [ ] Menü enthält: "Bearbeiten" und "Löschen"
- [ ] "Bearbeiten" öffnet das bestehende CareTaskSheet mit den aktuellen Aufgabendaten zum Bearbeiten
- [ ] Nach erfolgreichem Bearbeiten wird die Aufgabe in der Liste aktualisiert (oder entfernt, wenn neues Fälligkeitsdatum außerhalb des Zeitraums)
- [ ] "Löschen" öffnet einen Bestätigungs-Dialog
- [ ] Nach Bestätigung wird die Aufgabe gelöscht und aus der Liste entfernt
- [ ] Der Abschluss-Button (✓) bleibt auf der Karte und funktioniert weiterhin separat vom ⋮-Menü

### ⋮-Menü auf Garten-Aufgabenkarten (konsistentes UI)
- [ ] Garten-Aufgabenkarten erhalten ebenfalls ein ⋮-Menü mit "Bearbeiten" und "Löschen"
- [ ] Klick auf die Karte öffnet weiterhin das Edit-Sheet (bestehende Funktionalität bleibt)
- [ ] Das ⋮-Menü bietet eine alternative, explizite Möglichkeit zum Bearbeiten/Löschen

## Edge Cases

- **Filterstate bei Tab-Wechsel:** Suche, Statusfilter und Pflanzenfilter werden zurückgesetzt wenn der Nutzer zwischen den Range-Tabs (Monat/Woche/Heute) oder Monats-Buttons wechselt
- **Aufgabe nach Edit aus Liste verschwunden:** Wenn die bearbeitete Aufgabe ein neues Fälligkeitsdatum hat, das außerhalb des aktuellen Zeitraums liegt, verschwindet sie aus der Liste
- **Alle Aufgaben einer Pflanze gelöscht:** Die Pflanzengruppe und der Pflanzen-Chip verschwinden
- **Kein aktiver Status-Chip:** Alle drei Status-Typen sind sichtbar (kein Filter aktiv)
- **Pflanzen-Filter + Garten-Aufgaben:** Garten-Aufgaben bleiben sichtbar auch wenn ein Pflanzen-Filter aktiv ist (Trennung der zwei Bereiche)
- **Sehr langer Pflanzename:** Chip wird abgeschnitten (truncate) ohne Layout zu brechen
- **Mobile:** ⋮-Menü und Filter-Chips müssen auf kleinen Bildschirmen (375px) bedienbar sein

## Technical Requirements
- Filterlogik läuft vollständig client-seitig (keine neuen API-Queries bei Filter-Änderung)
- CareTaskSheet muss im Edit-Modus (mit bestehender Task) aufgerufen werden können — prüfen ob bestehende Prop-Schnittstelle ausreicht
- Löschen von Pflanzenpflege-Aufgaben: DELETE `/api/plants/[id]/care/[taskId]` (Route prüfen ob vorhanden)
- Filterstate: nur in React state (kein URL-Param, keine Persistenz)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
