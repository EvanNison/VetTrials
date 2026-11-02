#!/usr/bin/env bash
set -euo pipefail

# Web releases use the existing database as-is. Database maintenance and
# scheduled scraping have their own workflows.
APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$APP_ROOT/backend"
npm ci --include=dev --no-audit --no-fund
npx playwright install --with-deps chromium 2>&1 || {
  npx playwright install chromium
}
node node_modules/prisma/build/index.js generate

cd "$APP_ROOT/frontend"
npm ci --include=dev --no-audit --no-fund
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}" npm run build
