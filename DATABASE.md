# DATABASE.md — Schema, Migrations & Data Integrity

## ⚠️ CODEX REVIEW REQUIRED

**Before running any migration, paste the schema into Codex for review.**

```bash
codex "Review this PostgreSQL schema for a veterinary clinical trials aggregator. Check for: normalization issues, missing indexes, data integrity gaps, enum completeness, and any fields I'm likely to need later that I'm missing. Schema: [paste below]"
```

---

## Schema

### sources
The institutions we scrape. Seeded from SOURCES.md, rarely changes.

```sql
CREATE TABLE sources (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,                    -- "Colorado State University"
  short_name    TEXT NOT NULL,                    -- "CSU"
  url           TEXT NOT NULL UNIQUE,             -- scraping target URL
  tier          INTEGER NOT NULL DEFAULT 1,       -- 1=major academic, 2=additional academic, 3=canadian, 4=private, 5=registry
  scrape_method TEXT NOT NULL DEFAULT 'playwright', -- 'playwright' | 'cheerio' | 'studypages_api'
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_scraped  TIMESTAMP,
  last_success  TIMESTAMP,
  last_error    TEXT,
  trial_count   INTEGER NOT NULL DEFAULT 0,       -- denormalized for quick display
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sources_active ON sources(is_active);
```

### trials
The core table. One row per trial per source.

```sql
CREATE TABLE trials (
  id                    SERIAL PRIMARY KEY,
  source_id             INTEGER NOT NULL REFERENCES sources(id),
  
  -- Identity
  title                 TEXT NOT NULL,
  source_url            TEXT,                      -- direct link to trial on institution's site
  avma_registry_id      TEXT,                      -- VCT##### if cross-referenced
  
  -- Classification
  species               TEXT[] NOT NULL DEFAULT '{}', -- {'dog', 'cat', 'horse', ...}
  condition_category    TEXT NOT NULL DEFAULT 'other', -- enum-like, see below
  condition_specific    TEXT,                       -- "osteosarcoma", "lymphoma", etc.
  
  -- Status
  enrollment_status     TEXT NOT NULL DEFAULT 'unknown', -- 'recruiting' | 'enrolled' | 'completed' | 'suspended' | 'removed' | 'unknown'
  
  -- Details
  eligibility_summary   TEXT,                      -- AI-generated plain English
  eligibility_details   TEXT,                      -- raw criteria
  principal_investigator TEXT,
  contact_email         TEXT,
  contact_phone         TEXT,
  financial_info        TEXT,                      -- 'fully_funded' | 'partially_funded' | 'owner_costs' | 'unknown'
  
  -- Location (from source, can be overridden)
  location_city         TEXT,
  location_state        TEXT,
  location_lat          DECIMAL(10, 7),
  location_lng          DECIMAL(10, 7),
  
  -- Metadata
  first_seen            TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen             TIMESTAMP NOT NULL DEFAULT NOW(),
  last_changed          TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active             BOOLEAN NOT NULL DEFAULT true, -- false = soft deleted (removed from source)
  raw_extraction        JSONB,                     -- full AI extraction output for debugging
  
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate trials from same source
  UNIQUE(source_id, title)
);

-- Search indexes
CREATE INDEX idx_trials_search ON trials USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(condition_specific, '') || ' ' || coalesce(eligibility_summary, '')));
CREATE INDEX idx_trials_species ON trials USING GIN (species);
CREATE INDEX idx_trials_condition ON trials(condition_category);
CREATE INDEX idx_trials_status ON trials(enrollment_status);
CREATE INDEX idx_trials_source ON trials(source_id);
CREATE INDEX idx_trials_active ON trials(is_active);
CREATE INDEX idx_trials_state ON trials(location_state);
```

### scrape_logs
Audit trail of every scrape attempt. Essential for debugging.

