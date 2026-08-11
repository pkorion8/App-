# Notes for AI coding agents

Read this whole file before touching code — it's the fastest way for any
agent (Claude, GPT, Gemini, human) to pick this project up cold, and it's
maintained specifically for that handoff, not just as a style guide.

## Current status and plan (as of 2026-08-11)

**Latest round: Build/Compare visual pass, World Bank gap explained, idea-aware
search, and Simulator consuming more real Research evidence.** Prompted by a
product-owner-relayed external critique (partially right, partially wrong --
see below) of the app producing "generic" results:
- **Corrected a wrong diagnosis first.** The critique assumed a hardcoded/
  silently-defaulted "Canada" bug in the World Bank card. Verified by
  grep + code trace that's false: `resolveCountryCode()` (geography.ts)
  has no fallback, returns `null` on no match, and every live-source
  caller either uses the real resolved geography or degrades to the DEMO
  placeholder -- never a silent substitute country. The actual bug was
  narrower: the World Bank API is empirically flaky and had only
  returned 1 of 3 tracked indicators that run, and the UI didn't explain
  the gap. Fixed: retries bumped 2→3, and `MarketFindingMetadata` now
  carries `missingIndicatorLabels` so the card explains a partial result
  instead of silently looking incomplete.
- **Idea-aware search, not just venture-name search.** GitHub and App
  Store search both used to query on the bare venture name only, ignoring
  the idea text entirely -- a real, fair critique. New
  `packages/research/src/search-keywords.ts` (`deriveSearchKeywords`,
  heuristic-tier stopword-stripped keyword extraction, same tier label as
  `extraction/heuristic-claims.ts`) mixes a few real idea-text terms in
  with the venture name for both GitHub and App Store searches. App
  Store falls back to the bare venture name if the expanded query returns
  zero results (recall safety net -- App Store search is more
  recall-sensitive than GitHub's). 6 new tests prove 5 example ventures
  (nail/roti/pets/invoice/study) produce genuinely different queries, plus
  wiring tests (mocked fetch) proving both call sites actually receive the
  expanded query.
- **Simulator now consumes 2 more real evidence signals, not just
  competitor traction.** `MarketContext` gained `internetPenetrationPct`
  (World Bank, scales organic growth -- low access = real headwind) and
  `activeRelatedReposFound` (GitHub, >=2 actively-maintained related repos
  = a starting productQuality/technicalRisk bonus, since that's evidence
  the technical territory is less unproven). Both null-safe/neutral when
  absent, same "no evidence ≠ evidence of ease" principle as everything
  else here. Sourced from the *same* `findings.metadata` the Research
  page's cards already render (`simulate/actions.ts`'s `buildMarketContext`
  now also reads the latest mission's market/github findings, no new
  table). This is explicitly not the full VentureContext/ResearchSnapshot
  rearchitecture the critique also proposed -- that's real production-depth
  work, already logged as deferred post-launch scope below, and the
  product owner agreed to keep it there once the Canada misdiagnosis was
  corrected. What shipped here is bounded, evidence-linked, and tested.
- **Build and Compare got the same visual system Research got last
  round** (StatTile/Badge/BarList from `packages/ui`): Build's cost
  card is now a hero stat + a real cost-breakdown bar chart instead of a
  bullet list, its Stack/How-to-build sections are labeled "same for every
  venture" (they deliberately are -- a fixed reference recommendation, not
  per-idea) so the Task list's "specific to this idea" framing isn't
  confusing next to them. Compare replaced its plain HTML table with
  stat-tile pairs per dimension (Idea/Status/Research/Simulation/Cost) --
  the "$1" vs "Not generated yet" table row that read as broken/funny to
  the product owner is now framed as a proper stat. Compare does **not**
  yet do the deeper "compare actual research findings dimension-by-
  dimension" (competitor traction, market size, tech signal side by side)
  -- that's the next queued step, using the same `findings.metadata`
  already available, not a new fetch/model.
- Added a `Spinner` component (`packages/ui`) and wired it into Build's
  generate button and Compare's compare button -- both are fast
  synchronous DB writes (no external API calls), so a spinner is honest;
  a fake multi-stage progress bar (like Research's, which really does run
  3 parallel external API calls) would not be.

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
- Research gained a 6th live source: GitHub repo search (open-source
  activity related to the idea) — the "Tech" half of Similar Apps/Tech.
  Written against GitHub's stable API but genuinely untested live: this
  sandbox's network egress scopes all api.github.com traffic to attached
  repos only, so treat it like the YouTube transcript connector
  (best-effort, verify once deployed, not yet watched succeed in prod).
- Research now has a 30s per-venture cooldown between runs, protecting
  the 3 free external APIs' shared rate limits from a spam-click loop.
- Expanded logEvent coverage from 2 server actions to ~9, including all
  3 Stripe webhook outcomes (a checkout completing with no workspace_id
  now logs loudly instead of silently doing nothing).
- Added error.tsx / not-found.tsx — previously any unhandled exception
  or bad venture URL fell through to Next's generic unbranded crash page.
