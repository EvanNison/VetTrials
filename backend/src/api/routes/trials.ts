import { Router, type Request, type Response } from "express";
import prisma from "../../db/client.js";
import type { Prisma } from "../../generated/prisma/client.js";

export const trialsRouter = Router();

// GET /api/trials — search + filter
trialsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const {
      q,
      species,
      condition,
      status,
      state,
      institution,
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const where: Prisma.TrialWhereInput = {
      isActive: true,
    };

    // Species filter (overlap with array)
    if (species && typeof species === "string") {
      const speciesArr = species.split(",").map((s) => s.trim().toLowerCase());
      where.species = { hasSome: speciesArr };
    }

    // Condition category filter
    if (condition && typeof condition === "string") {
      const conditions = condition.split(",").map((c) => c.trim().toLowerCase());
      if (conditions.length === 1) {
        where.conditionCategory = conditions[0];
      } else {
        where.conditionCategory = { in: conditions };
      }
    }

    // Enrollment status filter
    if (status && typeof status === "string") {
      const statuses = status.split(",").map((s) => s.trim().toLowerCase());
      if (statuses.length === 1) {
        where.enrollmentStatus = statuses[0];
      } else {
        where.enrollmentStatus = { in: statuses };
      }
    }

    // State filter
    if (state && typeof state === "string") {
      where.locationState = state.toUpperCase();
    }

    // Institution filter
    if (institution && typeof institution === "string") {
      where.sourceId = parseInt(institution, 10);
    }

    // Full-text search using raw SQL for the search query
    if (q && typeof q === "string" && q.trim().length > 0) {
      const searchTerm = q.trim();
      // Use Prisma raw filter for FTS
      where.OR = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { conditionSpecific: { contains: searchTerm, mode: "insensitive" } },
        { eligibilitySummary: { contains: searchTerm, mode: "insensitive" } },
        { principalInvestigator: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const [trials, total] = await Promise.all([
      prisma.trial.findMany({
        where,
        include: {
          source: {
            select: { id: true, name: true, shortName: true },
          },
        },
        orderBy: [
          { enrollmentStatus: "asc" }, // recruiting first
          { lastChanged: "desc" },
        ],
        skip: offset,
        take: limitNum,
      }),
      prisma.trial.count({ where }),
    ]);

    res.json({
      data: {
        trials,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      error: null,
    });
  } catch (error) {
    console.error("[API] GET /trials error:", error);
    res.status(500).json({
      data: null,
      error: "Failed to fetch trials",
    });
  }
});

// GET /api/trials/:id — single trial detail
trialsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ data: null, error: "Invalid trial ID" });
      return;
    }

    const trial = await prisma.trial.findUnique({
      where: { id },
      include: {
        source: {
          select: { id: true, name: true, shortName: true, url: true },
        },
      },
    });

    if (!trial) {
      res.status(404).json({ data: null, error: "Trial not found" });
      return;
    }

    res.json({ data: trial, error: null });
  } catch (error) {
    console.error("[API] GET /trials/:id error:", error);
    res.status(500).json({ data: null, error: "Failed to fetch trial" });
  }
});
