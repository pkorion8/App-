#!/usr/bin/env bash
set -euo pipefail

RESEARCH_ACTION="apps/web/src/app/venture/[id]/research/actions.ts"

if grep -q 'generateDemoFindings' "$RESEARCH_ACTION"; then
  echo "ERROR: production Research action must not generate or persist demo findings" >&2
  exit 1
fi

if grep -Eq 'is_demo:[[:space:]]*true|isDemo:[[:space:]]*true' "$RESEARCH_ACTION"; then
  echo "ERROR: production Research action must not mark newly persisted findings as demo/synthetic" >&2
  exit 1
fi

if ! grep -q 'Only persist findings returned by connected live sources' "$RESEARCH_ACTION"; then
  echo "ERROR: expected explicit live-source persistence boundary in Research action" >&2
  exit 1
fi

echo "Research persistence guard passed: production flow stores only connected live-source findings."