- Compare page: fixed a real perf issue (4 sequential DB round trips
  where 3 were independent and parallelizable; the venture-picker screen
  was also running the full findings/run/build fetch just to read a
  venture's name).

**Research: three permanently-pending findings, by design, not oversight.**
The product owner asked for revenue, subscription/monetization model,
review sentiment ("why is an app good/bad"), top features, and growth
trend on competitors. Three of those are now explicit finding slots
(`packages/research/src/demo-findings.ts`, slots 6-8) that will show
"Connection pending" on every single research run until one of these
happens — not silently dropped, kept visible on purpose so the gap is
never forgotten:
- **Revenue & monetization model** — no free source publishes this,
  anywhere. Cheapest real option: AppFigures' Optimize tier, ~$100-150/mo,
  gives competitor revenue/download *estimates* (modeled, not real sales
  data — no provider at any price has that) plus reviews and competitor
  tracking. AppTweak Essential is ~$79-83/mo but weaker on revenue.
  Sensor Tower was ruled out for now: no self-serve signup, sales-negotiated
  contracts only, real median contract ~$74K/year ($2,500-$12,500/mo) —
  enterprise pricing, not viable pre-revenue.
- **Reviews & ratings sentiment** ("why good/bad", top features) — same
  AppFigures/paid-provider dependency; genuinely zero free path exists
  (Apple's review feed empirically returns nothing, Google Play has no
  free review API at all).
- **Growth trend over time** — now built (`packages/research/src/trend.ts`
  + `research_competitor_snapshots` table, migration 0007, not yet run
  against the live DB — see below). No new scheduled job needed: each
  live App Store search's results are stored, and the next Research run
  for the same venture compares against what was stored last time,
  matched by Apple's stable numeric app id. First-ever run on a venture
  has nothing to compare against yet, which is correct, not a bug.

**Simulate previously ignored Research entirely** — fixed. `startSimulation`
now looks up the venture's most recent Research run (via
`research_missions` + `research_competitor_snapshots`) and passes a
`MarketContext` into `createInitialState()`: real competitor traction
(from live App Store data) makes user growth in the sim harder or easier
(`Strong` traction = headwind, confirmed `None` = tailwind), and the venture's
top real competitor's name shows up in the in-run market event instead of
generic text. If Research has never been run, that's stated plainly (both
in a "Market context" card on the Simulate page and as day-0 event
narration) and growth math stays neutral — "no research done" is never
treated the same as "research confirmed no competitors," since the first
is an absence of evidence, not evidence of absence. New `market_context`
jsonb column on `simulation_runs`, migration 0008, not yet run against the
live DB (see below).

**Research page got a real visual redesign, not just a data-completeness
pass.** The product owner flagged this twice ("the ui how things are
presented so messy and really bad" / "all messed up ... no proper
presentations, cards"). Root cause: every live finding only ever produced
one prose paragraph (`user_facing_summary`), so the UI had no choice but
to render everything as a wall of bulleted text. Fixed by adding a
`findings.metadata` jsonb column (migration 0009) that live sources also
populate with the same numbers in structured form, plus 4 new tokenized
`packages/ui` components (`StatTile`, `Badge`, `Meter`, `BarList`) built
per the dataviz skill's method (form-before-color, validated status
tokens, sequential-hue bars with secondary-encoded tags rather than a
second competing hue). `apps/web/.../research/FindingCard.tsx` now
dispatches on `metadata.kind` to render real stat tiles / a ranked bar
chart / a meter instead of prose, for the 3 live sources (competitors,
market, GitHub); anything without metadata (every DEMO placeholder, or
pre-migration rows) still renders as plain text, so nothing regresses.
Also added a real progress indicator (indeterminate bar + cycling
"searching App Store… / pulling market data… " stage text) during the
research run's multi-second multi-API call, replacing a bare "Starting…"
label. A 2-slice pie chart was explicitly *not* used for the "N of M
newcomers" stat — the dataviz skill's own form table calls that out
("a single ratio against a limit → Meter, not a pie of 2 slices") — a
Meter/progress-bar gives the same at-a-glance read without the
readability cost. Verified by rendering the actual compiled Tailwind CSS
against the real component markup with the product owner's own Nail
Design/Japan data (screenshotted light + dark + mobile widths), since
this sandbox has no way to log into the live app with real credentials.

**Two things still need the product owner, not more code:**
- `supabase/migrations/0007_competitor_snapshots.sql`,
  `0008_simulation_market_context.sql`, and
  `0009_findings_metadata.sql` haven't been run against the live DB yet
  (0001-0006 have, confirmed via a live diagnostic query after the
  product owner ran a consolidated fix for 3 tables that had gone
  missing). All three are additive-only and safe to run any time: 0007
  backs the competitor growth-trend feature, 0008 backs Simulate reading
  real Research data, 0009 backs the new stat-tile/bar-chart Research UI
  — until they run, those features degrade gracefully (no trend section,
  no market-context calibration, findings render as plain text) rather
  than erroring, but won't actually work at full depth.
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
