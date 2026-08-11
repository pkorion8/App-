# Notes for AI coding agents

Read this whole file before touching code — it's the fastest way for any
agent (Claude, GPT, Gemini, human) to pick this project up cold, and it's
maintained specifically for that handoff, not just as a style guide.

## Current status and plan (as of 2026-08-11)

**Hardening pass done on top of the full breadth list**, ahead of the
product owner having time to run the pending SQL / set up Stripe:
- Security audit: fixed a real cross-tenant data-integrity gap
  (rewindToCheckpoint/createComparison trusted a caller-supplied second
  id without checking its workspace), empirically verified via the RLS
  smoke test that no workspace member can self-upgrade billing_accounts
  to Pro, added baseline security headers (X-Frame-Options etc.),
  confirmed no dangerouslySetInnerHTML/eval anywhere and no open-redirect
  in the magic-link callback.
- Real unit test suite (Vitest, 38 tests, wired into CI): Simulator
  engine + narration, Build Studio's generator, Research's geography
  resolver / newcomer detection / heuristic claim extraction. Caught a
  genuine infinite-loop bug while writing these (a bare `while (stage !==
  X) advanceDay()` loop hangs forever if it passes through an unresolved
  decision stage, since advanceDay() is a documented no-op there) — worth
  knowing if anyone writes a similar helper later.
- Per-page browser tab titles (previously every page shared one title).

**Two things still need the product owner, not more code:**
- `supabase/migrations/0006_shape.sql` hasn't been run against the live
  DB yet — Shape's code is safe to have deployed ahead of this (queries
  degrade to "no shape data" rather than erroring), but Shape won't
  actually work until it's run.
- Stripe test-mode account + 3 env vars for Billing to go live (see
  .env.example).

**Deadline: public beta launch by 2026-08-24 (14 days from repo start).**
Execution strategy locked with the product owner: **breadth-first, V1 depth
per module** — every major module in the product vision (Research,
Similar Apps/Tech, Shape, Compare, Simulator, Build Studio, Monitoring,
Billing, public launch pages) must exist and work end-to-end by roughly
day 8-9, at V1 depth. Full production-grade depth (Monte Carlo, licensed
data providers, mature calibration) is explicitly *not* in scope for
launch — that's post-launch work. Do not silently narrow this further by
skipping a module; do not silently expand it into full-depth work either.
If a tradeoff decision is needed, say so explicitly rather than picking
one direction quietly.

**Every module in that list now exists at V1 depth as of this commit.**
Two decisions made along the way, called out explicitly per the rule
above rather than resolved silently:
- **"Similar Apps/Tech"** was folded into Research rather than built as a
  separate page: the live App Store competitor search (with newcomer
  detection) *is* "Similar Apps," and the demo "Cost and time to build"
  finding slot *is* "Tech" (build-journey sourcing, once Creator
  Intelligence feeds it). If the product owner wants this as its own
  distinct screen later, it's a straightforward split out of Research.
- **"Shape"** was built as a founder-filled structured brief (target
  user, problem, value prop, MVP scope, differentiation) rather than
  AI-generated — there's no LLM API budget yet (`packages/ai` stays
  reserved for that upgrade). It populates `ventures.target_user` /
  `ventures.geography` (already-reserved columns) and advances
  `ventures.status` from `draft` to `shaped` (an already-reserved enum
  value neither had been wired up before).

**What's genuinely done and tested, not just written:**
- Full auth (magic link), workspace/venture CRUD, RLS on everything — Slice 1
- Research: clarification flow (geography is now a dropdown, not free
  text — resolves reliably to a country code), DEMO-labeled placeholder
  findings, live App Store competitor search (Apple's free iTunes Search
  API) with newcomer detection (apps released in the trailing 12 months,
  flagged directly in the finding text), live World Bank market
  indicators (population, GDP/capita, internet penetration) with
  graceful per-indicator degradation since the API is empirically flaky
- Creator Intelligence: YouTube official discovery (tested live, works),
  browser-assisted transcript connector (untested live — see below),
  heuristic claim extraction (tested against sample transcripts)
