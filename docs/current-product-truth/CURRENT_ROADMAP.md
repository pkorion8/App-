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

## Existing gaps identified before the delta

The implementation audit identified these gaps. The priority sections below now promote several of them into accepted work; any remainder still requires explicit prioritization:

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

The Post-Claude delta has been accepted and is preserved in `POST_CLAUDE_DELTA.md`.

## Priority 0 — presentation-ready working prototype

Target: **within the next couple of days from the 2026-08-11 delta**.

The first delivery is a coherent, responsive, externally presentable web experience using the production venture model. It must have working major links/CTAs, no dead navigation, a consistent calm visual system, honest live/demo/unavailable states, and a connected Idea → Clarify → Understand → Shape → Monetize → Simulate → Build → Learn story.

Required presentation coverage:

- Home, My Ideas, Explore, idea entry, and clarification;
- research progress/summary, competitors, reviews, Creator/YouTube intelligence, Technology & Ownership, and Evidence Explorer;
- Shape V1, Compare, and Monetization Lab;
- simulation setup, build, launch, first users, retention, market event, and Month 1;
- Build Studio and Learn/Monitor;
- System View and relevant account/plans/methodology surfaces.

Existing screens should be reused where truthful. Missing production-depth integrations may use representative states only when explicitly labeled demo, partial, credential-required, unavailable, or future. Presentation work must not claim state changes or downstream connections that do not exist.

## Priority 1 — continuity and first-class Monetization

- Establish one persisted venture context and reuse known values across modules.
- Stop repeated audience/geography entry.
- Add Monetization Lab experiments with evidence/assumption provenance and Simulator inputs.
- Make Creator Intelligence venture-relevant.
- Align venture navigation and next actions to the canonical journey.
- Make Build recommendations distinguish evidence-backed, heuristic, and default/reference content.

## Priority 2 — evidence and intelligence depth

- Implement the answer → synthesis → finding → evidence → source model.
- Add honest Review Intelligence and Technology & Ownership Intelligence through replaceable adapters.
- Expand Compare toward its three required modes and equivalent evidence dimensions.
- Connect creator evidence into downstream modules.
- Add source freshness, contradictions, claim typing, and uncertainty.

## Priority 3 — persistent simulation and learning loop

- Deepen simulator state and venture-context inputs without a universal success score.
- Add selectable/comparable alternative timelines.
- Feed Monetization experiments into runs.
- Preserve SIMULATED versus REAL outcome labeling.
- Use real outcomes to recalibrate later recommendations only when supported by persisted evidence and explicit methodology.
- Add automated monitoring candidates for competitors, creator signals, technology, and market changes.

## Future architecture

Temporal/orchestration, multi-agent specialist fan-out/fan-in, and multi-model routing remain future architecture rather than launch dependencies. Workflow boundaries should stay replaceable and free-first.

## Next decision gate

Before application implementation, translate Priority 0 into a screen-by-screen prototype plan that identifies which states are backed by current actions, which require new persisted behavior, and which are honest presentation-only demo/unavailable states. No application change is part of this documentation commit.
