import type { FindingState } from "@venture-sandbox/domain";

export interface DemoFindingInput {
  ventureName: string;
  ideaText: string;
  targetUser: string;
  geography: string;
}

export interface DemoFinding {
  normalizedClaim: string;
  userFacingSummary: string;
  state: FindingState;
  limitations: string;
  nextTest: string;
}

const NO_SOURCE_LIMITATION =
  "No live data source is connected yet — this is a placeholder showing " +
  "where a researched, cited answer will appear once one is.";

// These three specifically stay pending on purpose, not by oversight --
// no free source for them exists anywhere (revenue, reviews), or the
// data literally cannot exist without checking repeatedly over time
// (trend). They're listed every single research run precisely so the
// gap is never silently forgotten -- see AGENTS.md for the full
// rationale and cost breakdown behind each one.
const REVENUE_PENDING_LIMITATION =
  "Connection pending — requires a paid provider (e.g. AppFigures' Optimize tier, " +
  "roughly $100-150/mo) since no free source publishes competitor revenue or " +
  "download estimates. Even paid providers only ever give a modeled estimate, " +
  "never a competitor's real sales figures.";
const REVIEWS_PENDING_LIMITATION =
  "Connection pending — no free source exists for this at all. Apple's public " +
  "review feed reliably returns zero entries (tested, not assumed) and Google " +
  "Play has no free review API. Only paid review-aggregation tools have this.";
const TREND_PENDING_LIMITATION =
  "Connection pending — this needs the same competitors checked again over " +
  "weeks/months and compared, which a single research run can never show. " +
  "Free to build (no paid data needed), just not built yet.";

/**
 * Placeholder findings for the 4 beginner research groups (spec §21.2
 * Slice 2), used until a real, credentialed source (App Store listings,
 * YouTube, GitHub, etc. — see addendum §7.2) is wired up per venture.
 *
 * Every finding here is state: UNKNOWN and is_demo: true (set by the
 * caller) — this function must never claim SOLID/MIXED/WEAK confidence
 * for something nobody actually checked. That would violate the same
 * evidence-honesty rule this whole product is built around.
 */
export function generateDemoFindings(input: DemoFindingInput): DemoFinding[] {
  const { ventureName, ideaText, targetUser, geography } = input;
  const state: FindingState = "UNKNOWN";

  return [
    {
      normalizedClaim: `Competitor landscape for "${ventureName}" in ${geography}`,
      userFacingSummary:
        `Once connected, this will show apps already solving a similar ` +
        `problem to "${ideaText}" — who's doing well, who's struggling, ` +
        `and what they charge.`,
      state,
      limitations: NO_SOURCE_LIMITATION,
      nextTest: "Search app stores and Product Hunt for the closest 5-10 existing products.",
    },
    {
      normalizedClaim: `Demand signal from ${targetUser} in ${geography}`,
      userFacingSummary:
        `Once connected, this will show whether ${targetUser} are actively ` +
        `looking for something like this — forum threads, search interest, ` +
        `and complaints about current options.`,
      state,
      limitations: NO_SOURCE_LIMITATION,
      nextTest: "Check Google Trends and relevant subreddits/forums for direct evidence of demand.",
    },
    {
      normalizedClaim: `Cost and time to build a first version of "${ventureName}"`,
      userFacingSummary:
        `Once connected, this will pull real examples from indie founders ` +
        `who've shipped something similar — what tools they used, how long ` +
        `it took, and roughly what it cost.`,
      state,
      limitations: NO_SOURCE_LIMITATION,
      nextTest: "Pull build-journey videos from curated YouTube channels covering similar apps.",
    },
    {
      normalizedClaim: `Early risks and gaps for "${ventureName}"`,
      userFacingSummary:
        `Once connected, this will flag the obvious ways this idea could ` +
        `struggle — a crowded niche, a hard technical dependency, or a ` +
        `regulatory issue specific to ${geography}.`,
      state,
      limitations: NO_SOURCE_LIMITATION,
      nextTest: "Cross-check technical feasibility (APIs, licensing) once Technology & Ownership research is connected.",
    },
    {
      normalizedClaim: `Market size & digital readiness for ${geography}`,
      userFacingSummary:
        `Once connected, this will show population, income level, and internet ` +
        `access for ${geography} — the macro backdrop for how big this market ` +
        `could realistically be.`,
      state,
      limitations: NO_SOURCE_LIMITATION,
      nextTest: "Pull population, GDP per capita, and internet penetration from the World Bank Open Data API.",
    },
    {
      normalizedClaim: `Related open-source projects for "${ventureName}"`,
      userFacingSummary:
        `Once connected, this will show whether something like "${ideaText}" already ` +
        `exists as an open-source project — how popular it is and whether it's still ` +
        `actively maintained.`,
      state,
      limitations: NO_SOURCE_LIMITATION,
      nextTest: "Search GitHub for repositories matching the idea and check their recent activity.",
    },
    {
      normalizedClaim: `Revenue & monetization model for "${ventureName}"`,
      userFacingSummary:
        `Connection pending. Once a paid provider is connected, this will show ` +
        `competitors' estimated revenue, download volume, and pricing/subscription ` +
        `model — not available from any free source that exists.`,
      state,
      limitations: REVENUE_PENDING_LIMITATION,
      nextTest: "Connect a paid app-intelligence provider (e.g. AppFigures) when budget allows.",
    },
    {
      normalizedClaim: `Reviews & ratings sentiment for "${ventureName}"`,
      userFacingSummary:
        `Connection pending. Once a paid provider is connected, this will show what ` +
        `users actually say in reviews — what they like, what they complain about, ` +
        `and why competitors succeed or struggle. No free source has this at all.`,
      state,
      limitations: REVIEWS_PENDING_LIMITATION,
      nextTest: "Connect a paid review-aggregation provider when budget allows.",
    },
    {
      normalizedClaim: `Growth trend for competitors in ${geography}`,
      userFacingSummary:
        `Connection pending. Once built, this will show whether the competitors found ` +
        `above are trending up or down over time — a single research run only ever ` +
        `sees one moment, never a trend.`,
      state,
      limitations: TREND_PENDING_LIMITATION,
      nextTest: "Build a scheduled job that re-checks the same competitors weekly/monthly and compares.",
    },
  ];
}
