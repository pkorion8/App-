import { describe, expect, it } from "vitest";
import {
  advanceDay,
  createInitialState,
  DEFAULT_MARKET_CONTEXT,
  getDecisionOptions,
  requiresDecision,
  resolveDecision,
} from "./engine";
import type { MarketContext, PricingModel, SimulationState } from "./types";

const MAX_STEPS = 500;

/**
 * Advances until `state.stage === target` OR the run completes, resolving
 * any decision encountered along the way with `choices[stage]`. Bounded --
 * advanceDay() is a no-op once a decision is required (see engine.ts), so
 * a bare "while stage !== X { advanceDay() }" loop spins forever the
 * moment it passes through an unresolved decision stage. This is the
 * actual bug that made the first version of this file hang.
 */
function driveTo(
  start: SimulationState,
  target: SimulationState["stage"],
  choices: Record<string, string> = {},
): SimulationState {
  let state = start;
  for (let i = 0; i < MAX_STEPS; i++) {
    if (state.stage === target || state.stage === "complete") return state;
    if (requiresDecision(state)) {
      const pick = choices[state.stage] ?? getDecisionOptions(state)[0]?.id;
      if (!pick) throw new Error(`Stuck at decision stage ${state.stage} with no choice available`);
      state = resolveDecision(state, pick).state;
      continue;
    }
    state = advanceDay(state).state;
  }
  throw new Error(`driveTo(${target}) did not terminate within ${MAX_STEPS} steps`);
}

function runFullSim(budget: number, choices: Record<string, string>): SimulationState {
  return driveTo(createInitialState(budget), "complete", choices);
}

const GOOD_CHOICES = {
  build_event: "fix_properly",
  mvp_ready: "test_onboarding",
  user_or_market_event: "improve_product",
};

const BAD_CHOICES = {
  build_event: "ignore",
  mvp_ready: "launch_now",
  user_or_market_event: "double_down_marketing",
};

describe("createInitialState", () => {
  it("seeds a day-0 history point matching the starting budget", () => {
    const state = createInitialState(10_000);
    expect(state.cashRemaining).toBe(10_000);
    expect(state.budgetTotal).toBe(10_000);
    expect(state.virtualDay).toBe(0);
    expect(state.history).toEqual([
      { day: 0, cashRemaining: 10_000, totalUsers: 0, monthlyRevenue: 0, buildProgressPct: 0, productQualityPct: 50 },
    ]);
  });

  it("defaults to an honest 'no research yet' market context when none is passed", () => {
    const state = createInitialState(10_000);
    expect(state.marketContext).toEqual(DEFAULT_MARKET_CONTEXT);
    expect(state.marketContext.hasResearch).toBe(false);
  });

  it("carries a passed-in market context through unchanged", () => {
    const marketContext: MarketContext = {
      hasResearch: true,
      competitorTraction: "Strong",
      topCompetitorName: "Rival App",
      summary: "test summary",
      internetPenetrationPct: null,
      activeRelatedReposFound: null,
      estimatedMonthlyCost: null,
    };
    const state = createInitialState(10_000, marketContext);
    expect(state.marketContext).toEqual(marketContext);
  });
});

