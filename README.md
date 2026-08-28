# Sim Venture

Sim Venture helps a user research a venture idea, compare it with another venture, rehearse launch scenarios, prepare a build plan, record reported outcomes, and practice investor conversations before spending real money.

The product preserves two levels of detail: **Simple** mode for the main guided journey and **Pro** mode for deeper tools. Evidence-facing features are source-bound: the app does not fabricate market data, traction, pricing, success probability, or investor interest.

## Current product surfaces

- **Explore / Search** — searches connected public sources and can start a venture from a search result.
- **Research** — collects evidence from connected sources and shows source availability and limitations. It does not create synthetic fallback findings when live sources return nothing.
- **Compare** — compares two real user ventures; it does not seed a fake second venture.
- **Simulator** — deterministic rehearsal scenarios. App Store rating volume is descriptive context and is not treated as traction or a growth input.
- **Build Studio** — prepares a build package. Vendor costs remain unpriced unless backed by a pricing source; historical estimates are labeled as legacy estimates.
- **Learn / Monitor** — stores user-reported observations separately from simulations and does not present them as independently verified facts.
- **Investor World / Deal Lab** — investor and negotiation rehearsals only; outputs are not real investor interest, offers, funding probabilities, valuation recommendations, transactions, or legal advice.

## Connected research sources

| Source | Status | What it can support |
| --- | --- | --- |
| Apple iTunes Search API | Live | App discovery and public App Store metadata/rating-volume evidence. Rating counts are not downloads, revenue, market share, success, or traction. |
| World Bank Open Data | Live | Public country/indicator context. Population or macro indicators are not TAM, demand, or willingness to pay. |
| GitHub public repositories | Partial | Public repository/activity context where relevant. Repository activity is not commercial demand or feasibility proof. |
| Reviews / live vendor pricing / regulatory data | Not connected unless explicitly shown otherwise in-product | The app must mark these unavailable rather than inventing substitutes. |

## Stack

Next.js App Router + TypeScript, React + Tailwind, Supabase (Postgres + Auth), and pnpm workspaces.

## Repository layout

```text
apps/
  web/        Next.js application
  worker/     Background-worker surface
packages/
  ui/               Design tokens + component library
  domain/           Core domain types
  schemas/          Validation schemas
  integrations/     Supabase and external-source integrations
  observability/    Structured event logging
  research/         Research/source logic
  simulator/        Simulation logic
  build/            Build Studio logic
supabase/
  migrations/       Database schema + RLS policies
tests/
  integration/      Database, production-persistence, deployment, and HTTP smoke guards
```

## Local setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env.local` and configure the required environment variables. At minimum, authenticated use requires valid `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` values. For production, set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS application origin so magic-link redirects return to the correct host.

   Until Supabase is configured, setup-safe routes render a connection notice instead of entering a broken auth path.

3. Run the development server:

   ```bash
   pnpm dev
   ```

   Visit `http://localhost:3000`.

Optional server-side integrations, including scheduled creator intelligence, have their required secrets documented in `.env.example`. Keep service-role and cron credentials server-only; never expose them as `NEXT_PUBLIC_*` variables.

## Verification

Run the repository checks before shipping:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
bash tests/integration/production_http_smoke.sh
bash tests/integration/rls_smoke_test.sh
```

GitHub CI also runs production-safety guards that prevent production fixture seeding, synthetic research persistence, and simulated investor-interest regressions, plus a production-server HTTP smoke test.

## Production data rule

Do not seed historical research ideas, demo ventures, or disposable test ventures into the production `ventures` table. A production venture should exist only because a real user explicitly created it. Tests must use fixtures/mocks or isolated disposable data that is cleaned up.

## Deployment checklist

Before treating a deployment as launch-ready:

1. Confirm the production environment has valid Supabase public credentials and the canonical `NEXT_PUBLIC_SITE_URL`.
2. Confirm any enabled server-side integration secrets from `.env.example` are present and remain server-only.
3. Complete a real magic-link sign-in against the deployed application.
4. Smoke-test the authenticated journey with a deliberately created real-user venture: Explore/Create → Research → Shape/Compare → Simulator → Build → Learn, plus Investor World rehearsal if needed.
5. Verify source-status labels remain truthful when a connected source returns no result or is unavailable.

CI can validate code and the built server, but it cannot substitute for the final live-auth and deployed-environment checks.