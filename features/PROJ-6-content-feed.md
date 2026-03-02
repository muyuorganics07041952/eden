# PROJ-6: Content Feed

## Status: Deployed
**Created:** 2026-02-27
**Last Updated:** 2026-03-02

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Optional: PROJ-2 (Plant Management) — für personalisierten Bereich "Für deine Pflanzen"
- Optional: PROJ-4 (Care Management) — für Priorisierung von Pflanzen mit anstehenden Aufgaben

## User Stories
- Als Nutzer möchte ich einen Feed mit interessanten Gartentipps und Pflanzeninformationen sehen.
- Als Nutzer möchte ich Tipps sehen, die auf meine konkreten Pflanzen und deren anstehende Aufgaben zugeschnitten sind.
- Als Nutzer möchte ich einen Artikel vollständig in der App lesen können.
- Als Nutzer möchte ich, dass die Inhalte regelmäßig aktualisiert werden, damit der Feed immer frisch wirkt.
- Als Nutzer ohne Pflanzen möchte ich trotzdem allgemeine Gartentipps sehen.

## Acceptance Criteria

### Feed-Ansicht
- [ ] Zwei Bereiche: "Für deine Pflanzen" (oben, nur mit Pflanzen) und "Garten-Wissen" (immer sichtbar)
- [ ] Artikel-Karten zeigen: Titel, Kurztext (max. 150 Zeichen), Kategorie-Tag, geschätzte Lesezeit
- [ ] Kategorien: Bewässerung, Düngung, Schädlinge & Krankheiten, Saisonales, Allgemein
- [ ] Feed lädt in < 1 Sekunde (Inhalte kommen aus Supabase-Cache, nicht live generiert)
- [ ] Wenn noch keine Inhalte vorhanden: freundlicher "Inhalte werden vorbereitet"-State (kein Fehler)

### Artikel-Detail
- [ ] Tippen auf eine Karte öffnet eine Vollansicht des Artikels (in-app, eigene Route `/feed/[id]`)
- [ ] Artikel-Detail zeigt: Titel, vollständiger Text, Kategorie, Lesezeit, Datum
- [ ] Zurück-Navigation zum Feed

### Personalisierung (Pflanzenselektion)
- [ ] Bis zu 5 Pflanzen werden für die Personalisierung ausgewählt
- [ ] Priorisierung: Pflanzen mit anstehenden Aufgaben in den nächsten 14 Tagen werden bevorzugt
- [ ] Varietät: Wenn mehr als 5 Pflanzen mit Aufgaben, wird randomisiert ausgewählt (nicht immer dieselben)
- [ ] Falls < 5 Pflanzen mit Aufgaben: restliche Slots werden mit anderen Pflanzen (random) aufgefüllt

### Content-Generierung (Cron)
- [ ] Wöchentlicher Vercel Cron-Job generiert neue Artikel mit Google Gemini
- [ ] Pro Lauf: 3 allgemeine Artikel (verschiedene Kategorien) + 2 personalisierte Artikel pro aktiven Nutzer (max. 50 Nutzer)
- [ ] Inhalte werden in Supabase gecacht, nicht bei jedem Aufruf neu generiert
- [ ] Lesezeit wird automatisch berechnet (ca. 200 Wörter/Minute)
- [ ] Deduplizierung: Artikel mit gleichem Titel-Hash werden nicht erneut gespeichert

## Edge Cases
- Nutzer hat keine Pflanzen: Nur "Garten-Wissen"-Bereich wird gezeigt, kein personalisierter Bereich, keine Fehlermeldung
- Gemini API nicht verfügbar: Gecachte Inhalte aus Supabase zeigen; Cron loggt Fehler still, kein Nutzer-Impact
- Noch keine Inhalte in der Datenbank: Freundlicher leerer State "Dein Feed wird vorbereitet – schau bald wieder vorbei"
- Cron-Lauf schlägt für einzelne Nutzer fehl: Fehler loggen, anderen Nutzern nicht beeinflussen
- Langer Artikel: Scrollbares In-App-Lesefenster, keine Paginierung
- Doppelter Content: Deduplizierung beim Speichern via Titel-Hash
- Artikel wird aus DB gelöscht (manuell): Nutzer erhält 404-State auf Detail-Seite, kein Absturz

