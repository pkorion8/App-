#!/usr/bin/env bash
set -euo pipefail

TARGET='apps/web/src/app/venture/[id]/simulate/actions.ts'

if grep -q 'from("build_packages")' "$TARGET"; then
  echo 'Simulator must not read Build Studio cost estimates while vendor pricing is not connected.' >&2
  exit 1
fi

if grep -q 'Build Studio estimates \$' "$TARGET"; then
  echo 'Simulator must not present unsourced Build Studio pricing as a current estimate.' >&2
  exit 1
fi

if ! grep -q 'estimatedMonthlyCost: null' "$TARGET"; then
  echo 'New simulation market context must keep Build pricing neutral/unpriced.' >&2
  exit 1
fi

if ! grep -q 'vendor pricing is not connected' "$TARGET"; then
  echo 'Simulator must state the Build pricing source boundary explicitly.' >&2
  exit 1
fi

echo 'Simulator Build pricing source boundary OK.'
