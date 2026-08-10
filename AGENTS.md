# Notes for AI coding agents

Read this whole file before touching code — it's the fastest way for any
agent (Claude, GPT, Gemini, human) to pick this project up cold, and it's
maintained specifically for that handoff, not just as a style guide.

## Current status and plan (as of 2026-08-10)

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

**What's genuinely done and tested, not just written:**
- Full auth (magic link), workspace/venture CRUD, RLS on everything — Slice 1
- Research: clarification flow, DEMO-labeled placeholder findings, one
  live source (Apple's free iTunes Search API for App Store competitors)
- Creator Intelligence: YouTube official discovery (tested live, works),
  browser-assisted transcript connector (untested live — see below),
  heuristic claim extraction (tested against sample transcripts)
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
