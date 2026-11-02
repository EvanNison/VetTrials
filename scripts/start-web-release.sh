#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Keep normal backend initialization, including its persisted scheduler
# configuration. Never populate the database or trigger a scrape at startup.
cd "$APP_ROOT/backend"
BACKEND_PORT=8080 node node_modules/.bin/tsx src/api/server.ts &
BACKEND_PID=$!

cd "$APP_ROOT/frontend"
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}" npm run start &
FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 143' TERM
trap 'exit 130' INT

wait -n "$BACKEND_PID" "$FRONTEND_PID"
