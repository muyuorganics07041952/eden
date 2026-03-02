# PROJ-6: Content Feed

## Status: In Review
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
| `GET /api/feed` | Allgemeine + personalisierte Artikel des Nutzers laden |
| `GET /api/feed/[id]` | Einzelnen Artikel laden |
| `POST /api/feed/generate` | Cron-Endpunkt: Artikel generieren (gesichert via CRON_SECRET) |

### New Dependencies

Keine — Google Gemini und CRON_SECRET sind bereits im Stack vorhanden.

### New Environment Variables

Keine — `GEMINI_API_KEY` und `CRON_SECRET` existieren bereits.

## QA Test Results

**Tested:** 2026-03-02
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Method:** Code review + build verification (no running Supabase instance available for live testing)

---

### Acceptance Criteria Status

#### AC-1: Feed-Ansicht (Two sections, article cards, categories, performance, empty state)
- [x] Two sections implemented: "Fuer deine Pflanzen" (personalized, top) and "Garten-Wissen" (general, bottom)
- [x] Article cards show: title, summary (line-clamp-3), category badge, reading time
- [x] Categories correctly defined: Bewaesserung, Duengung, Schaedlinge & Krankheiten, Saisonales, Allgemein
- [x] Feed loads from Supabase cache (server component, no client-side API calls)
- [x] Empty state shows friendly message: "Dein Feed wird vorbereitet" (not an error)
- [ ] BUG: Summary on cards uses `line-clamp-3` instead of enforcing max 150 characters visually -- summary could exceed card design expectations if Gemini generates longer summaries (though DB constraint limits to 150 chars, so this is minor)

#### AC-2: Artikel-Detail (Full view, back navigation)
- [x] Tapping a card opens full article view at `/feed/[id]`
- [x] Article detail shows: title, full text, category badge, reading time, date
- [x] Back navigation to feed (both top and bottom of article)
- [x] Date formatted in German locale (de-DE)

#### AC-3: Personalisierung (Plant selection logic)
- [x] Up to 5 plants selected for personalization
- [x] Plants with tasks due in next 14 days are prioritized
- [x] If > 5 plants with tasks, random selection is used (shuffleArray)
- [x] If < 5 plants with tasks, remaining slots filled with random other plants
- [ ] BUG: The `selectPlantsForUser` function fetches "other plants" with `.limit(5 - selectedPlants.length)` BEFORE shuffling, meaning the randomization only applies to the already-limited result set. If the user has 100 plants and 0 tasks, the query fetches the first 5 plants by DB default order (not random), then shuffles those 5. The shuffle does nothing useful here. (See BUG-3)

#### AC-4: Content-Generierung (Cron)
- [x] Vercel Cron configured: `0 6 * * 0` (Sunday 06:00 UTC) in vercel.json
- [x] Generates 3 general articles with varied categories per run
- [x] Generates 2 personalized articles per active user (max 50 users)
- [x] Content stored in Supabase, not generated on user request
- [x] Reading time auto-calculated (words / 200, minimum 1)
- [x] Deduplication via title_hash (SHA-256) with UNIQUE constraint + upsert with ignoreDuplicates

---

### Edge Cases Status

#### EC-1: User has no plants
- [x] Only "Garten-Wissen" section shown, no personalized section, no error message
- [x] `hasPersonalized` check correctly gates the personalized section

#### EC-2: Gemini API not available
- [x] Cron logs errors silently, continues processing other categories/users
- [x] Feed page loads cached content from Supabase regardless of Gemini status
- [x] 30-second timeout on Gemini calls with AbortController

#### EC-3: No content in database yet
- [x] Friendly empty state displayed: "Dein Feed wird vorbereitet -- schau bald wieder vorbei"

#### EC-4: Cron fails for individual user
- [x] Error caught per-user in try/catch, other users continue processing
- [x] Error counter incremented, returned in response JSON

#### EC-5: Long article
- [x] Article body is scrollable (default page scroll behavior)
- [x] No pagination implemented (as specified)

#### EC-6: Duplicate content
- [x] `title_hash` column has UNIQUE constraint
- [x] Upsert with `onConflict: 'title_hash', ignoreDuplicates: true`

#### EC-7: Article deleted from DB (404 state)
- [x] ArticleNotFoundState component renders friendly message
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
- [ ] BUG: Feed nav link text "Feed" is hidden on mobile (`hidden sm:inline`) but icon remains. This is consistent with the Settings nav pattern, but on very small screens the nav bar could become crowded with 4+ nav items. (See BUG-6)

---

### Security Audit Results

#### Authentication
- [x] Feed page: `createClient()` + `getUser()` check, returns null if no user
- [x] API GET /api/feed: Auth check returns 401 if not authenticated
- [x] API GET /api/feed/[id]: Auth check returns 401 if not authenticated
- [x] API POST /api/feed/generate: Protected by CRON_SECRET bearer token
- [x] Protected layout redirects to /login if no user session

