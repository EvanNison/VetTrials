import { Router } from "express";
import crypto from "crypto";
import { adminAuth, createSession, invalidateSession } from "../middleware/auth.js";
import prisma from "../../db/client.js";
import { getScheduleConfig, updateSchedule, stopSchedule } from "../../jobs/scheduler.js";

const router = Router();

// ─── Login ───────────────────────────────────────────────────────────────────

router.post("/login", (req, res) => {
  const { password } = req.body;
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    return res.status(500).json({ data: null, error: "Admin authentication not configured. Set ADMIN_SECRET env var." });
  }

  if (typeof password !== "string" || password.length !== secret.length || !crypto.timingSafeEqual(Buffer.from(password), Buffer.from(secret))) {
    return res.status(401).json({ data: null, error: "Invalid password" });
  }

  const token = createSession();
  res.json({ data: { token }, error: null });
});

router.post("/logout", adminAuth, (req, res) => {
  const token = req.headers.authorization?.slice(7);
  if (token) invalidateSession(token);
  res.json({ data: { message: "Logged out" }, error: null });
});

// ─── Verify session ─────────────────────────────────────────────────────────

router.get("/verify", adminAuth, (_req, res) => {
  res.json({ data: { valid: true }, error: null });
});

// ─── Trigger scrape ──────────────────────────────────────────────────────────

router.post("/scrape", adminAuth, async (req, res) => {
  const { source } = req.query;
  const sourceNames =
    typeof source === "string"
      ? source.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  res.json({
    data: {
      message: sourceNames.length
        ? `Scrape started for ${sourceNames.length} source${sourceNames.length === 1 ? "" : "s"}: ${sourceNames.join(", ")}`
        : "Full scrape started for all sources",
    },
    error: null,
  });

  setImmediate(async () => {
    try {
      const { scrapeAllSources, scrapeSource } = await import("../../scrapers/scrape.js");

      if (sourceNames.length > 0) {
        for (const sourceName of sourceNames) {
          const src = await prisma.source.findFirst({ where: { shortName: sourceName } });
          if (src) {
            console.log(`[ADMIN] Scraping source: ${sourceName}`);
            await scrapeSource(src);
          } else {
            console.error(`[ADMIN] Source not found: ${sourceName}`);
          }
        }
      } else {
        console.log("[ADMIN] Starting full scrape of all sources...");
        await scrapeAllSources();
        const count = await prisma.trial.count({ where: { isActive: true } });
        console.log(`[ADMIN] Full scrape complete. Active trials: ${count}`);
      }
    } catch (err) {
      console.error("[ADMIN] Scrape failed:", err);
    }
  });
});

// ─── Run History ─────────────────────────────────────────────────────────────

router.get("/runs", adminAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const sourceId = req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined;
  const status = req.query.status as string | undefined;

  const where: Record<string, unknown> = {};
  if (sourceId) where.sourceId = sourceId;
  if (status) where.status = status;

  const [runs, total] = await Promise.all([
    prisma.scrapeLog.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        source: { select: { id: true, name: true, shortName: true } },
      },
    }),
    prisma.scrapeLog.count({ where }),
  ]);

  res.json({
    data: {
      runs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
    error: null,
  });
});

router.get("/runs/:id", adminAuth, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const run = await prisma.scrapeLog.findUnique({
    where: { id },
    include: { source: { select: { id: true, name: true, shortName: true, url: true } } },
  });

  if (!run) {
    return res.status(404).json({ data: null, error: "Run not found" });
  }

  res.json({ data: run, error: null });
});

// ─── Cost Tracking ───────────────────────────────────────────────────────────

// Haiku pricing (per 1M tokens)
const HAIKU_INPUT_COST_PER_M = 0.80;
const HAIKU_OUTPUT_COST_PER_M = 4.00;
// Approximate: we don't track input vs output separately, so use a blended rate
const HAIKU_BLENDED_COST_PER_M = (HAIKU_INPUT_COST_PER_M + HAIKU_OUTPUT_COST_PER_M) / 2;

