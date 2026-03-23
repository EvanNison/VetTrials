import "dotenv/config";
import cron from "node-cron";
import { scrapeAllSources } from "../scrapers/scrape.js";

// Run full scrape daily at 3 AM ET
cron.schedule("0 3 * * *", async () => {
  console.log("[SCHEDULER] Starting daily scrape cycle");
  try {
    await scrapeAllSources();
    console.log("[SCHEDULER] Daily scrape cycle complete");
  } catch (error) {
    console.error("[SCHEDULER] Daily scrape failed:", error);
  }
});

console.log("[SCHEDULER] Cron job scheduled: daily at 3 AM ET");
