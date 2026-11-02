#!/bin/sh
set -eu
TASK_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$TASK_ROOT/frontend"
if lsof -nP -iTCP:3349 -sTCP:LISTEN >/dev/null 2>&1; then
  echo 'Port3349 already has a listener; use the owned QA review instead of starting another.' >&2
  exit 1
fi
for candidate in .env .env.local .env.development .env.development.local; do
  if [ -f "$candidate" ]; then echo 'Credential/environment file found; refusing isolated review.' >&2; exit 1; fi
done
# Next16 dev uses .next/dev, isolated from the prior production review on3348.
exec env -i PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/tmp}" NODE_ENV=development NEXT_TELEMETRY_DISABLED=1 \
  node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3349
