import { describe, expect, it } from "vitest";
import { advanceDay, createInitialState, getDecisionOptions, requiresDecision, resolveDecision } from "./engine";
import type { MarketContext, SimulationState } from "./types";

function driveToFirstUsers(context: MarketContext): SimulationState {
  let state = createInitialState(10_000, context);
  for (let i = 0; i < 100; i++) {
    if (state.stage === "first_users" && state.totalUsers > 0) return state;
    if (requiresDecision(state)) {
      const choice = getDecisionOptions(state)[0]?.id;
      if (!choice) throw new Error(`No choice available at ${state.stage}`);
      state = resolveDecision(state, choice).state;
    } else {
      state = advanceDay(state).state;
    }
  }
  throw new Error("Simulation did not reach first users");
}

function context(ratingVolumeBand: "Low" | "High"): MarketContext {
  return {
    hasResearch: true,
    ratingVolumeBand,
    topCompetitorName: "Example App",
    summary: `${ratingVolumeBand} App Store rating volume`,
    internetPenetrationPct: null,
    activeRelatedReposFound: null,
    estimatedMonthlyCost: null,
  };
}

describe("research source boundaries in the simulator", () => {
  it("does not turn App Store rating volume into a growth adjustment", () => {
    const low = driveToFirstUsers(context("Low"));
    const high = driveToFirstUsers(context("High"));

    expect(high.totalUsers).toBe(low.totalUsers);
    expect(high.monthlyRevenue).toBe(low.monthlyRevenue);
  });

  it("labels competitive attention as simulated rather than observed behavior", () => {
    let state = driveToFirstUsers(context("High"));
    const descriptions: string[] = [];

    for (let i = 0; i < 100 && state.stage !== "user_or_market_event"; i++) {
      const result = advanceDay(state);
      state = result.state;
      descriptions.push(...result.events.map((event) => event.description));
    }

    const marketEvent = descriptions.find((description) => description.includes("competitive-attention event"));
    expect(marketEvent).toContain("simulated");
    expect(marketEvent).not.toContain("has strong traction");
  });
});
