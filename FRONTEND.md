# FRONTEND.md — Frontend Specification

## Design Principles

- **Utilitarian first.** This is a tool for busy vets. Clean, fast, no decoration for decoration's sake.
- **Information density.** Show as much relevant data as possible without cluttering. Vets scan, they don't browse.
- **Filter-first.** The primary interaction model is: filter down → scan results → click for detail.
- **Mobile-functional.** Vets may check this on their phone between appointments. Not mobile-first, but must work on mobile.

## Color Palette

```
Primary:      #1B4D3E  (dark forest green — veterinary medicine association color)
Secondary:    #2E86AB  (teal blue — trust, clinical)
Accent:       #F18F01  (warm amber — for CTAs and status badges)
Background:   #FAFAFA  (off-white)
Surface:      #FFFFFF  (white cards)
Text:         #1A1A1A  (near-black)
Text-muted:   #6B7280  (gray-500)
Success:      #059669  (green — "recruiting" status)
Warning:      #D97706  (amber — "enrolled/full" status)
Danger:       #DC2626  (red — "suspended/removed" status)
Neutral:      #6B7280  (gray — "unknown" status)
```

---

## Pages

### 1. Search & Filter Page (`/`)

The main page. This is where 90% of usage happens.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  HEADER: Logo + "VetTrials" + tagline                │
├──────────────────────────────────────────────────────┤
│  SEARCH BAR: [Search trials by condition, species... ]│
├────────────┬─────────────────────────────────────────┤
│  FILTERS   │  RESULTS                                │
│            │                                         │
│  Species   │  [Trial Card]                           │
│  □ Dog     │  [Trial Card]                           │
│  □ Cat     │  [Trial Card]                           │
│  □ Horse   │  [Trial Card]                           │
│            │  [Trial Card]                           │
│  Condition │  ...                                    │
│  □ Oncology│                                         │
│  □ Cardio  │  Showing 47 of 312 trials               │
│  □ Neuro   │  [Load More / Pagination]               │
│            │                                         │
│  Status    │                                         │
│  □ Recruit.│                                         │
│            │                                         │
│  State     │                                         │
│  [Dropdown]│                                         │
│            │                                         │
│  Inst.     │                                         │
│  [Dropdown]│                                         │
│            │                                         │
│  [Clear]   │                                         │
├────────────┴─────────────────────────────────────────┤
│  FOOTER: About + Data sources + Last updated          │
└──────────────────────────────────────────────────────┘
```

**Trial Card Component:**
```
┌──────────────────────────────────────────────────────┐
│  ● Recruiting                    Colorado State Univ. │
│  CAR T Cell Immunotherapy for Treatment of            │
│  Metastatic Osteosarcoma in Dogs                      │
│                                                       │
│  🐕 Dog  ·  Oncology  ·  Fort Collins, CO             │
│  PI: Dr. Smith  ·  Fully Funded                       │
│                                                       │
│  Eligibility: Dogs over 1 year with confirmed         │
│  osteosarcoma diagnosis, no prior chemo...            │
│                                            [Details →]│
└──────────────────────────────────────────────────────┘
```

**Interactions:**
- Typing in search bar filters results in real-time (debounced 300ms)
- Clicking filter checkboxes updates results immediately
- Filter state is stored in URL params (`?species=dog&condition=oncology&status=recruiting`)
- Back button preserves filter state
- "Clear all filters" resets to showing all active trials
- Results show count: "Showing X of Y trials"
- Pagination: 20 results per page, "Load more" button or traditional pagination

**Empty States:**
- No results for filters: "No trials match your current filters. Try broadening your search."
- No results for search: "No trials found for '[query]'. Try different keywords."
- Loading: Skeleton cards (pulsing gray rectangles)
- Error: "Unable to load trials. Please try again." with retry button

### 2. Trial Detail Page (`/trial/[id]`)

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  ← Back to results                                    │
├──────────────────────────────────────────────────────┤
│  ● Recruiting                                         │
│  CAR T Cell Immunotherapy for Treatment of            │
│  Metastatic Osteosarcoma in Dogs                      │
│                                                       │
│  Colorado State University                            │
│  James L. Voss Veterinary Teaching Hospital           │
│  Fort Collins, CO                                     │
│                                                       │
├──────────────────────────────────────────────────────┤
│  SPECIES        │  CONDITION       │  FUNDING         │
│  🐕 Dog         │  Oncology        │  Fully Funded    │
│                 │  Osteosarcoma    │                   │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ELIGIBILITY                                          │
│  Dogs over 1 year of age with histopathologically     │
│  confirmed osteosarcoma. Must not have received       │
│  prior chemotherapy...                                │
│                                                       │
│  FULL CRITERIA                                        │
│  [expandable section with detailed criteria]          │
│                                                       │
├──────────────────────────────────────────────────────┤
│  CONTACT                                              │
│  PI: Dr. Jane Smith                                   │
│  📧 jsmith@colostate.edu                              │
│  📞 (970) 555-1234                                    │
│                                                       │
│  [View on Institution Website ↗]                     │
├──────────────────────────────────────────────────────┤
│  METADATA                                             │
│  First listed: Jan 15, 2026                           │
│  Last verified: Mar 23, 2026                          │
│  Also listed in AVMA Registry: VCT25005869            │
│                                                       │
│  [Share This Trial] [Print Summary]                   │
└──────────────────────────────────────────────────────┘
```

