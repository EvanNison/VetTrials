# ARCHITECTURE.md — System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      SCHEDULING LAYER                        │
│              node-cron (every 24h by default)                │
└─────────────┬───────────────────────────────────┬───────────┘
              │                                   │
              ▼                                   ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│     SCRAPING LAYER      │     │     AVMA REGISTRY SCRAPER   │
│  Playwright + Cheerio   │     │  Cross-reference enrichment │
│  35+ source modules     │     │                             │
└─────────────┬───────────┘     └──────────────┬──────────────┘
              │                                │
              ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI EXTRACTION LAYER                        │
│            Claude Haiku API (structured JSON)                │
│         Zod validation on every extraction output            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
│                    PostgreSQL                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ sources  │ │  trials  │ │  scrape  │ │ subscriptions │  │
│  │          │ │          │ │  _logs   │ │               │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│               REST API (Express/Fastify)                     │
│  GET /api/trials          — search + filter                  │
│  GET /api/trials/:id      — single trial detail              │
│  GET /api/filters         — available filter options          │
│  GET /api/sources         — scrape status per institution    │
│  POST /api/subscriptions  — create alert subscription        │
│  GET /api/stats           — aggregate statistics             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                             │
│                  Next.js (App Router)                         │
│  /                — search + filter page                     │
│  /trial/:id       — trial detail page                        │
│  /alerts          — subscription management                  │
│  /status          — scraper health dashboard                 │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow: Scrape Cycle

```
1. Cron triggers scrape job
2. For each source in `sources` table:
   a. Fetch the source URL with Playwright (or cheerio for static)
   b. Store raw HTML in scrape_logs (for debugging/replay)
   c. Send HTML to Claude Haiku with extraction prompt
   d. Validate response with Zod schema
   e. If valid:
      - Compare extracted trials to existing trials for this source
      - INSERT new trials
      - UPDATE changed trials (and set last_changed timestamp)
      - SOFT DELETE trials no longer present (set enrollment_status = 'removed', don't hard delete)
   f. If invalid:
      - Log error to scrape_logs
      - Skip this source (don't corrupt existing data)
      - Continue to next source
3. After all sources complete:
   - Run alert matching job
   - Send notifications for new trials matching subscriptions
   - Log summary to scrape_logs
```

## Key Design Decisions

### Why scrape + AI extract instead of building custom parsers?
- 35+ sources with wildly different HTML structures
- Universities redesign their sites frequently
- AI extraction handles layout changes gracefully
- Cost is ~$2-5/month with Haiku
- Custom parsers would require 100+ hours of initial build + ongoing maintenance

### Why PostgreSQL full-text search instead of Elasticsearch/Typesense?
- At 500-2000 total trials, PG full-text search is more than sufficient
- No additional infrastructure to manage
- tsvector + GIN index gives us fast, relevant search
- Can upgrade to dedicated search engine later if scale demands it

### Why soft delete instead of hard delete?
- A trial disappearing from a website might be temporary (site redesign, page error)
- We want to track trial lifecycle: when it appeared, changed, and was removed
- Vets may want to see recently-closed trials for follow-up

### Why Haiku instead of Sonnet/Opus?
- Structured extraction from HTML is a low-reasoning task
- Haiku handles JSON schema extraction nearly as well as Sonnet
- Cost difference: ~$2-5/month vs ~$20-50/month
- If extraction quality issues emerge, we can selectively upgrade specific sources

### Why Playwright over plain HTTP requests?
- Many vet school sites use JavaScript rendering (React, Vue, dynamic content loading)
- StudyPages embeds (UC Davis, Texas A&M) require JS execution
- Playwright handles both static and dynamic pages uniformly
- Headless mode keeps resource usage low

## Scaling Considerations (for later)

- **If trial count exceeds 5000:** Add Typesense for search
- **If sources exceed 100:** Parallelize scraping with a job queue (BullMQ)
- **If traffic exceeds 10K users/day:** Add Redis caching for API responses
- **If we add user accounts:** Add auth via NextAuth.js or Clerk
- **If pharma companies want to list trials:** Add a submission portal with approval workflow
