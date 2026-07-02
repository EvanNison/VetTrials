# SCRAPING.md — Scraping Layer & AI Extraction

## Scraping Strategy

### Method Selection Per Source

Most sources need Playwright (headless Chromium) because vet school sites frequently use JavaScript-rendered content. A few are simple enough for Cheerio (server-side HTML parsing).

**Playwright sources (default):** Any page that uses dynamic content loading, JavaScript frameworks, StudyPages embeds, accordion/tab interfaces, or lazy-loaded content.

**Cheerio sources:** Simple static HTML pages where trials are rendered server-side in plain HTML tables or lists.

**StudyPages sources:** UC Davis and Texas A&M use StudyPages (studypages.com) as their trial listing platform. These have a more consistent structure and may have an API we can use directly.

### Scraping Rules

1. **Respect rate limits.** Never scrape more than 1 page per source per 24 hours. Add a 5-second delay between sources.

2. **Set a proper User-Agent.** Use: `VetTrials/1.0 (+https://vet-trials.replit.app; evan@nisonco.com)` — be transparent about what we are.

3. **Handle redirects.** Some URLs in our sources list may redirect. Follow redirects but log when the final URL differs from the stored URL.

4. **Timeout at 30 seconds.** If a page doesn't load in 30 seconds, log the timeout and move on. Don't retry immediately — the site may be down.

5. **Store raw HTML hash.** SHA256 the full page HTML. If the hash matches the last scrape, skip extraction entirely (page unchanged, no need to re-call Claude).

6. **Capture screenshots on error.** If Playwright encounters an error, take a screenshot before closing. Save to `logs/screenshots/` for debugging.

---

## Source-Specific Notes

### Sources that need special handling:

| Source | Issue | Solution |
|--------|-------|----------|
| UC Davis | Uses StudyPages embed | Scrape the StudyPages URL directly: `https://studypages.com/ucdavisvet/` |
| Texas A&M | Uses StudyPages embed | Scrape: `https://studypages.com/tamuvetmed/home/` |
| Ohio State | Publishes PDF trial list monthly | Download and extract from PDF, OR scrape the HTML trial pages which are also maintained |
| NC State | Trials organized by service area, not single page | May need to scrape multiple sub-pages (by species, by service) |
| University of Missouri | Oncology trials on separate sub-path | Scrape: `https://vhc.missouri.edu/small-animal-hospital/oncology/clinical-trials/current-clinical-trials/` |
| Oklahoma State | No dedicated trials page found | Check department pages or skip until confirmed URL found |
| Washington State | URL pattern may have changed | Verify current URL before scraping |
| Cornell Veterinary Specialists (Stamford) | Satellite facility, may duplicate Cornell main | Deduplicate against Cornell main trials |

### Sources with the cleanest HTML (good for initial testing):

1. **Colorado State** — Well-structured table with trial name, conditions, enrollment dates
2. **Ohio State** — Organized by service area with clear trial cards
3. **Purdue** — Simple page with trials listed by species
4. **Michigan State** — Clean trial cards with expandable details
5. **Tufts** — Simple list format

**Start your POC with Colorado State. It's the cleanest.**

---

## AI Extraction Pipeline

### Flow

```
Raw HTML → Pre-process → Claude Haiku → Zod Validate → Database
```

### Pre-processing

Before sending HTML to Claude, strip unnecessary content to reduce token count and cost:

```typescript
function preprocessHtml(html: string): string {
  // Remove script tags and their content
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  
  // Remove style tags and their content
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
  
  // Remove navigation, headers, footers (common patterns)
  html = html.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  html = html.replace(/<header[\s\S]*?<\/header>/gi, '');
  html = html.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  
  // Remove HTML comments
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  
  // Collapse whitespace
  html = html.replace(/\s+/g, ' ');
  
  return html.trim();
}
```

**Typical token savings:** 60-80% reduction. A 50KB page becomes ~10-15KB after preprocessing.

### Claude Haiku Call

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

