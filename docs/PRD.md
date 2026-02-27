# Product Requirements Document

## Vision
Eine progressive Web-App (PWA) für Gartenbegeisterte, die ihre Pflanzen digital verwalten, KI-gestützte Pflegeempfehlungen erhalten und durch personalisierte Garteninhalte inspiriert werden möchten. Die App folgt einem clean, minimalen UX-Stil (Referenz: Notion/Linear) und ist von Grund auf für die Integration weiterer Features offen.

## Target Users
**Gartenbesitzer und Pflanzenliebhaber**, die:
- Einen Überblick über ihre Pflanzen und deren Pflegebedarf behalten möchten
- Nicht vergessen wollen, wann welche Pflanze gegossen, gedüngt oder beschnitten werden muss
- Sich für Gartenwissen interessieren, aber keine Profi-Gärtner sind
- Technikaffin genug sind, eine Web-App zu nutzen (Smartphone + Desktop)

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | User Authentication | Planned |
| P0 (MVP) | Plant Management (CRUD + Photos) | Planned |
| P0 (MVP) | AI Plant Identification | Planned |
| P0 (MVP) | Care Management (Suggestions + Tasks) | Planned |
| P0 (MVP) | Reminders & Push Notifications | Planned |
| P0 (MVP) | Content Feed | Planned |
| P1 | Garden Dashboard | Planned |
| P2 | Offline & PWA Optimization | Planned |

## Success Metrics
- **Onboarding:** 60% der neuen Nutzer legen mindestens 3 Pflanzen an
- **Engagement:** Wöchentliche Rückkehrrate > 40%
- **Reminders:** 40% der Nutzer aktivieren Push-Benachrichtigungen
- **Content:** 30% der Nutzer lesen mindestens einen Artikel pro Woche

## Constraints
- Solo-Entwickler, kein fixes Budget oder Timeline
- Tech Stack: Next.js 16 (App Router), Supabase, Tailwind CSS + shadcn/ui
- Externe APIs: Plant.id (Pflanzenerkennung), OpenAI (Care-Vorschläge + Content)
- Plattform: PWA (kein Native App)

## Non-Goals
- Native iOS/Android App (nur PWA)
- Social Features / Community (Phase 2+)
- E-Commerce / Pflanzen kaufen
- B2B / professionelle Gartenverwaltung
- Mehrsprachigkeit (zunächst Deutsch)

---

Use `/requirements` to create detailed feature specifications for each item in the roadmap above.
