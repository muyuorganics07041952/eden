# PROJ-21: Android PWA Install in Settings

## Status: Planned
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