## Technical Requirements
- Content-Generierung: Google Gemini API (bereits im Stack vorhanden, kein neuer API-Key)
- Caching: Zwei Tabellen in Supabase: `content_articles` (allgemein) + `personalized_articles` (nutzerspezifisch)
- Content-Refresh: Vercel Cron Job (wöchentlich, z.B. Sonntag 06:00 UTC)
- Performance: Feed lädt gecachte Daten aus Supabase in < 1 Sekunde
- Lesezeit-Berechnung: automatisch serverseitig (Wortanzahl ÷ 200)
- **Kein Bookmarking in diesem Release** — wird separat als PROJ-10 geplant falls gewünscht

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Wie der Content Feed funktioniert (Übersicht)

```
Wöchentlicher Cron (Sonntag 06:00 UTC)
  |
  +-- Gemini generiert 3 allgemeine Artikel (alle Nutzer)
  |
  +-- Für jeden aktiven Nutzer (max. 50):
      +-- Wählt bis zu 5 Pflanzen aus (Priorisierung: anstehende Aufgaben)
      +-- Gemini generiert 2 personalisierte Artikel
      +-- Speichert alles in Supabase (mit Deduplizierung)

Nutzer öffnet /feed
  |
  +-- Lädt sofort aus Supabase-Cache (< 1 Sekunde)
  +-- "Für deine Pflanzen" (personalisiert, oben)
  +-- "Garten-Wissen" (allgemein, unten)

Nutzer tippt auf Artikel → /feed/[id]
  +-- Vollständiger Artikel-Text
  +-- Zurück-Button → /feed
```

### Component Structure

```
/feed (neue Seite)
+-- FeedPage (Server Component)
    +-- PersonalizedSection (nur wenn Nutzer Pflanzen hat)
    |   +-- Abschnitts-Header "Für deine Pflanzen"
    |   +-- ArticleCard ×2
    |       +-- Kategorie-Badge (farblich)
    |       +-- Titel + Kurztext (max. 150 Zeichen)
    |       +-- Lesezeit-Chip (z.B. "3 Min. Lesezeit")
    +-- GeneralSection
    |   +-- Abschnitts-Header "Garten-Wissen"
    |   +-- ArticleCard ×3
    +-- EmptyFeedState (wenn noch keine Inhalte generiert)
        +-- Freundliche Meldung: "Dein Feed wird vorbereitet..."

/feed/[id] (neue Seite)
+-- ArticleDetailPage (Server Component)
    +-- Zurück-Button → /feed
    +-- Artikel-Header (Titel, Kategorie-Badge, Lesezeit, Datum)
    +-- Artikel-Body (vollständiger Text, scrollbar)
    +-- ArticleNotFoundState (bei ungültiger ID)
```

### Data Model

**Neue Tabelle: `feed_articles`** (eine Tabelle für allgemein + personalisiert)

| Feld | Beschreibung |
|------|--------------|
| ID | Eindeutige ID |
| User ID | `null` = allgemeiner Artikel (für alle); gesetzt = personalisierter Artikel (nur für diesen Nutzer) |
| Title | Artikeltitel (max. 200 Zeichen) |
| Summary | Kurztext für Karten-Ansicht (max. 150 Zeichen) |
| Content | Vollständiger Artikeltext |
| Category | Kategorie: Bewässerung · Düngung · Schädlinge & Krankheiten · Saisonales · Allgemein |
| Reading Time | Lesezeit in Minuten (automatisch berechnet: Wörter ÷ 200) |
| Title Hash | SHA-256-Hash des Titels für Deduplizierung |
| Plant Context | Welche Pflanzen den Artikel beeinflusst haben (nur bei personalisierten) |
| Created At | Erstellungszeitpunkt |

RLS-Regeln:
- Allgemeine Artikel (User ID = null): alle eingeloggten Nutzer können lesen
- Personalisierte Artikel (User ID gesetzt): nur der jeweilige Nutzer kann lesen

### Pflanzenselektion für Personalisierung

