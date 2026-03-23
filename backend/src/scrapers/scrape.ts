import { chromium, type Browser } from "playwright";
import { createHash } from "crypto";
import prisma from "../db/client.js";
import { extractTrials } from "../extraction/extract.js";
import type { TrialExtraction } from "../extraction/schema.js";
import type { Source, Trial } from "../generated/prisma/client.js";

const USER_AGENT =
  "VetTrials/1.0 (veterinary clinical trials aggregator; contact@vettrials.com)";

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    const launchOptions: Record<string, unknown> = { headless: true };
    if (process.env.CHROME_PATH) {
      launchOptions.executablePath = process.env.CHROME_PATH;
    }
    browser = await chromium.launch(launchOptions);
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

function hashHtml(html: string): string {
  return createHash("sha256").update(html).digest("hex");
}

// Sources where we override the URL or need to scrape multiple pages
const SOURCE_OVERRIDES: Record<string, { urls: string[]; waitMs?: number; clickSelectors?: string[] }> = {
  // UC Davis uses StudyPages — main page is just a portal
  "UC Davis": {
    urls: ["https://studypages.com/ucdavisvet/"],
    waitMs: 5000,
  },
  // Texas A&M also uses StudyPages
  "TAMU": {
    urls: ["https://studypages.com/tamuvetmed/home/"],
    waitMs: 5000,
  },
  // Wisconsin organizes by specialty — scrape main + oncology sub-page
  "Wisconsin": {
    urls: [
      "https://uwveterinarycare.wisc.edu/veterinary-clinical-studies/",
      "https://uwveterinarycare.wisc.edu/veterinary-clinical-studies/oncology/",
    ],
    waitMs: 3000,
  },
  // MSU needs a longer timeout
  "MSU": {
    urls: ["https://cvm.msu.edu/hospital/veterinarians/clinical-trials"],
    waitMs: 5000,
  },
  // Purdue — hub page links to species sub-pages
  "Purdue": {
    urls: [
      "https://vet.purdue.edu/ctr/clinical-research/canine.php",
      "https://vet.purdue.edu/ctr/clinical-research/feline.php",
      "https://vet.purdue.edu/ctr/clinical-research/equine.php",
      "https://vet.purdue.edu/ctr/clinical-research/avian.php",
    ],
    waitMs: 3000,
  },
  // UGA — main page is FAQ, actual trials at search/archive page
  "UGA": {
    urls: [
      "https://vet.uga.edu/search-clinical-trials/",
      "https://vet.uga.edu/clinical-trial/",
    ],
    waitMs: 5000,
  },
  // UF — hub page, trials on deeper department pages
  "UF": {
    urls: [
      "https://research.vetmed.ufl.edu/clinical-trials/",
      "https://research.vetmed.ufl.edu/clinical-trials/small-animal/",
      "https://research.vetmed.ufl.edu/clinical-trials/oncology/",
    ],
    waitMs: 4000,
  },
  // Kansas State — hub links to current trials sub-page
  "Kansas State": {
    urls: ["https://www.ksvhc.org/services/clinical-trials/current-trials/"],
    waitMs: 4000,
  },
  // Oregon State — try cleaner canonical URL
  "Oregon State": {
    urls: [
      "https://vetmed.oregonstate.edu/oncology-clinical-trials",
      "https://vetmed.oregonstate.edu/hospital/oncology/clinical-trials",
    ],
    waitMs: 3000,
  },
  // OVC — landing page points to species sub-pages on different subdomain
  "OVC": {
    urls: [
      "https://ovcclinicaltrials.uoguelph.ca/active-canine-clinical-trials/",
      "https://ovcclinicaltrials.uoguelph.ca/active-feline-clinical-trials/",
      "https://ovcclinicaltrials.uoguelph.ca/large-animal/",
    ],
    waitMs: 4000,
  },
  // NC State — directory page, trials at species sub-pages
  "NC State": {
    urls: [
      "https://cvm.ncsu.edu/research/clinical-trials/dogs/",
      "https://cvm.ncsu.edu/research/clinical-trials/cats/",
      "https://cvm.ncsu.edu/research/clinical-trials/horses/",
    ],
    waitMs: 4000,
  },
  // VA-MD — overview page, actual studies at current-studies sub-page
  "VA-MD": {
    urls: ["https://research.vetmed.vt.edu/clinical-trials/current-studies.html"],
    waitMs: 4000,
  },
  // Oklahoma State — college homepage, actual trials at hospital page
  "Oklahoma State": {
    urls: ["https://vethospital.okstate.edu/info-for-researchers/clinical-trials"],
    waitMs: 4000,
  },
  // AVMA registry — StudyPages with JS pagination. Single page + aggressive scroll.
  "AVMA": {
    urls: ["https://veterinaryclinicaltrials.org/studies/?term~recruiting_status=R"],
    waitMs: 5000,
  },
  // CUVS — hub page, trials on species sub-pages
  "CUVS": {
    urls: [
      "https://www.cuvs.org/clinical_trials/canine_studies",
      "https://www.cuvs.org/clinical_trials/feline_studies",
    ],
    waitMs: 4000,
  },
};

