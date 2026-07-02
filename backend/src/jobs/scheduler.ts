import "dotenv/config";
import cron, { ScheduledTask } from "node-cron";
import { scrapeAllSources } from "../scrapers/scrape.js";
import prisma from "../db/client.js";

let currentTask: ScheduledTask | null = null;
let currentCron = "0 3 * * *"; // Default: daily at 3 AM ET
let isEnabled = false;

function shouldEnableInternalSchedulerByDefault(): boolean {
  return process.env.ENABLE_INTERNAL_SCHEDULER === "true";
}

function startSchedule(cronExpression: string): void {
  // Validate cron expression
  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  // Stop existing task if any
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
  }

  currentCron = cronExpression;
  isEnabled = true;

  currentTask = cron.schedule(cronExpression, async () => {
    console.log("[SCHEDULER] Starting scheduled scrape cycle");
    try {
      await scrapeAllSources();
      console.log("[SCHEDULER] Scheduled scrape cycle complete");
    } catch (error) {
      console.error("[SCHEDULER] Scheduled scrape failed:", error);
    }
  });

  console.log(`[SCHEDULER] Cron job scheduled: ${cronExpression}`);
}

export function updateSchedule(cronExpression: string): void {
  startSchedule(cronExpression);
}

export function stopSchedule(): void {
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
  }
  isEnabled = false;
  console.log("[SCHEDULER] Cron job stopped");
}

export function getScheduleConfig(): {
  cronExpression: string;
  enabled: boolean;
  nextRun: string | null;
} {
  return {
    cronExpression: currentCron,
    enabled: isEnabled,
    nextRun: isEnabled ? describeNextRun(currentCron) : null,
  };
}

function describeNextRun(cronExpr: string): string {
  // Simple human-readable description of common cron patterns
  const parts = cronExpr.split(" ");
  if (parts.length !== 5) return cronExpr;

  const [min, hour, dom, mon, dow] = parts;

  if (dom === "*" && mon === "*" && dow === "*") {
    return `Daily at ${hour.padStart(2, "0")}:${min.padStart(2, "0")} UTC`;
  }
  if (dom === "*" && mon === "*") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayNames = dow.split(",").map((d) => days[parseInt(d)] || d).join(", ");
    return `${dayNames} at ${hour.padStart(2, "0")}:${min.padStart(2, "0")} UTC`;
  }
  return cronExpr;
}

// Initialize: load persisted schedule from DB, or use env-controlled default.
// Replit Autoscale processes are not guaranteed to stay alive, so production
// should use Replit Scheduled Deployments unless ENABLE_INTERNAL_SCHEDULER=true.
async function init(): Promise<void> {
  try {
    const [cronSetting, enabledSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "scrape_cron" } }),
      prisma.setting.findUnique({ where: { key: "scrape_enabled" } }),
    ]);

    const cronExpr = cronSetting?.value || "0 3 * * *";
    const enabled =
      enabledSetting?.value !== undefined
        ? enabledSetting.value !== "false"
        : shouldEnableInternalSchedulerByDefault();

    if (enabled) {
      startSchedule(cronExpr);
    } else {
      currentCron = cronExpr;
      isEnabled = false;
      console.log("[SCHEDULER] Schedule is disabled (persisted setting)");
    }
  } catch (err) {
    // If settings table doesn't exist yet, use defaults
    console.log("[SCHEDULER] Could not load persisted schedule, using defaults");
    startSchedule("0 3 * * *");
  }
}

init().catch((e) => console.error("[SCHEDULER] Init failed:", e));
