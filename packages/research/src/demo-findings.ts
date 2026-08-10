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
  ];
}
