#!/bin/sh
set -eu
TASK_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$TASK_ROOT/frontend"
if lsof -nP -iTCP:3348 -sTCP:LISTEN >/dev/null 2>&1; then
  echo 'Port 3348 is already in use. Use the running review or stop its owner first.' >&2
  exit 1
fi
if [ ! -f ../review/fixtures.json ]; then echo 'Missing local review/fixtures.json snapshot.' >&2; exit 1; fi
for candidate in .env .env.local .env.production .env.production.local; do
  if [ -f "$candidate" ]; then echo 'Remove environment files from this isolated review checkout before starting.' >&2; exit 1; fi
done
# No inherited credentials, database URLs, analytics IDs, scheduler or API destinations.
exec env -i PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/tmp}"   NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 /bin/sh -ec '
  npm ci --include=dev --ignore-scripts --no-audit --no-fund
  npm run build
  exec node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3348
'
