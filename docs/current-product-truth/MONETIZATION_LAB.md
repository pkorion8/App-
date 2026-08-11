# Monetization Lab

## Scope clarification

There is no standalone Monetization Lab screen or module in the current repository. Monetization currently exists in two separate domains:

1. the founder's venture pricing choice and simulated revenue; and
2. Venture Sandbox's own Free/Pro billing.

This document names that current boundary. It does not invent a new Monetization Lab requirement.

## Venture monetization: implemented

Shape stores one optional founder-selected pricing model:

- subscription;
- one-time purchase;
- marketplace/commission; or
- ad-supported.

When a simulation starts, the selection is copied onto the run and controls one of four fixed revenue formulas described in `SIMULATOR.md`. If no selection exists, subscription is used as the compatibility default.

## Venture monetization: partial

- Shape captures the model, not an actual price, conversion rate, commission percentage, ad yield, tier structure, free trial, or unit economics.
- Simulator constants are fixed and not editable by the founder.
- Research does not provide competitor monetization or revenue because no viable source is connected.
- Build Studio detects payment-related keywords and may add Stripe to the backlog, but does not read the selected pricing model.
- Compare does not show pricing model or monetization outcomes as a dedicated dimension.
- Monitor can record revenue and cost manually, but does not calculate margin, LTV, CAC, payback, or variance from simulation.

These are implementation gaps, not automatically approved product requirements.

## Venture Sandbox billing: implemented

- Every new personal workspace receives a Free billing account.
- `/pricing` advertises Free and labels Pro as coming soon.
- `/billing` displays current plan/status.
- When Stripe configuration exists, Free workspaces can start subscription Checkout.
- Pro workspaces with a Stripe customer can open the customer portal.
- Signed Stripe webhooks update plan, customer, subscription, and status data.
- RLS prevents ordinary workspace members from writing billing-account upgrades.

## Venture Sandbox billing: partial

- The handoff records Stripe as code-complete but not live-tested.
- Required Stripe and service-role environment configuration is external to the repository.
- No public Pro price is committed in the UI.
- No application feature checks enforce Free versus Pro behavior.
- `usage_ledger` has schema only and no writers/readers.
- Pricing-page promises such as higher refresh limits are not enforced.
- There is no billing test suite covering Checkout, portal, webhook idempotency, or entitlement changes.

## Newly required

None recorded yet. Any post-Claude monetization requirement must first be entered in `POST_CLAUDE_DELTA.md`.

## Future architecture boundary

Founder venture economics and Venture Sandbox SaaS billing must remain separate concepts and data flows. A future Monetization Lab, if explicitly required, should not overload workspace billing tables or treat competitor estimates as verified revenue. No detailed future design is approved in this baseline.
