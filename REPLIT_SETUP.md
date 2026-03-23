# Replit Setup Instructions

This is a full-stack veterinary clinical trials aggregator. It has two parts: a Node.js backend (Express API + Playwright scraper) and a Next.js frontend.

## Required Secrets

Add these in Replit's Secrets tab before doing anything else:

- `DATABASE_URL` — PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/vettrials`
- `ANTHROPIC_API_KEY` — Anthropic API key for Claude Haiku extraction (starts with `sk-ant-`)

## System Requirements

This project requires:
- Node.js 18+
- PostgreSQL (provision a PostgreSQL database in Replit or use an external provider like Neon, Supabase, or Railway)
- Chromium for Playwright (the scraper uses headless Chromium to render JavaScript-heavy vet school websites)

Install Playwright's Chromium browser:
```bash
npx playwright install chromium
```

If Chromium won't install on Replit due to system dependencies, run:
```bash
npx playwright install-deps chromium
npx playwright install chromium
```

## Setup Steps (run in order)

### 1. Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Set up the database
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npx tsx src/db/seed.ts
```

This creates all tables and seeds 31 veterinary institution source URLs.

### 3. Run the initial scrape (optional but recommended)
```bash
cd backend
npx tsx src/scrapers/scrape-all.ts
```

This scrapes all 31 vet school websites and extracts clinical trial data using Claude Haiku. Takes ~15-20 minutes (5-second delay between sources to be respectful). Costs ~$0.05 in Haiku API usage.

You can also scrape a single source to test:
```bash
npx tsx src/scrapers/test-single.ts "Colorado State"
```

### 4. Start the app

You need to run both the backend and frontend. In Replit, you can use the `.replit` run command or start them manually:

**Backend** (runs on port 8000):
```bash
cd backend && npx tsx src/api/server.ts
```

**Frontend** (runs on port 3000):
```bash
cd frontend && npm run dev
```

Or run both together:
```bash
cd backend && npx tsx src/api/server.ts &
cd frontend && npm run dev
```

### 5. Configure the frontend API URL

The frontend needs to know where the backend API lives. Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

If backend and frontend are on different Replit URLs, set this to the backend's public URL.

## Project Structure

```
backend/
  src/
    api/          — Express REST API (search, filters, detail, subscriptions)
    db/           — Prisma client and seed script
    extraction/   — Claude Haiku AI extraction (prompt, schema, validation)
    scrapers/     — Playwright scrapers and change detection
    jobs/         — Daily cron scheduler (3 AM automatic scrape)
  prisma/         — Schema and migrations

frontend/
  src/
    app/          — Next.js pages (search, trial detail, alerts, status)
    components/   — React components (TrialCard, FilterSidebar, etc.)
    lib/          — API client
    types/        — TypeScript interfaces
```

## How It Works

1. **Scraping**: Playwright visits each vet school's clinical trials page and captures the full HTML
2. **Extraction**: The HTML is preprocessed (scripts/styles stripped) and sent to Claude Haiku, which extracts structured JSON for each trial
3. **Validation**: Zod validates every extraction output before database writes
4. **Change detection**: SHA256 hash of page HTML skips re-extraction if nothing changed
5. **API**: Express serves the trial data with full-text search, species/condition/status filters, and pagination
6. **Frontend**: Next.js renders a searchable, filterable interface with trial cards and detail pages
7. **Scheduling**: A daily cron job re-scrapes all sources at 3 AM ET

## Ports

- Backend API: `8000`
- Frontend: `3000`

## Troubleshooting

- **Prisma generate fails**: Make sure `DATABASE_URL` is set and the PostgreSQL database exists
- **Scraper timeouts**: Some vet school sites are slow. The 30-second timeout is intentional — failed scrapes are logged and don't corrupt existing data
- **0 trials extracted from a source**: Some sites use sub-page navigation or heavy JS that the generic scraper can't parse. The data from those sources will need source-specific scraper logic
- **CORS errors**: Make sure `NEXT_PUBLIC_API_URL` in the frontend matches the actual backend URL
