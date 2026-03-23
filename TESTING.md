# TESTING.md — Complete Test Plan

## Testing Philosophy

This project uses a three-tier testing strategy:

1. **Unit tests** — Fast, isolated, run in CI. Cover extraction logic, data validation, and utility functions.
2. **Integration tests** — Test API routes against a real database. Cover search, filters, and data persistence.
3. **Browser tests (via browser-bridge MCP)** — The final authority. If it doesn't work in a browser, it's not done.

---

## Tier 1: Unit Tests

Run with: `npm test` (vitest or jest)

### Extraction Logic

```typescript
// tests/extraction/preprocessor.test.ts
describe('HTML Preprocessor', () => {
  it('strips script tags', () => { ... });
  it('strips style tags', () => { ... });
  it('strips navigation and footer', () => { ... });
  it('collapses whitespace', () => { ... });
  it('preserves trial content within main body', () => { ... });
  it('handles empty input', () => { ... });
  it('handles malformed HTML gracefully', () => { ... });
});

// tests/extraction/validator.test.ts
describe('Zod Validation', () => {
  it('accepts valid trial extraction', () => { ... });
  it('rejects missing title', () => { ... });
  it('defaults species to empty array when missing', () => { ... });
  it('defaults enrollment_status to unknown when missing', () => { ... });
  it('accepts null optional fields', () => { ... });
  it('rejects invalid species values', () => { ... });
  it('rejects invalid enrollment_status values', () => { ... });
  it('validates email format when present', () => { ... });
  it('accepts email as null', () => { ... });
});

// tests/extraction/change-detection.test.ts
describe('Change Detection', () => {
  it('detects new trial (not in existing)', () => { ... });
  it('detects updated trial (title match, fields changed)', () => { ... });
  it('detects unchanged trial (same hash)', () => { ... });
  it('detects removed trial (in existing, not in new)', () => { ... });
  it('does not flag removal when source scrape failed', () => { ... });
  it('handles empty extraction (no trials found)', () => { ... });
  it('handles empty existing (first scrape for source)', () => { ... });
});
```

### Utility Functions

```typescript
// tests/utils/search.test.ts
describe('Search Query Builder', () => {
  it('builds full-text search query from keywords', () => { ... });
  it('handles special characters in search query', () => { ... });
  it('handles empty search query', () => { ... });
  it('combines text search with filters', () => { ... });
});

// tests/utils/hash.test.ts
describe('HTML Hashing', () => {
  it('produces consistent hash for same input', () => { ... });
  it('produces different hash for different input', () => { ... });
  it('ignores whitespace differences', () => { ... });
});
```

---

## Tier 2: Integration Tests

Run with: `npm run test:integration` (requires running database)

### API Routes

```typescript
// tests/api/trials.test.ts
describe('GET /api/trials', () => {
  // Setup: seed test database with known trial data
  
  it('returns all active trials when no filters', () => { ... });
  it('filters by species', () => { ... });
  it('filters by condition_category', () => { ... });
  it('filters by enrollment_status', () => { ... });
  it('filters by state', () => { ... });
  it('combines multiple filters', () => { ... });
  it('full-text search returns relevant results', () => { ... });
  it('full-text search ranks by relevance', () => { ... });
  it('pagination returns correct page size', () => { ... });
  it('pagination returns total count', () => { ... });
  it('does not return soft-deleted trials', () => { ... });
  it('returns 200 with empty array for no matches', () => { ... });
});

describe('GET /api/trials/:id', () => {
  it('returns trial detail for valid id', () => { ... });
  it('returns 404 for non-existent id', () => { ... });
  it('returns 404 for soft-deleted trial', () => { ... });
  it('includes all fields in response', () => { ... });
});

describe('GET /api/filters', () => {
  it('returns available species with counts', () => { ... });
  it('returns available conditions with counts', () => { ... });
  it('returns available states with counts', () => { ... });
  it('returns available institutions with counts', () => { ... });
  it('only counts active trials in filter options', () => { ... });
});

describe('POST /api/subscriptions', () => {
  it('creates subscription with valid email', () => { ... });
  it('rejects invalid email', () => { ... });
  it('allows multiple subscriptions for same email with different filters', () => { ... });
  it('generates unique unsubscribe token', () => { ... });
});

describe('GET /api/sources', () => {
  it('returns all sources with scrape status', () => { ... });
  it('includes trial count per source', () => { ... });
  it('includes last scrape time', () => { ... });
  it('includes error info for failed scrapes', () => { ... });
});
```

