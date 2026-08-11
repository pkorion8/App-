import { describe, expect, it } from "vitest";
import { DEFAULT_MARKET_CONTEXT } from "./engine";
import { getDelayedConsequenceNotes } from "./narration";
import type { SimulationState } from "./types";

function baseState(overrides: Partial<SimulationState> = {}): SimulationState {
  return {
    stage: "month_1",
    virtualDay: 30,
    cashRemaining: 5_000,
    budgetTotal: 10_000,
    buildProgressPct: 100,
    productQualityPct: 60,
    technicalRisk: "low",
    launchReadinessPct: 80,
    totalUsers: 100,
    returningUsers: 60,
    monthlyRevenue: 500,
    monthlyCost: 200,
    marketConfidence: "mixed",
    history: [],
    marketContext: DEFAULT_MARKET_CONTEXT,
    pricingModel: "subscription",
    ...overrides,
  };
}

describe("getDelayedConsequenceNotes", () => {
  it("stays silent when every metric is healthy, even after a bad-sounding choice list", () => {
    const state = baseState({ technicalRisk: "low", productQualityPct: 80 });
    const notes = getDelayedConsequenceNotes(state, [
      { virtualDay: 5, decisionType: "build_event", choice: "fix_properly" },
      { virtualDay: 12, decisionType: "mvp_ready", choice: "test_onboarding" },
      { virtualDay: 20, decisionType: "user_or_market_event", choice: "improve_product" },
    ]);
    expect(notes).toEqual([]);
  });

  it("calls out ignoring a technical blocker only when technical risk is actually still high", () => {
    const decisions = [{ virtualDay: 5, decisionType: "build_event", choice: "ignore" }];

    const stillBroken = getDelayedConsequenceNotes(baseState({ technicalRisk: "high" }), decisions);
    expect(stillBroken.some((n) => n.includes("day 5"))).toBe(true);

    const recovered = getDelayedConsequenceNotes(baseState({ technicalRisk: "low" }), decisions);
    expect(recovered.some((n) => n.includes("ignore the technical blocker"))).toBe(false);
  });

  it("ties weak retention back to a launch_now decision, with the real numbers substituted in", () => {
    const decisions = [{ virtualDay: 12, decisionType: "mvp_ready", choice: "launch_now" }];
    const state = baseState({ totalUsers: 100, returningUsers: 20 }); // 20% retention, below the 40% threshold

    const notes = getDelayedConsequenceNotes(state, decisions);
    expect(notes.some((n) => n.includes("day 12") && n.includes("20%"))).toBe(true);
  });

  it("does not fire the retention note when retention is actually fine, despite having launched without testing", () => {
    const decisions = [{ virtualDay: 12, decisionType: "mvp_ready", choice: "launch_now" }];
    const state = baseState({ totalUsers: 100, returningUsers: 80 }); // 80% retention, well above threshold

    const notes = getDelayedConsequenceNotes(state, decisions);
    expect(notes.some((n) => n.includes("launched without testing"))).toBe(false);
  });

  it("only evaluates a decision type if it actually happened in this run", () => {
    // No build_event decision recorded at all -- must not fabricate a note about one.
    const notes = getDelayedConsequenceNotes(baseState({ technicalRisk: "high" }), []);
    expect(notes).toEqual([]);
  });
});
