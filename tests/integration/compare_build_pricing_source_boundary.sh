#!/usr/bin/env bash
set -euo pipefail

COMPARE_FILE="apps/web/src/app/venture/[id]/compare/page.tsx"
DASHBOARD_FILE="apps/web/src/app/dashboard/page.tsx"

if grep -q 'from("build_packages")' "$COMPARE_FILE"; then
  echo "Compare must not read Build Studio pricing while vendor pricing is not connected."
  exit 1
fi

if grep -Eq 'Estimated monthly build cost|build-cost estimates|cost_estimate|monthlyCost|totalMonthly' "$COMPARE_FILE" "$DASHBOARD_FILE"; then
  echo "Compare/dashboard reintroduced legacy or unsourced Build pricing language/data."
  exit 1
fi

grep -q 'Vendor pricing is not connected' "$COMPARE_FILE"

echo "Compare Build-pricing source boundary OK"
