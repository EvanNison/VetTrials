# VetTrials

**A free, open-source aggregator for veterinary clinical trials.**

VetTrials scrapes and normalizes clinical trial listings from 30+ veterinary schools and institutions into a single searchable interface. It exists because veterinarians (especially oncologists) currently have to visit each institution's website individually to find trials for their patients.

🌐 **Live site:** https://vettrials.org
📦 **Sources:** 30+ vet schools and registries — see [SOURCES.md](SOURCES.md)
🔬 **Status:** Early. Active development. Contributions welcome.

---

## What's in here

```
vettrials/
├── backend/         Express + Prisma + Playwright. Scrapes sources, runs Claude
│                    extraction, exposes the public API.
├── frontend/        Next.js + Tailwind. The search UI and content pages.
├── docs/            Architecture, schema, scraping, sources, testing notes.
└── scripts/         Helpers for local development.
```

## How it works

1. A scheduled job hits each source's public clinical-trials page using Playwright.
2. The HTML is sent to Claude (Anthropic's `claude-haiku-4-5` model) with a structured-extraction prompt that returns trial data as JSON.
3. The data is normalized and stored in PostgreSQL.
4. A Next.js frontend lets users search and filter by species, condition, location, and enrollment status.
5. Every trial card links back to the original source page — VetTrials never replaces direct contact with the institution.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the deep dive.

## Quickstart (self-host)

You'll need: **Node 20+**, **PostgreSQL 14+**, an **Anthropic API key**, and ~10 minutes.

```bash
# 1. Clone and install
git clone https://github.com/EvanNison/VetTrials.git
cd VetTrials
(cd backend && npm install)
(cd frontend && npm install)

# 2. Configure
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit backend/.env: set DATABASE_URL and ANTHROPIC_API_KEY

# 3. Set up the database
(cd backend && npm run db:migrate && npm run db:generate)
(cd backend && npm run seed)   # loads the source list

# 4. Run a single test scrape (recommended before scraping all 30 sources)
(cd backend && npm run scrape -- --source CSU)

# 5. Start the dev servers
(cd backend && npm run dev)    # API on :8000
(cd frontend && npm run dev)   # UI on :3000
```

Open http://localhost:3000 — you should see the search UI.

A full scrape of all 30 sources costs roughly **$0.50–$2.00 in Claude API fees** depending on how much HTML each site returns. Run `npm run scrape:all` only when you actually want fresh data.

## Public API

There's a free, rate-limited HTTP API available. It returns the same data the UI shows.

| Endpoint | Description |
|---|---|
| `GET /api/trials` | Paginated trial search; supports `q`, `species`, `condition`, `status`, `state`, `institution`, `page` |
| `GET /api/trials/:id` | Full trial detail |
| `GET /api/sources` | List of institutions and their last scrape time |
| `GET /api/filters` | Filter facets (species, conditions, states) with counts |

Rate limit: 60 requests/minute per IP on read endpoints. Be a good citizen and cache responses if you're building anything serious.

## Contributing

The most useful contribution right now is **adding a new source**. We have ~30 institutions; there are dozens more vet schools globally. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to propose one.

Other welcome contributions:
- Bug fixes for source-specific scraping issues (look in `backend/src/scrapers/scrape.ts` `SOURCE_OVERRIDES`)
- Improvements to the Claude extraction prompt in `backend/src/extraction/`
- Frontend polish, accessibility, mobile fixes
- Documentation

## Legal & data ethics

VetTrials aggregates **publicly-posted** veterinary clinical trial data for public-interest research discovery. We:

- Respect `robots.txt` on every source.
- Identify ourselves with a polite `User-Agent` that includes a contact email.
- Rate-limit ourselves: one source at a time, with delays between requests.
- Store summaries and factual fields, not full verbatim descriptions.
- Always link back to the source institution — they own the relationship with the patient.
- Honor takedown requests within 72 hours. Contact: **evan@nisonco.com**

If you're an institution that would prefer to be excluded, please email and we'll remove you immediately. If you'd prefer a structured feed (RSS, JSON, sitemap), we'd love that even more.

Self-hosters are responsible for their own compliance with each source's terms of use and applicable law in their jurisdiction.

## Donations

Running this project costs real money — Claude API calls for scraping, plus hosting. If VetTrials is useful to you or your practice, you can help cover those costs:

- GitHub Sponsors: *(coming soon)*
- Open Collective: *(coming soon)*

Donations are not tax-deductible (for now) and pay for: API credits, hosting, domain, and developer time.

## License

[AGPL-3.0-or-later](LICENSE). In short: you can use, modify, and redistribute this code, including for commercial purposes, **but** any modifications — including hosting a modified version as a public service — must also be released under AGPL-3.0. This keeps improvements flowing back to the community.

Built by [Evan Nison](https://github.com/EvanNison) at [NisonCo](https://nisonco.com).