### Database Operations

```typescript
// tests/db/trials.test.ts
describe('Trial CRUD', () => {
  it('inserts new trial with all fields', () => { ... });
  it('enforces unique constraint on (source_id, title)', () => { ... });
  it('soft deletes by setting is_active=false', () => { ... });
  it('updates last_seen on re-scrape', () => { ... });
  it('updates last_changed only when data changes', () => { ... });
  it('stores raw_extraction as JSONB', () => { ... });
  it('correctly syncs source trial_count after changes', () => { ... });
});
```

---

## Tier 3: Browser Tests (Browser-Bridge MCP)

**This is the most important tier. If it doesn't pass here, it's not done.**

These tests are executed by Claude Code using browser-bridge MCP. They are described as procedures, not code, because they are performed interactively.

### Pre-Test Setup

Before running any browser test:

```
1. Ensure backend is running: npm run dev (backend)
2. Ensure frontend is running: npm run dev (frontend)
3. Ensure database has seed data (at minimum: sources seeded, a few sample trials)
4. Open browser-bridge connection
```

### Test Suite: Homepage & Search

```
TEST-HOME-01: Page Load
  Navigate to http://localhost:3000
  Screenshot
  VERIFY: Page loads without console errors
  VERIFY: Search bar is visible
  VERIFY: Trial cards are displayed (if data exists) or empty state shows
  VERIFY: Filter sidebar is visible on desktop

TEST-HOME-02: Basic Search
  Navigate to http://localhost:3000
  Type "osteosarcoma" into search bar
  Wait 500ms (debounce)
  Screenshot
  VERIFY: Results shown are relevant to osteosarcoma
  VERIFY: Result count updates
  VERIFY: No irrelevant trials showing

TEST-HOME-03: Search with No Results
  Clear search bar
  Type "xyznonexistentcondition123"
  Wait 500ms
  Screenshot
  VERIFY: "No trials found" message displays
  VERIFY: Page does not show blank/broken state
  VERIFY: Option to clear search is available

TEST-HOME-04: Empty Search
  Clear search bar
  Press Enter or click Search
  Screenshot
  VERIFY: All trials are shown (no filter applied)
  VERIFY: Result count shows total
```

### Test Suite: Filters

```
TEST-FILTER-01: Species Filter
  Navigate to http://localhost:3000
  Click "Dog" checkbox in species filter
  Screenshot
  VERIFY: Only dog trials are shown
  VERIFY: Result count decreases
  VERIFY: URL updates with ?species=dog

TEST-FILTER-02: Multiple Filters
  With Dog still checked, also check "Oncology" in condition filter
  Screenshot
  VERIFY: Only dog + oncology trials shown
  VERIFY: URL has ?species=dog&condition=oncology

TEST-FILTER-03: Clear Filters
  Click "Clear all filters"
  Screenshot
  VERIFY: All trials shown again
  VERIFY: URL params cleared
  VERIFY: All checkboxes unchecked

TEST-FILTER-04: Filter Persistence via URL
  Navigate directly to http://localhost:3000?species=cat&condition=cardiology
  Screenshot
  VERIFY: Cat and Cardiology filters are pre-checked
  VERIFY: Results are filtered accordingly

TEST-FILTER-05: Filter + Search Combined
  Type "lymphoma" in search bar
  Check "Dog" species filter
  Check "Recruiting" status filter
  Screenshot
  VERIFY: Results match all three criteria
  VERIFY: URL reflects all filters
```

### Test Suite: Trial Detail

