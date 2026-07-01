import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// In-memory session store. Sessions expire after 24 hours.
const sessions = new Map<string, { createdAt: number }>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function createSession(): string {
  // Clean expired sessions
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(token);
    }
  }
  const token = crypto.randomUUID();
  sessions.set(token, { createdAt: now });
  return token;
}

export function invalidateSession(token: string): void {
  sessions.delete(token);
}

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    res.status(500).json({ data: null, error: "Admin authentication not configured" });
    return;
  }

  // Accept either Bearer token (session) or X-Admin-Secret header (legacy)
  const authHeader = req.headers.authorization;
  const legacyHeader = req.headers["x-admin-secret"];

  if (typeof legacyHeader === "string" && legacyHeader.length === secret.length && crypto.timingSafeEqual(Buffer.from(legacyHeader), Buffer.from(secret))) {
    next();
    return;
  }

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const session = sessions.get(token);
    if (session && Date.now() - session.createdAt < SESSION_TTL_MS) {
      next();
      return;
    }
  }

  res.status(401).json({ data: null, error: "Unauthorized" });
}
