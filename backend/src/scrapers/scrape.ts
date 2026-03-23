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
    browser = await chromium.launch({ headless: true });
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

async function fetchPage(url: string): Promise<string> {
  const b = await getBrowser();
  const page = await b.newPage({
    userAgent: USER_AGENT,
  });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    // Wait a bit for any lazy content
    await page.waitForTimeout(2000);
    const html = await page.content();
    return html;
  } finally {
    await page.close();
  }
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
    const html = await fetchPage(source.url);
    const htmlHash = hashHtml(html);

    // Check if page has changed since last scrape
    const lastLog = await prisma.scrapeLog.findFirst({
      where: { sourceId: source.id, status: "success" },
      orderBy: { startedAt: "desc" },
    });

    if (lastLog?.rawHtmlHash === htmlHash) {
      console.log(`[SCRAPE] ${source.name}: page unchanged, skipping extraction`);
      await prisma.scrapeLog.update({
        where: { id: log.id },
        data: {
          status: "success",
          completedAt: new Date(),
          rawHtmlHash: htmlHash,
          rawHtmlSize: html.length,
          trialsFound: 0,
          trialsNew: 0,
          trialsUpdated: 0,
          trialsRemoved: 0,
        },
      });
      await prisma.source.update({
        where: { id: source.id },
        data: { lastScraped: new Date(), lastSuccess: new Date() },
      });
      return;
    }

    console.log(`[SCRAPE] Extracting trials from ${source.name}`);
    const { trials, tokensUsed } = await extractTrials(html, source.name);
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
