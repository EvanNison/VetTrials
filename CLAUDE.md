# CLAUDE.md — VetTrials: Veterinary Clinical Trials Aggregator

## Project Identity

**VetTrials** is a web application that scrapes, normalizes, and aggregates veterinary clinical trial listings from 35+ university and institutional websites into a single searchable interface. Veterinarians (especially oncologists) currently must visit each school's website individually. We solve this by scraping directly from the source, extracting structured data with AI, and presenting it in a clean, filterable UI.

This is a NisonCo AI Consulting project. The codebase owner is Evan Nison.

---

## CRITICAL: Autonomous Build Protocol

You are expected to build this project end-to-end with minimal human intervention. That means:

1. **Build it**
2. **Test it yourself** using browser-bridge MCP
3. **Debug it yourself** when tests fail
4. **Get a second opinion from Codex** when you're unsure
5. **Do NOT mark anything as done until you have personally verified it works**

### Definition of Done (per feature)

A feature is DONE only when ALL of the following are true:

- [ ] Code compiles/runs without errors
- [ ] Unit tests pass (if applicable)
- [ ] You have opened the feature in a real browser via browser-bridge MCP
- [ ] You have visually confirmed it renders correctly
- [ ] You have interacted with it (clicked buttons, submitted forms, etc.) via browser-bridge
- [ ] You have confirmed the data displayed is accurate (not placeholder/dummy)
- [ ] You have tested at least one edge case (empty state, error state, long text, etc.)
- [ ] If it involves database writes, you have confirmed data integrity via direct DB query

**If you skip browser-bridge verification, the feature is NOT done. Period.**

---

## Second Opinion Protocol: When to Use Codex

Use OpenAI Codex (via terminal: `codex`) as a second-opinion tool in these situations:

### MUST use Codex when:

1. **Confidence below 70%** — If you are less than 70% sure about an approach, implementation detail, or architectural decision, stop and ask Codex before proceeding. Frame it as: "I'm building X. My plan is Y. What am I missing? What would you do differently?"

2. **Data integrity operations** — ANY code that writes to, migrates, or transforms data in the database. This includes:
   - Schema migrations
   - Seed scripts
   - Data normalization logic
   - Deduplication logic
   - The AI extraction prompt and its JSON output mapping
   - Any bulk update or delete operation

3. **Big architectural decisions** — Including but not limited to:
   - Database schema design (get Codex to review before running migrations)
   - API route structure
   - Authentication/authorization approach
   - Scraping strategy and scheduling architecture
   - AI extraction prompt engineering (have Codex review the prompt)
   - State management approach on the frontend
   - Deployment configuration

4. **When something breaks and you don't know why after 2 attempts** — If you've tried to fix a bug twice and it's still broken, consult Codex with the full error context before attempt #3.

### How to use Codex:

```bash
# General second opinion
codex "I'm building a veterinary clinical trials aggregator. [describe the specific question/problem]. Here's my current approach: [paste relevant code or plan]. What would you do differently? What am I missing?"

# Schema review
codex "Review this PostgreSQL schema for a veterinary clinical trials aggregator. Flag any normalization issues, missing indexes, or data integrity concerns: [paste schema]"

# Prompt review
codex "Review this Claude API extraction prompt. It takes raw HTML from a vet school's clinical trials page and should output structured JSON. Flag any fields it might miss or misinterpret: [paste prompt]"

# Bug diagnosis
codex "I'm getting this error in my veterinary trials scraper: [paste error]. Here's the relevant code: [paste code]. I've already tried: [describe attempts]. What's wrong?"
```

### How to handle Codex disagreement:

If Codex suggests a different approach than what you planned:
- If Codex's reasoning is clearly better → adopt it
- If it's a toss-up → go with your original plan but add a code comment noting the alternative
- If Codex seems wrong → proceed with your plan but add a `# TODO: Codex suggested [X], revisit if issues arise` comment

---

## Browser-Bridge MCP Testing Protocol

You have access to browser-bridge MCP for automated browser testing. Use it to verify every user-facing feature.

### Setup

The frontend dev server must be running before browser tests. Start it and confirm it's accessible:

```bash
# Start the frontend dev server (adjust command based on framework)
cd frontend && npm run dev &

# Wait for it to be ready
sleep 5
```

### Testing Workflow

For EVERY frontend feature, follow this exact sequence:

```
1. Navigate to the page
   → browser-bridge: navigate to http://localhost:3000/[route]

2. Screenshot and verify render
   → browser-bridge: take screenshot
   → Visually confirm: Does it look right? Layout broken? Missing elements?

3. Interact with the feature
   → browser-bridge: click, type, select as needed
   → Example: type a search query, click a filter, submit a form

4. Screenshot after interaction
   → browser-bridge: take screenshot
   → Visually confirm: Did the expected thing happen?

5. Verify data accuracy
   → Compare what's displayed in the browser to what's in the database
   → If numbers or trial details don't match, it's a bug

6. Test edge cases
   → Empty search results
   → Very long trial titles/descriptions
   → Special characters in search queries
   → Rapid repeated clicks
   → Back/forward navigation

7. Test responsive (if applicable)
   → browser-bridge: resize viewport to mobile width (375px)
   → Screenshot and verify mobile layout
```

