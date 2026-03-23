import { Router, type Request, type Response } from "express";
import prisma from "../../db/client.js";

export const sourcesRouter = Router();

// GET /api/sources — scrape status per institution
sourcesRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const sources = await prisma.source.findMany({
      where: { isActive: true },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        shortName: true,
        tier: true,
        trialCount: true,
        lastScraped: true,
        lastSuccess: true,
        lastError: true,
      },
    });

    res.json({ data: sources, error: null });
  } catch (error) {
    console.error("[API] GET /sources error:", error);
    res.status(500).json({ data: null, error: "Failed to fetch sources" });
  }
});
