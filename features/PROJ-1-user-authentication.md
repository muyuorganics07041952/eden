# PROJ-1: User Authentication

## Status: In Progress
**Created:** 2026-02-27
**Last Updated:** 2026-02-27

## Dependencies
- None

## User Stories
- Als neuer Nutzer möchte ich mich mit E-Mail und Passwort registrieren, damit meine Gartendaten sicher gespeichert sind.
- Als wiederkehrender Nutzer möchte ich mich einloggen, damit ich auf meine Pflanzen und Aufgaben zugreifen kann.
- Als Nutzer möchte ich mein Passwort zurücksetzen können, wenn ich es vergessen habe.
- Als Nutzer möchte ich mich ausloggen können, damit mein Konto auf geteilten Geräten sicher ist.
- Als Nutzer möchte ich, dass meine Sitzung erhalten bleibt, damit ich mich nicht bei jedem Besuch neu einloggen muss.

## Acceptance Criteria
- [ ] Nutzer kann sich mit E-Mail + Passwort registrieren
- [ ] Nutzer kann sich mit E-Mail + Passwort einloggen
- [ ] Nutzer kann Passwort-Reset per E-Mail anfordern
- [ ] Nutzer kann sich ausloggen
- [ ] Session bleibt über Browser-Schließen hinweg erhalten
- [ ] Falsche Zugangsdaten zeigen eine klare Fehlermeldung
- [ ] Nicht-eingeloggte Nutzer werden bei geschützten Seiten zur Login-Seite weitergeleitet
- [ ] Formular-Validierung: E-Mail-Format, Passwort min. 8 Zeichen

## Edge Cases
- Doppelte E-Mail bei Registrierung: Fehlermeldung "E-Mail bereits registriert" anzeigen
- Ungültiges E-Mail-Format: Inline-Validierung vor Absenden
- Passwort zu kurz: Hinweis mit Mindestanforderung
- Abgelaufener Reset-Link: Klare Fehlermeldung mit Möglichkeit, neuen Link anzufordern
- Nutzer versucht auf geschützte Seite zuzugreifen ohne Login: Redirect zur Login-Seite, nach Login Redirect zurück zur ursprünglichen Seite

## Technical Requirements
- Auth-Provider: Supabase Auth (E-Mail/Passwort)
- Session-Management: Supabase Session-Tokens (automatisch)
- Passwort-Reset: Supabase eingebauter Flow
- Kein OAuth / Social Login in dieser Version

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
**Designed:** 2026-02-27

### Seitenstruktur (Routing)

```
app/
├── (auth)/                         ← Öffentliche Seiten (kein Login nötig)
│   ├── login/page.tsx              ← Login-Seite
│   ├── register/page.tsx           ← Registrierungs-Seite
│   ├── reset-password/page.tsx     ← Passwort-Reset anfordern
│   └── update-password/page.tsx    ← Neues Passwort setzen (via E-Mail-Link)
├── (protected)/                    ← Alle geschützten Seiten (Login erforderlich)
│   └── dashboard/...
└── middleware.ts                   ← Automatischer Schutz aller Routen
```

### Komponenten-Baum

```
LoginPage
└── AuthCard (zentriertes Card-Layout)
    ├── AppLogo + Titel
    ├── LoginForm
    │   ├── EmailInput
    │   ├── PasswordInput (Passwort anzeigen/verstecken)
    │   ├── ForgotPasswordLink → /reset-password
    │   ├── SubmitButton (Loading-State)
    │   └── ErrorAlert
    └── RegisterLink → /register

RegisterPage
└── AuthCard
    ├── AppLogo + Titel
    ├── RegisterForm
    │   ├── EmailInput
    │   ├── PasswordInput (+ Mindestlängen-Hinweis)
    │   ├── SubmitButton (Loading-State)
    │   └── ErrorAlert
    └── LoginLink → /login

ResetPasswordPage
└── AuthCard
    ├── ResetForm
    │   ├── EmailInput
    │   ├── SubmitButton
    │   └── SuccessMessage
    └── BackToLoginLink

UpdatePasswordPage
└── AuthCard
    ├── NewPasswordForm
    │   ├── NewPasswordInput
    │   ├── SubmitButton
    │   └── ErrorAlert (abgelaufener Link etc.)
    └── BackToLoginLink
```

### Datenmodell

Supabase verwaltet Nutzer intern in `auth.users` — kein eigener Code nötig.

Jeder Nutzer hat automatisch:
- Eindeutige Nutzer-ID (UUID)
- E-Mail-Adresse + Passwort (verschlüsselt)
- Session-Token (automatisch verlängert)
- E-Mail-Verifizierungsstatus

Kein eigener `profiles`-Table in dieser Version.

### Technische Entscheidungen

| Entscheidung | Warum |
|---|---|
| Supabase Auth | Kein externer Dienst, integriert mit DB, E-Mail-Reset eingebaut |
| Next.js Middleware | Routenschutz vor dem Rendern — kein Flackern, kein JS nötig |
| Route Groups (auth) / (protected) | Klare Trennung, getrennte Layouts |
| @supabase/ssr | Pflichtpaket für Next.js App Router — Auth-State auf Server + Client |
| react-hook-form + Zod | Bereits installiert, Live-Validierung, konsistent im gesamten Projekt |

### Neue Abhängigkeiten

| Paket | Zweck |
|---|---|
| `@supabase/ssr` | Supabase Auth für Next.js App Router (Server Components + Cookies) |

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
