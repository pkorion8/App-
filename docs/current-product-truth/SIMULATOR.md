# Simulator

## Current implementation

The simulator is a deterministic TypeScript state machine in `packages/simulator`. The same starting budget, market context, pricing model, and decisions produce the same result. Application actions persist snapshots and event/decision history in Supabase.

## Stages

`resource_planning` → `build` → `build_event` → `build` → `mvp_ready` → `pre_launch` → `launch` → `first_users` → `user_or_market_event` → `adaptation` → `month_1` → `complete`

Decision-required stages block time advancement until the founder chooses an option.

## State and outputs

- virtual day;
- starting budget and cash remaining;
- build progress, product quality, technical risk, and launch readiness;
- total and returning users;
- monthly revenue and monthly cost;
- market confidence;
- day-by-day chart history;
- snapshotted market context and pricing model.

## Decisions

The V1 contains three decision moments:

1. Technical blocker: fix properly, workaround, or ignore.
2. MVP readiness: test onboarding or launch now.
3. Market event: increase acquisition, improve product, or hold steady.

Decisions change deterministic state. Separate narration logic surfaces delayed-consequence notes only when a recorded earlier decision and a current metric condition support the explanation.

## Inputs from other modules

At run creation:

- founder supplies a starting budget;
- latest App Store snapshots determine competitor traction and top competitor;
- latest mission metadata supplies internet penetration and active GitHub repository count;
- latest Build package supplies an operating-cost floor;
- Shape supplies the pricing model, defaulting to subscription when absent.

No other Shape or research fields affect the engine.

## Revenue models

- **Subscription:** total users × 5% conversion × $8.
- **One-time:** current daily-new-user cohort × 30 × 5% × $25.
- **Commission:** total users × 5% × $4.
- **Ad-supported:** total users × $0.50.

These are fixed V1 formulas, not market-calibrated forecasts.

## Persistence and UI

- `simulation_runs` stores current state, history, market context, and pricing model.
- `simulation_events` stores generated narrative events.
- `simulation_decisions` stores founder choices.
- `simulation_checkpoints` stores JSON snapshots.
- Rewind creates a new run from a checkpoint rather than mutating the original.
- The page displays latest-run metrics, charts, decisions, market context, checkpoints, and recent events.

## Partial behavior and known limitations

- The page always selects the newest run and does not read its `run` query parameter.
- There is no run list, branch tree, or side-by-side branch comparison.
- Event variety and decision depth are deliberately small.
- There is no randomness, scenario distribution, Monte Carlo analysis, sensitivity analysis, or confidence interval.
- No category or country simulation packs exist.
- Growth and monetization constants are generic beyond the four evidence inputs described above.
- Acquisition choices change current users/cost but do not introduce a durable acquisition-rate state.
- A run is not automatically recalibrated if Shape, Research, or Build changes afterward; inputs are snapshots at run creation.
- Actual Monitor outcomes do not feed the engine.

## Tested behavior

The repository contains 25 engine tests and 5 narration tests covering stages, decisions, history, evidence adjustments, Build-cost addition, pricing formulas, deterministic behavior, and delayed-consequence narration.

The tests were not executed during the takeover audit because local dependencies were unavailable and registry access was restricted.

## Future architecture boundary

Any future probabilistic, category-specific, or AI-narrated simulator must preserve an auditable separation between state-transition authority and presentation. The current repository explicitly assigns state authority to deterministic code. This boundary is documented; no specific future simulator expansion is approved by this baseline.