```
TEST-DETAIL-01: Navigation to Detail
  From search results, click on any trial card
  Screenshot
  VERIFY: Detail page loads with full trial info
  VERIFY: Title matches the card clicked
  VERIFY: All fields are populated (or gracefully show N/A)

TEST-DETAIL-02: Contact Links
  On trial detail page, check contact section
  VERIFY: Email link has correct mailto: href
  VERIFY: Phone link has correct tel: href
  VERIFY: "View on Institution Website" link opens in new tab

TEST-DETAIL-03: Back Navigation
  Click "Back to results"
  Screenshot
  VERIFY: Returns to search page
  VERIFY: Previous filters/search are preserved

TEST-DETAIL-04: Direct URL Access
  Navigate directly to http://localhost:3000/trial/1
  Screenshot
  VERIFY: Page loads correctly without coming from search
  VERIFY: All data displays
```

### Test Suite: Responsive Design

```
TEST-MOBILE-01: Mobile Homepage
  Set viewport to 375x812 (iPhone)
  Navigate to http://localhost:3000
  Screenshot
  VERIFY: No horizontal scroll
  VERIFY: Search bar is full-width
  VERIFY: Filters are collapsed/in a drawer (not blocking content)
  VERIFY: Trial cards stack vertically and are readable

TEST-MOBILE-02: Mobile Detail Page
  Navigate to a trial detail page
  Screenshot at 375px width
  VERIFY: All content readable
  VERIFY: Contact buttons are tappable (44px+ touch targets)
  VERIFY: No text overflow or clipping
```

### Test Suite: Edge Cases

```
TEST-EDGE-01: Very Long Trial Title
  Ensure DB has a trial with a 200+ character title
  Navigate to search, find that trial
  Screenshot
  VERIFY: Title truncates gracefully on card (ellipsis)
  VERIFY: Full title shows on detail page without breaking layout

TEST-EDGE-02: Trial with Minimal Data
  Ensure DB has a trial with only title and source (all other fields null)
  Navigate to that trial's detail page
  Screenshot
  VERIFY: Page renders without errors
  VERIFY: Missing fields show "Not specified" or equivalent (not blank or "null")

TEST-EDGE-03: Special Characters in Search
  Type: cancer & "CAR-T" (dog)
  Screenshot
  VERIFY: No errors, search handles special characters gracefully

TEST-EDGE-04: Rapid Filter Toggling
  Rapidly check/uncheck species filters 5 times
  Screenshot
  VERIFY: No errors, final state is correct, no stale data showing
```

### Test Suite: Data Accuracy

```
TEST-DATA-01: Trial Count Matches Database
  Count trials in DB: SELECT COUNT(*) FROM trials WHERE is_active = true
  Count trials displayed on homepage (result count)
  VERIFY: Numbers match

TEST-DATA-02: Filter Counts Match
  Count dog trials in DB: SELECT COUNT(*) FROM trials WHERE is_active = true AND 'dog' = ANY(species)
  Apply dog filter on frontend
  VERIFY: Frontend count matches DB count

TEST-DATA-03: Detail Page Matches Database
  Pick a specific trial, query all fields from DB
  Open that trial's detail page
  VERIFY: Every displayed field matches the DB value exactly
```

---

## Test Data Seeding

Before browser tests, seed the database with realistic test data:

```typescript
// scripts/seed-test-data.ts
// Include:
// - At least 50 trials across 5+ sources
// - All species represented
// - All condition categories represented
// - Mix of enrollment statuses
// - At least one trial with ALL fields populated
// - At least one trial with MINIMAL fields (title + source only)
// - At least one trial with a very long title (200+ chars)
// - At least one trial with special characters in title
// - Trials from at least 3 different states
```

---

## Post-Test Verification

After ALL browser tests pass, do one final sweep:

```
FINAL-01: Open browser DevTools console
  Navigate through all pages
  VERIFY: Zero console errors
  VERIFY: Zero console warnings (other than known React dev warnings)

FINAL-02: Network tab inspection
  VERIFY: All API calls return 200
  VERIFY: No failed requests
  VERIFY: No CORS errors
  VERIFY: Response times under 500ms for search, under 200ms for detail

FINAL-03: Accessibility quick check
  Tab through the search page using keyboard only
  VERIFY: All interactive elements are focusable
  VERIFY: Focus order is logical
  VERIFY: Search is usable without a mouse
```
