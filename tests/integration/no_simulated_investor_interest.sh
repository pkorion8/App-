#!/usr/bin/env bash
set -euo pipefail

committee_action="apps/web/src/app/venture/[id]/investor/committee/actions.ts"
committee_page="apps/web/src/app/venture/[id]/investor/committee/page.tsx"
deal_action="apps/web/src/app/venture/[id]/investor/deal/actions.ts"
deal_page="apps/web/src/app/venture/[id]/investor/deal/page.tsx"

if grep -q 'outcome.*conditional_interest' "$committee_action"; then
  echo "ERROR: Investor World must not persist simulated 'conditional interest' as investor interest."
  exit 1
fi

if ! grep -q 'negotiation_rehearsal_ready' "$committee_action"; then
  echo "ERROR: Committee progression must use explicit rehearsal-only outcome language."
  exit 1
fi

if ! grep -q 'not evidence that any real investor is interested' "$committee_page"; then
  echo "ERROR: Committee UI must keep the real-investor-interest boundary visible."
  exit 1
fi

if ! grep -q 'not a real investor offer or transaction' "$deal_action"; then
  echo "ERROR: Deal outcomes must remain explicitly rehearsal-only in persisted session reasons."
  exit 1
fi

if ! grep -q 'Nothing on this page is a real investor offer' "$deal_page"; then
  echo "ERROR: Deal Lab must visibly state that simulated terms are not a real investor offer."
  exit 1
fi

if grep -q '>Accept simulated terms<' "$deal_page"; then
  echo "ERROR: Deal Lab acceptance copy must be framed as a rehearsal action, not an offer acceptance."
  exit 1
fi

echo "Investor rehearsal source-truth guard passed."
