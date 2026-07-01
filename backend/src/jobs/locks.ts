import crypto from "crypto";
import prisma from "../db/client.js";

interface LockHandle {
  key: string;
  value: string;
}

const LOCK_PREFIX = "lock:";

export async function acquireLock(
  key: string,
  ttlMs: number
): Promise<LockHandle | null> {
  const lockKey = LOCK_PREFIX + key;
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const value = JSON.stringify({ token, expiresAt });

  const rows = await prisma.$queryRaw<Array<{ key: string }>>`
    INSERT INTO settings (key, value, updated_at)
    VALUES (${lockKey}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value,
          updated_at = NOW()
      WHERE (settings.value::jsonb->>'expiresAt')::timestamptz < NOW()
    RETURNING key
  `;

  return rows.length > 0 ? { key: lockKey, value } : null;
}

export async function releaseLock(lock: LockHandle | null): Promise<void> {
  if (!lock) return;

  await prisma.setting.deleteMany({
    where: {
      key: lock.key,
      value: lock.value,
    },
  });
}
