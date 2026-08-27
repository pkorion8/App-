#!/usr/bin/env bash
set -euo pipefail

route="apps/web/src/app/api/webhooks/stripe/route.ts"

if [[ ! -f "$route" ]]; then
  echo "Stripe webhook route not found: $route" >&2
  exit 1
fi

# Verified Stripe events must not be acknowledged after a failed/no-op billing
# database mutation. A non-2xx response is what causes Stripe to retry delivery.
grep -q 'event: "billing.webhook_sync_failed"' "$route" || {
  echo "Stripe webhook must log billing sync failures" >&2
  exit 1
}

grep -q 'status: 500' "$route" || {
  echo "Stripe webhook sync failures must return a retryable non-2xx status" >&2
  exit 1
}

# Mutations need returned rows so a zero-row update cannot be mistaken for a
# successful synchronization.
select_count="$(grep -c '\.select("workspace_id")' "$route" || true)"
if [[ "$select_count" -lt 3 ]]; then
  echo "All launch billing mutations must verify that a billing account was updated" >&2
  exit 1
fi

# Keep successful business events behind mutation checks; this guard prevents
# a regression to fire-and-forget updates that silently lose paid state.
grep -q 'if (error || !data?.length)' "$route" || {
  echo "Stripe webhook must fail when persistence errors or matches no billing row" >&2
  exit 1
}

# Checkout completion is not always equivalent to settled payment when delayed
# payment methods are enabled. Do not unlock Pro on an unpaid completion; wait
# for Stripe's async success event instead. Trials/no-payment-required sessions
# can still pass through the normal activation path.
grep -q 'case "checkout.session.async_payment_succeeded"' "$route" || {
  echo "Stripe webhook must handle async checkout payment success" >&2
  exit 1
}

grep -q 'session.payment_status === "unpaid"' "$route" || {
  echo "Stripe webhook must gate Pro access when checkout payment is still unpaid" >&2
  exit 1
}

grep -q 'event: "billing.checkout_payment_pending"' "$route" || {
  echo "Stripe webhook must record pending checkout payment without granting access" >&2
  exit 1
}

echo "Stripe webhook retry/payment-settlement contract OK"