router.get("/costs", adminAuth, async (req, res) => {
  const days = Math.min(365, Math.max(1, parseInt(req.query.days as string) || 30));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Aggregate cost data
  const [totals, bySource, byDay] = await Promise.all([
    // Overall totals
    prisma.scrapeLog.aggregate({
      where: { startedAt: { gte: since }, status: "success" },
      _sum: { extractionTokens: true },
      _count: true,
    }),
    // Per-source breakdown
    prisma.scrapeLog.groupBy({
      by: ["sourceId"],
      where: { startedAt: { gte: since }, status: "success" },
      _sum: { extractionTokens: true },
      _count: true,
    }),
    // Daily totals (raw query for date grouping)
    prisma.$queryRaw<Array<{ day: string; tokens: bigint; runs: bigint }>>`
      SELECT DATE(started_at) as day,
             COALESCE(SUM(extraction_tokens), 0) as tokens,
             COUNT(*) as runs
      FROM scrape_logs
      WHERE started_at >= ${since} AND status = 'success'
      GROUP BY DATE(started_at)
      ORDER BY day DESC
      LIMIT 30
    `,
  ]);

  // Get source names for the by-source breakdown
  const sourceIds = bySource.map((s) => s.sourceId);
  const sources = await prisma.source.findMany({
    where: { id: { in: sourceIds } },
    select: { id: true, name: true, shortName: true },
  });
  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  const totalTokens = totals._sum.extractionTokens || 0;
  const estimatedCost = (Number(totalTokens) / 1_000_000) * HAIKU_BLENDED_COST_PER_M;

  res.json({
    data: {
      period: { days, since: since.toISOString() },
      totals: {
        runs: totals._count,
        tokens: totalTokens,
        estimatedCostUsd: Math.round(estimatedCost * 10000) / 10000,
      },
      bySource: bySource.map((s) => {
        const tokens = s._sum.extractionTokens || 0;
        return {
          source: sourceMap.get(s.sourceId) || { id: s.sourceId, name: "Unknown", shortName: "unknown" },
          runs: s._count,
          tokens,
          estimatedCostUsd: Math.round((Number(tokens) / 1_000_000) * HAIKU_BLENDED_COST_PER_M * 10000) / 10000,
        };
      }).sort((a, b) => Number(b.tokens) - Number(a.tokens)),
      byDay: byDay.map((d) => ({
        day: d.day,
        tokens: Number(d.tokens),
        runs: Number(d.runs),
        estimatedCostUsd: Math.round((Number(d.tokens) / 1_000_000) * HAIKU_BLENDED_COST_PER_M * 10000) / 10000,
      })),
    },
    error: null,
  });
});

// ─── Schedule Management ─────────────────────────────────────────────────────

router.get("/schedule", adminAuth, async (_req, res) => {
  const config = getScheduleConfig();

  // Also check DB for persisted schedule
  const dbSchedule = await prisma.setting.findUnique({ where: { key: "scrape_cron" } });
  const dbEnabled = await prisma.setting.findUnique({ where: { key: "scrape_enabled" } });

  res.json({
    data: {
      cronExpression: config.cronExpression,
      enabled: config.enabled,
      nextRun: config.nextRun,
      lastPersisted: dbSchedule?.value || null,
    },
    error: null,
  });
});

router.put("/schedule", adminAuth, async (req, res) => {
  const { cronExpression, enabled } = req.body;

  if (cronExpression !== undefined && typeof cronExpression !== "string") {
    return res.status(400).json({ data: null, error: "cronExpression must be a string" });
  }

  if (enabled !== undefined && typeof enabled !== "boolean") {
    return res.status(400).json({ data: null, error: "enabled must be a boolean" });
  }

  try {
    if (enabled === false) {
      stopSchedule();
      await prisma.setting.upsert({
        where: { key: "scrape_enabled" },
        update: { value: "false" },
        create: { key: "scrape_enabled", value: "false" },
      });
    } else {
      const cron = cronExpression || getScheduleConfig().cronExpression;
      updateSchedule(cron);
      await Promise.all([
        prisma.setting.upsert({
          where: { key: "scrape_cron" },
          update: { value: cron },
          create: { key: "scrape_cron", value: cron },
        }),
        prisma.setting.upsert({
          where: { key: "scrape_enabled" },
          update: { value: "true" },
          create: { key: "scrape_enabled", value: "true" },
        }),
      ]);
    }

    const config = getScheduleConfig();
    res.json({
      data: {
        cronExpression: config.cronExpression,
        enabled: config.enabled,
        nextRun: config.nextRun,
        message: "Schedule updated",
      },
      error: null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update schedule";
    res.status(400).json({ data: null, error: message });
  }
});

// ─── Change History (trial changes over time) ────────────────────────────────

router.get("/changes", adminAuth, async (req, res) => {
  const days = Math.min(90, Math.max(1, parseInt(req.query.days as string) || 7));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [newTrials, updatedTrials, removedTrials] = await Promise.all([
    prisma.trial.findMany({
      where: { firstSeen: { gte: since } },
      orderBy: { firstSeen: "desc" },
      take: 100,
      select: {
        id: true, title: true, species: true, conditionCategory: true,
        enrollmentStatus: true, firstSeen: true,
        source: { select: { name: true, shortName: true } },
      },
    }),
    prisma.trial.findMany({
      where: { lastChanged: { gte: since }, firstSeen: { lt: since } },
      orderBy: { lastChanged: "desc" },
      take: 100,
      select: {
        id: true, title: true, species: true, conditionCategory: true,
        enrollmentStatus: true, lastChanged: true,
        source: { select: { name: true, shortName: true } },
      },
    }),
    prisma.trial.findMany({
      where: { isActive: false, updatedAt: { gte: since } },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true, title: true, species: true, conditionCategory: true,
        enrollmentStatus: true, updatedAt: true,
        source: { select: { name: true, shortName: true } },
      },
    }),
  ]);

  res.json({
    data: {
      period: { days, since: since.toISOString() },
      newTrials: { count: newTrials.length, trials: newTrials },
      updatedTrials: { count: updatedTrials.length, trials: updatedTrials },
      removedTrials: { count: removedTrials.length, trials: removedTrials },
    },
    error: null,
  });
});

// ─── Active scrape status ────────────────────────────────────────────────────

router.get("/scrape-status", adminAuth, async (_req, res) => {
  const running = await prisma.scrapeLog.findMany({
    where: { status: "running" },
    include: { source: { select: { name: true, shortName: true } } },
    orderBy: { startedAt: "desc" },
  });

  res.json({ data: { running }, error: null });
});

export { router as adminRouter };
