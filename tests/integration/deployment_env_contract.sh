#!/usr/bin/env bash
set -euo pipefail

ENV_EXAMPLE=".env.example"
CRON_ROUTE="apps/web/src/app/api/cron/creator-intelligence/route.ts"
VERCEL_CONFIG="apps/web/vercel.json"

fail() {
  echo "Deployment environment contract failed: $1" >&2
  exit 1
}

for file in "$ENV_EXAMPLE" "$CRON_ROUTE" "$VERCEL_CONFIG"; do
  [[ -f "$file" ]] || fail "missing $file"
done

# Keep every production variable used by the scheduled integration discoverable
# without putting real secrets in CI or the repository.
required_documented_vars=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  NEXT_PUBLIC_SITE_URL
  CRON_SECRET
  SUPABASE_SERVICE_ROLE_KEY
  YOUTUBE_API_KEY
)

for var in "${required_documented_vars[@]}"; do
  grep -Eq "^${var}=" "$ENV_EXAMPLE" || fail "$var is used by deployment but missing from .env.example"
done

# Server credentials must never be renamed into browser-exposed NEXT_PUBLIC vars.
if grep -Eq '^NEXT_PUBLIC_(CRON_SECRET|SUPABASE_SERVICE_ROLE_KEY|YOUTUBE_API_KEY)=' "$ENV_EXAMPLE"; then
  fail "server-only creator-intelligence credential is exposed as NEXT_PUBLIC"
fi

# The scheduled endpoint must remain protected. Vercel sends this bearer header
# when CRON_SECRET is configured in the deployment environment.
grep -Fq 'process.env.CRON_SECRET' "$CRON_ROUTE" || fail "cron route no longer requires CRON_SECRET"
grep -Fq 'authHeader !== `Bearer ${cronSecret}`' "$CRON_ROUTE" || fail "cron route bearer validation is missing"

# Prevent the deployment schedule from silently drifting away from the protected route.
grep -Fq '"path": "/api/cron/creator-intelligence"' "$VERCEL_CONFIG" || fail "Vercel cron path is missing or changed"

# The write-capable service-role key and external discovery key should only be
# read from server-side process.env in this route, never hard-coded.
grep -Fq 'process.env.SUPABASE_SERVICE_ROLE_KEY' "$CRON_ROUTE" || fail "cron service-role env lookup is missing"
grep -Fq 'process.env.YOUTUBE_API_KEY' "$CRON_ROUTE" || fail "cron YouTube API env lookup is missing"

echo "Deployment environment contract OK"
