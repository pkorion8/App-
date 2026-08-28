#!/usr/bin/env bash
set -euo pipefail

action="apps/web/src/app/billing/actions.ts"
page="apps/web/src/app/billing/page.tsx"

if [[ ! -f "$action" || ! -f "$page" ]]; then
  echo "Billing checkout files are missing" >&2
  exit 1
fi

# Checkout must refuse to create a second subscription when the workspace
# already has a live/non-terminal Stripe subscription. The UI hides the
# upgrade button for Pro users, but the server action must enforce this too.
grep -q 'function hasExistingPaidSubscription' "$action" || {
  echo "Billing checkout must have a server-side duplicate-subscription guard" >&2
  exit 1
}

grep -q 'if (hasExistingPaidSubscription(billing))' "$action" || {
  echo "Checkout must call the duplicate-subscription guard before creating a Stripe session" >&2
  exit 1
}

grep -q 'redirect("/billing?error=already_subscribed")' "$action" || {
  echo "Duplicate subscription attempts must return to Billing without creating another checkout" >&2
  exit 1
}

grep -q 'stripe_subscription_id' "$action" || {
  echo "Duplicate-subscription guard must consider the persisted Stripe subscription id" >&2
  exit 1
}

grep -q 'already_subscribed:' "$page" || {
  echo "Billing page must explain why a duplicate checkout was blocked" >&2
  exit 1
}

echo "Stripe checkout duplicate-subscription contract OK"
