# Venture Sandbox: Current Product Truth

Status date: 2026-08-11
Repository baseline: commit `2285453` on `codex/venture-sandbox-takeover`

## Authority and scope

This folder is the authoritative repository-backed description of the current product. It supersedes older status claims in `README.md`, `CHANGELOG.md`, package READMEs, and reserved `docs/` pages when those claims conflict with implemented code.

This baseline records only:

- behavior present in the repository;
- limitations demonstrated by the implementation;
- operational facts recorded in `AGENTS.md`; and
- clearly identified integration or architecture boundaries.

The external master product specification is not in this repository. Requirements from it are not reconstructed here. Product changes supplied after this baseline belong in `POST_CLAUDE_DELTA.md` before they are merged into the other truth documents.

## Status vocabulary

- **Implemented:** code and persistence exist for the described behavior.
- **Partial:** a working V1 exists, but an important part of the represented flow is absent, static, heuristic, disconnected, or unverified.
- **Required, not yet implemented:** explicitly established by the repository handoff or a subsequently accepted product delta.
- **Future architecture:** an architectural direction or boundary, not a commitment to a specific feature or date.

## Product in one sentence

Venture Sandbox lets a signed-in founder record an idea, shape it, collect a mixture of live and explicitly labeled placeholder research, run a deterministic launch simulation, generate a heuristic build plan, compare ventures, and manually track real outcomes before or after spending real money.

## Current module truth

| Module | Status | Current truth |
| --- | --- | --- |
| Public landing and pricing | Implemented | Landing page describes the product; pricing shows Free and labels Pro as coming soon. |
| Authentication | Implemented | Supabase email magic-link authentication with protected application routes. |
| Workspace and ventures | Implemented | New users receive a personal workspace; users can create and open ventures. |
| Shape | Partial | Founder-authored brief persists audience, geography, problem, value proposition, MVP scope, differentiation, and pricing model. Only some fields feed later modules. |
| Research | Partial | Three live adapters can replace three of nine finding slots. Remaining slots are explicit demo/pending findings. |
| Creator Intelligence | Partial | Shared YouTube channel registry, scheduled discovery, experimental transcript retrieval, and heuristic claim extraction exist; claims are not consumed by venture modules. |
| Simulator | Partial | Deterministic staged simulation, decisions, history, research/build inputs, pricing models, checkpoints, and rewind exist. Scenario depth and run navigation are limited. |
| Build Studio | Partial | Rule-based build package generator persists a stack, backlog, and rough costs. The stack is fixed and personalization is keyword-based. |
| Compare | Partial | Compares two ventures using latest research, simulation, and build outputs. It does not compare the full venture context or simulation branches. |
| Monitor | Partial | Manual outcome logging and charts exist. No automated imports, alerts, or closed-loop calibration exist. |
| Billing | Partial | Stripe Checkout, portal, and webhook code exists. Live configuration/testing is outstanding according to the handoff. |
| AI package | Not implemented | Reserved package only; no LLM powers current product behavior. |
| Worker | Not implemented | Stub only. The one scheduled workload runs as a Vercel route. |

## Data and evidence principles already implemented

- Demo research is stored and displayed with `is_demo = true`.
- Finding confidence and demo provenance are separate concepts.
- Missing research is not treated as evidence that a market or technical problem is easy.
- Simulator state changes are deterministic; narration does not override the engine.
- Simulated projections and manually reported real outcomes remain separate.
- Founder pricing choices are modeled separately from research evidence.
- Workspace data is protected with Supabase Row Level Security.

## Known cross-module disconnects

- Shape audience and geography are not reused as Research form defaults.
- Shape problem, value proposition, MVP scope, and differentiation do not affect Research, Build, Compare, or Simulator behavior.
- Creator claims do not feed venture research or simulation.
- `venture_comparisons` records are written but not read by the comparison screen.
- `usage_ledger` is present but unused; there are no feature entitlements or usage limits.
- Venture status advances from `draft` to `shaped`, but later modules do not advance it through the other reserved statuses.
- Checkpoint rewind creates a new simulation run, but the UI has no run picker and ignores the `run` query parameter.
- Authentication middleware records an intended protected path, but the magic-link request does not preserve it through the callback.

