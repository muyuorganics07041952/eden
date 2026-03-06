# PROJ-10: Content Feed Improvements

## Status: Deployed
**Created:** 2026-03-06
**Last Updated:** 2026-03-06

## Dependencies
- Requires: PROJ-6 (Content Feed) — baut auf bestehender `feed_articles`-Tabelle und Cron-Infrastruktur auf

## User Stories
- Als Nutzer möchte ich täglich neue Artikel im Feed sehen, damit der Feed immer frisch und relevant bleibt.
- Als Nutzer möchte ich 10–15 Artikel auf einmal sehen, damit ich mehr Auswahl beim Lesen habe.
- Als Nutzer möchte ich keine veralteten Artikel aus dem letzten Monat sehen, damit der Feed aktuell wirkt.
- Als Nutzer möchte ich, dass personalisierte Artikel weiterhin zuerst erscheinen, damit ich relevante Inhalte sofort finde.

## Acceptance Criteria

### Feed-Häufigkeit
- [ ] Cron-Job läuft täglich (statt wöchentlich), z.B. um 07:00 UTC
- [ ] Pro Lauf: 2 allgemeine Artikel + 1 personalisierter Artikel pro aktivem Nutzer (max. 50 Nutzer)
- [ ] Deduplizierung bleibt aktiv (Titel-Hash), sodass kein Artikel doppelt gespeichert wird

### Artikel-Anzeige
- [ ] "Für deine Pflanzen" zeigt bis zu 5 personalisierte Artikel (bisher: 2)
- [ ] "Garten-Wissen" zeigt bis zu 10 allgemeine Artikel (bisher: 3)
- [ ] Gesamt max. 15 Artikel sichtbar im Feed
- [ ] Artikel sind absteigend nach `created_at` sortiert (neueste zuerst)

### 30-Tage-Fenster
- [ ] Nur Artikel der letzten 30 Tage werden im Feed angezeigt
- [ ] Cron-Job bereinigt bei jedem Lauf Artikel, die älter als 30 Tage sind (DELETE aus `feed_articles`)
- [ ] Das Löschen alter Artikel erfolgt vor der Generierung neuer Inhalte

### Bestehende Funktionen bleiben erhalten
- [ ] Artikeldetail-Seite `/feed/[id]` funktioniert weiterhin
- [ ] Personalisierungs-Logik (Pflanzenselektion) bleibt unverändert
- [ ] Leerer Feed-State ("Dein Feed wird vorbereitet") bleibt für neue Nutzer erhalten

## Edge Cases
- Noch keine 5 personalisierten Artikel vorhanden (neue Nutzer): Zeige was da ist, kein Fehler
- Noch keine 10 allgemeinen Artikel vorhanden: Zeige was da ist, kein Fehler
- Ein Artikel wird über den Direktlink aufgerufen, ist aber bereits älter als 30 Tage und gelöscht: Bestehender 404-State wird angezeigt
- Cron-Bereinigung schlägt fehl: Fehler wird geloggt, Generierung neuer Artikel läuft trotzdem weiter
- Gemini-API nicht verfügbar: Bereinigung findet trotzdem statt, Generierung schlägt still fehl — gecachte Artikel aus den letzten 30 Tagen bleiben sichtbar
- Nutzer ohne Pflanzen: Kein personalisierter Bereich, nur bis zu 10 allgemeine Artikel sichtbar

## Technical Requirements
- Cron: `vercel.json` Zeitplan von `0 6 * * 0` (wöchentlich) auf `0 7 * * *` (täglich) ändern
- DB: Kein Schema-Change nötig — `feed_articles`-Tabelle bleibt unverändert
- Query: Feed-Seite filtert mit `.gte('created_at', thirtyDaysAgo)` und erhöhten `.limit()`-Werten
- Cleanup: DELETE-Query in Cron vor der Generierung: `DELETE FROM feed_articles WHERE created_at < now() - interval '30 days'`
- Keine neuen Umgebungsvariablen nötig

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Überblick

PROJ-10 ist eine reine Backend-Änderung. Es gibt keine neuen UI-Komponenten, kein neues Datenbankschema und keine neuen API-Routen. Nur 3 bestehende Dateien werden angepasst.

