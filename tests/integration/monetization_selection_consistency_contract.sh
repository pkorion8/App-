#!/usr/bin/env bash
set -euo pipefail

FILE="apps/web/src/app/venture/[id]/monetization/actions.ts"

if [[ ! -f "$FILE" ]]; then
  echo "Missing monetization selection action: $FILE" >&2
  exit 1
fi

require() {
  local pattern="$1"
  local message="$2"
  if ! grep -Fq "$pattern" "$FILE"; then
    echo "$message" >&2
    exit 1
  fi
}

require 'if (experiment.pricingModelOverride && !shape)' \
  'Monetization must validate the venture-shape prerequisite before persisting a pricing-model override.'
require 'db.from("monetization_experiments").upsert' \
  'Monetization selection persistence is missing.'
require '.update({ pricing_model: experiment.pricingModelOverride })' \
  'Monetization pricing-model synchronization into venture_shapes is missing.'
require 'if (shapeError || !updatedShape)' \
  'Monetization must fail when the venture-shape synchronization fails or updates no row.'

precheck_line=$(grep -Fn 'if (experiment.pricingModelOverride && !shape)' "$FILE" | head -n1 | cut -d: -f1)
persist_line=$(grep -Fn 'db.from("monetization_experiments").upsert' "$FILE" | head -n1 | cut -d: -f1)

if (( precheck_line >= persist_line )); then
  echo 'Venture-shape prerequisite must be checked before monetization experiment persistence.' >&2
  exit 1
fi

echo 'Monetization selection consistency contract passed.'
