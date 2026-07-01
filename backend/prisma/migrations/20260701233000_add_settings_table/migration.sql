-- The schema uses settings for persisted scheduler configuration and runtime
-- scrape locks. Older Replit deploys created this via `prisma db push`; keep
-- this idempotent so migrate deploy can adopt those databases safely.
CREATE TABLE IF NOT EXISTS "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);
