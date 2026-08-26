#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"
BASE_URL="http://127.0.0.1:${PORT}"
LOG_FILE="${TMPDIR:-/tmp}/sim-venture-next.log"

pnpm --filter @venture-sandbox/web exec next start -p "${PORT}" >"${LOG_FILE}" 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "${SERVER_PID}" 2>/dev/null || true
  wait "${SERVER_PID}" 2>/dev/null || true
}
trap cleanup EXIT

ready=0
for _ in $(seq 1 30); do
  if curl --silent --show-error --fail --max-time 3 "${BASE_URL}/" >/dev/null; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "${ready}" -ne 1 ]]; then
  echo "Production server did not become ready."
  cat "${LOG_FILE}"
  exit 1
fi

# Keep this smoke test intentionally source-free and database-free. It checks
# only launch-critical pages that must render safely without production secrets
# or seeded ventures. Explore is called without a query so no live provider is
# contacted and CI cannot become dependent on a third-party network response.
routes=(
  "/"
  "/sign-in"
  "/explore"
  "/dashboard"
)

for route in "${routes[@]}"; do
  status="$(curl --silent --show-error --location --output /dev/null --write-out '%{http_code}' --max-time 10 "${BASE_URL}${route}")"
  if [[ "${status}" -lt 200 || "${status}" -ge 400 ]]; then
    echo "Smoke test failed for ${route}: HTTP ${status}"
    cat "${LOG_FILE}"
    exit 1
  fi
  echo "${route} -> HTTP ${status}"
done