async function extractTrials(html: string, sourceName: string): Promise<TrialExtraction[]> {
  const preprocessed = preprocessHtml(html);
  
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Extract all active/recruiting veterinary clinical trials from this ${sourceName} webpage HTML into a JSON array.\n\n${EXTRACTION_PROMPT}\n\nHTML:\n${preprocessed}`
    }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  
  // Parse and validate
  const parsed = JSON.parse(text);
  return z.array(TrialExtractionSchema).parse(parsed);
}
```

### Zod Validation Schema

```typescript
import { z } from 'zod';

const TrialExtractionSchema = z.object({
  title: z.string().min(1),
  species: z.array(z.enum(['dog', 'cat', 'horse', 'avian', 'exotic', 'cattle', 'swine', 'goat', 'sheep', 'rabbit', 'other'])).default(['dog']),
  condition_category: z.string().default('other'),
  condition_specific: z.string().nullable().default(null),
  enrollment_status: z.enum(['recruiting', 'enrolled', 'completed', 'suspended', 'unknown']).default('unknown'),
  eligibility_summary: z.string().nullable().default(null),
  eligibility_details: z.string().nullable().default(null),
  principal_investigator: z.string().nullable().default(null),
  contact_email: z.string().email().nullable().default(null),
  contact_phone: z.string().nullable().default(null),
  financial_info: z.string().nullable().default(null),
  source_url_fragment: z.string().nullable().default(null),
});

type TrialExtraction = z.infer<typeof TrialExtractionSchema>;
```

**⚠️ CODEX REVIEW:** Before first use, paste the extraction prompt AND the Zod schema into Codex:

```bash
codex "Review this AI extraction prompt and Zod validation schema for a vet clinical trials scraper. The prompt takes raw HTML and extracts trial data into JSON. The Zod schema validates the output. What fields am I likely to miss? Are my enum values complete? Any edge cases that would cause validation failures? [paste prompt and schema]"
```

---

## Change Detection Logic

### Comparing new extraction to existing data

```typescript
async function processExtractionResults(
  sourceId: number,
  newTrials: TrialExtraction[],
  existingTrials: Trial[]
): Promise<{ added: number; updated: number; removed: number }> {
  
  const existingByTitle = new Map(existingTrials.map(t => [t.title, t]));
  const newByTitle = new Map(newTrials.map(t => [t.title, t]));
  
  let added = 0, updated = 0, removed = 0;
  
  // New or updated trials
  for (const [title, trial] of newByTitle) {
    const existing = existingByTitle.get(title);
    if (!existing) {
      // INSERT new trial
      await insertTrial(sourceId, trial);
      added++;
    } else if (hasChanged(existing, trial)) {
      // UPDATE existing trial
      await updateTrial(existing.id, trial);
      updated++;
    }
    // If unchanged, just update last_seen timestamp
    await touchLastSeen(existing?.id);
  }
  
  // Removed trials (in DB but not in new extraction)
  for (const [title, existing] of existingByTitle) {
    if (!newByTitle.has(title) && existing.is_active) {
      await softDeleteTrial(existing.id);
      removed++;
    }
  }
  
  return { added, updated, removed };
}
```

**⚠️ CODEX REVIEW:** The change detection and soft-delete logic is data integrity critical. Get Codex review:

```bash
codex "Review this change detection logic for a trials scraper. I compare extracted trials to existing DB records by title. Is title matching robust enough? What about slight title variations between scrapes? Should I use fuzzy matching? Any race condition risks? [paste code]"
```

---

## Scheduled Job Configuration

For Replit Autoscale deployments, use a Replit Scheduled Deployment instead of
the app's internal `node-cron` scheduler. Autoscale web processes can scale down,
so an in-process cron is not a reliable production trigger unless the app is
running on an always-on process.

Recommended Scheduled Deployment settings:

```bash
# Build command
bash /home/runner/workspace/scrape-build.sh

# Run command
cd /home/runner/workspace/backend && npm run scrape:all
```

The internal scheduler defaults off unless `ENABLE_INTERNAL_SCHEDULER=true` is
set or the database explicitly stores `scrape_enabled=true`.

---

## Manual Scrape Commands

For testing and debugging:

```bash
# Scrape a single source by name
npx ts-node scripts/scrape-single.ts --source "Colorado State University"

# Scrape all sources (manual trigger)
npx ts-node scripts/scrape-all.ts

# Test extraction on a saved HTML file (no network required)
npx ts-node scripts/test-extraction.ts --file samples/csu-trials.html

# View scrape logs for last 24 hours
npx ts-node scripts/view-logs.ts --hours 24
```