- Simulator: deterministic state machine (Setup → ... → Month 1),
  delayed-consequence narration tied to real past decisions + current
  metrics, batch day-advance controls (1/3/to-next-checkpoint), checkpoint
  save + rewind (duplicate-and-replay, not git-like branching), and real
  day-by-day trend charts (cash/users/revenue) — all tested
- Build Studio V1 (stack/cost/backlog generator), Compare V1
  (side-by-side facts, no invented "winner" score)
- Monitor V1: manual real-world outcome logging (users/revenue/cost/
  retention) with the same trend-chart treatment as Simulate, kept
  deliberately separate from the simulation's projected numbers
- Billing V1: Stripe Checkout + customer portal + webhook sync wired to
  the existing billing_accounts table — code-complete and typechecked,
  but genuinely untested live (needs a real Stripe test-mode account from
  the product owner; see .env.example)
- Public landing page (`/`) and `/pricing` — Pro honestly labeled "coming
  soon" until Stripe is actually configured
- Shape V1: founder-filled brief (target user/geography/problem/value
  prop/MVP scope/differentiation), advances venture status draft→shaped
- Deployed and live on Vercel, real Supabase project connected

**Two external-source findings from real testing, not assumptions —
don't re-attempt these without a new approach:**
- Apple's public review RSS/JSON feed (`itunes.apple.com/*/rss/customerreviews/...`)
  returns zero entries for every app tested (Instagram, Spotify, etc.) as
  of tonight. Unreliable in practice, not just theoretically deprecated.
- Scraping YouTube transcripts (or Google Play reviews, same category)
  from server/datacenter infrastructure gets bot-detected quickly (a raw
  request got redirected straight to Google's CAPTCHA page on the second
  request). A real browser (Playwright) helps but does not change the
  network origin, which is the actual signal being detected. This is why
  the transcript connector is labeled experimental/best-effort, not a
  hard dependency — see its file header for the full reasoning.

## Engineering notes

- **Reference stack is fixed for this slice**: Next.js App Router + TS,
  Supabase (Postgres/Auth), Tailwind, pnpm workspaces. Don't introduce a
  second framework/ORM/auth provider without updating spec §16.1 first.
- **Internal package imports use no file extension** (`from "./foo"`, not
  `"./foo.js"`). `tsc`'s `moduleResolution: Bundler` accepts either, but
  webpack (via Next's `transpilePackages`) only resolves the extensionless
  form against `.ts`/`.tsx` source. Extension-suffixed imports build clean
  under `tsc --noEmit` and then fail `next build` with "Module not found" —
  that mismatch is easy to reintroduce, so keep this consistent.
- **RLS policies must not self-reference their own table** in a `USING`
  clause — Postgres RLS recurses infinitely if they do. Use the
  `public.is_workspace_member()` SECURITY DEFINER helper in
  `supabase/migrations/0001_init.sql` for any new membership check rather
  than inlining `EXISTS (SELECT ... FROM workspace_members ...)` again.
- **`packages/integrations/src/supabase/types.ts` is hand-maintained** —
  there's no live Supabase project to run `supabase gen types` against yet.
  Every table needs `Relationships: []` and the schema object needs
  `Views`/`Functions`/`Enums`/`CompositeTypes` present (even as
  `Record<string, never>`), or `@supabase/supabase-js`'s generic
  constraints silently collapse `.from(...)` to `never` everywhere instead
  of raising a clear error at the type declaration.
- **`@supabase/ssr` and `@supabase/supabase-js` versions are coupled** —
  check the installed `@supabase/ssr`'s `peerDependencies` before bumping
  either independently; a mismatch produces the same silent `never`
  collapse as above, not a clean version error.
- Run `pnpm typecheck && pnpm lint && pnpm build` before considering any
  change to `apps/web` or `packages/*` done. Run
  `tests/integration/rls_smoke_test.sh` after touching anything in
  `supabase/migrations/`.