### Required Browser Tests (Checklist)

Do NOT consider the frontend complete until every test below passes:

#### Homepage / Search
- [ ] Page loads without errors
- [ ] Search input is visible and functional
- [ ] Typing a query and pressing Enter/clicking Search returns results
- [ ] Empty search shows appropriate message or all trials
- [ ] Search with no results shows "no results" state (not blank page)
- [ ] Results display: trial title, institution, species, condition, enrollment status
- [ ] Pagination works (if > N results)

#### Filters
- [ ] Species filter works (Dog, Cat, Horse, etc.)
- [ ] Condition category filter works (Oncology, Cardiology, etc.)
- [ ] Enrollment status filter works (Recruiting, Completed, etc.)
- [ ] Location/state filter works
- [ ] Multiple filters can be combined
- [ ] Clearing filters restores full results
- [ ] Filter counts update correctly

#### Trial Detail Page
- [ ] Clicking a trial from search results navigates to detail page
- [ ] All fields display correctly (title, institution, PI, eligibility, contact, etc.)
- [ ] Contact information is clickable (email mailto, phone tel)
- [ ] "Back to results" navigation works
- [ ] Source URL links to the original institution page

#### Alert Subscription (if implemented)
- [ ] Email input accepts valid email
- [ ] Email input rejects invalid email
- [ ] Subscription confirmation message appears
- [ ] Selecting condition/species preferences works

#### Admin / Scraper Status (if implemented)
- [ ] Shows last scrape time per institution
- [ ] Shows trial count per institution
- [ ] Shows error log for failed scrapes

#### Cross-Browser / Responsive
- [ ] Desktop viewport (1280px) renders correctly
- [ ] Mobile viewport (375px) renders correctly
- [ ] No horizontal scroll on mobile
- [ ] Touch targets are large enough on mobile

---

## Tech Stack

### Backend
- **Runtime:** Node.js (preferred) or Python (FastAPI)
- **Database:** PostgreSQL (via Prisma ORM if Node, SQLAlchemy if Python)
- **Scraping:** Playwright for JS-rendered pages, cheerio/BeautifulSoup for static HTML
- **AI Extraction:** Claude Haiku API (claude-haiku-4-5-20251001) — cheapest model, sufficient for structured extraction
- **Scheduling:** node-cron or cron jobs for scheduled scraping
- **Email:** Resend or SendGrid for alert notifications

### Frontend
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **State:** React Query for server state, URL params for filter state
- **Search:** PostgreSQL full-text search (upgrade to Typesense/Meilisearch later if needed)

### Infrastructure
- **Hosting:** Vercel (frontend) + Railway (backend + DB)
- **Monitoring:** Built-in error logging to database table

---

## Project Structure

```
vettrials/
├── CLAUDE.md                    ← You are here
├── docs/
│   ├── ARCHITECTURE.md          ← System architecture deep dive
│   ├── DATABASE.md              ← Schema, migrations, data integrity rules
│   ├── SCRAPING.md              ← Scraping layer: sources, extraction, scheduling
│   ├── FRONTEND.md              ← Frontend spec, components, pages
│   ├── TESTING.md               ← Full test plan (unit, integration, browser)
│   └── SOURCES.md               ← Complete list of all 35+ scraping targets with URLs
├── backend/
│   ├── src/
│   │   ├── db/                  ← Database connection, migrations, seed
│   │   ├── scrapers/            ← Per-source scraper modules
│   │   ├── extraction/          ← Claude API extraction logic
│   │   ├── api/                 ← REST API routes
│   │   ├── jobs/                ← Scheduled scraping jobs
│   │   └── alerts/              ← Alert/notification system
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                 ← Next.js App Router pages
│   │   ├── components/          ← Reusable UI components
│   │   ├── lib/                 ← API client, utils
│   │   └── types/               ← TypeScript types
│   ├── tests/
│   └── package.json
└── scripts/
    ├── seed-sources.ts          ← Initialize source URLs in DB
    ├── scrape-all.ts            ← Manual full scrape trigger
    └── test-extraction.ts       ← Test AI extraction on sample HTML
```

---

## Build Order

Follow this exact order. Do not skip ahead.

### Phase 1: Foundation
1. Initialize project repos (backend + frontend)
2. Set up PostgreSQL database
3. **→ CODEX REVIEW: Schema design** (see DATABASE.md)
4. Run migrations
5. Seed source URLs from SOURCES.md

