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

outcome_insert = action.index('db.from("venture_outcomes").insert')
status_update = action.index('.update({ status: "learning" })')
failure_check = action.index('if (statusError || !updatedVenture)')
success_log = action.index('logEvent({ event: "venture_outcome.logged"')

if not (outcome_insert < status_update < failure_check < success_log):
    raise SystemExit(
        "monitor write ordering must remain outcome insert -> learning status sync -> failure check -> success event"
    )

print("monitor status-sync contract passed")
PY
