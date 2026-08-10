# Venture Sandbox

Research a venture idea, simulate building and launching it, and decide
before spending real money.

This repository implements **Slice 1 (Foundation)** of the vertical-slice
plan in the master spec (§21.2): a user can sign in and create/open a
venture. Later slices (research engine, staged simulator, Build Studio,
etc.) are not implemented yet — see `packages/research`, `packages/ai`,
`packages/simulator`, and `packages/build`, which are reserved placeholders.

## Stack

Per the spec's reference stack (§16.1): Next.js App Router + TypeScript,
React + Tailwind, Supabase (Postgres + Auth), pnpm workspaces monorepo.

## Repository layout

```
apps/
  web/        Next.js app (this slice's only real surface)
  worker/     Reserved for background jobs (Slice 2+)
packages/
  ui/               Design tokens + tokenized component library
  domain/           Core domain types (Venture, Workspace, ...)
  schemas/          Zod validation schemas
  integrations/     Framework-neutral Supabase client + types
  observability/     Structured event logging
  research/ai/simulator/build/   Reserved for later slices
supabase/
  migrations/       SQL migrations (schema + RLS policies)
  config.toml       Local Supabase CLI config
tests/
  integration/      RLS smoke test (runs against real Postgres, no Docker needed for CI)
```

## Local setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Connect a Supabase project.** Either:
   - **Local**: install the [Supabase CLI](https://supabase.com/docs/guides/cli) and run
     `supabase start` from the repo root. It applies `supabase/migrations/`
     automatically and prints your local API URL + anon key.
   - **Hosted**: create a project at [supabase.com](https://supabase.com),
     then run the SQL in `supabase/migrations/0001_init.sql` via the SQL
     editor (or `supabase db push` once linked).

   Copy `.env.example` to `.env.local` in the repo root and fill in
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

   Until this is done, the app still runs — sign-in and dashboard routes
   show a "Supabase isn't connected yet" notice instead of crashing.

3. **Run the dev server**

   ```bash
   pnpm dev
   ```

   Visit `http://localhost:3000`.

## Verifying changes

```bash
pnpm typecheck   # all packages + apps
pnpm lint        # apps/web (eslint-config-next)
pnpm build       # production build, all apps
bash tests/integration/rls_smoke_test.sh   # requires a local Postgres; see script header
```

CI (`.github/workflows/ci.yml`) runs all four on every push/PR.

## Why RLS has its own test

The first draft of `supabase/migrations/0001_init.sql` had a
self-referential `workspace_members` policy that caused infinite recursion
under Postgres RLS — a bug `tsc`/`next build` cannot catch, since it only
happens when Postgres evaluates the policy. `tests/integration/rls_smoke_test.sh`
exercises it directly (and everything else load-bearing: cross-workspace
isolation) against a real Postgres instance, no Docker/Supabase CLI
required, so it runs in plain GitHub Actions.

## Decisions still open before later slices

See the "Pre-Build Decisions Required" section of the latest addendum
(product spec, not in this repo) for what's still blocking Slices 3, 5,
8, and 9 — licensed data-provider economics, exact pricing, and the
deterministic/AI-authored split for the simulator, among others. Nothing
there blocks the work in this repository today.