async function fetchPage(url: string, waitMs: number = 2000): Promise<string> {
  const b = await getBrowser();
  const page = await b.newPage({
    userAgent: USER_AGENT,
  });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(waitMs);

    // Try scrolling to bottom to trigger lazy loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Aggressively click "Load More" / "Next" / pagination buttons until exhausted
    const loadMoreSelectors = [
      'button:has-text("Load More")',
      'button:has-text("Show All")',
      'button:has-text("View All")',
      'a:has-text("Load More")',
      'a:has-text("Show All")',
      'a:has-text("View All")',
      'button:has-text("Next")',
      'a:has-text("Next")',
      'a[aria-label="Next"]',
      'button[aria-label="Next page"]',
      '.pagination a:last-child',
    ];

    // Keep clicking load-more/next and scrolling for up to 30 iterations
    // Handles both button-based pagination and infinite scroll
    let lastHeight = await page.evaluate(() => document.body.scrollHeight);
    for (let attempt = 0; attempt < 30; attempt++) {
      let clicked = false;
      for (const selector of loadMoreSelectors) {
        try {
          const btn = page.locator(selector).first();
          if (await btn.isVisible({ timeout: 500 })) {
            await btn.click();
            await page.waitForTimeout(2000);
            clicked = true;
            break;
          }
        } catch {
          // Button not found
        }
      }

      // Also try infinite scroll
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      const newHeight = await page.evaluate(() => document.body.scrollHeight);

      if (!clicked && newHeight === lastHeight) break; // Nothing new loaded
      lastHeight = newHeight;
    }

    const html = await page.content();
    return html;
  } finally {
    await page.close();
  }
}

// For multi-page sources, fetch and extract each page separately to avoid token limits
async function fetchAndExtractMultiPage(
  source: { shortName: string; url: string; name: string }
): Promise<{ allTrials: TrialExtraction[]; totalTokens: number; combinedHtml: string } | null> {
  const override = SOURCE_OVERRIDES[source.shortName];
  if (!override) return null;

  const urls = override.urls;
  const waitMs = override.waitMs || 2000;
  const allTrials: TrialExtraction[] = [];
  let totalTokens = 0;
  const htmlParts: string[] = [];
  const seenTitles = new Set<string>();

  for (const url of urls) {
    try {
      console.log(`[SCRAPE]   Fetching sub-page: ${url}`);
      const html = await fetchPage(url, waitMs);
      htmlParts.push(html);

      const { trials, tokensUsed } = await extractTrials(html, source.name);
      totalTokens += tokensUsed;

      // Deduplicate across sub-pages
      for (const trial of trials) {
        if (!seenTitles.has(trial.title)) {
          seenTitles.add(trial.title);
          allTrials.push(trial);
        }
      }
      console.log(`[SCRAPE]   Sub-page ${url}: ${trials.length} trials`);
    } catch (err) {
      console.warn(`[SCRAPE]   Sub-page failed: ${url} — ${err instanceof Error ? err.message : err}`);
    }
  }

  return { allTrials, totalTokens, combinedHtml: htmlParts.join("\n") };
}

function hasChanged(
  existing: Trial,
  extracted: TrialExtraction
): boolean {
  if (existing.conditionCategory !== extracted.condition_category) return true;
  if (existing.conditionSpecific !== extracted.condition_specific) return true;
  if (existing.enrollmentStatus !== extracted.enrollment_status) return true;
  if (existing.eligibilitySummary !== extracted.eligibility_summary) return true;
  if (existing.principalInvestigator !== extracted.principal_investigator) return true;
  if (existing.contactEmail !== extracted.contact_email) return true;
  if (existing.contactPhone !== extracted.contact_phone) return true;
  if (existing.financialInfo !== extracted.financial_info) return true;
  // Compare species arrays
  const existingSpecies = (existing.species || []).sort().join(",");
  const newSpecies = (extracted.species || []).sort().join(",");
  if (existingSpecies !== newSpecies) return true;
  return false;
}