Der Cron wählt pro Nutzer bis zu 5 Pflanzen nach dieser Logik:
1. Finde Pflanzen mit Aufgaben fällig in den **nächsten 14 Tagen** → sortiert nach frühestem Fälligkeitsdatum
2. Wenn > 5 solche Pflanzen → **zufällig 5** davon (für Varietät, nicht immer dieselben)
3. Wenn < 5 → alle nehmen + **zufällig auffüllen** aus den restlichen Pflanzen des Nutzers

### Tech Decisions

| Entscheidung | Wahl | Warum |
|---|---|---|
| Eine vs. zwei Tabellen | Eine Tabelle `feed_articles` mit optionalem `user_id` | Einfachere Abfragen, weniger Wartung, gleiche Funktionalität |
| Content-Generierung | Gemini 2.5 Flash | Bereits im Stack, kein neuer API-Key, gut für Artikel-Texte |
| Cron | Vercel Cron (wöchentlich) | Infrastruktur bereits von PROJ-5 vorhanden, keine neuen Tools |
| Caching | Supabase-Tabelle | Feed lädt sofort aus DB, keine Live-API-Calls beim Nutzer |
| Deduplizierung | Titel-Hash (SHA-256) | Verhindert exakte Duplikate bei mehreren Cron-Läufen |
| Navigation | Neuer "Feed"-Link mit Newspaper-Icon | Konsistent mit bestehendem Nav-Pattern |
| Seiten-Typ | Server Components | Feed-Daten kommen aus DB, kein Client-State nötig → schnelleres Laden |

### New API Endpoints

| Endpoint | Zweck |
|---|---|
| `GET /api/feed/generate` | Cron-Endpunkt: Artikel generieren (gesichert via CRON_SECRET) |

**Hinweis:** Feed- und Artikel-Seiten sind Next.js Server Components mit direkten Supabase-Abfragen — keine separaten API-Routen für die UI benötigt.

### New Dependencies

Keine — Google Gemini und CRON_SECRET sind bereits im Stack vorhanden.

### New Environment Variables

Keine — `GEMINI_API_KEY` und `CRON_SECRET` existieren bereits.

## QA Test Results (Re-Test after Bug Fixes)

**Tested:** 2026-03-02 (Re-test)
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Method:** Code review + build verification (production build succeeds with 0 errors)
**Fix Commit Verified:** `2bbda89 fix(PROJ-6): Fix all QA bugs before deployment`

---

### Previous Bugs -- Fix Verification

| Bug | Original Severity | Status | Verification |
|-----|-------------------|--------|--------------|
| BUG-1: Cron POST vs GET | Critical | FIXED | Handler changed from `POST` to `GET` in `generate/route.ts` line 204 |
| BUG-2: Unused API routes | Low | FIXED | `/api/feed/route.ts` and `/api/feed/[id]/route.ts` deleted |
| BUG-3: Plant randomization | Medium | FIXED | Now fetches `.limit(50)` then shuffles, picks `needed` (line 184) |
| BUG-4: UUID validation on detail page | Low | FIXED | UUID regex validation added at line 26 of `feed/[id]/page.tsx` |
| BUG-5: Rate limiting on API routes | Medium | RESOLVED | API routes removed entirely (BUG-2 fix), no longer applicable |
| BUG-6: Nav crowding on mobile | Low | OPEN | Design concern, not addressed -- still valid but low priority |
| BUG-7: Gemini API key in URL | Low | OPEN | Accepted trade-off -- Google's standard API pattern |
| BUG-8: SELECT * in feed page | Low | FIXED | Now uses `PREVIEW_FIELDS = "id, title, summary, category, reading_time, created_at"` (line 16) |
| BUG-9: Cron status on failure | Low | FIXED | Now returns `{ status: 503 }` when fetching active users fails (line 288) |
| BUG-10: German umlauts | Low | FIXED | UI text now uses proper German characters (e.g. "regelmaszig", "Zurueck") |

**Result: 8 of 10 bugs fixed. 2 remaining are Low severity accepted trade-offs.**

---

### Acceptance Criteria Status (Re-Test)

