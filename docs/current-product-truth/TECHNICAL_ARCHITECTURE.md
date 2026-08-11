# Technical Architecture

## Repository shape

The repository is a pnpm-workspace monorepo.

### Applications

- `apps/web`: Next.js 14 App Router application and current production surface.
- `apps/worker`: TypeScript stub with no jobs.

### Packages

- `packages/ui`: design tokens and reusable form/data-display components.
- `packages/domain`: shared domain interfaces.
- `packages/schemas`: Zod form/action validation.
- `packages/integrations`: Supabase clients/types and Stripe client helpers.
- `packages/observability`: structured console event logging.
- `packages/research`: live adapters, demo findings, metadata, trends, and creator extraction.
- `packages/simulator`: deterministic engine, row mapping, and narration.
- `packages/build`: rule-based build-package generator.
- `packages/ai`: reserved only.

## Runtime architecture

- Server-rendered Next.js pages query Supabase through a cookie-aware SSR client.
- Client components submit server actions for mutations.
- Middleware refreshes Supabase sessions and protects application prefixes.
- Venture research performs three external API calls in parallel inside a server action.
- Creator Intelligence runs in a Vercel cron route using a Supabase service-role client.
- Stripe webhooks use a service-role client after signature verification.
- No general background queue or worker runtime is active.

## Database architecture

Migrations `0001`–`0010` define:

- identity tenancy: `workspaces`, `workspace_members`;
- core product: `ventures`, `venture_shapes`;
- evidence: `research_missions`, `findings`, `research_competitor_snapshots`;
- shared creator evidence: `youtube_channels`, `creator_claims`;
- simulation: `simulation_runs`, `simulation_events`, `simulation_decisions`, `simulation_checkpoints`;
- comparison/build/continuity: `venture_comparisons`, `build_packages`, `venture_outcomes`;
- commercial/operations: `billing_accounts`, `usage_ledger`, `audit_log`.

Workspace identifiers are denormalized onto most product tables so RLS can use the shared `is_workspace_member()` security-definer helper without recursive policies.

Supabase TypeScript types are hand-maintained. Schema changes require synchronized migration and type updates.

## Security model

- Workspace-scoped tables use RLS membership policies.
- Audit logs are append-only by policy omission.
- Billing rows have no regular-user write policy.
- Creator claims are written only through service-role code; authenticated users may read them.
- Stripe webhook bodies are signature-verified.
- Cron requests require `CRON_SECRET` bearer authentication.
- Baseline response headers include frame denial, MIME sniffing prevention, referrer policy, and restricted browser permissions.
- Bad venture identifiers use RLS plus `notFound()` rather than exposing records.

## Configuration

Core:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server integrations:

- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_API_KEY`
- `CRON_SECRET`
- optional local `CHROMIUM_EXECUTABLE_PATH`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID_PRO`
- `STRIPE_WEBHOOK_SECRET`

The checked-in `.env.example` currently documents Supabase and Stripe variables but omits the creator-intelligence/service-role variables used by the cron route.

## Deployment

- `apps/web/vercel.json` schedules creator intelligence daily at 06:00 UTC.
- The cron route declares a 60-second duration and caps transcript attempts.
- `@sparticuz/chromium` supplies serverless Chromium; Playwright/Chromium are externalized from the Next bundle.
- `AGENTS.md` records the application as deployed to Vercel with a hosted Supabase project, but deployment identity and live configuration are not encoded in this repository.

## Testing and CI

GitHub Actions runs on `main` pushes and pull requests:

- pnpm frozen install;
- typecheck;
- lint;
- 70 Vitest unit tests;
- production build;
- PostgreSQL 16 RLS smoke test.

Current unit-test distribution:

- Simulator engine: 25
- Simulator narration: 5
- Build generator: 5
- Research trend: 5
- Geography: 4
- Search keywords: 6
- Live findings: 10
- GitHub helper: 4
- Heuristic creator claims: 6

Absent:

- browser E2E tests;
- external-source contract/live tests;
- Stripe integration tests;
- research-quality evals;
- broad server-action authorization tests;
- comprehensive RLS coverage for every later table.

## Current technical debt and boundaries

- Status-oriented README/CHANGELOG/docs are stale relative to code.
- The worker and AI package are placeholders.
- Observability is structured console logging, not a durable telemetry backend.
- Research missions use `complete` immediately; queued/running/failed states are not exercised by the current action.
- External source work runs in request lifetimes and is not resumable.
- Several schema objects are unused or write-only (`usage_ledger`, application reads of `venture_comparisons`).
- Live migration state is external. `AGENTS.md` reports `0007`–`0010` pending in the product-owner database.

## Future architecture

No new architecture is approved by this baseline. Future designs must be derived from an accepted delta and should preserve RLS tenancy, honest evidence provenance, deterministic simulation authority unless explicitly changed, and separation of simulated versus actual outcomes.
