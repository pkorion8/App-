# Research and Evidence

## Current research model

A research run creates a `research_missions` row and nine `findings` rows. The run starts and completes synchronously in one server action. Three finding positions attempt live sources; all other positions use explicitly labeled demo/pending content.

Each finding stores:

- a normalized claim and user-facing summary;
- evidence state: `SOLID`, `MIXED`, `WEAK`, or `UNKNOWN`;
- `is_demo`, independently identifying placeholder provenance;
- limitations and a next test; and
- optional structured metadata for rich rendering.

## Venture research sources

| Source | Status | Evidence produced | Important limits |
| --- | --- | --- | --- |
| Apple iTunes Search API | Implemented live adapter | Similar apps, seller, rating, rating count, price, update/release dates, newcomers, traction | Search relevance is heuristic; App Store fallback uses the bare venture name if expanded search finds nothing. |
| World Bank Open Data | Implemented live adapter | Population, GDP per capita, internet penetration | Per-indicator API calls are empirically flaky; each retries and partial results are disclosed. Unsupported geography degrades to demo. |
| GitHub repository search | Implemented, live operation unverified | Related repositories, stars, activity recency | Unauthenticated rate limits; keyword relevance is heuristic; handoff says production success has not been observed. |
| Stored App Store snapshots | Implemented | Rating-count direction between repeated research runs | First run has no trend; trends occur only when Research is rerun and the same app is found. |

Expanded App Store and GitHub queries use stopword-stripped terms derived from both venture name and raw idea text.

## Demo and pending findings

The nine-slot generator currently includes these areas:

1. Similar apps — replaced by live App Store evidence when successful.
2. Demand signals from the target audience — demo.
3. Cost and time to build from comparable founder journeys — demo.
4. Early market, technical, and regulatory risks — demo.
5. Market indicators — replaced by live World Bank evidence when successful.
6. Related open-source activity — replaced by live GitHub evidence when successful.
7. Competitor revenue and monetization — pending paid-provider access.
8. Review sentiment and top features — pending a viable provider.
9. Competitor growth trend — wording remains pending/demo when no usable repeated snapshot exists; live App Store metadata can include computed trends after repeated runs.

No placeholder may be presented as researched fact.

## Creator Intelligence

Creator Intelligence is a shared platform dataset, not venture-scoped research.

Implemented pieces:

- authenticated users can register a YouTube channel;
- a daily Vercel cron uses the official YouTube Data API to discover recent uploads;
- an experimental Playwright/Chromium connector attempts to retrieve public caption data;
- keyword heuristics extract creator-reported claims about costs, revenue, users, tooling, timelines, problems, and marketing;
- claims are stored as unverified creator self-reports and displayed on `/channels`.

Partial or disconnected pieces:

- handle-based channels remain unresolved without API-assisted resolution;
- transcript retrieval is unverified live and expected to fail normally under bot detection or page changes;
- the exported comments fetcher is unused;
- creator claims are not associated with ventures and are not used by Research, Compare, Build, or Simulator;
- there is no corroboration workflow despite the schema allowing `corroborated` confidence.

## Evidence consumed downstream

Simulator currently consumes from the latest available records:

- App Store competitor rating counts → traction classification and growth multiplier;
- top competitor name → market-event narration;
- World Bank internet penetration → reach multiplier;
- GitHub active repository count → initial product-quality/technical-risk bonus.

Compare consumes structured metadata from each venture's latest research mission:

- live/pending finding counts;
- competitor traction and count;
- population; and
- active/total related repositories.

Build Studio and Monitor do not consume research findings.

## Current quality controls

- 30-second per-venture research cooldown.
- Timeouts and graceful fallbacks around external requests.
- Idea-aware search-query tests.
- Unit tests for geography, newcomers, trend calculation, GitHub formatting, metadata wiring, and heuristic extraction.
- Structured UI distinguishes live evidence, state, demo status, limitations, and next tests.