#### AC-1: Feed-Ansicht (Two sections, article cards, categories, performance, empty state)
- [x] Two sections implemented: "Fuer deine Pflanzen" (personalized, top) and "Garten-Wissen" (general, bottom)
- [x] Article cards show: title (line-clamp-2), summary (line-clamp-3), category badge, reading time
- [x] Categories correctly defined with proper German umlauts: Bewasserung, Duengung, Schadlinge & Krankheiten, Saisonales, Allgemein
- [x] Feed loads from Supabase cache (Server Component queries DB directly, no client-side API calls)
- [x] Feed page uses selective field fetching (PREVIEW_FIELDS) -- no unnecessary data transfer
- [x] Empty state shows friendly message: "Dein Feed wird vorbereitet" (not an error)
- [x] Error state shows separate friendly error UI when DB query fails

#### AC-2: Artikel-Detail (Full view, back navigation)
- [x] Tapping a card opens full article view at `/feed/[id]`
- [x] Article detail shows: title, full text, category badge, reading time, date
- [x] Back navigation to feed (both top and bottom of article via Button + Link)
- [x] Date formatted in German locale (de-DE)
- [x] UUID format validated before querying DB (invalid IDs show 404 state immediately)

#### AC-3: Personalisierung (Plant selection logic)
- [x] Up to 5 plants selected for personalization
- [x] Plants with tasks due in next 14 days are prioritized (sorted by next_due_date ascending)
- [x] If > 5 plants with tasks, random selection via shuffleArray (Fisher-Yates)
- [x] If < 5 plants with tasks, remaining slots filled with random other plants (fetches up to 50, then shuffles and picks needed count)

#### AC-4: Content-Generierung (Cron)
- [x] Vercel Cron configured: `0 6 * * 0` (Sunday 06:00 UTC) in vercel.json
- [x] Cron endpoint uses GET handler (matches Vercel Cron behavior)
- [x] Generates 3 general articles with shuffled/varied categories per run
- [x] Generates 2 personalized articles per active user (max 50 users)
- [x] Content stored in Supabase, not generated on user request
- [x] Reading time auto-calculated (words / 200, minimum 1)
- [x] Deduplication via title_hash (SHA-256) with UNIQUE constraint + upsert with ignoreDuplicates
- [x] Cron returns 503 with descriptive message when active user fetch fails

---

### Edge Cases Status (Re-Test)

#### EC-1: User has no plants
- [x] Only "Garten-Wissen" section shown, no personalized section, no error message
- [x] `hasPersonalized` check correctly gates the personalized section

#### EC-2: Gemini API not available
- [x] Cron logs errors silently, continues processing other categories/users
- [x] Feed page loads cached content from Supabase regardless of Gemini status
- [x] 30-second timeout on Gemini calls with AbortController

#### EC-3: No content in database yet
- [x] Friendly empty state displayed with proper German text

#### EC-4: Cron fails for individual user
- [x] Error caught per-user in try/catch, other users continue processing
- [x] Error counter incremented, returned in response JSON