```sql
CREATE TABLE scrape_logs (
  id            SERIAL PRIMARY KEY,
  source_id     INTEGER NOT NULL REFERENCES sources(id),
  started_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMP,
  status        TEXT NOT NULL DEFAULT 'running', -- 'running' | 'success' | 'error'
  
  -- Results
  trials_found      INTEGER DEFAULT 0,
  trials_new        INTEGER DEFAULT 0,
  trials_updated    INTEGER DEFAULT 0,
  trials_removed    INTEGER DEFAULT 0,
  
  -- Debug data
  raw_html_hash     TEXT,                        -- SHA256 of scraped HTML (detect unchanged pages)
  raw_html_size     INTEGER,                     -- bytes, to track page growth/shrinkage
  extraction_model  TEXT DEFAULT 'claude-haiku-4-5-20251001',
  extraction_tokens INTEGER,                     -- total tokens used
  error_message     TEXT,
  error_stack       TEXT,
  
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scrape_logs_source ON scrape_logs(source_id);
CREATE INDEX idx_scrape_logs_status ON scrape_logs(status);
CREATE INDEX idx_scrape_logs_started ON scrape_logs(started_at DESC);
```

### subscriptions
Alert subscriptions for vets who want to be notified of new matching trials.

```sql
CREATE TABLE subscriptions (
  id                  SERIAL PRIMARY KEY,
  email               TEXT NOT NULL,
  species_filter      TEXT[],                    -- null = all species
  condition_filter    TEXT[],                    -- null = all conditions
  state_filter        TEXT[],                    -- null = all states
  is_active           BOOLEAN NOT NULL DEFAULT true,
  last_notified       TIMESTAMP,
  unsubscribe_token   TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_active ON subscriptions(is_active);
CREATE INDEX idx_subscriptions_email ON subscriptions(email);
```

### notification_log
Track what notifications were sent to avoid duplicates.

```sql
CREATE TABLE notification_log (
  id              SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
  trial_id        INTEGER NOT NULL REFERENCES trials(id),
  sent_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(subscription_id, trial_id)
);
```

---

## Condition Categories (Enum Values)

Use these exact strings for `condition_category`:

```
oncology
cardiology
neurology
orthopedic
dermatology
gastroenterology
ophthalmology
behavioral
endocrine
infectious_disease
nephrology
urology
emergency
nutrition
pain_management
dentistry
internal_medicine
surgery
reproduction
respiratory
hematology
immunology
other
```

## Species Values

Use these exact strings in the `species` array:

```
dog
cat
horse
avian
exotic
cattle
swine
goat
sheep
rabbit
other
```

---

## Data Integrity Rules

### CRITICAL — Enforce these in application code:

1. **Never hard delete a trial.** Set `is_active = false` and `enrollment_status = 'removed'`. We need the history.

2. **Never write to trials table without Zod validation.** Every extraction output must pass the Zod schema before INSERT/UPDATE.

3. **Deduplication is by (source_id, title).** If the same trial appears with a slightly different title (e.g., trailing whitespace, changed capitalization), treat it as a new trial. Better to have a near-duplicate than to lose data.

4. **Change detection compares full extraction JSON.** Don't just check title — compare all fields. If anything changed, update the row AND set `last_changed = NOW()`.

5. **Raw HTML hash prevents unnecessary re-extraction.** If the page HTML hasn't changed since last scrape (same SHA256), skip the Claude API call entirely. This saves money and avoids phantom "updates."

6. **Scrape failures must not corrupt data.** If a scrape fails for any reason (network error, parsing error, invalid Claude response), log the error and move on. Never delete existing trials just because a scrape failed.

7. **Extraction errors must be logged with raw HTML.** If Claude returns invalid JSON, store the raw HTML in the scrape_log so we can replay/debug.

8. **Trial counts on sources table must stay in sync.** After every scrape, update `sources.trial_count = (SELECT COUNT(*) FROM trials WHERE source_id = X AND is_active = true)`.

---

## Prisma Schema (TypeScript ORM)

The SQL above should be translated into a Prisma schema file. When generating the Prisma schema:

```bash
codex "Convert this SQL schema to a Prisma schema file. Ensure all indexes, defaults, and constraints are preserved. Flag anything that can't be directly represented in Prisma: [paste SQL]"
```

---

## Migration Strategy

1. Use Prisma migrations (`npx prisma migrate dev`)
2. Every migration gets a descriptive name: `add_trials_table`, `add_search_index`, etc.
3. **NEVER use `prisma migrate reset` in production** — it drops all data
4. Test migrations on a local DB first, verify with `prisma studio`
5. Seed data (sources) goes in a separate seed script, not in migrations
