import { Router, type Request, type Response } from "express";
import prisma from "../../db/client.js";

export const filtersRouter = Router();

// GET /api/filters — available filter options with counts
filtersRouter.get("/", async (_req: Request, res: Response) => {
  try {
    // Get all active trials for counting
    const trials = await prisma.trial.findMany({
      where: { isActive: true },
      select: {
        species: true,
        conditionCategory: true,
        enrollmentStatus: true,
        locationState: true,
        sourceId: true,
      },
    });

    // Species counts
    const speciesCounts: Record<string, number> = {};
    for (const trial of trials) {
      for (const s of trial.species) {
        speciesCounts[s] = (speciesCounts[s] || 0) + 1;
      }
    }

    // Condition counts
    const conditionCounts: Record<string, number> = {};
    for (const trial of trials) {
      conditionCounts[trial.conditionCategory] =
        (conditionCounts[trial.conditionCategory] || 0) + 1;
    }

    // Status counts
    const statusCounts: Record<string, number> = {};
    for (const trial of trials) {
      statusCounts[trial.enrollmentStatus] =
        (statusCounts[trial.enrollmentStatus] || 0) + 1;
    }

    // State counts
    const stateCounts: Record<string, number> = {};
    for (const trial of trials) {
      if (trial.locationState) {
        stateCounts[trial.locationState] =
          (stateCounts[trial.locationState] || 0) + 1;
      }
    }

    // Institution counts
    const sources = await prisma.source.findMany({
      where: { isActive: true, trialCount: { gt: 0 } },
      select: { id: true, name: true, shortName: true, trialCount: true },
      orderBy: { name: "asc" },
    });

    res.json({
      data: {
        species: Object.entries(speciesCounts)
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count),
        conditions: Object.entries(conditionCounts)
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count),
        statuses: Object.entries(statusCounts)
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count),
        states: Object.entries(stateCounts)
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => a.value.localeCompare(b.value)),
        institutions: sources.map((s) => ({
          id: s.id,
          name: s.name,
          shortName: s.shortName,
          count: s.trialCount,
        })),
      },
      error: null,
    });
  } catch (error) {
    console.error("[API] GET /filters error:", error);
    res.status(500).json({ data: null, error: "Failed to fetch filters" });
  }
});