## Operational truth

- Stack: Next.js App Router, React, TypeScript, Tailwind, pnpm workspaces, Supabase, Vercel, optional Stripe.
- Latest migration in the repository: `0010_pricing_model.sql`.
- `AGENTS.md` reports migrations `0007` through `0010` are not yet applied to the live database. This repository alone cannot verify live database state.
- CI defines typecheck, lint, 70 Vitest tests, production build, and a Postgres RLS smoke test.
- Browser E2E tests and research-quality evals are not implemented.
- The prior audit could not execute local checks because dependencies were absent and registry access was restricted.

## Documents in this authority set

- `POST_CLAUDE_DELTA.md`: intake and decision record for the next product-owner delta.
- `USER_JOURNEY_AND_SCREEN_MAP.md`: routes, user flow, and navigation gaps.
- `RESEARCH_AND_EVIDENCE.md`: source-by-source evidence truth.
- `SIMULATOR.md`: engine, inputs, persistence, and limitations.
- `MONETIZATION_LAB.md`: founder pricing simulation and Venture Sandbox billing.
- `TECHNICAL_ARCHITECTURE.md`: runtime, packages, database, security, deployment, and testing.
- `CURRENT_ROADMAP.md`: current baseline, outstanding operational work, and delta-controlled next work.

## Accepted product intent after the Post-Claude delta

Venture Sandbox is an **AI Venture Intelligence Platform and Startup Flight Simulator** for people ranging from first-time idea holders and vibe/no-code builders to creators, students, freelancers, and serious founders.

The governing product principle is:

> Expert-level intelligence underneath. Beginner-level simplicity on top.

Default UX must avoid startup jargon. Technical depth belongs behind progressive disclosure, Evidence Explorer, or System View.

The canonical connected journey is:

**Idea → Clarify → Understand → Shape → Monetize → Simulate → Build → Learn**

Calm default venture navigation remains **Understand, Shape, Simulate, Build, Learn**. Monetization is first-class but should sit naturally between Shape and Simulate without adding top-level clutter. Quick Launch/Vibe Coder, Guided Builder, Startup/Professional, and Learner/Student are valid experience profiles over the same underlying venture context, not separate products.

## Product continuity contract — newly required

Every module must operate on one shared venture context. Data captured once must be reused downstream rather than requested again:

- idea and category;
- geography and audience;
- problem, MVP scope, and differentiation;
- pricing model and monetization experiments;
- technical requirements and cost assumptions;
- research evidence and uncertainty; and
- simulated and, later, real outcomes.

A feature counts as implemented only when the user can perform the action, required state persists, and required downstream behavior changes. Otherwise it must be labeled UI-only, partial, demo, credential-required, unavailable, or future. “Complete,” “fully connected,” and “live” are prohibited unless demonstrably true.

## Immediate product objective — newly required

The highest priority is a presentation-ready web prototype within the next couple of days. It must use the production product model, feel like one coherent product, include the important presentation screens, have working major CTAs and no dead navigation, share a consistent responsive visual system, and distinguish representative/demo data from live evidence.

The presentation scope and implementation status are tracked in `USER_JOURNEY_AND_SCREEN_MAP.md` and `CURRENT_ROADMAP.md`.

## Stable trust and UX rules — newly required

- Never fabricate revenue, downloads, market share, percentages, conversion, success probability, or competitor traction numbers.
- Missing evidence remains missing.
- Preserve a path from answer to synthesis to finding to evidence to original source.
- Avoid arbitrary scores, fake progress, unexplained numbers, enterprise clutter, dense navigation, and decorative complexity.
- Prefer calm hierarchy, strong typography, progressive disclosure, useful charts, visual evidence summaries, clear states, and an obvious next action.

## Future product architecture

Research synthesis, review intelligence, Technology & Ownership Intelligence, Monetization Lab depth, broader Compare modes, automated Learn/Monitor, multi-agent roles, and replaceable model/provider routing are established future directions where not yet implemented. Their detailed requirements live in the focused documents. They do not change the current-code status table above.
