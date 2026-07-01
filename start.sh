#!/bin/bash
set -e

ROOT="/home/runner/workspace"

echo "[START] Starting VetTrials backend on port 8080..."
cd "$ROOT/backend"
BACKEND_PORT=8080 node node_modules/.bin/tsx src/api/server.ts &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 5

# Check if database needs populating — run scraper fully detached so it
# doesn't interfere with the wait below when it eventually finishes
echo "[START] Checking database population..."
TRIAL_COUNT=$(curl -s http://localhost:8080/api/stats 2>/dev/null | grep -o '"activeTrials":[0-9]*' | grep -o '[0-9]*' || echo "0")
echo "[START] Active trials in database: $TRIAL_COUNT"

if [ -z "$TRIAL_COUNT" ] || [ "$TRIAL_COUNT" = "0" ]; then
  echo "[START] Database is empty — launching background scrape (detached)..."
  nohup node "$ROOT/backend/node_modules/.bin/tsx" "$ROOT/backend/src/scrapers/scrape-all.ts" >> /tmp/scrape.log 2>&1 &
  disown
  echo "[START] Scrape running detached. Tail /tmp/scrape.log for progress."
else
  echo "[START] Database has $TRIAL_COUNT trials — skipping initial scrape."
fi

echo "[START] Starting VetTrials frontend on port 3000..."
cd "$ROOT/frontend"
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}" npm run start &
FRONTEND_PID=$!

echo "[START] Both services running. Backend PID=$BACKEND_PID, Frontend PID=$FRONTEND_PID"

# Wait for the backend OR frontend to exit (not the scraper)
wait -n $BACKEND_PID $FRONTEND_PID
echo "[START] A core service exited — shutting down..."
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
