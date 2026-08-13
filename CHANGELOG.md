# Changelog

## Unreleased — UI redesign pass

- Reworked the visual system around a light modular SaaS workspace with a green editorial brand layer.
- Redesigned the public landing page, dashboard, venture overview, and persistent venture navigation.
- Updated shared Card, Button, Input, Select, and design-token primitives so Research, Simulator, Build, Compare, Investor World, Monetization, Evidence, and other existing surfaces inherit the new visual language without changing their product logic.
- Preserved existing routes, Supabase flows, research/simulation logic, and venture data.

## Unreleased — Final prototype Pass 1

- Added a persistent simulated Investor World with bounded investor profiles, contextual screening questions, meeting transcripts, and a conservative Claim Ledger.
- Added simulated Diligence, Investment Committee, and deterministic Deal Lab / cap-table routes.
- Added migration `0012_investor_world.sql` for workspace-scoped investor sessions, messages, claims, offers, and diligence items. The migration is created but not applied to production.
- Added deterministic investor-domain logic for contextual questions, claim classification, ownership/dilution math, bounded counters, and stage progression.
- Added a research source registry around the existing Apple/iTunes, World Bank, and GitHub integrations, while explicitly marking reviews, pricing, and regulatory intelligence unavailable where no source exists.
- Upgraded persistent venture navigation to separate the primary Understand → Shape → Simulate → Build → Learn journey from contextual monetization and connected intelligence modules.
- This is only the recovered Pass 1 foundation; advanced Simulator work, rewinds, seeded demo ventures, deeper Research/Evidence redesign, and Pass 2 remain outstanding.

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