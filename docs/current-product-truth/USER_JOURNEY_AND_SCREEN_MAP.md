# User Journey and Screen Map

## Current journey

The application exposes a hub-and-spoke venture journey rather than a strictly enforced sequence:

1. Visit `/` or `/pricing`.
2. Request a magic link at `/sign-in`.
3. View or create ventures at `/dashboard`.
4. Open `/venture/[id]`.
5. Enter any venture module: Shape, Research, Simulate, Build, Compare, or Monitor.
6. Manage platform-level YouTube channels at `/channels` or account billing at `/billing`.

Shape is recommended before Research or Simulate, but navigation and server actions do not enforce module ordering.

## Screen map

| Route | Screen | Implemented behavior | Current limitation |
| --- | --- | --- | --- |
| `/` | Landing | Product promise, module summaries, pricing/sign-in links | Marketing claims are broader than the depth of some V1 modules. |
| `/pricing` | Pricing | Free/Pro feature cards | Pro is coming soon; no public price is shown. |
| `/sign-in` | Sign in | Sends Supabase email OTP/magic link | Intended destination from middleware is not propagated into the email callback. |
| `/dashboard` | Ventures | Lists ventures, creates venture, links to channels/billing | No venture editing, deletion, archiving, filtering, or team management. |
| `/venture/[id]` | Venture hub | Shows idea, Shape summary, status, module links | Status is mostly static after Shape; no progress orchestration. |
| `/venture/[id]/shape` | Shape | Edits structured founder brief and pricing model | Most fields are not consumed downstream. |
| `/venture/[id]/research` | Research | Clarification form, live/demo findings, structured cards, rerun | Does not default from Shape; current action runs synchronous external calls. |
| `/venture/[id]/simulate` | Simulate | Starts/advances run, decisions, charts, market context, checkpoints | Always displays latest run; no run selector or branch comparison. |
| `/venture/[id]/build` | Build Studio | Generates and displays persisted stack/backlog/cost package | Cannot regenerate from the screen once a valid package exists; output is heuristic/static. |
| `/venture/[id]/compare` | Compare | Picks another venture and compares current outputs | Stored comparison is not used; limited dimensions; no winner/recommendation. |
| `/venture/[id]/monitor` | Monitor | Adds real metrics and displays logs/charts | Manual-only and disconnected from simulated projections. |
| `/channels` | Monitored channels | Adds shared YouTube channels and shows recent creator claims | Handle resolution requires external configuration; no pause/edit/remove UI; claims do not feed ventures. |
| `/billing` | Billing | Shows plan; starts Stripe Checkout or portal when configured | Stripe live/test operation is unverified in the repository baseline. |

## Implemented navigation safeguards

- Middleware protects `/dashboard`, `/venture`, `/billing`, and `/channels` when Supabase is configured.
- Protected pages also verify the authenticated user.
- Invalid or inaccessible venture identifiers resolve to the branded not-found screen.
- Global application errors have a branded recovery screen.
- Supabase-dependent pages show a setup notice when configuration is missing.

## Connected flows

- Venture creation redirects to the venture hub.
- Shape persists venture-level audience/geography and a one-to-one shape row.
- Simulator reads the latest research evidence, latest Build cost, and Shape pricing model at run creation.
- Compare reads each venture's latest research mission, latest simulation run, and latest build package.
- Monitor persists real outcomes separately from simulations.
- Stripe webhooks update the workspace billing account.

## Disconnected or incomplete flows

- Shape → Research: the founder re-enters audience and geography.
- Shape → later modules: only pricing reaches Simulator; other brief fields are unused.
- Creator Intelligence → Research: no connection.
- Research → Build: build generation uses venture name and raw idea, not findings.
- Research/Shape/Build → Compare: only selected research and build fields appear.
- Simulation checkpoints → run history: new runs are created, but old/new runs cannot be deliberately selected in UI.
- Compare persistence → Compare display: `venture_comparisons` is write-only from the application perspective.
- Simulate/Build/Monitor → venture lifecycle: venture status is not advanced.
- Monitor → learning loop: actual outcomes do not recalibrate research or simulation.

## Dead-link audit

No hard-coded internal navigation link was found pointing to a missing page route. External creator-claim URLs are stored source data and cannot be guaranteed by the application.
