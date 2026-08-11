import type {
  AdvanceDayResult,
  DecisionOption,
  MarketContext,
  SimulationEvent,
  SimulationState,
} from "./types";

/**
 * Simulator V1 engine — a real, deterministic state machine (spec's own
 * rule: AI narrates, it never overrides deterministic state). No
 * randomness: every run with the same inputs and decisions produces the
 * same outcome, which is what makes "you skipped X on day N, that's why
 * Y happened later" an honest statement rather than a dressed-up dice
 * roll. Depth (event variety, category-specific calibration, branching)
 * is intentionally V1 -- see AGENTS.md for what's deferred post-launch.
 */

const DAILY_BURN_RATE = 0.02; // 2% of total budget per day
const BUILD_PROGRESS_PER_DAY = 10;
const BUILD_EVENT_TRIGGER_PROGRESS = 40;
const DAILY_NEW_USERS_BASE = 3;
const RETURNING_USER_FLOOR = 0.3;
const PRICE_PER_CONVERTING_USER = 8;
const CONVERSION_RATE = 0.05;
const MARKET_EVENT_TRIGGER_USERS = 80;
const MONTH_1_DAY = 30;

export const DEFAULT_MARKET_CONTEXT: MarketContext = {
  hasResearch: false,
  competitorTraction: "None",
  topCompetitorName: null,
  summary:
    "No research has been run for this venture yet — this simulation is running " +
    "without real market context. Run Research first for starting conditions " +
    "calibrated to actual competitors.",
};

// Real competitor traction (from Research's live App Store search) makes
// user growth harder or easier here -- an established, high-traction field
// is a real headwind; research that actually confirms no competitors is a
// real tailwind. This is the one place market context changes the
// deterministic math, not just the narration.
//
// Never having run Research at all is neutral (1.0), not a tailwind:
// "no evidence of competitors" only means something once Research has
// actually looked and found none -- absence of a search is not evidence.
const TRACTION_GROWTH_MULTIPLIER: Record<MarketContext["competitorTraction"], number> = {
  None: 1.15,
  Weak: 1.05,
  Moderate: 1.0,
  Strong: 0.85,
};

function growthMultiplierFor(marketContext: MarketContext): number {
  return marketContext.hasResearch ? TRACTION_GROWTH_MULTIPLIER[marketContext.competitorTraction] : 1.0;
}

export function createInitialState(
  budgetTotal: number,
  marketContext: MarketContext = DEFAULT_MARKET_CONTEXT,
): SimulationState {
  return {
    stage: "resource_planning",
    virtualDay: 0,
    cashRemaining: budgetTotal,
    budgetTotal,
    buildProgressPct: 0,
    productQualityPct: 50,
    technicalRisk: "medium",
    launchReadinessPct: 0,
    totalUsers: 0,
    returningUsers: 0,
    monthlyRevenue: 0,
    monthlyCost: 0,
    marketConfidence: "unknown",
    history: [
      { day: 0, cashRemaining: budgetTotal, totalUsers: 0, monthlyRevenue: 0, buildProgressPct: 0, productQualityPct: 50 },
    ],
    marketContext,
  };
}

const DECISION_STAGES = new Set(["build_event", "mvp_ready", "user_or_market_event"]);

