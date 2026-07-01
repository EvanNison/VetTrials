import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import prisma from "../db/client.js";
import { trialsRouter } from "./routes/trials.js";
import { filtersRouter } from "./routes/filters.js";
import { sourcesRouter } from "./routes/sources.js";
import { subscriptionsRouter } from "./routes/subscriptions.js";
import { adminRouter } from "./routes/admin.js";

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || "8000", 10);

// Behind Replit / Vercel / etc., real client IPs come via X-Forwarded-For.
// Trust one proxy hop so rate limiting keys on the actual caller.
app.set("trust proxy", 1);

// CORS: GET endpoints are part of the free public API and must work from any
// origin. POST endpoints (subscriptions) stay restricted to the frontend so
// random sites can't sign visitors up for emails.
app.use((req, res, next) => {
  if (req.method === "GET" || req.method === "OPTIONS" || req.method === "HEAD") {
    return cors({ origin: "*" })(req, res, next);
  }
  return cors({
    origin: process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "http://localhost:3000"
      : true,
  })(req, res, next);
});
app.use(express.json());

// Read-side rate limit: generous, per IP. Read endpoints are cheap (Postgres
// only — no Anthropic calls in the request path) but DOS protection still matters.
const readLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { data: null, error: "Rate limit exceeded. Try again in a minute." },
});

// Write-side rate limit: strict, to prevent subscription spam.
const writeLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { data: null, error: "Too many requests. Try again in a minute." },
});

app.use("/api/trials", readLimiter, trialsRouter);
app.use("/api/filters", readLimiter, filtersRouter);
app.use("/api/sources", readLimiter, sourcesRouter);
app.use("/api/subscriptions", writeLimiter, subscriptionsRouter);

// Admin: /login is the only unauthenticated endpoint, so throttle it against
// brute force. The rest of /api/admin is session-token gated (adminAuth), so it
// is left unthrottled to avoid choking the admin dashboard's polling.
app.use("/api/admin/login", writeLimiter);
app.use("/api/admin", adminRouter);

app.get("/api/stats", readLimiter, async (_req, res) => {
  const [totalTrials, activeTrials, totalSources, activeSources] =
    await Promise.all([
      prisma.trial.count(),
      prisma.trial.count({ where: { isActive: true } }),
      prisma.source.count(),
      prisma.source.count({ where: { isActive: true } }),
    ]);

  res.json({
    data: { totalTrials, activeTrials, totalSources, activeSources },
    error: null,
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Start scheduled scraping jobs
import("../jobs/scheduler.js").catch((e) =>
  console.error("[API] Failed to load scheduler:", e)
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[API] VetTrials API running on http://0.0.0.0:${PORT}`);
});