describe("market context effects", () => {
  function driveToFirstUsers(marketContext?: MarketContext): SimulationState {
    return driveTo(createInitialState(10_000, marketContext), "first_users", {
      build_event: "workaround",
      mvp_ready: "launch_now",
    });
  }

  it("announces the venture's real market context as a day-0 event", () => {
    const withResearch = advanceDay(
      createInitialState(10_000, {
        hasResearch: true,
        competitorTraction: "Strong",
        topCompetitorName: "Rival App",
        summary: "Research found 3 competitors, strong traction overall.",
        internetPenetrationPct: null,
        activeRelatedReposFound: null,
        estimatedMonthlyCost: null,
      }),
    );
    expect(withResearch.events.some((e) => e.description.includes("Research found 3 competitors"))).toBe(true);

    const withoutResearch = advanceDay(createInitialState(10_000));
    expect(withoutResearch.events.some((e) => e.description.includes("No research has been run"))).toBe(true);
  });

  it("strong competitor traction slows user growth relative to no competitors found", () => {
    const strong = driveToFirstUsers({
      hasResearch: true,
      competitorTraction: "Strong",
      topCompetitorName: "Rival App",
      summary: "strong",
      internetPenetrationPct: null,
      activeRelatedReposFound: null,
      estimatedMonthlyCost: null,
    });
    const none = driveToFirstUsers({
      hasResearch: true,
      competitorTraction: "None",
      topCompetitorName: null,
      summary: "none",
      internetPenetrationPct: null,
      activeRelatedReposFound: null,
      estimatedMonthlyCost: null,
    });
    expect(strong.totalUsers).toBeLessThan(none.totalUsers);
  });

  it("references the real competitor name in the market event once growth triggers it", () => {
    let prev = driveTo(
      createInitialState(10_000, {
        hasResearch: true,
        competitorTraction: "Moderate",
        topCompetitorName: "Rival App",
        summary: "moderate",
        internetPenetrationPct: null,
        activeRelatedReposFound: null,
        estimatedMonthlyCost: null,
      }),
      "first_users",
      { build_event: "workaround", mvp_ready: "launch_now" },
    );
    const events: string[] = [];
    while (prev.stage !== "user_or_market_event") {
      const result = advanceDay(prev);
      prev = result.state;
      events.push(...result.events.map((e) => e.description));
    }
    expect(events.some((d) => d.includes("Rival App"))).toBe(true);
  });

  it("low internet access in the researched geography slows growth relative to high access, all else equal", () => {
    const lowAccess = driveToFirstUsers({
      hasResearch: true,
      competitorTraction: "Moderate",
      topCompetitorName: null,
      summary: "low access",
      internetPenetrationPct: 30,
      activeRelatedReposFound: null,
      estimatedMonthlyCost: null,
    });
    const highAccess = driveToFirstUsers({
      hasResearch: true,
      competitorTraction: "Moderate",
      topCompetitorName: null,
      summary: "high access",
      internetPenetrationPct: 95,
      activeRelatedReposFound: null,
      estimatedMonthlyCost: null,
    });
    expect(lowAccess.totalUsers).toBeLessThan(highAccess.totalUsers);
  });

  it("not knowing internet access (null) behaves identically to not having researched it at all", () => {
    const unknown = driveToFirstUsers({
      hasResearch: true,
      competitorTraction: "Moderate",
      topCompetitorName: null,
      summary: "unknown access",
      internetPenetrationPct: null,
      activeRelatedReposFound: null,
      estimatedMonthlyCost: null,
    });
    const noResearch = driveToFirstUsers(undefined);
    // Moderate traction (1.0x) with unknown reach (1.0x) should match the
    // fully-neutral default context's math exactly.
    expect(unknown.totalUsers).toBe(noResearch.totalUsers);
  });

  it("finding actively-maintained related open-source projects starts the venture with higher quality and lower technical risk", () => {
    const withTechEvidence = createInitialState(10_000, {
      hasResearch: true,
      competitorTraction: "None",
      topCompetitorName: null,
      summary: "tech evidence",
      internetPenetrationPct: null,
      activeRelatedReposFound: 4,
      estimatedMonthlyCost: null,
    });
    const withoutTechEvidence = createInitialState(10_000, {
      hasResearch: true,
      competitorTraction: "None",
      topCompetitorName: null,
      summary: "no tech evidence",
      internetPenetrationPct: null,
      activeRelatedReposFound: 0,
      estimatedMonthlyCost: null,
    });
    expect(withTechEvidence.productQualityPct).toBeGreaterThan(withoutTechEvidence.productQualityPct);
    expect(withTechEvidence.technicalRisk).toBe("low");
    expect(withoutTechEvidence.technicalRisk).toBe("medium");
  });

  it("Build Studio's real cost estimate adds a floor to monthlyCost once launched, on top of burn", () => {
    const withCostEstimate = driveToFirstUsers({
      hasResearch: true,
      competitorTraction: "None",
      topCompetitorName: null,
      summary: "has cost estimate",
      internetPenetrationPct: null,
      activeRelatedReposFound: null,
      estimatedMonthlyCost: 500,
    });
    const withoutCostEstimate = driveToFirstUsers({
      hasResearch: true,
      competitorTraction: "None",
      topCompetitorName: null,
      summary: "no cost estimate",
      internetPenetrationPct: null,
      activeRelatedReposFound: null,
      estimatedMonthlyCost: null,
    });
    expect(withCostEstimate.monthlyCost).toBe(withoutCostEstimate.monthlyCost + 500);
  });

  it("each pricing model produces a genuinely different revenue formula for identical simulated growth", () => {
    const runFor = (pricingModel: PricingModel) =>
      driveTo(createInitialState(10_000, DEFAULT_MARKET_CONTEXT, pricingModel), "first_users", {
        build_event: "workaround",
        mvp_ready: "launch_now",
      });

    const subscription = runFor("subscription");
    const oneTime = runFor("one_time");
    const commission = runFor("commission");
    const adSupported = runFor("ad_supported");

    // Pricing model is a revenue-formula choice only -- it must never
    // change the deterministic growth math itself.
    expect(oneTime.totalUsers).toBe(subscription.totalUsers);
    expect(commission.totalUsers).toBe(subscription.totalUsers);
    expect(adSupported.totalUsers).toBe(subscription.totalUsers);

    const revenues = [
      subscription.monthlyRevenue,
      oneTime.monthlyRevenue,
      commission.monthlyRevenue,
      adSupported.monthlyRevenue,
    ];
    expect(new Set(revenues).size).toBe(revenues.length);
  });

  it("one-time-purchase revenue stays flat with a constant new-user rate, while subscription revenue keeps compounding with the growing user base", () => {
    let subscriptionState = createInitialState(10_000, DEFAULT_MARKET_CONTEXT, "subscription");
    let oneTimeState = createInitialState(10_000, DEFAULT_MARKET_CONTEXT, "one_time");
    subscriptionState = driveTo(subscriptionState, "first_users", { build_event: "workaround", mvp_ready: "launch_now" });
    oneTimeState = driveTo(oneTimeState, "first_users", { build_event: "workaround", mvp_ready: "launch_now" });

    const oneTimeRevenueAtEntry = oneTimeState.monthlyRevenue;
    const subscriptionRevenueAtEntry = subscriptionState.monthlyRevenue;

    // Advance several more days with no decisions to take (quality/
    // traction stay constant), so the daily new-user rate itself is flat.
    for (let i = 0; i < 5; i++) {
      subscriptionState = advanceDay(subscriptionState).state;
      oneTimeState = advanceDay(oneTimeState).state;
    }

    expect(oneTimeState.totalUsers).toBe(subscriptionState.totalUsers); // pricing model never changes growth math
    // One-time revenue is driven only by this period's (constant) new
    // cohort, so it stays flat; subscription revenue is proportional to
    // the ever-growing cumulative base, so it keeps climbing.
    expect(oneTimeState.monthlyRevenue).toBe(oneTimeRevenueAtEntry);
    expect(subscriptionState.monthlyRevenue).toBeGreaterThan(subscriptionRevenueAtEntry);
  });
});

