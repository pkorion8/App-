#!/usr/bin/env bash
set -euo pipefail

python3 - <<'PY'
from pathlib import Path

action = Path("apps/web/src/app/venture/[id]/monitor/actions.ts").read_text()

required = [
    'const { data: venture, error: ventureError }',
    'if (ventureError)',
    'const { data: updatedVenture, error: statusError }',
    '.update({ status: "learning" })',
    '.select("id")',
    '.maybeSingle()',
    'if (statusError || !updatedVenture)',
    'Observation was saved, but the venture could not be moved into Learning.',
]

for token in required:
    if token not in action:
        raise SystemExit(f"monitor status-sync contract missing: {token}")

failure_check = action.index('if (statusError || !updatedVenture)')
success_log = action.index('logEvent({ event: "venture_outcome.logged"')
if failure_check > success_log:
    raise SystemExit("monitor success event must only be logged after venture status synchronization succeeds")

print("monitor status-sync contract passed")
PY