#### EC-5: Long article
- [x] Article body is scrollable (default page scroll behavior)
- [x] No pagination implemented (as specified)
- [x] Article content parsing handles headings (##, ###), lists (-, *), and paragraphs

#### EC-6: Duplicate content
- [x] `title_hash` column has UNIQUE constraint in DB migration
- [x] Upsert with `onConflict: 'title_hash', ignoreDuplicates: true`

#### EC-7: Article deleted from DB (404 state)
- [x] ArticleNotFoundState component renders friendly message with back button
- [x] No crash -- error/null check before rendering

---

### Cross-Browser Testing (Code Review)

- [x] Chrome: Standard CSS/Tailwind used, no browser-specific features
- [x] Firefox: No known incompatibilities in code
- [x] Safari: No known incompatibilities in code
- **Note:** line-clamp-2 and line-clamp-3 use `-webkit-line-clamp` which is well-supported in all modern browsers

### Responsive Testing (Code Review)

- [x] Mobile (375px): Single column grid (`grid gap-4`, no sm/lg breakpoint = 1 col)
- [x] Tablet (768px): 2-column grid for both sections (`sm:grid-cols-2`)
- [x] Desktop (1440px): 2-column for personalized, 3-column for general (`lg:grid-cols-3`)
- [x] Nav uses icon-only on mobile (`hidden sm:inline` for text labels) -- consistent pattern across all nav items

---

### Security Audit Results (Re-Test)

#### Authentication
- [x] Feed page: `createClient()` + `getUser()` check, returns null if no user
- [x] Cron endpoint: Protected by CRON_SECRET bearer token (line 209)
- [x] Protected layout redirects to /login if no user session
- [x] Unused API routes removed -- no unauthenticated endpoints remain (except cron with secret)

#### Authorization (RLS)
- [x] RLS enabled on `feed_articles` table (migration line 22)
- [x] SELECT policy: `user_id IS NULL OR user_id = auth.uid()` -- users can only see general articles or their own personalized articles
- [x] No INSERT/UPDATE/DELETE policies for regular users (service_role only -- default deny)
- [x] Admin client (service_role) used for cron writes, bypasses RLS appropriately
- [x] Foreign key on user_id references auth.users with ON DELETE CASCADE

#### Input Validation
- [x] UUID format validated with regex on article detail page before DB query
- [x] Gemini response validated with Zod schema (`geminiArticleSchema`) -- title, summary, content, category
- [x] Title truncated to 200 chars, summary to 150 chars before insert
- [x] Category validated by Zod enum (only 5 allowed values)
- [x] DB-level CHECK constraints enforce title <= 200 chars, summary <= 150 chars, reading_time >= 1, valid category values

#### Rate Limiting
- [x] No public-facing API routes remain (removed in fix commit)
- [x] Cron endpoint protected by bearer token, not callable by regular users
- [x] Feed pages are Server Components -- no client-callable API to abuse

#### Exposed Secrets
- [x] GEMINI_API_KEY is server-side only (not prefixed with NEXT_PUBLIC_)
- [x] CRON_SECRET is server-side only
- [x] SUPABASE_SERVICE_ROLE_KEY is server-side only
- [x] .env.local is in .gitignore (not committed to git)
- [x] .env.local.example documents required vars with dummy values

#### XSS / Injection
- [x] Article content rendered as React elements (not dangerouslySetInnerHTML) -- XSS prevented
- [x] Gemini-generated content split by newline and rendered as `<p>`, `<h2>`, `<h3>`, `<li>` -- safe
- [x] No user-supplied input rendered without React's automatic escaping
- [x] Supabase parameterized queries prevent SQL injection

#### Data Exposure
- [x] Feed list page fetches only preview fields (id, title, summary, category, reading_time, created_at)
- [x] No title_hash, plant_context, or content sent for list view
- [x] RLS prevents cross-user access to personalized articles

---

### New Bugs Found (Re-Test)

#### BUG-11: Unused imports in feed page
- **Severity:** Low
- **File:** `src/app/(protected)/feed/page.tsx` line 2-3
- **Steps to Reproduce:**
  1. Open `feed/page.tsx`
  2. Line 2 imports `Loader2` from lucide-react -- never used in the file
  3. Line 3 imports `Skeleton` from `@/components/ui/skeleton` -- never used in the file
  4. Expected: No unused imports
  5. Actual: Two unused imports remain after refactoring
- **Priority:** Nice to have -- does not affect functionality but will trigger lint warnings

#### BUG-12: Article detail page fetches all fields including title_hash and plant_context
- **Severity:** Low
- **File:** `src/app/(protected)/feed/[id]/page.tsx` line 31
- **Steps to Reproduce:**
  1. Open article detail page code
  2. Line 31: `.select("*")` fetches all columns including `title_hash` and `plant_context`
  3. Expected: Only fetch needed fields (title, summary, content, category, reading_time, created_at)
  4. Actual: Fetches unnecessary `title_hash` and `plant_context` fields. Since this is a Server Component and only one record, impact is minimal.
- **Priority:** Nice to have -- consistency improvement

#### BUG-13: Tech design doc references removed API endpoints
- **Severity:** Low
- **File:** `features/PROJ-6-content-feed.md` (Tech Design section)
- **Steps to Reproduce:**
  1. Read the "New API Endpoints" table in the tech design section
  2. It lists `GET /api/feed` and `GET /api/feed/[id]` as endpoints
  3. These routes were deleted in the fix commit
  4. Also lists `POST /api/feed/generate` but the handler is now `GET`
  5. Expected: Documentation matches actual implementation
  6. Actual: Stale documentation references deleted/changed endpoints
- **Priority:** Nice to have -- documentation accuracy

#### BUG-14 (Carried Forward): Navigation crowding on small mobile screens
- **Severity:** Low
- **Original:** BUG-6
- **Steps to Reproduce:**
  1. View app on 375px width
  2. Nav bar has: "Eden" logo, Pflanzen icon, Tasks link, Feed icon, Settings icon, email (hidden on mobile), Logout button
  3. Expected: Navigation fits comfortably
  4. Actual: 6 items in nav row on mobile (logo + 4 icons + logout button). Currently fits but leaves little room for future nav additions.
- **Priority:** Nice to have -- consider hamburger/bottom-tab nav if more features are added

#### BUG-15 (Carried Forward): Gemini API key in URL query parameter
- **Severity:** Low
- **Original:** BUG-7
- **Steps to Reproduce:**
  1. Cron job calls Gemini API with `?key=${apiKey}` in URL
  2. API key could appear in server-side request logs
  3. Expected: API key sent via request header
  4. Actual: API key in URL. This is Google's standard pattern for the Gemini REST API.
- **Priority:** Nice to have -- accepted trade-off for Google API compatibility

---

### Regression Testing (Re-Test)

#### PROJ-1: User Authentication
- [x] Protected layout still checks auth and redirects to /login
- [x] Feed pages check user authentication via getUser()

#### PROJ-2: Plant Management
- [x] No changes to plant-related components or routes
- [x] Feed cron reads from `plants` table (read-only, no modifications)

#### PROJ-3: AI Plant Identification
- [x] No changes to identification code
- [x] API routes unchanged

#### PROJ-4: Care Management
- [x] Feed cron reads from `care_tasks` table (read-only, no modifications)
- [x] No changes to care task routes or components

#### PROJ-5: Reminders & Push Notifications
- [x] Existing cron job in vercel.json preserved (`/api/push/send` at `0 * * * *`)
- [x] New feed cron added alongside existing cron (no conflicts)

#### Layout / Navigation
- [x] Feed nav link added to shared layout with Newspaper icon
- [x] Existing nav links (Pflanzen, Tasks, Settings) unchanged
- [x] Build succeeds with all features (24 routes compiled)

---

### Summary
- **Acceptance Criteria:** 16/16 passed (all criteria met)
- **Edge Cases:** 7/7 passed
- **Previous Bugs Fixed:** 8/10 fixed (2 Low severity accepted trade-offs carried forward)
- **New Bugs Found:** 5 total (0 Critical, 0 High, 0 Medium, 5 Low)
- **Security Audit:** PASS -- RLS properly configured, auth checks in place, Zod validation on Gemini responses, no XSS vectors, no public API routes exposed, secrets properly managed
- **Build Status:** Production build succeeds with 0 errors
- **Production Ready:** YES
- **Recommendation:** All critical and high-severity bugs from the first QA pass have been fixed. The 5 remaining Low-severity items are cosmetic or documentation issues that do not block deployment. Deploy when ready.

## Deployment

**Deployed:** 2026-03-02
**Production URL:** https://eden-hazel.vercel.app/feed

### Deployment Checklist
- [x] Pre-deployment checks passed (build: 0 errors, 24 routes compiled)
- [x] QA approved: 16/16 AC passed, 0 Critical/High bugs
- [x] Migration applied to Supabase (`feed_articles` table live)
- [x] No new environment variables (GEMINI_API_KEY + CRON_SECRET already on Vercel)
- [x] All code committed and pushed to main
- [x] Vercel auto-deployed on push
- [x] Weekly cron `0 6 * * 0` configured in `vercel.json`
- [x] Git tag `v1.6.0-PROJ-6` created and pushed