### Ablauf-Vergleich

**Vorher (wöchentlich):**
```
Jeden Sonntag 06:00 UTC
  → 3 allgemeine Artikel generieren
  → 2 personalisierte Artikel pro Nutzer generieren
  → Speichern (ohne Altersfilter)

/feed lädt:
  → Bis zu 6 personalisierte Artikel (alle jemals erstellt)
  → Bis zu 9 allgemeine Artikel (alle jemals erstellt)
```

**Nachher (täglich):**
```
Jeden Tag 07:00 UTC
  → Schritt 0: Artikel > 30 Tage alt löschen (Bereinigung)
  → Schritt 1: 2 allgemeine Artikel generieren
  → Schritt 2: 1 personalisierten Artikel pro Nutzer generieren
  → Speichern (Deduplizierung via Titel-Hash wie bisher)

/feed lädt:
  → Bis zu 5 personalisierte Artikel der letzten 30 Tage
  → Bis zu 10 allgemeine Artikel der letzten 30 Tage
```

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `vercel.json` | Cron-Zeitplan: `0 6 * * 0` → `0 7 * * *` |
| `src/app/api/feed/generate/route.ts` | Bereinigung alter Artikel am Anfang des Runs; allgemeine Artikel: 3 → 2; personalisierte: 2 → 1 pro Nutzer |
| `src/app/(protected)/feed/page.tsx` | 30-Tage-Filter auf beide Abfragen; Limits: personalisiert 6 → 5, allgemein 9 → 10 |

### Warum diese Zahlen?

**Täglich 2 allgemein + 1 personalisiert:**
- Über 30 Tage entstehen ~60 allgemeine Artikel — ausreichend Puffer für .limit(10)
- Über 30 Tage entstehen ~30 personalisierte Artikel pro Nutzer — ausreichend für .limit(5)
- Kleinere Batches = weniger Timeout-Risiko und geringere Gemini-Kosten pro Cron-Lauf

**30-Tage-Fenster:**
- Feed zeigt immer saisonrelevante Inhalte
- Datenbank wächst auf ein stabiles Maximum (~60 + 30×Nutzeranzahl Artikel)
- Bereinigung läuft vor Generierung, damit DB-Platz zuerst freigegeben wird

### Keine neuen Abhängigkeiten

Alle nötigen Werkzeuge sind vorhanden: Supabase Admin Client (für Cleanup), Gemini API, Vercel Cron.

### Kein Datenbankschema-Change

`feed_articles` bleibt unverändert. Der 30-Tage-Filter verwendet das bereits vorhandene `created_at`-Feld.

## QA Test Results

**Tested:** 2026-03-06
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Method:** Code review + production build verification + diff analysis of commit `e73784a`

---

### Acceptance Criteria Status

#### AC-1: Feed-Haeufigkeit

**Cron-Job laeuft taeglich (statt woechentlich), z.B. um 07:00 UTC**
- [x] PASS: `vercel.json` schedule changed from `0 6 * * 0` (weekly Sunday) to `0 7 * * *` (daily at 07:00 UTC)

**Pro Lauf: 2 allgemeine Artikel + 1 personalisierter Artikel pro aktivem Nutzer (max. 50 Nutzer)**
- [x] PASS: `generate/route.ts` line 249 -- `shuffleArray([...ARTICLE_CATEGORIES]).slice(0, 2)` generates exactly 2 general articles
- [x] PASS: `generate/route.ts` line 331 -- `shuffleArray([...ARTICLE_CATEGORIES]).slice(0, 1)` generates exactly 1 personalized article per user
- [x] PASS: `MAX_USERS = 50` constant enforced at line 12, user list sliced at line 315

**Deduplizierung bleibt aktiv (Titel-Hash), sodass kein Artikel doppelt gespeichert wird**
- [x] PASS: Upsert with `onConflict: 'title_hash', ignoreDuplicates: true` unchanged in both general (line 268-279) and personalized (line 350-361) article insertion

#### AC-2: Artikel-Anzeige

**"Fuer deine Pflanzen" zeigt bis zu 5 personalisierte Artikel (bisher: 2)**
- [x] PASS: `feed/page.tsx` line 25 -- `.limit(5)` (changed from `.limit(6)`)

