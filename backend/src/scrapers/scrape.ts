import { chromium, type Browser } from "playwright";
import { createHash } from "crypto";
import prisma from "../db/client.js";
import { extractTrials } from "../extraction/extract.js";
import type { TrialExtraction } from "../extraction/schema.js";
import type { Source, Trial } from "../generated/prisma/client.js";
import { Prisma } from "../generated/prisma/client.js";
import { isAllowedByRobots, getCrawlDelay } from "./robots.js";
import { getBotUserAgent } from "./user-agent.js";
import { acquireLock, releaseLock } from "../jobs/locks.js";

// Bot-style UA for Playwright: transparent about who we are, and supports
// robots.txt user-agent matching.
const BOT_USER_AGENT = getBotUserAgent();
const SOURCE_LOCK_TTL_MS = 2 * 60 * 60 * 1000;
const FULL_SCRAPE_LOCK_TTL_MS = 8 * 60 * 60 * 1000;

let browser: Browser | null = null;
let browserFailed = false;

function findChromiumPath(): string | undefined {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  const { readdirSync, existsSync } = require("fs");
  const { join } = require("path");
  const { homedir } = require("os");

  // Check for Nix-provided Playwright Chromium (Replit environment)
  try {
    const nixStore = "/nix/store";
    if (existsSync(nixStore)) {
      const entries = readdirSync(nixStore) as string[];
      const pwEntry = entries.find((e: string) => e.includes("playwright-browsers-chromium"));
      if (pwEntry) {
        const baseDir = `${nixStore}/${pwEntry}`;
        const chromeDirs = (readdirSync(baseDir) as string[]).filter((d: string) => d.startsWith("chromium-"));
        if (chromeDirs.length > 0) {
          chromeDirs.sort();
          const chromeDir = chromeDirs[chromeDirs.length - 1];
          const chromePath = `${baseDir}/${chromeDir}/chrome-linux/chrome`;
          if (existsSync(chromePath)) return chromePath;
        }
      }
    }
  } catch {}

  // Check Playwright's default cache directory (~/.cache/ms-playwright/)
  // and the local-browsers directory inside node_modules/playwright-core
  const cacheDirs = [
    join(homedir(), ".cache", "ms-playwright"),
    join(__dirname, "..", "..", "node_modules", "playwright-core", ".local-browsers"),
    join(__dirname, "..", "..", "..", "node_modules", "playwright-core", ".local-browsers"),
  ];
  for (const cacheDir of cacheDirs) {
    try {
      if (!existsSync(cacheDir)) continue;
      const entries = readdirSync(cacheDir) as string[];
      const chromiumDir = entries.filter((e: string) => e.startsWith("chromium-")).sort().pop();
      if (!chromiumDir) continue;
      // Check both chrome-linux64 (newer) and chrome-linux (older) paths
      for (const subdir of ["chrome-linux64", "chrome-linux"]) {
        const chromePath = join(cacheDir, chromiumDir, subdir, "chrome");
        if (existsSync(chromePath)) return chromePath;
      }
    } catch {}
  }

  // Check for system-installed browsers
  try {
    const { execSync } = require("child_process");
    const path = execSync(
      "which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome-stable 2>/dev/null || which google-chrome 2>/dev/null",
      { encoding: "utf8", timeout: 5000 }
    ).trim();
    if (path) return path;
  } catch {}

  return undefined;
}

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    const chromiumPath = findChromiumPath();
    console.log(`[scraper] Launching browser${chromiumPath ? ` from ${chromiumPath}` : " (Playwright bundled)"}`);
    browser = await chromium.launch({
      headless: true,
      ...(chromiumPath ? { executablePath: chromiumPath } : {}),
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
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

// Fallback: fetch HTML via plain HTTP when Playwright is unavailable
async function fetchPageSimple(url: string): Promise<string> {
  console.log(`[scraper] Using HTTP fetch fallback for ${url}`);
  const response = await fetch(url, {
    headers: {
      "User-Agent": BOT_USER_AGENT,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return response.text();
}

// Sources where we override the URL or need to scrape multiple pages
const SOURCE_OVERRIDES: Record<string, { urls: string[]; waitMs?: number; clickSelectors?: string[] }> = {
  // CSU's old VTH URL redirects to a clinical trials hub; oncology trials are
  // listed separately by the Flint Animal Cancer Center.
  "CSU": {
    urls: [
      "https://csuveterinaryhealth.org/clinical-trials/",
      "https://www.csuanimalcancercenter.org/current-clinical-trials/",
    ],
    waitMs: 3000,
  },
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
  // Oklahoma State — behind Cloudflare challenge, use main college page as fallback
  "Oklahoma State": {
    urls: ["https://cvhs.okstate.edu/veterinary-teaching-hospital/clinical-trials"],
    waitMs: 5000,
  },
  // WSU — old URL redirects; clinical studies are listed on the hospital category page
  "WSU": {
    urls: ["https://hospital.vetmed.wsu.edu/category/clinical-study/"],
    waitMs: 3000,
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
  // Respect robots.txt before any fetch — this gates both the Playwright path
  // and the HTTP fallback below. Fails open if robots.txt is unavailable.
  const allowed = await isAllowedByRobots(url, "VetTrials");
  if (!allowed) {
    throw new Error(`Blocked by robots.txt: ${url}`);
  }
  // If the site declares a crawl-delay, honor it (capped to avoid pathological values).
  const delay = await getCrawlDelay(url);
  if (delay && delay > 0) {
    await new Promise((r) => setTimeout(r, Math.min(delay * 1000, 30_000)));
  }

  // If Playwright already failed to launch, go straight to HTTP fallback
  if (browserFailed) {
    return fetchPageSimple(url);
  }

  try {
    const b = await getBrowser();
    const page = await b.newPage({
      userAgent: BOT_USER_AGENT,
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // If browser failed to launch (missing executable/libs), fall back to HTTP for all future requests
    if (msg.includes("Executable doesn't exist") || msg.includes("error while loading shared libraries") || msg.includes("browserType.launch")) {
      console.warn(`[scraper] Playwright unavailable: ${msg.substring(0, 100)}. Falling back to HTTP fetch for all sources.`);
      browserFailed = true;
      browser = null;
      return fetchPageSimple(url);
    }
    throw err;
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

// Sources that only list active/recruiting trials but don't label status explicitly.
// When Claude returns "unknown" for these, override to the default.
const SOURCE_STATUS_DEFAULTS: Record<string, string> = {
  "Cornell": "recruiting",
};

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
  // Fetch ALL trials for this source (including soft-deleted) to avoid unique constraint violations
  const existingTrials = await prisma.trial.findMany({
    where: { sourceId: source.id },
  });

  const existingByTitle = new Map(existingTrials.map((t) => [t.title, t]));
  const activeByTitle = new Map(existingTrials.filter((t) => t.isActive).map((t) => [t.title, t]));
  const newByTitle = new Map(newTrials.map((t) => [t.title, t]));

  let added = 0,
    updated = 0,
    removed = 0;

  const location = LOCATION_MAP[source.shortName] || { city: "", state: "" };

  for (const [title, trial] of newByTitle) {
    const existing = existingByTitle.get(title);
    const contentHash = hashHtml(JSON.stringify(trial));

    if (!existing) {
      // Truly new trial in this snapshot. Use upsert so a concurrent worker
      // cannot crash the source run if it inserted the same title first.
      await prisma.trial.upsert({
        where: {
          sourceId_title: {
            sourceId: source.id,
            title: trial.title,
          },
        },
        create: {
          sourceId: source.id,
          title: trial.title,
          sourceUrl: trial.source_url_fragment ?? undefined,
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
          rawExtraction: trial as unknown as Prisma.InputJsonValue,
        },
        update: {
          isActive: true,
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
          sourceUrl: trial.source_url_fragment ?? undefined,
          locationCity: location.city,
          locationState: location.state,
          contentHash,
          rawExtraction: trial as unknown as Prisma.InputJsonValue,
          lastSeen: new Date(),
          lastChanged: new Date(),
        },
      });
      added++;
    } else if (!existing.isActive) {
      // Reactivate a previously soft-deleted trial
      await prisma.trial.update({
        where: { id: existing.id },
        data: {
          isActive: true,
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
          rawExtraction: trial as unknown as Prisma.InputJsonValue,
          lastChanged: new Date(),
          lastSeen: new Date(),
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
          rawExtraction: trial as unknown as Prisma.InputJsonValue,
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

  // Soft delete active trials that are no longer on the page
  for (const [title, existing] of activeByTitle) {
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
  const sourceLock = await acquireLock(
    `scrape:source:${source.id}`,
    SOURCE_LOCK_TTL_MS
  );
  if (!sourceLock) {
    console.log(`[SCRAPE] ${source.name}: already running, skipping duplicate request`);
    return;
  }

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

    // Apply source-specific status defaults (e.g., Cornell only lists active trials)
    const statusDefault = SOURCE_STATUS_DEFAULTS[source.shortName] as TrialExtraction["enrollment_status"] | undefined;
    if (statusDefault) {
      trials = trials.map(t => ({
        ...t,
        enrollment_status: t.enrollment_status === "unknown" ? statusDefault : t.enrollment_status,
      }));
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
  } finally {
    await releaseLock(sourceLock);
  }
}

export async function scrapeAllSources(): Promise<void> {
  const fullScrapeLock = await acquireLock(
    "scrape:all",
    FULL_SCRAPE_LOCK_TTL_MS
  );
  if (!fullScrapeLock) {
    console.log("[SCRAPE] Full scrape already running, skipping duplicate request");
    return;
  }

  try {
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
  } finally {
    await releaseLock(fullScrapeLock);
  }
}