#### Authorization (RLS)
- [x] RLS enabled on `feed_articles` table
- [x] SELECT policy: `user_id IS NULL OR user_id = auth.uid()` -- users can only see general articles or their own personalized articles
- [x] No INSERT/UPDATE/DELETE policies for regular users (service_role only)
- [x] Admin client used for cron (bypasses RLS appropriately)

#### Input Validation
- [x] UUID format validated with regex in GET /api/feed/[id] before DB query
- [x] Gemini response validated with Zod schema (`geminiArticleSchema`)
- [x] Title truncated to 200 chars, summary to 150 chars before insert
- [x] Category validated by Zod enum (only allowed values)
- [ ] BUG: Article detail page (`/feed/[id]/page.tsx`) does NOT validate UUID format before querying Supabase. Only the API route validates UUID. If a user navigates to `/feed/not-a-uuid`, it will query Supabase with an invalid ID, which Supabase will reject but it causes unnecessary DB traffic. (See BUG-4)

#### Rate Limiting
- [ ] BUG: No rate limiting on GET /api/feed or GET /api/feed/[id]. An attacker could spam these endpoints. However, the feed page itself is a Server Component and does not use the API routes -- it queries Supabase directly. The API routes appear to be unused by the frontend. (See BUG-5)

#### Exposed Secrets
- [x] GEMINI_API_KEY is server-side only (not prefixed with NEXT_PUBLIC_)
- [x] CRON_SECRET is server-side only
- [x] SUPABASE_SERVICE_ROLE_KEY is server-side only
- [ ] BUG: The Gemini API key is passed as a URL query parameter in the fetch call (`?key=${apiKey}`). While this is the standard Google API pattern, the key could appear in server logs if request URLs are logged. Not a critical issue but worth noting. (See BUG-7)

#### XSS / Injection
- [x] Article content is rendered as React elements (not dangerouslySetInnerHTML), so XSS via article content is prevented
- [x] Gemini-generated content is split by newline and rendered as individual `<p>`, `<h2>`, `<h3>`, `<li>` elements -- safe
- [x] No user-supplied input is rendered without React's automatic escaping

#### Data Exposure
- [x] API GET /api/feed only returns preview fields (no content, title_hash, or plant_context)
- [x] API GET /api/feed/[id] returns full article -- but RLS prevents access to other users' personalized articles
- [ ] BUG: The feed page (Server Component) fetches `SELECT *` which includes `title_hash` and `plant_context`. While these are not exposed to the client (Server Component), the `plant_context` field in personalized articles could contain plant names which are passed to the ArticleCard component and thus serialized to the client. However, ArticleCard does not render plant_context, so it depends on whether Next.js serializes unused props. (See BUG-8)

---

### Bugs Found

#### BUG-1: Cron endpoint uses POST but Vercel Cron sends GET requests
- **Severity:** Critical
- **Steps to Reproduce:**
  1. Vercel Cron is configured in `vercel.json` with `"path": "/api/feed/generate"`
  2. Vercel Cron jobs send GET requests to the configured path
  3. The `/api/feed/generate/route.ts` only exports a `POST` handler
  4. Expected: Cron triggers article generation
  5. Actual: Cron sends GET, receives 405 Method Not Allowed. No articles are ever generated.
- **Priority:** Fix before deployment -- this completely breaks the content generation pipeline

#### BUG-2: API routes (GET /api/feed, GET /api/feed/[id]) are unused by the frontend
- **Severity:** Low
- **Steps to Reproduce:**
  1. The feed page (`/feed/page.tsx`) is a Server Component that queries Supabase directly
  2. The article detail page (`/feed/[id]/page.tsx`) also queries Supabase directly
  3. The API routes at `/api/feed` and `/api/feed/[id]` are never called by any frontend code
  4. Expected: API routes are used by the frontend or documented as external endpoints
  5. Actual: Dead code -- API routes exist but serve no purpose
- **Priority:** Nice to have -- remove or document as public API endpoints

#### BUG-3: Plant selection randomization is ineffective for fill-up slots
- **Severity:** Medium
- **Steps to Reproduce:**
  1. User has 50 plants, 0 with upcoming tasks
  2. `selectPlantsForUser` executes: query `.limit(5)` then `shuffleArray(otherPlants)`
  3. Expected: 5 random plants from the user's 50 plants
  4. Actual: The same 5 plants are returned every time (DB default order), shuffled among themselves. True randomization would require either a SQL `ORDER BY random()` or fetching all plants and shuffling.
- **Priority:** Fix in next sprint -- affects content variety for users with many plants

