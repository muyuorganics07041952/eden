# PROJ-13: Seasonal Task Scheduling

## Status: Planned
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- Requires: PROJ-4 (Care Management) — Pflegeaufgaben und `care_tasks`-Tabelle
- Requires: PROJ-11 (Standalone Garden Tasks) — allgemeine Aufgaben und `garden_tasks`-Tabelle

## Overview
Wiederkehrende Gartenaufgaben folgen oft einem saisonalen Rhythmus: "Rasen mähen alle 2 Wochen, aber nur von März bis Oktober." Bisher haben Aufgaben kein Saisonkonzept — sie erscheinen das ganze Jahr. Dieses Feature fügt einen optionalen Aktivzeitraum (Startmonat bis Endmonat) zu beiden Aufgabentypen hinzu. Außerhalb der Saison werden Aufgaben automatisch ausgeblendet. Wenn eine Saison beginnt, wird das Fälligkeitsdatum automatisch auf den ersten Tag der neuen Saison gesetzt.

## User Stories

- Als Gartenbesitzer möchte ich für eine Aufgabe festlegen können "aktiv von Monat X bis Monat Y", damit die Aufgabe nur in diesem Zeitraum in meiner Liste erscheint.
- Als Gartenbesitzer möchte ich, dass eine saisonale Aufgabe außerhalb der Saison automatisch verschwindet, damit meine Aufgabenliste übersichtlich bleibt.
- Als Gartenbesitzer möchte ich, dass das nächste Fälligkeitsdatum beim Saisonstart automatisch berechnet wird, damit ich es nicht jedes Jahr manuell anpassen muss.
- Als Gartenbesitzer möchte ich eine bestehende Aufgabe nachträglich mit einem Aktivzeitraum versehen können, damit ich alte Aufgaben auf saisonal umstellen kann.
- Als Gartenbesitzer möchte ich Aufgaben auch über den Jahreswechsel (z.B. November bis März) als saisonal markieren können, damit Winteraufgaben korrekt funktionieren.

## Acceptance Criteria

### Formular (Erstellen & Bearbeiten)
- [ ] Im GardenTaskSheet und CareTaskSheet gibt es ein optionales Feld "Aktivzeitraum"
- [ ] Das Feld besteht aus zwei Monatsauswahlen: "Aktiv von" und "Aktiv bis" (Dropdowns: Januar–Dezember)
- [ ] Wenn kein Zeitraum gesetzt ist, verhält sich die Aufgabe wie bisher (immer aktiv, ganzjährig)
- [ ] Beim Erstellen einer saisonalen Aufgabe außerhalb der Saison wird das Fälligkeitsdatum automatisch auf den 1. des Startmonats im nächsten Jahr gesetzt
- [ ] Beim Erstellen einer saisonalen Aufgabe innerhalb der Saison bleibt das vom Nutzer gewählte Fälligkeitsdatum erhalten
- [ ] Der Aktivzeitraum kann beim Bearbeiten geändert oder entfernt werden

### Anzeige auf der Task-Seite
- [ ] Aufgaben mit Aktivzeitraum werden NUR während der aktiven Monate in der Aufgabenliste angezeigt
- [ ] Außerhalb des Aktivzeitraums ist die Aufgabe unsichtbar (kein Abschnitt, kein leerer Eintrag)
- [ ] Eine Saison-Badge ("Mär–Okt") wird auf der Aufgabenkarte angezeigt, wenn ein Zeitraum gesetzt ist
- [ ] Überfällige saisonale Aufgaben werden wie normale überfällige Aufgaben behandelt (orange Hervorhebung)

### Automatische Datumsberechnung beim Erledigen
- [ ] Wenn eine saisonale Aufgabe am Ende der Saison erledigt wird und das berechnete nächste Datum außerhalb der Saison liegt, wird das Fälligkeitsdatum automatisch auf den 1. des Startmonats im nächsten Aktivzeitraum gesetzt
- [ ] Wenn das nächste Datum innerhalb der Saison liegt, bleibt die normale Frequenzberechnung unverändert
- [ ] Einmalige Aufgaben (`once`) mit Aktivzeitraum werden nach dem Erledigen wie bisher gelöscht (kein Nächstesdatum)

### Jahreszyklus-Übergang (Winteraufgaben)
- [ ] Ein Zeitraum "November bis März" (Startmonat > Endmonat) wird als jahresübergreifend erkannt
- [ ] Im Dezember ist eine Nov–Mär-Aufgabe aktiv, im April ist sie inaktiv

### Authentifizierung & Sicherheit
- [ ] Nur eingeloggte Nutzer können Aufgaben mit Aktivzeitraum anlegen oder bearbeiten
- [ ] RLS schützt Aufgaben vor fremdem Zugriff (bestehende Policies unverändert)

## Edge Cases

- **Kein Zeitraum gesetzt:** Aufgabe verhält sich komplett wie bisher — keine Änderung am Verhalten
- **Jahresübergreifende Saison (z.B. Nov–Mär):** Aktiv wenn aktueller Monat >= Startmonat ODER <= Endmonat; inaktiv von April bis Oktober
- **Einmalaufgabe mit Saison:** Wird erstellt und erscheint nur in der Saison; nach Erledigen gelöscht (kein Nächstesdatum)
- **Saisonsstart = Saisonende (gleicher Monat):** Aufgabe ist genau einen Monat pro Jahr aktiv
- **Aufgabe wird außerhalb der Saison bearbeitet:** Das Sheet zeigt die Aufgabe korrekt an (auch wenn sie in der Liste nicht sichtbar ist — erreichbar über Monatspicker auf den Fälligkeitsmonat)
- **Fälligkeitsdatum bereits in der Saison beim Erstellen:** Nutzer-Datum bleibt unverändert
- **Fälligkeitsdatum außerhalb der Saison beim Erstellen:** System überschreibt mit 1. Startmonat (nächstes Jahr, falls Startmonat bereits vergangen)
- **Bestehende Aufgabe wird auf saisonal umgestellt:** Wenn aktueller Monat außerhalb der neuen Saison liegt, wird das Fälligkeitsdatum automatisch angepasst
- **Monatsfilter auf Task-Seite:** Wenn Nutzer z.B. "August" auswählt und eine Aufgabe im August aktiv ist (Saison März–Oktober), erscheint sie — saisonale Filterlogik und Monatsfilter arbeiten zusammen

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
