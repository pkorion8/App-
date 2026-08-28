#!/usr/bin/env bash
set -euo pipefail

FILE="apps/web/src/app/venture/[id]/actions.ts"

if ! grep -q 'from("workspace_members")' "$FILE"; then
  echo "Venture mutations must resolve the authenticated user's workspace."
  exit 1
fi

if ! grep -q '\.eq("user_id", user.id)' "$FILE"; then
  echo "Venture workspace lookup must be scoped to the authenticated user."
  exit 1
fi

if ! grep -q '\.eq("workspace_id", membership.workspace_id)' "$FILE"; then
  echo "Venture lookup must be explicitly scoped to the authenticated workspace."
  exit 1
fi

echo "Venture workspace scope contract passed."
