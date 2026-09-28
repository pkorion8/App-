# Sim Venture — Final Launch Handoff

Status date: 2026-09-28

## Repository status

The complete V1 product and approved visual system are implemented on `codex/final-product-ui`.

Latest commits:

- `8774e89` — final launch handoff
- `e31bb34` — release-quality product pass
- `eb947e9` — launch access, sign-in and venture surfaces
- `fe8ca0d` — final product visual system

Local verification is clean:

- TypeScript typecheck: passed
- ESLint: passed
- Unit tests: 94 passed across 15 files
- Next.js production build: passed
- Public runtime smoke test: `/`, `/pricing`, `/methodology`, and `/explore` return `200`; unknown routes return the branded `404`

## Completed production infrastructure

- The connected Supabase project is healthy and contains the full schema through `0015_production_security_hardening.sql`.
- The Vercel project `app-web` exists and is connected to the GitHub repository.
- The production security migration was transaction-tested before it was applied.
- All 48 public-table RLS policies are restricted to authenticated users.
- Anonymous Data API table access is revoked.
- Security-definer helpers are isolated from the public API and use a fixed empty search path.
- The post-migration Supabase security advisor is clean except for leaked-password protection, which does not apply to the current passwordless magic-link flow.

## Owner setup required before the live release

These are deployment credentials and product decisions, not missing application development.

1. Authenticate GitHub, push `codex/final-product-ui`, and deploy that branch through the existing Vercel project `app-web`.
2. Confirm the required Vercel environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
3. In Supabase Auth, set the production Site URL and allow `<production-origin>/auth/callback` as a redirect URL.
4. Decide the recurring Pro price, create the Stripe Product/Price, then add:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID_PRO`
   - `STRIPE_WEBHOOK_SECRET`
5. Create the Stripe webhook endpoint at `<production-origin>/api/webhooks/stripe`.
6. Add optional research-operation secrets only if those services will be enabled at launch:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
   - `YOUTUBE_API_KEY`

Never commit any secret or production key to Git.

## Mandatory live verification

After the first Vercel preview is available:

1. Complete a real email magic-link sign-in.
2. Create a disposable venture and complete: Explore → Create → Research → Shape → Monetization → Simulate → Build → Learn.
3. Verify Compare with two ventures.
4. Verify Investor World, diligence, committee and deal routes.
5. Complete Stripe test Checkout, confirm the webhook changes the workspace plan, and open the customer portal.
6. Confirm App Store, World Bank and GitHub source labels remain truthful when a provider returns no result.
7. Test desktop and mobile widths on the deployed preview.
8. Promote the verified preview to production instead of rebuilding a different artifact.

## Honest product boundaries

The product is complete without fabricating unavailable evidence. App review text, Google Play coverage, competitor revenue, exact downloads, market share and jurisdiction-specific regulatory conclusions remain explicitly unavailable until a reliable licensed source is connected. These are provider/data decisions, not broken screens.

## Release gate

Do not call the release complete until authentication, the full venture journey and Stripe test mode pass against the deployed environment. Local CI cannot validate production keys, redirect allowlists or webhook delivery.