**"Garten-Wissen" zeigt bis zu 10 allgemeine Artikel (bisher: 3)**
- [x] PASS: `feed/page.tsx` line 34 -- `.limit(10)` (changed from `.limit(9)`)

**Gesamt max. 15 Artikel sichtbar im Feed**
- [x] PASS: 5 personalized + 10 general = 15 maximum

**Artikel sind absteigend nach created_at sortiert (neueste zuerst)**
- [x] PASS: Both queries use `.order("created_at", { ascending: false })` (lines 24 and 33)

#### AC-3: 30-Tage-Fenster

**Nur Artikel der letzten 30 Tage werden im Feed angezeigt**
- [x] PASS: `feed/page.tsx` line 16 -- `thirtyDaysAgo` calculated as `Date.now() - 30 * 24 * 60 * 60 * 1000`
- [x] PASS: Both queries use `.gte("created_at", thirtyDaysAgo)` (lines 23 and 32)

**Cron-Job bereinigt bei jedem Lauf Artikel, die aelter als 30 Tage sind**
- [x] PASS: `generate/route.ts` lines 235-245 -- DELETE query with `.lt('created_at', cutoff)` where cutoff is 30 days ago

**Das Loeschen alter Artikel erfolgt vor der Generierung neuer Inhalte**
- [x] PASS: Cleanup is "Step 0" (line 234), general article generation is "Step 1" (line 247), personalized is "Step 2" (line 296)

#### AC-4: Bestehende Funktionen bleiben erhalten

**Artikeldetail-Seite /feed/[id] funktioniert weiterhin**
- [x] PASS: `feed/[id]/page.tsx` is unchanged by PROJ-10 (no diff)

**Personalisierungs-Logik (Pflanzenselektion) bleibt unveraendert**
- [x] PASS: `selectPlantsForUser()` function (lines 132-200) is completely unchanged

**Leerer Feed-State ("Dein Feed wird vorbereitet") bleibt fuer neue Nutzer erhalten**
- [x] PASS: `EmptyFeedState` component unchanged (lines 96-108), conditional rendering unchanged (line 59)

---

### Edge Cases Status

#### EC-1: Noch keine 5 personalisierten Artikel vorhanden (neue Nutzer)
- [x] PASS: Feed page uses `personalizedArticles ?? []` fallback (line 36), renders whatever is available. No error thrown for fewer than 5 articles.

#### EC-2: Noch keine 10 allgemeinen Artikel vorhanden
- [x] PASS: Same pattern -- `generalArticles ?? []` fallback (line 37), renders whatever is available.

#### EC-3: Artikel ueber Direktlink aufgerufen, aber bereits geloescht (30-Tage-Fenster)
- [x] PASS: `feed/[id]/page.tsx` line 38-39 -- if article not found in DB, `ArticleNotFoundState` renders "Artikel nicht gefunden" with back button.

#### EC-4: Cron-Bereinigung schlaegt fehl
- [x] PASS: Cleanup error is caught and logged at line 241-242. Execution continues to Step 1 (general article generation) regardless of cleanup failure.

#### EC-5: Gemini-API nicht verfuegbar
- [x] PASS: Cleanup runs before any Gemini calls (Step 0). Gemini failures are caught per-article in try/catch blocks (lines 288-291 for general, lines 371-373 for personalized). Cached articles from the last 30 days remain visible.

#### EC-6: Nutzer ohne Pflanzen
- [x] PASS: In the cron, `selectPlantsForUser` returns empty plants array, and the `if (plants.length === 0) continue` check at line 321 skips personalized generation. On the feed page, `hasPersonalized` check (line 64) hides the personalized section entirely.

---

### Security Audit Results

#### Authentication
- [x] Feed page: `createClient()` + `getUser()` check at lines 7-8, returns null if no user (line 10-12)
- [x] Feed detail page: Same auth check pattern (lines 17-21)
- [x] Cron endpoint: Protected by CRON_SECRET bearer token (lines 213-217)
- [x] Protected layout wraps all /feed routes, redirects unauthenticated users to /login