// Location mapping from source short names to city/state
const LOCATION_MAP: Record<string, { city: string; state: string }> = {
  "Penn Vet": { city: "Philadelphia", state: "PA" },
  "Cornell": { city: "Ithaca", state: "NY" },
  "CSU": { city: "Fort Collins", state: "CO" },
  "Ohio State": { city: "Columbus", state: "OH" },
  "UC Davis": { city: "Davis", state: "CA" },
  "NC State": { city: "Raleigh", state: "NC" },
  "Tufts": { city: "Grafton", state: "MA" },
  "UF": { city: "Gainesville", state: "FL" },
  "Purdue": { city: "West Lafayette", state: "IN" },
  "MSU": { city: "East Lansing", state: "MI" },
  "Wisconsin": { city: "Madison", state: "WI" },
  "TAMU": { city: "College Station", state: "TX" },
  "Minnesota": { city: "Saint Paul", state: "MN" },
  "UGA": { city: "Athens", state: "GA" },
  "Mizzou": { city: "Columbia", state: "MO" },
  "Illinois": { city: "Urbana", state: "IL" },
  "Tennessee": { city: "Knoxville", state: "TN" },
  "Auburn": { city: "Auburn", state: "AL" },
  "Iowa State": { city: "Ames", state: "IA" },
  "Kansas State": { city: "Manhattan", state: "KS" },
  "LSU": { city: "Baton Rouge", state: "LA" },
  "Oregon State": { city: "Corvallis", state: "OR" },
  "WSU": { city: "Pullman", state: "WA" },
  "VA-MD": { city: "Blacksburg", state: "VA" },
  "Oklahoma State": { city: "Stillwater", state: "OK" },
  "JHU": { city: "Baltimore", state: "MD" },
  "Arizona": { city: "Tucson", state: "AZ" },
  "OVC": { city: "Guelph", state: "ON" },
  "AMC": { city: "New York", state: "NY" },
  "CUVS": { city: "Stamford", state: "CT" },
  "AVMA": { city: "", state: "" },
};

async function processExtractionResults(
  source: Source,
  newTrials: TrialExtraction[]
): Promise<{ added: number; updated: number; removed: number }> {
  const existingTrials = await prisma.trial.findMany({
    where: { sourceId: source.id, isActive: true },
  });

  const existingByTitle = new Map(existingTrials.map((t) => [t.title, t]));
  const newByTitle = new Map(newTrials.map((t) => [t.title, t]));

  let added = 0,
    updated = 0,
    removed = 0;

  const location = LOCATION_MAP[source.shortName] || { city: "", state: "" };

  for (const [title, trial] of newByTitle) {
    const existing = existingByTitle.get(title);
    const contentHash = hashHtml(JSON.stringify(trial));

    if (!existing) {
      await prisma.trial.create({
        data: {
          sourceId: source.id,
          title: trial.title,
          sourceUrl: trial.source_url_fragment,
          species: trial.species,
          conditionCategory: trial.condition_category,
          conditionSpecific: trial.condition_specific,
          enrollmentStatus: trial.enrollment_status,
          eligibilitySummary: trial.eligibility_summary,
          eligibilityDetails: trial.eligibility_details,
          principalInvestigator: trial.principal_investigator,
          contactEmail: trial.contact_email,
          contactPhone: trial.contact_phone,
          financialInfo: trial.financial_info,
          locationCity: location.city,
          locationState: location.state,
          contentHash,
          rawExtraction: trial as unknown as Record<string, unknown>,
        },
      });
      added++;
    } else if (hasChanged(existing, trial)) {
      await prisma.trial.update({
        where: { id: existing.id },
        data: {
          species: trial.species,
          conditionCategory: trial.condition_category,
          conditionSpecific: trial.condition_specific,
          enrollmentStatus: trial.enrollment_status,
          eligibilitySummary: trial.eligibility_summary,
          eligibilityDetails: trial.eligibility_details,
          principalInvestigator: trial.principal_investigator,
          contactEmail: trial.contact_email,
          contactPhone: trial.contact_phone,
          financialInfo: trial.financial_info,
          sourceUrl: trial.source_url_fragment ?? existing.sourceUrl,
          contentHash,
          rawExtraction: trial as unknown as Record<string, unknown>,
          lastChanged: new Date(),
          lastSeen: new Date(),
        },
      });
      updated++;
    } else {
      await prisma.trial.update({
        where: { id: existing.id },
        data: { lastSeen: new Date() },
      });
    }
  }

  // Soft delete trials that are no longer on the page
  for (const [title, existing] of existingByTitle) {
    if (!newByTitle.has(title) && existing.isActive) {
      await prisma.trial.update({
        where: { id: existing.id },
        data: {
          isActive: false,
          enrollmentStatus: "removed",
          lastChanged: new Date(),
        },
      });
      removed++;
    }
  }

  return { added, updated, removed };
}