describe("advanceDay", () => {
  it("is a no-op when a decision is required (returns the same state, still awaiting)", () => {
    const before = driveTo(createInitialState(10_000), "build_event");
    expect(requiresDecision(before)).toBe(true);

    const result = advanceDay(before);
    expect(result.state).toBe(before);
    expect(result.awaitingDecision).toBe(true);
    expect(result.events).toEqual([]);
  });

  it("is a no-op once the run is complete", () => {
    const finished = runFullSim(10_000, GOOD_CHOICES);
    expect(finished.stage).toBe("complete");
    const result = advanceDay(finished);
    expect(result.state).toBe(finished);
    expect(result.events).toEqual([]);
  });

  it("burns cash and progresses build day over day before any decision point", () => {
    let state = createInitialState(10_000);
    state = advanceDay(state).state; // resource_planning -> build, day 1
    expect(state.stage).toBe("build");
    expect(state.cashRemaining).toBeLessThan(10_000);
    expect(state.buildProgressPct).toBe(0);

    state = advanceDay(state).state; // day 2, build progress starts accruing
    expect(state.buildProgressPct).toBeGreaterThan(0);
  });

  it("never lets cash go negative or above the starting budget", () => {
    const state = driveTo(createInitialState(1_000), "complete", GOOD_CHOICES);
    expect(state.cashRemaining).toBeGreaterThanOrEqual(0);
    expect(state.cashRemaining).toBeLessThanOrEqual(1_000);
  });

  it("appends exactly one history point per day advanced, with monotonically increasing days", () => {
    let state = createInitialState(10_000);
    for (let i = 0; i < 5; i++) {
      state = advanceDay(state).state;
    }
    expect(state.history).toHaveLength(6); // day 0 seed + 5 advances
    const days = state.history.map((h) => h.day);
    for (let i = 1; i < days.length; i++) {
      expect(days[i]).toBeGreaterThan(days[i - 1]!);
    }
  });
});