#### Authorization (RLS)
- [x] RLS on `feed_articles` table ensures users can only see general articles (user_id IS NULL) or their own personalized articles (user_id = auth.uid())
- [x] Cron uses admin client (service_role) which bypasses RLS for writes -- appropriate for cron operations
- [x] The 30-day cleanup DELETE uses admin client, so it can delete all expired articles regardless of user_id

#### Input Validation
- [x] No new user input accepted in this feature change
- [x] Existing Zod validation on Gemini responses (`geminiArticleSchema`) unchanged
- [x] UUID validation on article detail page unchanged

#### Rate Limiting
- [x] No new public-facing API routes introduced
- [x] Cron endpoint remains protected by bearer token
- [x] Feed pages are Server Components with no client-callable API

#### Exposed Secrets
- [x] No new environment variables introduced
- [x] Existing secrets (GEMINI_API_KEY, CRON_SECRET) remain server-side only
- [x] No secrets in client-side code or public bundles

#### XSS / Injection
- [x] No new rendering of user-controlled content
- [x] Article content still rendered via React elements (not dangerouslySetInnerHTML)

#### Data Exposure via Cleanup
- [x] The DELETE cleanup uses admin client appropriately -- it deletes ALL articles older than 30 days (both general and personalized), preventing stale data accumulation
- [ ] BUG: The cleanup deletes articles from ALL users using the admin client. If a user bookmarked an article URL externally and the article is older than 30 days, it silently disappears. This is expected behavior per the spec, but worth noting.

---

### Bugs Found

#### BUG-1: Redundant 30-day filter on both cron AND feed page query
- **Severity:** Low
- **File:** `src/app/(protected)/feed/page.tsx` line 16 and `src/app/api/feed/generate/route.ts` line 235
- **Description:** The 30-day filtering is implemented in two places: (1) the cron job DELETEs articles older than 30 days from the database, AND (2) the feed page query adds `.gte("created_at", thirtyDaysAgo)` filter. This is technically redundant since deleted articles cannot be returned. However, this provides defense-in-depth (if cron fails to run for a day, the feed still shows correct results). Not a bug per se -- this is actually good defensive programming. Marking as informational only.
- **Priority:** Informational -- no action needed

#### BUG-2: 30-day calculation uses milliseconds without accounting for DST
- **Severity:** Low
- **File:** `src/app/(protected)/feed/page.tsx` line 16 and `src/app/api/feed/generate/route.ts` line 235
- **Description:** Both files calculate 30 days as `30 * 24 * 60 * 60 * 1000` milliseconds. During DST transitions, a "day" may be 23 or 25 hours. In practice this creates at most a 1-hour discrepancy in the 30-day window, which is negligible for article display purposes.
- **Priority:** Nice to have -- negligible real-world impact

#### BUG-3: Article detail page has no 30-day filter
- **Severity:** Low
- **File:** `src/app/(protected)/feed/[id]/page.tsx` line 32-35
- **Description:**
  1. Go to `/feed` and note an article
  2. If the cron job has not run recently and an article is between 30-31 days old
  3. The feed page would filter it out (`.gte("created_at", thirtyDaysAgo)`)
  4. But if you have the direct URL `/feed/[article-id]`, the detail page has NO 30-day filter
  5. Expected: Consistent behavior -- article should not be accessible if filtered from feed
  6. Actual: Article is still accessible via direct URL until the next cron cleanup deletes it
- **Note:** This is a very narrow window (between feed page filter and next cron run). The spec's edge case EC-3 says "bestehender 404-State wird angezeigt" for deleted articles, and once the cron runs, the article IS deleted. The inconsistency window is at most 24 hours.
- **Priority:** Nice to have -- extremely narrow edge case

#### BUG-4: Cron cleanup does not use RLS-aware delete
- **Severity:** Low
- **File:** `src/app/api/feed/generate/route.ts` lines 236-239
- **Description:** The cleanup DELETE uses the admin client (service_role), which bypasses RLS. This means it deletes ALL articles older than 30 days across all users in a single query. This is correct and intentional -- the admin client should be used for cron operations. However, if the `created_at` column had no index, this could be slow on large datasets.
- **Priority:** Informational -- correct behavior, but consider adding an index on `created_at` if performance degrades with scale

