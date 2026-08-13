# Changelog

## Unreleased — Final prototype Pass 3

- Added persisted Simulator branch lineage, a hard three-rewind limit for Standard runs, and Reality Mode with zero rewinds via migration `0013_simulation_branches_and_committee.sql`.
- Added persisted Investment Committee reviews, editable Diligence state, simulated offers/counters, and accept/decline negotiation state while keeping all investor outcomes explicitly simulated.
- Added two clearly labeled presentation demo ventures with demo findings, simulated timelines, decisions, and Investor World fixtures; demo records never present themselves as live evidence.
- Expanded the Venture Library with persistent founder notes and saved resources, plus richer Learn metrics and reality-vs-simulation variance views via migration `0014_venture_memory_and_learning.sql`.
- Expanded Monetization Lab, venture-specific Technology & Ownership guidance, and Build Studio while preserving evidence/heuristic/reference-assumption provenance.
- Added a private Venture Scorecard and a light Intelligence Feed based only on already-connected research, App Store snapshots, and monitored creator claims.
- Migrations `0013` and `0014` are created but are not applied to production by this code change.

## Unreleased — Final prototype Pass 2

- Upgraded Venture Home into an intelligence overview with evidence, simulation, monetization, build-readiness, strongest-signal, unresolved-question, and reality-loop summaries.
- Strengthened Research and Evidence Explorer around coverage, provenance, source traceability, and explicit unknowns.
- Upgraded the Simulator with 1× / 5× / 10× / 20× controls, observable consequence charts, decision history, timeline library, and checkpoint-based alternate-timeline UX.

## Unreleased — Final prototype Pass 1

- Added a persistent simulated Investor World with bounded investor profiles, contextual screening questions, meeting transcripts, and a conservative Claim Ledger.
- Added simulated Diligence, Investment Committee, and deterministic Deal Lab / cap-table routes.
- Added migration `0012_investor_world.sql` for workspace-scoped investor sessions, messages, claims, offers, and diligence items. The migration is created but not applied to production.
- Added deterministic investor-domain logic for contextual questions, claim classification, ownership/dilution math, bounded counters, and stage progression.
- Added a research source registry around the existing Apple/iTunes, World Bank, and GitHub integrations, while explicitly marking reviews, pricing, and regulatory intelligence unavailable where no source exists.
- Upgraded persistent venture navigation to separate the primary Understand → Shape → Simulate → Build → Learn journey from contextual monetization and connected intelligence modules.

## Unreleased — Sprint 1 product spine

- Added the shared Understand → Shape → Simulate → Build → Learn venture journey and persistent venture context header.
- Added Explore, Reviews, Technology & Ownership, Evidence Explorer, Monetization Lab, System View, and Methodology routes with explicit LIVE/PARTIAL/DEMO/UNAVAILABLE states.
- Added context-aware monetization experiments and migration `0011_sprint_product_spine.sql` for selected-experiment persistence and truthful lifecycle values. The migration is created but not applied.
- Reorganized Research into beginner-facing sections, preserved App Store, World Bank, and GitHub integrations, and reused saved Shape inputs.
- Clarified Build recommendation provenance and separated simulated outcomes, real outcomes, and future recalibration in Learn.

## Unreleased — Slice 1: Foundation

- Monorepo scaffold (pnpm workspaces) per spec §21.3.
- Next.js App Router web app with Tailwind + tokenized `packages/ui`.
- Supabase schema: `workspaces`, `workspace_members`, `ventures`,
  `audit_log`, all RLS-scoped to workspace membership; auto-provisioned
  personal workspace on signup.
- Magic-link auth via `@supabase/ssr`.
- Venture create/open flow — the Slice 1 exit condition ("user can sign
  in and create/open a venture").
- Structured event logging (`packages/observability`) wired to
  `venture.created`.
- CI: typecheck/lint/build, plus an RLS smoke test against a real
  Postgres service container.
