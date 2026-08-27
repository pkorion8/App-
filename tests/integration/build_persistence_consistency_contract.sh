#!/usr/bin/env bash
set -euo pipefail

python3 - <<'PY'
from pathlib import Path

action = Path("apps/web/src/app/venture/[id]/build/actions.ts").read_text()

required = [
    'const { data: venture, error: ventureError }',
    'if (ventureError)',
    'const { error: packageError }',
    'if (packageError)',
    'const { data: updatedVenture, error: statusError }',
    '.update({ status: "build_ready" })',
    '.select("id")',
    '.maybeSingle()',
    'if (statusError || !updatedVenture)',
    'The build package was saved, but the venture could not be moved to Build Ready.',
    'metadata: { pricing_status: "not_connected" }',
]

for token in required:
    if token not in action:
        raise SystemExit(f"build persistence contract missing: {token}")

package_insert = action.index('.from("build_packages").insert')
package_failure = action.index('if (packageError)')
status_update = action.index('.update({ status: "build_ready" })')
status_failure = action.index('if (statusError || !updatedVenture)')
success_log = action.index('event: "build_package.generated"')

if not (package_insert < package_failure < status_update < status_failure < success_log):
    raise SystemExit(
        "build write ordering must remain package insert -> insert failure check -> build_ready sync -> sync failure check -> success event"
    )

if "total_monthly_cost" in action:
    raise SystemExit("Build Studio must not log unsourced total_monthly_cost metadata")

print("build persistence consistency contract passed")
PY
