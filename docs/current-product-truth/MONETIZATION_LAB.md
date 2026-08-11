# Monetization Lab

## Scope clarification

Monetization Lab is now a **newly required first-class module**. There is no standalone screen, experiment data model, or downstream experiment integration in the current repository. Current monetization still exists in two separate partial domains:

1. the founder's venture pricing choice and simulated revenue; and
2. Venture Sandbox's own Free/Pro billing.

It sits naturally between Shape and Simulate without adding clutter to default top-level venture navigation.

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

Monetization Lab must provide market-aware Monetization Intelligence rather than a generic paywall suggestion page.

### Context inputs

It may use region/country, category, audience, product function and usage frequency, competitor pricing/paywall patterns, pricing-related reviews, similar-app monetization, acquisition channel, AI/API and infrastructure costs, Shape pricing model, simulation behavior, and later real outcomes. Missing inputs must remain explicit rather than inferred as fact.

### Experiment output

It should produce context-aware experiments including monthly vs annual, subscription vs credits, free-result limits, trial vs no trial, first-value moment before paywall, regional pricing, one-time vs recurring, feature gating, and usage gating.

Every experiment must persist:

- hypothesis;
- why it fits this venture;
- supporting evidence;
- assumptions and unknowns; and
- the metric that determines the winner.

Experiments must feed Simulator behavior. After launch, real experiment outcomes must feed Learn and later recalibrate simulations and recommendations.

The inspiration pattern is historical experiments → pattern extraction → suggested experiment → real outcome → learning loop, applied at broader venture/market context rather than copied as a paywall-only product.

### Trust boundary

Competitor prices, patterns, reviews, and outcomes require evidence provenance. The module must not fabricate conversion, competitor revenue, or experiment lift. Founder-selected pricing intent, research evidence, simulator assumptions, and real results must remain distinguishable.

## Future architecture boundary

Founder venture economics and Venture Sandbox SaaS billing remain separate concepts and data flows. Monetization experiments need venture-scoped persistence and must not overload workspace billing tables or treat competitor estimates as verified revenue. Specific schema, algorithms, and model providers remain implementation decisions.