### Phase 2: Scraping + Extraction
6. Build Playwright scraper for 1 source (Colorado State — cleanest HTML)
7. Build Claude Haiku extraction prompt
8. **→ CODEX REVIEW: Extraction prompt and JSON mapping**
9. Test extraction on CSU HTML, verify JSON output accuracy
10. Expand scraper to all 35+ sources
11. Build scheduled job runner
12. **→ CODEX REVIEW: Deduplication and change detection logic**

### Phase 3: API
13. Build REST API routes (GET /trials, GET /trials/:id, GET /filters)
14. Build search endpoint with full-text search
15. Build filter endpoints
16. Test all API routes with curl/httpie
17. **→ CODEX REVIEW: API response shapes and error handling**

### Phase 4: Frontend
18. Build layout (header, footer, navigation)
19. Build search page with results list
20. Build filter sidebar
21. Build trial detail page
22. Build empty/error states
23. **→ BROWSER-BRIDGE: Full frontend test suite** (see checklist above)
24. Fix any issues found in browser testing
25. **→ BROWSER-BRIDGE: Re-test after fixes**
26. Repeat 24-25 until all tests pass

### Phase 5: Alerts (if time permits)
27. Build subscription form
28. Build alert matching logic
29. Build email sender
30. **→ CODEX REVIEW: Alert query logic (data integrity)**
31. **→ BROWSER-BRIDGE: Test subscription flow**

### Phase 6: Polish
32. Responsive design pass
33. **→ BROWSER-BRIDGE: Mobile viewport tests**
34. SEO metadata
35. Error monitoring
36. Final full browser test sweep

---

## AI Extraction Prompt Template

Use this as the base prompt for Claude Haiku extraction. **Get Codex to review this before first use.**

```
You are a structured data extractor for veterinary clinical trials.

Given the raw HTML content of a veterinary school's clinical trials page, extract ALL active/recruiting clinical trials into a JSON array.

For each trial, extract these fields (use null if not found):

{
  "title": "string — full trial title",
  "species": ["string array — dog, cat, horse, avian, exotic, other"],
  "condition_category": "string — oncology, cardiology, neurology, orthopedic, dermatology, gastroenterology, ophthalmology, behavioral, endocrine, infectious_disease, nephrology, emergency, nutrition, pain_management, other",
  "condition_specific": "string — specific condition e.g. osteosarcoma, lymphoma, IVDD",
  "enrollment_status": "string — recruiting, enrolled, completed, suspended, unknown",
  "eligibility_summary": "string — plain English 1-2 sentence summary of who qualifies",
  "eligibility_details": "string — full eligibility criteria as listed",
  "principal_investigator": "string — PI name",
  "contact_email": "string — contact email if listed",
  "contact_phone": "string — contact phone if listed",
  "financial_info": "string — funding info: fully funded, partially funded, owner costs, unknown",
  "source_url_fragment": "string — if the trial has its own detail page URL, include it"
}

Rules:
- Only extract trials that appear to be CURRENTLY active or recruiting
- If a trial is explicitly marked as completed or closed, skip it
- If species is not specified, infer from context (e.g. "canine" = dog)
- If condition category is ambiguous, pick the best match
- Return ONLY valid JSON array. No markdown, no explanation, no preamble.
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/vettrials

# Claude API (for extraction)
ANTHROPIC_API_KEY=sk-ant-...

# Email (for alerts)
RESEND_API_KEY=re_...

# App
SCRAPE_INTERVAL_HOURS=24
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:8000
```

---

## Error Handling Philosophy

- **Scraping errors are expected.** University websites go down, change structure, rate-limit. Every scraper must catch errors gracefully and log them without crashing the entire job.
- **Extraction errors should be flagged.** If Claude returns invalid JSON or missing fields, log the raw HTML and the bad response for debugging. Never write bad data to the production trials table.
- **Frontend errors should show user-friendly messages.** Never show raw error objects. Always show "Something went wrong, try again" with a retry button.
- **Database errors are critical.** Any unexpected DB error should halt the operation and alert (log loudly). Never silently swallow DB errors.

---

## Style & Code Conventions

- TypeScript everywhere (backend and frontend)
- Functional components only (React)
- No `any` types — define proper interfaces
- Use Zod for runtime validation of AI extraction output
- Prisma for database access (type-safe queries)
- All API responses follow: `{ data: T, error: null } | { data: null, error: string }`
- Commit messages: conventional commits format (`feat:`, `fix:`, `chore:`, `test:`)

---

## Remember

1. **Test with browser-bridge before marking anything done**
2. **Consult Codex when confidence < 70%, on big decisions, or on data integrity code**
3. **A feature that "probably works" is not done. A feature you've SEEN work in a browser is done.**
4. **When in doubt, scrape more conservatively. Missing a trial temporarily is better than storing bad data.**
5. **This project should be runnable and testable locally before any deployment.**