**Interactions:**
- "Back to results" returns to search page with preserved filters
- Email link opens mailto:
- Phone link opens tel:
- "View on Institution Website" opens source URL in new tab
- "Share This Trial" copies URL to clipboard
- "Print Summary" opens browser print dialog with print-optimized CSS

### 3. Subscribe to Alerts (`/alerts`)

Simple form:

```
┌──────────────────────────────────────────────────────┐
│  Get notified when new trials match your criteria     │
│                                                       │
│  Email: [your@email.com                    ]          │
│                                                       │
│  Species (optional):                                  │
│  □ Dog  □ Cat  □ Horse  □ All                        │
│                                                       │
│  Conditions (optional):                               │
│  □ Oncology  □ Cardiology  □ Neurology  □ All        │
│                                                       │
│  States (optional):                                   │
│  [Multi-select dropdown]                              │
│                                                       │
│  [Subscribe]                                          │
│                                                       │
│  ✓ You'll receive email when new matching trials      │
│    are listed. Unsubscribe anytime.                   │
└──────────────────────────────────────────────────────┘
```

### 4. Scraper Status (`/status`)

Dashboard for monitoring. Minimal, just shows if things are working.

```
┌──────────────────────────────────────────────────────┐
│  Data Sources Status                                  │
│  Last full scrape: 2026-03-23 03:00 AM ET             │
│  Total active trials: 312                             │
│                                                       │
│  Institution             Trials  Last Scrape  Status  │
│  ─────────────────────────────────────────────────── │
│  Colorado State Univ.    24      3h ago       ✓       │
│  Ohio State Univ.        31      3h ago       ✓       │
│  Penn Vet                18      3h ago       ✓       │
│  Cornell                 12      3h ago       ✓       │
│  UC Davis                27      3h ago       ✓       │
│  ...                                                  │
│  Oklahoma State          0       3h ago       ⚠ (no trials page)│
│  Washington State        —       3h ago       ✗ (timeout)       │
└──────────────────────────────────────────────────────┘
```

---

## Components

### TrialCard
Props: `{ trial: Trial }`
Displays: status badge, title, institution, species/condition/location, PI, funding, eligibility snippet, link to detail page.

### FilterSidebar
Props: `{ filters: FilterState, onChange: (filters) => void }`
Displays: species checkboxes, condition checkboxes, status checkboxes, state dropdown, institution dropdown, clear button.

### SearchBar
Props: `{ query: string, onChange: (query) => void }`
Displays: text input with search icon, debounced onChange.

### StatusBadge
Props: `{ status: EnrollmentStatus }`
Displays: colored pill badge (green=recruiting, amber=enrolled, red=suspended, gray=unknown).

### SpeciesIcon
Props: `{ species: string }`
Displays: emoji or icon for species (🐕 🐈 🐴 etc.).

### EmptyState
Props: `{ type: 'no-results' | 'no-filters' | 'error', onRetry?: () => void }`
Displays: appropriate message and optional retry button.

### TrialShareCard
Props: `{ trial: Trial }`
Generates: printable/shareable one-page summary of a trial for pet owners.

---

## State Management

- **Server state:** React Query (`@tanstack/react-query`) for API data fetching, caching, and invalidation
- **Filter state:** URL search params (via `useSearchParams`) — this means filters survive page refreshes and are shareable
- **UI state:** Local React state only (modals, dropdowns, etc.)

No Redux, no Zustand, no complex state management. This app is simple enough to keep state minimal.

---

## API Integration

```typescript
// lib/api.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function searchTrials(params: SearchParams): Promise<TrialSearchResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.species?.length) query.set('species', params.species.join(','));
  if (params.condition?.length) query.set('condition', params.condition.join(','));
  if (params.status?.length) query.set('status', params.status.join(','));
  if (params.state) query.set('state', params.state);
  if (params.page) query.set('page', String(params.page));
  
  const res = await fetch(`${API_BASE}/api/trials?${query}`);
  if (!res.ok) throw new Error('Failed to fetch trials');
  return res.json();
}

export async function getTrial(id: number): Promise<Trial> {
  const res = await fetch(`${API_BASE}/api/trials/${id}`);
  if (!res.ok) throw new Error('Failed to fetch trial');
  return res.json();
}

export async function getFilters(): Promise<FilterOptions> {
  const res = await fetch(`${API_BASE}/api/filters`);
  if (!res.ok) throw new Error('Failed to fetch filters');
  return res.json();
}
```
