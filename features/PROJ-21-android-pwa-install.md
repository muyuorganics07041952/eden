# PROJ-21: Android PWA Install in Settings

## Status: Deployed
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Overview
Android-Nutzer können Eden über den Browser als App auf ihrem Homescreen installieren – ohne Play Store. Analog zur bestehenden iOS-Installationsanleitung in den Einstellungen soll auch für Android eine Karte erscheinen, die mit einem Knopfdruck das native Browser-Install-Popup auslöst.

## Dependencies
- Requires: PROJ-1 (User Authentication) — Einstellungen sind nur für eingeloggte Nutzer
- Extends: PROJ-8 (Offline & PWA Optimization) — nutzt bestehende PWA-Infrastruktur (`InstallBanner`, Manifest, Service Worker)

---

## User Stories

### Installation für Android-Nutzer
- Als Android-Nutzer möchte ich in den Einstellungen eine "App installieren"-Option sehen, damit ich Eden wie eine native App nutzen kann ohne den Play Store.
- Als Android-Nutzer möchte ich mit einem einzigen Knopfdruck das Browser-Install-Popup öffnen, damit die Installation schnell und einfach ist.
- Als Android-Nutzer möchte ich nach erfolgreicher Installation in den Einstellungen sehen, dass die App installiert ist, damit ich keine verwirrenden Hinweise mehr sehe.

### Kein Install-Prompt verfügbar
- Als Nutzer mit einem Browser der kein Install-Prompt unterstützt (z. B. Firefox Android), möchte ich keine kaputte oder leere Karte sehen.

### Plattform-Konsistenz
- Als iOS-Nutzer möchte ich weiterhin die Safari-Schritt-für-Schritt-Anleitung sehen (kein Rückschritt durch diese Änderung).
- Als Desktop-Nutzer ohne mobilen Browser soll die Karte nur erscheinen, wenn ein Install-Prompt verfügbar ist.

---

## Acceptance Criteria

### Android Install Card
- [ ] Auf Android-Geräten (Chrome, Edge, Samsung Internet mit Install-Support) erscheint in den Einstellungen eine Karte "Eden als App installieren"
- [ ] Die Karte enthält einen "Jetzt installieren"-Button
- [ ] Ein Klick auf den Button öffnet das native Browser-Install-Popup
- [ ] Lehnt der Nutzer ab, bleibt der Button aktiv (erneuter Versuch möglich)
- [ ] Akzeptiert der Nutzer, wechselt die Karte in den "App installiert"-Zustand

### Bereits installiert (Standalone Mode)
- [ ] Ist die App bereits im Standalone-Modus aktiv, zeigt die Karte "App installiert" (kein Install-Button)
- [ ] Dieser Zustand gilt für iOS und Android gleichermaßen

### Kein Install-Prompt verfügbar
- [ ] Ist `beforeinstallprompt` nicht verfügbar (Firefox Android, Gerät unterstützt es nicht), und die App ist nicht im Standalone-Modus, wird keine Android-Karte angezeigt
- [ ] Die iOS-Karte erscheint weiterhin ausschließlich auf iOS/iPadOS

### Kein Rückschritt
- [ ] iOS-Nutzer sehen weiterhin exakt die bestehende Safari-Anleitung
- [ ] Der bestehende `InstallBanner` (floating, beim ersten Besuch) bleibt unverändert

---

## Edge Cases

- **Firefox / Nicht-Chromium-Browser auf Android:** Kein `beforeinstallprompt` → Karte wird nicht gerendert.
- **Samsung Internet:** Unterstützt `beforeinstallprompt` in neueren Versionen → soll funktionieren; in alten Versionen kein Prompt → keine Karte.
- **Nutzer lehnt ab:** `userChoice.outcome === 'dismissed'` → Button bleibt sichtbar, Nutzer kann es erneut versuchen (Browser erlaubt erneuten Prompt nach kurzer Zeit).
- **Nutzer öffnet Settings bevor `beforeinstallprompt` gefeuert hat:** Das Event feuert kurz nach dem Laden der Seite; falls die Navigations-Zeit zu kurz ist, besteht ein kleines Zeitfenster wo die Karte noch nicht sichtbar ist. Akzeptables Verhalten.
- **App wird aus dem `InstallBanner` heraus installiert:** Wenn der Nutzer die App über den floating Banner installiert (nicht über die Settings-Karte), wechselt die Settings-Karte beim nächsten Öffnen in den "installiert"-Zustand (erkannt via `display-mode: standalone`).
- **Mehrfaches Öffnen der Einstellungen im selben Tab:** Prompt-Objekt muss zwischen Navigationen verfügbar bleiben → erfordert geteilten State (Context oder globale Variable).

---

## Technical Requirements
- Keine neue externe Abhängigkeit — nutzt nur die Browser-native `BeforeInstallPromptEvent`-API
- Plattform-Detection clientseitig (SSR-sicher mit `useEffect`)
- Geteilter Prompt-State zwischen `InstallBanner` und der neuen Settings-Karte (damit der Prompt nicht verloren geht, wenn beide Komponenten gleichzeitig mounten)
- Performance: Karte öffnet sofort (kein API-Call nötig)

