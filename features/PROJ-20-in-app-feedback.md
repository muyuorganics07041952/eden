# PROJ-20: In-App Feedback

## Status: Planned
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Overview
Ein persistenter Floating-Button erlaubt eingeloggten Nutzern, jederzeit Feedback direkt aus der App zu senden – ohne App zu verlassen. Das Formular erfasst Typ (Bug / Idee / Lob), eine Pflichtbeschreibung und den aktuellen Screen automatisch. Feedbacks werden in Supabase gespeichert und können vom Entwickler im Dashboard eingesehen werden.

## Dependencies
- Requires: PROJ-1 (User Authentication) — Nur eingeloggte Nutzer können Feedback senden

---

## User Stories

### Feedback senden
- Als Nutzer möchte ich jederzeit schnell Feedback geben können, ohne die App zu verlassen, damit Bugs oder Ideen nicht verloren gehen.
- Als Nutzer möchte ich meinen Feedback-Typ angeben (Bug / Idee / Lob), damit der Entwickler das Feedback einordnen kann.
- Als Nutzer möchte ich nach dem Absenden eine Bestätigung sehen, damit ich weiß, dass mein Feedback angekommen ist.

### Kontextinformation
- Als Entwickler möchte ich automatisch den Screen sehen, von dem aus das Feedback kam, damit ich Bugs schneller reproduzieren kann.
- Als Entwickler möchte ich wissen, welcher Nutzer das Feedback gesendet hat, damit ich bei Bedarf nachfragen kann.

---

## Acceptance Criteria

### Floating Button
- [ ] Ein Floating-Action-Button (FAB) ist auf allen geschützten Seiten (nach Login) sichtbar
- [ ] Der Button ist dezent positioniert (unten rechts), überlagert keinen wichtigen Content
- [ ] Der Button öffnet ein Bottom Sheet / Dialog mit dem Feedback-Formular
- [ ] Der Button ist nicht sichtbar auf öffentlichen Seiten (Login, Register, Landing Page)

### Feedback-Formular
- [ ] Das Formular enthält einen Pflicht-Freitext (min. 10, max. 1000 Zeichen) mit Zeichenzähler
- [ ] Der Nutzer kann einen Typ auswählen: **Bug**, **Idee**, **Lob** (Standard: Idee)
- [ ] Die aktuelle Seiten-URL wird automatisch erfasst und mitgespeichert (nicht vom Nutzer editierbar)
- [ ] Das Formular zeigt Validierungsfehler inline (z. B. "Bitte gib mindestens 10 Zeichen ein")

### Absenden
- [ ] Der Submit-Button ist deaktiviert, solange das Formular ungültig ist
- [ ] Nach erfolgreichem Absenden erscheint ein Danke-Toast ("Danke für dein Feedback!")
- [ ] Das Formular wird nach dem Absenden zurückgesetzt und geschlossen
- [ ] Bei einem Fehler zeigt das Formular eine Fehlermeldung, ohne es zu schließen

### Datenspeicherung
- [ ] Jedes Feedback wird in einer Supabase-Tabelle `feedback` gespeichert mit: `id`, `user_id`, `type`, `text`, `page_url`, `created_at`
- [ ] RLS: Nutzer können nur eigene Feedbacks einsehen (INSERT, SELECT own); kein DELETE oder UPDATE
- [ ] Rate Limit: Max. 50 Feedbacks pro Nutzer pro 24 Stunden (gibt 429-Fehler zurück)

---

## Edge Cases

- **Doppeltes Absenden:** Submit-Button wird nach dem Klick sofort deaktiviert (Loading-State), um doppelte Einträge zu verhindern.
- **Sehr langer Text:** Textarea hat `maxLength={1000}` und ein Zeichenzähler informiert den Nutzer.
- **Netzwerkfehler:** Fehlermeldung "Konnte Feedback nicht senden. Bitte versuche es erneut." – Formular bleibt offen.
- **Rate Limit erreicht:** "Du hast heute schon 5 Feedbacks gesendet. Bitte versuche es morgen wieder."
- **Nutzer loggt sich aus während Formular offen ist:** Formular wird geschlossen, kein Feedback gespeichert.
- **Mobile Tastatur überdeckt Formular:** Bottom Sheet verhält sich korrekt mit `adjustResize` (Viewport-Handling).

---

## Technical Requirements
- Security: Authentifizierung erforderlich (401 für Unauthentifizierte)
- RLS: Aktiviert auf `feedback`-Tabelle
- Rate Limit: DB-basiert (max. 50 Feedbacks / 24h)
- Performance: Formular öffnet in < 100ms (clientseitig, kein API-Call beim Öffnen)
- Keine externen API-Abhängigkeiten (nur Supabase)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure
```
Protected Layout (src/app/(protected)/layout.tsx)  ← modified: add FeedbackFab
├── [existing: Header, main content, BottomNav]
└── FeedbackFab  (src/components/feedback/feedback-fab.tsx)
    Floating button fixed bottom-right (bottom-20 mobile / bottom-6 desktop)
    Manages open/closed Sheet state
    └── FeedbackSheet  (src/components/feedback/feedback-sheet.tsx)
        shadcn Sheet (slides from bottom)
        ├── Type Selector — 3 toggle chips: Bug / Idee / Lob
        ├── Textarea (10–1000 chars) with live character counter
        └── Submit Button (disabled when invalid or loading)
```

### Data Model
**New table: `feedback`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Auto-generated primary key |
| user_id | UUID | References auth.users — ON DELETE SET NULL |
| type | TEXT | 'bug', 'idea', or 'praise' |
| text | TEXT | Required, 10–1000 chars |
| page_url | TEXT | Full URL captured client-side at sheet open |
| created_at | Timestamp | Auto-set to now() |

RLS: INSERT for authenticated users; SELECT own rows only; no UPDATE or DELETE.

### API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/feedback` | Submit feedback (auth required, rate limit 50/24h) |

### Tech Decisions
| Decision | Choice | Why |
|----------|--------|-----|
| FAB placement | Protected layout | Auto-appears on all protected pages — no per-page work |
| Sheet component | shadcn Sheet (already installed) | Consistent with existing ShareTipSheet pattern |
| Page URL | `window.location.href` at sheet open | Captures the page user was on when they clicked |
| Rate limiting | DB-based count (same as community tips) | Works in serverless, no Redis needed |
| FAB is client component | Separate component imported by server layout | Layout stays a server component; FAB handles its own state |

### New Files
- `src/components/feedback/feedback-fab.tsx`
- `src/components/feedback/feedback-sheet.tsx`
- `src/app/api/feedback/route.ts`
- `supabase/migrations/20260318000000_feedback.sql`

### No New Dependencies
All shadcn components (Sheet, Textarea, Button, Badge) already installed.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
