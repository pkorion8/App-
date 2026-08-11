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