#### BUG-5: Carried forward from PROJ-6 -- Gemini API key in URL query parameter
- **Severity:** Low
- **Original:** PROJ-6 BUG-15/BUG-7
- **File:** `src/app/api/feed/generate/route.ts` line 57
- **Description:** API key passed as `?key=${apiKey}` in URL. Could appear in server-side request logs. This is Google's standard pattern for the Gemini REST API.
- **Priority:** Nice to have -- accepted trade-off

---

### Cross-Browser Testing (Code Review)

- [x] Chrome: No new browser-specific features introduced. Standard Tailwind CSS grid used.
- [x] Firefox: No known incompatibilities in changed code.
- [x] Safari: No known incompatibilities in changed code.
- **Note:** PROJ-10 changes are primarily backend (cron schedule, article counts, cleanup). The only frontend change is query parameters (limit values, 30-day filter) -- no visual changes.

### Responsive Testing (Code Review)

- [x] Mobile (375px): Grid layout unchanged -- single column on mobile.
- [x] Tablet (768px): 2-column grid unchanged (`sm:grid-cols-2`).
- [x] Desktop (1440px): 2-column personalized, 3-column general unchanged (`lg:grid-cols-3`).
- **Note:** With up to 5 personalized articles (up from previous 6), the 2-column grid on tablet/desktop will have one article in the last row alone (5 = 2+2+1). This is normal grid behavior, not a bug.

---

### Regression Testing

#### PROJ-1: User Authentication
- [x] Protected layout auth check unchanged
- [x] Feed pages continue to check authentication

#### PROJ-2: Plant Management
- [x] No changes to plant-related components or routes
- [x] Cron reads from `plants` table (read-only)

#### PROJ-3: AI Plant Identification
- [x] No changes to identification code

#### PROJ-4: Care Management
- [x] Cron reads from `care_tasks` table (read-only)
- [x] No changes to care task routes or components

#### PROJ-5: Reminders & Push Notifications
- [x] PASS: Push cron `/api/push/send` at `0 * * * *` is present in `vercel.json`
- [x] IMPORTANT: The push cron was MISSING from `vercel.json` before this commit (only the feed cron was listed). PROJ-10 restored it. This was a pre-existing regression from a previous change.

#### PROJ-6: Content Feed
- [x] Feed page structure unchanged (two sections, empty state, error state)
- [x] Article card component unchanged
- [x] Article detail page unchanged
- [x] Cron endpoint authentication unchanged
- [x] Gemini API integration unchanged (prompts, parsing, validation)
- [x] Deduplication logic unchanged

#### PROJ-7: Garden Dashboard
- [x] No changes to dashboard code

#### PROJ-8: Offline & PWA
- [x] No changes to PWA/offline code

#### PROJ-9: Care Management Improvements
- [x] No changes to care management improvements code

#### Build Verification
- [x] `npm run build` succeeds with 0 errors
- [x] All routes compile correctly (23 routes)

---

### Summary

- **Acceptance Criteria:** 13/13 passed
- **Edge Cases:** 6/6 passed
- **Bugs Found:** 5 total (0 Critical, 0 High, 0 Medium, 5 Low/Informational)
- **Security Audit:** PASS -- no new attack surface, authentication and RLS unchanged, no new user input vectors
- **Build Status:** Production build succeeds with 0 errors
- **Regression:** All 9 deployed features verified -- no regressions found. Notable: push cron was restored (was missing before this commit).
- **Production Ready:** YES
- **Recommendation:** All acceptance criteria are met. No Critical or High severity bugs found. The 5 Low/Informational items are minor observations that do not block deployment. Deploy when ready.

## Deployment

**Deployed:** 2026-03-06
**Production URL:** https://eden-hazel.vercel.app/feed

### Deployment Checklist
- [x] Pre-deployment checks passed (build: 0 errors, 29 routes compiled)
- [x] QA approved: 13/13 AC passed, 0 Critical/High bugs
- [x] No database migrations needed (no schema change)
- [x] No new environment variables
- [x] All code committed and pushed to main
- [x] Vercel auto-deployed on push
- [x] Daily cron `0 7 * * *` active in `vercel.json`
- [x] Push cron `0 * * * *` restored in `vercel.json`
- [x] Git tag `v1.10.0-PROJ-10` created and pushed
