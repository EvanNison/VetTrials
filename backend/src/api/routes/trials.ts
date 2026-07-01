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

    // Build WHERE clauses and params for raw SQL
    const conditions: string[] = ["t.is_active = true"];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Species filter (array overlap)
    if (species && typeof species === "string") {
      const speciesArr = species.split(",").map((s) => s.trim().toLowerCase());
      conditions.push(`t.species && $${paramIndex}::text[]`);
      params.push(speciesArr);
      paramIndex++;
    }

    // Condition category filter
    if (condition && typeof condition === "string") {
      const condArr = condition.split(",").map((c) => c.trim().toLowerCase());
      conditions.push(`t.condition_category = ANY($${paramIndex}::text[])`);
      params.push(condArr);
      paramIndex++;
    }

    // Enrollment status filter
    if (status && typeof status === "string") {
      const statusArr = status.split(",").map((s) => s.trim().toLowerCase());
      conditions.push(`t.enrollment_status = ANY($${paramIndex}::text[])`);
      params.push(statusArr);
      paramIndex++;
    }

    // State filter
    if (state && typeof state === "string") {
      conditions.push(`t.location_state = $${paramIndex}`);
      params.push(state.toUpperCase());
      paramIndex++;
    }

    // Institution filter
    if (institution && typeof institution === "string") {
      conditions.push(`t.source_id = $${paramIndex}`);
      params.push(parseInt(institution, 10));
      paramIndex++;
    }

    // Full-text search
    if (q && typeof q === "string" && q.trim().length > 0) {
      const searchTerm = `%${q.trim()}%`;
      conditions.push(`(t.title ILIKE $${paramIndex} OR t.condition_specific ILIKE $${paramIndex} OR t.eligibility_summary ILIKE $${paramIndex} OR t.principal_investigator ILIKE $${paramIndex})`);
      params.push(searchTerm);
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    // Count query (uses same WHERE)
    const countQuery = `SELECT COUNT(*)::int as total FROM trials t WHERE ${whereClause}`;

    // Main query with proper enrollment status sort order
    const mainQuery = `
      SELECT t.*,
        json_build_object('id', s.id, 'name', s.name, 'shortName', s.short_name) as source
      FROM trials t
      JOIN sources s ON s.id = t.source_id
      WHERE ${whereClause}
      ORDER BY
        CASE t.enrollment_status
          WHEN 'recruiting' THEN 1
          WHEN 'enrolled' THEN 2
          WHEN 'unknown' THEN 3
          WHEN 'suspended' THEN 4
          WHEN 'completed' THEN 5
          WHEN 'removed' THEN 6
          ELSE 7
        END ASC,
        t.last_changed DESC NULLS LAST
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const mainParams = [...params, limitNum, offset];
    const countParams = [...params];

    const [trialsRaw, countRaw] = await Promise.all([
      prisma.$queryRawUnsafe(mainQuery, ...mainParams) as Promise<Record<string, unknown>[]>,
      prisma.$queryRawUnsafe(countQuery, ...countParams) as Promise<Array<{ total: number }>>,
    ]);

    const total = countRaw[0]?.total ?? 0;

    // Map snake_case columns to camelCase to match Prisma output shape
    const trials = trialsRaw.map((row) => ({
      id: row.id,
      sourceId: row.source_id,
      source: row.source,
      title: row.title,
      sourceUrl: row.source_url,
      avmaRegistryId: row.avma_registry_id,
      species: row.species,
      conditionCategory: row.condition_category,
      conditionSpecific: row.condition_specific,
      enrollmentStatus: row.enrollment_status,
      eligibilitySummary: row.eligibility_summary,
      eligibilityDetails: row.eligibility_details,
      principalInvestigator: row.principal_investigator,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      financialInfo: row.financial_info,
      locationCity: row.location_city,
      locationState: row.location_state,
      locationLat: row.location_lat,
      locationLng: row.location_lng,
      firstSeen: row.first_seen,
      lastSeen: row.last_seen,
      lastChanged: row.last_changed,
      isActive: row.is_active,
      contentHash: row.content_hash,
      rawExtraction: row.raw_extraction,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

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
    const id = parseInt(String(req.params.id), 10);
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
