# PROJ-19: Community Plant Tips

## Status: Planned
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