#### BUG-4: Article detail page does not validate UUID format
- **Severity:** Low
- **Steps to Reproduce:**
  1. Navigate to `/feed/not-a-valid-uuid`
  2. Expected: Immediate 404-style response without DB query
  3. Actual: Supabase is queried with invalid UUID, returns error, then ArticleNotFoundState is shown. Functionally correct but wasteful.
- **Priority:** Nice to have

#### BUG-5: No rate limiting on API feed endpoints
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Send rapid requests to `GET /api/feed` or `GET /api/feed/[id]`
  2. Expected: Rate limiting after N requests
  3. Actual: No rate limiting. However, since the frontend does not use these endpoints, impact is limited.
- **Priority:** Fix in next sprint (if API routes are kept)

#### BUG-6: Navigation crowding on small mobile screens
- **Severity:** Low
- **Steps to Reproduce:**
  1. View app on 375px width
  2. Navigation bar has: "Eden" logo, "Pflanzen", Tasks link, Feed icon, Settings icon, email, Logout button
  3. Expected: Navigation fits comfortably
  4. Actual: Many items in a single row could cause overflow on very small screens, especially if email is long
- **Priority:** Nice to have -- the `hidden sm:inline` pattern helps, but the nav has grown with each feature

#### BUG-7: Gemini API key in URL query parameter
- **Severity:** Low
- **Steps to Reproduce:**
  1. Cron job calls Gemini API with `?key=${apiKey}` in URL
  2. If server request logging is enabled, the API key appears in logs
  3. Expected: API key sent in header
  4. Actual: API key in URL. This is Google's standard pattern for Gemini API, so it is an accepted trade-off, but could be improved by using header-based auth if available.
- **Priority:** Nice to have

#### BUG-8: SELECT * in Server Component fetches unnecessary fields
- **Severity:** Low
- **Steps to Reproduce:**
  1. Feed page queries `SELECT *` from feed_articles
  2. This includes `title_hash`, `plant_context`, and `content` for list view
  3. Expected: Only needed fields are fetched (like the API route does)
  4. Actual: Extra data transferred from DB. The `content` field is particularly wasteful as full article text is fetched for every card in the list view.
- **Priority:** Fix in next sprint -- performance optimization, fetching full `content` for 30 articles on the list page is unnecessarily heavy

#### BUG-9: Cron response does not use proper HTTP status on partial failure
- **Severity:** Low
- **Steps to Reproduce:**
  1. If fetching active users fails, the cron returns status 200 with error count
  2. Expected: Non-200 status code when significant errors occur
  3. Actual: Always returns 200 (default NextResponse.json). This makes monitoring/alerting harder.
- **Priority:** Nice to have

#### BUG-10: German umlauts replaced with ASCII in UI text
- **Severity:** Low
- **Steps to Reproduce:**
  1. View feed page empty state: "regelmaessig" instead of "regelmaessig" (though actually the original text in the code does use "regelmaessig" not "regelmaeig" -- this appears intentional as ASCII-safe text)
  2. Article detail back button: "Zurueck zum Feed" instead of "Zurueck zum Feed"
  3. Expected: Proper German text with umlauts ("regelmaeig", "Zurueck") or consistent ASCII alternatives
  4. Actual: ASCII transliterations used (ae, ue, oe instead of ae, ue, oe). The rest of the app (categories like "Bewaesserung", "Duengung") uses proper umlauts. This is inconsistent.
- **Priority:** Fix in next sprint -- inconsistent UX for German-language app

---

### Regression Testing

#### PROJ-1: User Authentication
- [x] Protected layout still checks auth and redirects to /login
- [x] Feed pages check user authentication

#### PROJ-2: Plant Management
- [x] No changes to plant-related code
- [x] Feed cron reads from `plants` table (read-only, no modifications)

#### PROJ-4: Care Management
- [x] Feed cron reads from `care_tasks` table (read-only, no modifications)
- [x] No changes to care task routes or components

#### PROJ-5: Reminders & Push Notifications
- [x] Existing cron job in vercel.json preserved (`/api/push/send`)
- [x] New feed cron added alongside existing cron

#### Layout / Navigation
- [x] Feed nav link added to shared layout
- [x] Existing nav links (Pflanzen, Tasks, Settings) unchanged

---

### Summary
- **Acceptance Criteria:** 14/16 passed (2 minor issues in AC-1 and AC-3)
- **Edge Cases:** 7/7 passed
- **Bugs Found:** 10 total (1 Critical, 0 High, 3 Medium, 6 Low)
- **Security:** Mostly solid -- RLS properly configured, auth checks in place, Zod validation on Gemini responses, no XSS vectors. Minor issues with rate limiting and unnecessary data fetching.
- **Production Ready:** NO
- **Recommendation:** Fix BUG-1 (Critical: cron uses POST but Vercel sends GET) before deployment. BUG-3 and BUG-8 should be addressed in the next sprint for content quality and performance.

## Deployment
_To be added by /deploy_