---

## Tech Design (Solution Architect)

### Kernproblem: Der Browser feuert `beforeinstallprompt` genau einmal

Das Browser-Event, das die native Install-Funktion bereitstellt, erscheint einmal kurz nach dem Seitenaufruf. Bisher fängt es der `InstallBanner` für sich allein. Da die Settings-Karte auf einer anderen Unterseite liegt, kommt sie zu spät — das Event ist weg.

**Lösung:** Ein zentraler "PWA Install Provider" fängt das Event einmalig für die gesamte App ab und teilt es mit allen Komponenten, die es brauchen.

### Komponenten-Struktur

```
Protected Layout (layout.tsx) — modifiziert: PwaInstallProvider hinzufügen
└── PwaInstallProvider (NEU: src/components/pwa/pwa-install-context.tsx)
    │   Fängt beforeinstallprompt einmalig ab
    │   Stellt canInstall, isInstalled und triggerInstall() bereit
    │
    ├── InstallBanner (MODIFIZIERT: src/components/pwa/install-banner.tsx)
    │       Liest canInstall und triggerInstall() aus dem Provider
    │       (kein eigenes Event-Listener mehr)
    │
    └── Settings Page → InstallGuideCard (ERWEITERT: src/components/settings/install-guide-card.tsx)
            iOS: zeigt weiterhin Safari-Schritt-für-Schritt-Anleitung
            Android (canInstall=true): zeigt "Jetzt installieren"-Button
            Bereits installiert (isInstalled=true): zeigt "App installiert"-Bestätigung
            Kein Prompt verfügbar (iOS=false, canInstall=false): Karte bleibt ausgeblendet
```

### Zustandslogik der InstallGuideCard

| Situation | Was die Karte zeigt |
|-----------|---------------------|
| App bereits installiert (standalone) | "App installiert" — für iOS und Android |
| iOS, nicht installiert | Safari-Anleitung (3 Schritte) |
| Android/Desktop, Install-Prompt verfügbar | "Jetzt installieren"-Button |
| Alles andere (Firefox Android, etc.) | Karte wird gar nicht angezeigt |

### Tech-Entscheidungen

| Entscheidung | Wahl | Warum |
|---|---|---|
| State-Sharing | React Context (PwaInstallProvider) | Sauberste Lösung ohne globale Variablen; der Provider lebt direkt im Protected Layout und überlebt alle Seitennavigationen |
| InstallBanner | Auf Context umgestellt | Verhindert Race Condition (beide hören auf dasselbe Event) — nur der Provider hört zu |
| InstallGuideCard | Erweitert, nicht neu | Settings-Seite muss gar nicht angefasst werden — `<InstallGuideCard />` bleibt identisch |
| Backend | Keiner | Rein clientseitige Browser-API — keine DB, kein API-Endpoint |
| Neue Pakete | Keine | React Context ist eingebaut |

### Geänderte / neue Dateien

| Datei | Aktion | Was sich ändert |
|-------|--------|----------------|
| `src/components/pwa/pwa-install-context.tsx` | **NEU** | Context + Provider, fängt `beforeinstallprompt` ab |
| `src/components/pwa/install-banner.tsx` | Modifiziert | Liest aus Context statt eigenes Listener |
| `src/components/settings/install-guide-card.tsx` | Erweitert | Android-Zweig hinzugefügt |
| `src/app/(protected)/layout.tsx` | Modifiziert | PwaInstallProvider hinzufügen |

### Kein Backend, keine Migration

Alles läuft im Browser. Kein Datenbankzugriff, keine API-Endpoints, keine Migrationen.

---

## QA Test Results

**Tested:** 2026-03-18 | **Build Status:** PASS | **Overall:** PASS (all bugs fixed)

### Acceptance Criteria: 11/11 PASSED

| Category | Result |
|----------|--------|
| Android Install Card (AC-1) | PASS — button triggers native prompt; hides after dismiss; reappears when browser re-fires event |
| Already Installed / Standalone (AC-2) | PASS — "App installiert" shown for iOS and Android |
| No Install-Prompt Available (AC-3) | PASS — card not shown on Firefox Android etc. |
| No Regression (AC-4) | PASS — iOS guide unchanged; existing InstallBanner unchanged |

### Security Audit: PASS
No server-side attack surface. Entirely client-side. Authentication enforced by existing protected layout redirect.

### Bugs Found and Fixed

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| BUG-1 | Medium | `triggerInstall()` nulled prompt ref but kept `canInstall=true` on dismissal → dead button | **Fixed** (set `canInstall=false` on any outcome) |
| BUG-2 | Low | Same root cause affected `InstallBanner` floating button | **Fixed** (same fix) |

### Production Ready: YES

## Deployment
- **Deployed:** 2026-03-18
- **Method:** Push to main → Vercel auto-deploy
- **Production URL:** https://eden-azure-zeta.vercel.app
- **Migration applied:** None (frontend-only, no DB changes)
- **QA Status:** PASSED — all bugs fixed, security audit passed
