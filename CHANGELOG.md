# Changelog

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