## Not currently implemented

- Source registry with access terms and freshness policy.
- Contradiction handling or multi-source synthesis.
- Research citations beyond source-derived summaries/links in structured results.
- Research-quality evaluations or hallucination grading.
- Background venture-research jobs, retries, resumability, or queued mission states in practice.
- Licensed competitor revenue, reviews, or monetization data.

These are current absences. The accepted target model below promotes several of them into product requirements while leaving implementation sequencing to the roadmap.

## Research target model — newly required

The evidence path is:

**Answer → synthesis → finding → evidence → original source**

Evidence records must preserve source, URL, date, freshness, claim type, contradictions, confidence, and availability state such as LIVE, PARTIAL, DEMO, or UNAVAILABLE. Claim types must distinguish fact, source claim, observation, inference, assumption, and hypothesis.

The current schema does not preserve all of those fields, so this target is not implemented yet. Existing `state`, `is_demo`, limitations, metadata, and source-derived URLs are a partial foundation.

Never fabricate revenue, downloads, market share, percentages, conversion, success probability, or competitor traction numbers. A percentage may be shown only when calculated from an identified retrieved sample. Missing evidence remains missing.

## Required source breadth

Research should eventually synthesize App Store and Google Play data; YouTube metadata, recent videos, appropriate transcripts, and useful comments; competitor sites and pricing; reviews; GitHub; Hugging Face/model hubs; official APIs, documentation, and changelogs; World Bank/government data; academic papers; Product Hunt/startup communities; and relevant web/community signals.

Free/public sources are preferred where practical. Paid market-intelligence providers are optional enrichment, not launch dependencies. Each source must degrade honestly when unavailable.

## Beginner Research and System View

Beginner-facing synthesis must group intelligence into:

- People & alternatives;
- Can it be built?;
- Market & money; and
- Reasons to be careful.

System View may expose source status, agent/workflow detail, contradictions, evidence weighting, and technical internals. Research progress must represent actual work rather than cosmetic timers.

## Creator Intelligence — newly required direction

Creator Intelligence is a strategic research source. The target is approximately 50–100+ curated channels, prioritizing roughly the prior 5–7 days, extracting what was built and why, tools/APIs/models, time and costs, creator-stated users/downloads/revenue, distribution, what worked/failed, and emerging workflows.

Creator statements remain source claims until independently corroborated. Transcript retrieval must become a replaceable router supporting authorized/public/licensed sources, creator/user-supplied transcripts, future providers, and an experimental browser route only where appropriate. The platform must not warehouse unnecessary full copyrighted transcripts.

Creator evidence should eventually feed Research, Compare, Shape, Technology, Simulator, and Build Studio. None of those downstream connections currently exists.

## Review Intelligence — newly required

Review acquisition must use replaceable adapters. Retrieved samples should be clustered into complaints, praise, requests, bugs, pricing/paywall issues, onboarding issues, and missing features. Cluster percentages are prohibited unless calculated from the actual retrieved sample. The current product has no working review adapter or review screen.

## Technology & Ownership Intelligence — newly required

For each venture, this intelligence must identify required capabilities, hosted APIs/free tiers, open-source and self-hosted alternatives, local/downloadable models, GitHub/Hugging Face options, licenses and commercial restrictions, maturity/activity/docs, lock-in, privacy, recurring cost, replacement difficulty, and browser/local/VPS/GPU/cloud implications.

Recommendations must be separated into fastest MVP, lowest recurring cost, best long-term ownership, and balanced option. Fixed/reference assumptions must never be presented as researched recommendations. Current Build Studio does not satisfy this requirement.

## Future multi-agent evidence synthesis

Potential specialist roles include User Pain, Competitor, Similar Apps, Creator Signals, Technology, Market, Monetization, and Red Team. Fan-in should weigh source quality, independence, freshness, directness, corroboration, contradictions, and category/geographic relevance. Agreement counts alone must never determine truth. This remains future architecture.
