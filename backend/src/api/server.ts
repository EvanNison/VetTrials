import "dotenv/config";
import express from "express";
import cors from "cors";
import { trialsRouter } from "./routes/trials.js";
import { filtersRouter } from "./routes/filters.js";
import { sourcesRouter } from "./routes/sources.js";
import { subscriptionsRouter } from "./routes/subscriptions.js";

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "8000", 10);

app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL || "http://localhost:3000"
    : true,
}));
app.use(express.json());

app.use("/api/trials", trialsRouter);
app.use("/api/filters", filtersRouter);
app.use("/api/sources", sourcesRouter);
app.use("/api/subscriptions", subscriptionsRouter);

app.get("/api/stats", async (_req, res) => {
  const prisma = (await import("../db/client.js")).default;
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
