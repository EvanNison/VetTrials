#!/bin/bash
set -e

ROOT="/home/runner/workspace"

echo "[SCRAPE BUILD] Installing backend dependencies..."
cd "$ROOT/backend"
npm ci --no-audit --no-fund

echo "[SCRAPE BUILD] Installing Playwright Chromium..."
npx playwright install chromium 2>&1 || echo "[SCRAPE BUILD] WARNING: Playwright Chromium install failed"

echo "[SCRAPE BUILD] Generating Prisma client..."
node node_modules/prisma/build/index.js generate

echo "[SCRAPE BUILD] Applying database migrations..."
if ! node node_modules/prisma/build/index.js migrate deploy; then
  echo "[SCRAPE BUILD] migrate deploy failed; falling back to non-destructive db push..."
  node node_modules/prisma/build/index.js db push
fi

echo "[SCRAPE BUILD] Seeding institution sources..."
node node_modules/.bin/tsx src/db/seed.ts

echo "[SCRAPE BUILD] Done."
