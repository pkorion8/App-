#!/usr/bin/env bash
set -euo pipefail

FILE="apps/web/src/app/dashboard/page.tsx"

if ! grep -q 'from("workspace_members")' "$FILE"; then
  echo "Dashboard must resolve the signed-in user's workspace before listing ventures."
  exit 1
fi

if ! grep -q '\.eq("user_id", user.id)' "$FILE"; then
  echo "Dashboard workspace lookup must be scoped to the authenticated user."
  exit 1
fi

if ! grep -q '\.eq("workspace_id", workspaceId)' "$FILE"; then
  echo "Dashboard venture query must be explicitly scoped to the resolved workspace."
  exit 1
fi

echo "Dashboard workspace scope contract passed."
