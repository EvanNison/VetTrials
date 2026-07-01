#!/bin/bash
set -e

ROOT="/home/runner/workspace"

echo "[BUILD] Installing backend dependencies..."
cd "$ROOT/backend"
npm ci --no-audit --no-fund

echo "[BUILD] Installing Playwright Chromium + system deps..."
npx playwright install --with-deps chromium 2>&1 || {
  echo "[BUILD] playwright install --with-deps failed, trying without deps..."
  npx playwright install chromium 2>&1 || echo "[BUILD] WARNING: Playwright Chromium install failed"
}

echo "[BUILD] Generating Prisma client..."
node node_modules/prisma/build/index.js generate

echo "[BUILD] Applying database migrations..."
if ! node node_modules/prisma/build/index.js migrate deploy; then
  echo "[BUILD] migrate deploy failed; falling back to non-destructive db push for existing Replit database..."
  node node_modules/prisma/build/index.js db push
fi

echo "[BUILD] Seeding institution sources..."
node node_modules/.bin/tsx src/db/seed.ts

echo "[BUILD] Installing frontend dependencies..."
cd "$ROOT/frontend"
npm ci --no-audit --no-fund

echo "[BUILD] Building Next.js frontend..."
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}" npm run build

echo "[BUILD] Done."