export async function scrapeSource(source: Source): Promise<void> {
  const log = await prisma.scrapeLog.create({
    data: {
      sourceId: source.id,
      status: "running",
    },
  });

  try {
    console.log(`[SCRAPE] Fetching ${source.name} (${source.url})`);

    // Multi-page sources: extract per sub-page to avoid token limits
    const override = SOURCE_OVERRIDES[source.shortName];
    let trials: TrialExtraction[];
    let tokensUsed: number;
    let html: string;

    if (override && override.urls.length > 1) {
      const multiResult = await fetchAndExtractMultiPage(source);
      if (!multiResult || multiResult.allTrials.length === 0) {
        // Fall back to single-page extraction
        html = await fetchPage(source.url, override.waitMs || 2000);
        const result = await extractTrials(html, source.name);
        trials = result.trials;
        tokensUsed = result.tokensUsed;
      } else {
        trials = multiResult.allTrials;
        tokensUsed = multiResult.totalTokens;
        html = multiResult.combinedHtml;
      }
    } else if (override) {
      html = await fetchPage(override.urls[0], override.waitMs || 2000);
      const result = await extractTrials(html, source.name);
      trials = result.trials;
      tokensUsed = result.tokensUsed;
    } else {
      html = await fetchPage(source.url);
      const result = await extractTrials(html, source.name);
      trials = result.trials;
      tokensUsed = result.tokensUsed;
    }

    const htmlHash = hashHtml(html);
    console.log(`[SCRAPE] ${source.name}: extracted ${trials.length} trials (${tokensUsed} tokens)`);

    const results = await processExtractionResults(source, trials);

    // Update trial count
    const activeCount = await prisma.trial.count({
      where: { sourceId: source.id, isActive: true },
    });

    await prisma.scrapeLog.update({
      where: { id: log.id },
      data: {
        status: "success",
        completedAt: new Date(),
        rawHtmlHash: htmlHash,
        rawHtmlSize: html.length,
        extractionTokens: tokensUsed,
        trialsFound: trials.length,
        trialsNew: results.added,
        trialsUpdated: results.updated,
        trialsRemoved: results.removed,
      },
    });

    await prisma.source.update({
      where: { id: source.id },
      data: {
        lastScraped: new Date(),
        lastSuccess: new Date(),
        lastError: null,
        trialCount: activeCount,
      },
    });

    console.log(`[SCRAPE] ${source.name}: +${results.added} new, ~${results.updated} updated, -${results.removed} removed`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack || "" : "";
    console.error(`[SCRAPE] ${source.name} failed: ${errorMsg}`);

    await prisma.scrapeLog.update({
      where: { id: log.id },
      data: {
        status: "error",
        completedAt: new Date(),
        errorMessage: errorMsg,
        errorStack: errorStack,
      },
    });

    await prisma.source.update({
      where: { id: source.id },
      data: {
        lastScraped: new Date(),
        lastError: errorMsg,
      },
    });
  }
}

export async function scrapeAllSources(): Promise<void> {
  const sources = await prisma.source.findMany({
    where: { isActive: true },
    orderBy: { tier: "asc" },
  });

  console.log(`[SCRAPE] Starting scrape of ${sources.length} sources`);

  for (const source of sources) {
    try {
      await scrapeSource(source);
      // 5-second delay between sources
      await new Promise((r) => setTimeout(r, 5000));
    } catch (error) {
      console.error(`[SCRAPE] Unexpected error for ${source.name}:`, error);
    }
  }

  await closeBrowser();
  console.log("[SCRAPE] Scrape cycle complete");
}
