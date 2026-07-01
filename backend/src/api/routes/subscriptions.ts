import { Router, type Request, type Response } from "express";
import { z } from "zod";
import prisma from "../../db/client.js";

export const subscriptionsRouter = Router();

const CreateSubscriptionSchema = z.object({
  email: z.string().email("Invalid email address"),
  speciesFilter: z.array(z.string()).optional().default([]),
  conditionFilter: z.array(z.string()).optional().default([]),
  stateFilter: z.array(z.string()).optional().default([]),
});

// POST /api/subscriptions — create alert subscription
subscriptionsRouter.post("/", async (req: Request, res: Response) => {
  try {
    if (process.env.ENABLE_EMAIL_ALERTS !== "true") {
      res.status(503).json({
        data: null,
        error: "Email alerts are not enabled yet.",
      });
      return;
    }

    const parsed = CreateSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        data: null,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }

    const { email, speciesFilter, conditionFilter, stateFilter } = parsed.data;

    const subscription = await prisma.subscription.create({
      data: {
        email: email.toLowerCase(),
        speciesFilter,
        conditionFilter,
        stateFilter,
      },
    });

    res.status(201).json({
      data: {
        id: subscription.id,
        email: subscription.email,
        message: "Subscription created. You'll receive email notifications for matching trials.",
      },
      error: null,
    });
  } catch (error) {
    console.error("[API] POST /subscriptions error:", error);
    res.status(500).json({
      data: null,
      error: "Failed to create subscription",
    });
  }
});

// GET /api/subscriptions/unsubscribe/:token
subscriptionsRouter.get(
  "/unsubscribe/:token",
  async (req: Request, res: Response) => {
    try {
      const token = String(req.params.token);
      const sub = await prisma.subscription.findUnique({
        where: { unsubscribeToken: token },
      });

      if (!sub) {
        res.status(404).json({ data: null, error: "Subscription not found" });
        return;
      }

      await prisma.subscription.update({
        where: { id: sub.id },
        data: { isActive: false },
      });

      res.json({
        data: { message: "Successfully unsubscribed." },
        error: null,
      });
    } catch (error) {
      console.error("[API] GET /unsubscribe error:", error);
      res.status(500).json({ data: null, error: "Failed to unsubscribe" });
    }
  }
);