export function requiresDecision(state: SimulationState): boolean {
  return DECISION_STAGES.has(state.stage);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function advanceDay(state: SimulationState): AdvanceDayResult {
  if (requiresDecision(state)) {
    return { state, events: [], awaitingDecision: true };
  }
  if (state.stage === "complete") {
    return { state, events: [], awaitingDecision: false };
  }

  const events: SimulationEvent[] = [];
  const next: SimulationState = { ...state, virtualDay: state.virtualDay + 1 };

  const dailyBurn = next.budgetTotal * DAILY_BURN_RATE;
  next.cashRemaining = clamp(next.cashRemaining - dailyBurn, 0, next.budgetTotal);

  switch (state.stage) {
    case "resource_planning": {
      next.stage = "build";
      events.push({
        eventType: "build",
        description: "Build begins.",
        effect: {},
      });
      events.push({
        eventType: "market",
        description: next.marketContext.summary,
        effect: {},
      });
      break;
    }

    case "build": {
      const before = next.buildProgressPct;
      next.buildProgressPct = clamp(before + BUILD_PROGRESS_PER_DAY, 0, 100);
      if (before < BUILD_EVENT_TRIGGER_PROGRESS && next.buildProgressPct >= BUILD_EVENT_TRIGGER_PROGRESS) {
        next.stage = "build_event";
        events.push({
          eventType: "technical",
          description: "A technical blocker shows up mid-build — a dependency doesn't behave as expected.",
          effect: {},
        });
      } else if (next.buildProgressPct >= 100) {
        next.stage = "mvp_ready";
        events.push({
          eventType: "build",
          description: "The first version is built.",
          effect: {},
        });
      }
      break;
    }

    case "pre_launch": {
      next.stage = "launch";
      next.launchReadinessPct = clamp(60 + (next.productQualityPct - 50) * 0.6, 0, 100);
      events.push({
        eventType: "build",
        description: "Launch day.",
        effect: {},
      });
      break;
    }

    case "launch":
    case "first_users": {
      if (state.stage === "launch") {
        next.stage = "first_users";
      }
      const growthMultiplier = growthMultiplierFor(next.marketContext);
      const dailyNewUsers = Math.round(
        (DAILY_NEW_USERS_BASE + Math.floor(next.productQualityPct / 20)) * growthMultiplier,
      );
      next.totalUsers = next.totalUsers + dailyNewUsers;
      const retentionRate = clamp(RETURNING_USER_FLOOR + next.productQualityPct / 200, 0, 0.9);
      next.returningUsers = Math.round(next.totalUsers * retentionRate);
      next.monthlyRevenue = Math.round(next.totalUsers * CONVERSION_RATE * PRICE_PER_CONVERTING_USER);
      next.monthlyCost = Math.round(dailyBurn * 30);

      if (state.totalUsers < MARKET_EVENT_TRIGGER_USERS && next.totalUsers >= MARKET_EVENT_TRIGGER_USERS) {
        next.stage = "user_or_market_event";
        const { topCompetitorName, competitorTraction } = next.marketContext;
        const marketEventDescription =
          topCompetitorName !== null
            ? `Growth is picking up — and so is competitive attention. Research found ${topCompetitorName} ` +
              `already has ${competitorTraction.toLowerCase()} traction in this market; expect them to notice too.`
            : "Growth is picking up — and so is competitive attention. A comparable app just launched a similar feature.";
        events.push({
          eventType: "market",
          description: marketEventDescription,
          effect: {},
        });
      } else if (next.virtualDay >= MONTH_1_DAY) {
        next.stage = "month_1";
        events.push({
          eventType: "user",
          description: "One virtual month in.",
          effect: {},
        });
      }
      break;
    }

    case "adaptation": {
      next.stage = "month_1";
      events.push({ eventType: "user", description: "One virtual month in.", effect: {} });
      break;
    }

    case "month_1": {
      next.stage = "complete";
      events.push({ eventType: "user", description: "Run complete.", effect: {} });
      break;
    }

    default:
      break;
  }

  next.history = [
    ...state.history,
    {
      day: next.virtualDay,
      cashRemaining: next.cashRemaining,
      totalUsers: next.totalUsers,
      monthlyRevenue: next.monthlyRevenue,
      buildProgressPct: next.buildProgressPct,
      productQualityPct: next.productQualityPct,
    },
  ];

  return { state: next, events, awaitingDecision: requiresDecision(next) };
}

export function getDecisionOptions(state: SimulationState): DecisionOption[] {
  switch (state.stage) {
    case "build_event":
      return [
        {
          id: "fix_properly",
          label: "Fix it properly",
          immediateEffectSummary: "Costs extra time and cash now; lowers technical risk and improves quality.",
        },
        {
          id: "workaround",
          label: "Ship a workaround",
          immediateEffectSummary: "No extra cost; risk and quality stay roughly where they are.",
        },
        {
          id: "ignore",
          label: "Ignore it for now",
          immediateEffectSummary: "Saves time and cash today; raises technical risk and lowers quality.",
        },
      ];
    case "mvp_ready":
      return [
        {
          id: "test_onboarding",
          label: "Test onboarding with a few real people first",
          immediateEffectSummary: "Costs a few days and some cash; meaningfully improves quality and readiness.",
        },
        {
          id: "launch_now",
          label: "Launch now",
          immediateEffectSummary: "Saves time and cash; quality stays as-is going into launch.",
        },
      ];
    case "user_or_market_event":
      return [
        {
          id: "double_down_marketing",
          label: "Spend more on acquisition",
          immediateEffectSummary: "Raises monthly cost; accelerates user growth.",
        },
        {
          id: "improve_product",
          label: "Pause growth spend, improve the product",
          immediateEffectSummary: "Lowers monthly cost; raises quality, which compounds retention going forward.",
        },
        {
          id: "hold_steady",
          label: "Hold steady, keep watching",
          immediateEffectSummary: "No change now — you're choosing to wait for more signal before reacting.",
        },
      ];
    default:
      return [];
  }
}

export function resolveDecision(
  state: SimulationState,
  choiceId: string,
): { state: SimulationState; event: SimulationEvent } {
  const next = { ...state };

  if (state.stage === "build_event") {
    if (choiceId === "fix_properly") {
      next.cashRemaining = clamp(next.cashRemaining - next.budgetTotal * 0.05, 0, next.budgetTotal);
      next.technicalRisk = "low";
      next.productQualityPct = clamp(next.productQualityPct + 10, 0, 100);
    } else if (choiceId === "workaround") {
      // Deliberately no state change -- the honest middle option.
    } else if (choiceId === "ignore") {
      next.technicalRisk = "high";
      next.productQualityPct = clamp(next.productQualityPct - 15, 0, 100);
    }
    next.stage = "build";
    return {
      state: next,
      event: { eventType: "decision_effect", description: `Chose: ${choiceId}`, effect: {} },
    };
  }

  if (state.stage === "mvp_ready") {
    if (choiceId === "test_onboarding") {
      next.cashRemaining = clamp(next.cashRemaining - next.budgetTotal * 0.03, 0, next.budgetTotal);
      next.productQualityPct = clamp(next.productQualityPct + 15, 0, 100);
    }
    next.stage = "pre_launch";
    return {
      state: next,
      event: { eventType: "decision_effect", description: `Chose: ${choiceId}`, effect: {} },
    };
  }

  if (state.stage === "user_or_market_event") {
    if (choiceId === "double_down_marketing") {
      next.monthlyCost = Math.round(next.monthlyCost * 1.4);
      next.totalUsers = Math.round(next.totalUsers * 1.2);
    } else if (choiceId === "improve_product") {
      next.monthlyCost = Math.round(next.monthlyCost * 0.8);
      next.productQualityPct = clamp(next.productQualityPct + 12, 0, 100);
    }
    next.marketConfidence = choiceId === "hold_steady" ? "mixed" : "strong";
    next.stage = "adaptation";
    return {
      state: next,
      event: { eventType: "decision_effect", description: `Chose: ${choiceId}`, effect: {} },
    };
  }

  return { state: next, event: { eventType: "decision_effect", description: "No-op", effect: {} } };
}
