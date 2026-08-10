# Changelog

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