describe("resolveDecision", () => {
  it("build_event: ignore raises technical risk and lowers quality; fix_properly does the opposite", () => {
    const state = driveTo(createInitialState(10_000), "build_event");

    const ignored = resolveDecision(state, "ignore").state;
    expect(ignored.technicalRisk).toBe("high");
    expect(ignored.productQualityPct).toBeLessThan(state.productQualityPct);

    const fixed = resolveDecision(state, "fix_properly").state;
    expect(fixed.technicalRisk).toBe("low");
    expect(fixed.productQualityPct).toBeGreaterThan(state.productQualityPct);
    expect(fixed.cashRemaining).toBeLessThan(state.cashRemaining);
  });

  it("build_event: workaround is a genuine no-op on risk/quality", () => {
    const state = driveTo(createInitialState(10_000), "build_event");

    const result = resolveDecision(state, "workaround").state;
    expect(result.technicalRisk).toBe(state.technicalRisk);
    expect(result.productQualityPct).toBe(state.productQualityPct);
    expect(result.cashRemaining).toBe(state.cashRemaining);
  });

  it("mvp_ready: launch_now is cheaper than test_onboarding but skips a quality bump", () => {
    const state = driveTo(createInitialState(10_000), "mvp_ready", { build_event: "workaround" });

    const launched = resolveDecision(state, "launch_now").state;
    const tested = resolveDecision(state, "test_onboarding").state;

    expect(launched.cashRemaining).toBeGreaterThan(tested.cashRemaining);
    expect(tested.productQualityPct).toBeGreaterThan(launched.productQualityPct);
  });

  it("decision resolution always returns a decision_effect event and moves the stage forward", () => {
    const state = driveTo(createInitialState(10_000), "build_event");

    const { state: next, event } = resolveDecision(state, "workaround");
    expect(event.eventType).toBe("decision_effect");
    expect(next.stage).not.toBe("build_event");
  });
});

describe("getDecisionOptions", () => {
  it("returns no options outside a decision stage", () => {
    expect(getDecisionOptions(createInitialState(10_000))).toEqual([]);
  });

  it("returns exactly the 3 real options for build_event", () => {
    const state = driveTo(createInitialState(10_000), "build_event");
    const ids = getDecisionOptions(state).map((o) => o.id).sort();
    expect(ids).toEqual(["fix_properly", "ignore", "workaround"]);
  });
});

describe("full run determinism and decision consequences", () => {
  it("produces an identical final state for two runs given identical decisions (no hidden randomness)", () => {
    const a = runFullSim(10_000, GOOD_CHOICES);
    const b = runFullSim(10_000, GOOD_CHOICES);
    expect(a).toEqual(b);
  });

  it("good decisions produce a materially better outcome than bad ones from the same starting budget", () => {
    const good = runFullSim(10_000, GOOD_CHOICES);
    const bad = runFullSim(10_000, BAD_CHOICES);

    expect(good.stage).toBe("complete");
    expect(bad.stage).toBe("complete");
    expect(good.totalUsers).toBeGreaterThan(bad.totalUsers);
  });
});
