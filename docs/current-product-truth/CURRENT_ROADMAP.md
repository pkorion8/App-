# Current Roadmap

Status date: 2026-08-11

## How to read this roadmap

This roadmap distinguishes repository-backed completion, operational work already called out by the handoff, implementation gaps, and future work that requires a product delta. It is not a speculative feature backlog.

## Completed baseline

- Foundation: monorepo, Supabase auth, personal workspaces, venture creation, RLS.
- Public surfaces: landing, pricing, sign-in, dashboard, branded error/not-found pages.
- Shape V1 with structured founder brief and pricing model.
- Research V1 with explicit evidence states/demo provenance and three live adapters.
- Creator Intelligence V1 infrastructure and scheduled route.
- Simulator V1 with deterministic stages, decisions, charts, checkpoints, research/build context, and four revenue models.
- Build Studio V1 rule-based generator.
- Compare V1 for selected latest venture outputs.
- Monitor V1 for manual actual-outcome tracking.
- Billing V1 code for Stripe Checkout, portal, and webhooks.
- CI with unit tests, build checks, and an RLS smoke test.

## Operational work already identified

These items come directly from `AGENTS.md`, not from new product invention:

1. Apply migrations `0007_competitor_snapshots.sql` through `0010_pricing_model.sql` to the live Supabase database if they remain unapplied.
2. Configure a Stripe test-mode account and required environment variables.
3. Verify billing Checkout, portal, and webhook behavior end to end.
4. Verify the GitHub research adapter from the deployed environment.
5. Verify or reassess the experimental YouTube transcript connector in its real deployment environment.

## Documentation stabilization

This commit establishes the authoritative current-product-truth folder. Older status files remain untouched but are no longer reliable where they conflict with this folder or implementation.

Future documentation work, after accepting the product delta:

- reconcile the delta into each module truth document;
- decide whether to update or retire stale top-level/package status READMEs;
- record architecture decisions that materially change the current boundaries;
- turn confirmed operational procedures into runbooks.

## Existing gaps requiring prioritization, not assumed approval

The implementation audit identified these gaps. They are candidates for product prioritization, not automatically scheduled requirements:

- reuse structured Shape context consistently downstream;
- connect Creator Intelligence evidence to ventures;
- provide simulation run/branch navigation and comparison;
- enforce or simplify venture lifecycle statuses;
- reconcile actual Monitor outcomes with projections;
- determine whether comparison persistence and usage ledger are needed;
- decide whether research should move to background jobs;
- add browser E2E, billing integration, and research-quality test coverage;
- resolve the difference between public Free/Pro promises and actual entitlements;
- establish source freshness, contradiction, and evidence-synthesis policies;
- bring operational/configuration documentation in line with deployed code.

## Newly required work

None recorded yet. The product owner has stated that a post-Claude product delta will be supplied next. That delta must be captured in `POST_CLAUDE_DELTA.md` before this roadmap assigns it status or sequence.

## Future architecture

No specific future architecture is scheduled in this baseline. Architecture work will follow accepted requirements, with current constraints documented in `TECHNICAL_ARCHITECTURE.md`.

## Next decision gate

Receive and classify the product-owner delta into:

- retain current behavior;
- change current behavior;
- newly required;
- deferred/rejected; and
- open decision.

Only after that reconciliation should application implementation begin.
