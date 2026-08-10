import type { SimulationState } from "./types";

export interface DecisionRecord {
  virtualDay: number;
  decisionType: string;
  choice: string;
}

/**
 * The explicit callback the product owner asked for by name: "You
 * launched without testing onboarding earlier. This may be contributing
 * to the current activation problem." Every note here traces to an
 * actual past decision plus an actual current metric threshold -- never
 * a generic "something went wrong" line. If the condition it names isn't
 * true, the note isn't shown.
 */
export function getDelayedConsequenceNotes(
  state: SimulationState,
  decisions: DecisionRecord[],
): string[] {
  const notes: string[] = [];

  const buildEventDecision = decisions.find((d) => d.decisionType === "build_event");
  if (buildEventDecision?.choice === "ignore") {
    if (state.technicalRisk === "high") {
      notes.push(
        `You chose to ignore the technical blocker on day ${buildEventDecision.virtualDay}. ` +
          `Technical risk is still high as a direct result of that.`,
      );
    }
    if (state.productQualityPct < 45) {
      notes.push(
        `Skipping the fix on day ${buildEventDecision.virtualDay} is still weighing on product ` +
          `quality (currently ${state.productQualityPct}%).`,
      );
    }
  }
  if (buildEventDecision?.choice === "workaround" && state.productQualityPct < 50) {
    notes.push(
      `The workaround from day ${buildEventDecision.virtualDay} held, but didn't improve quality — ` +
        `it's sitting at ${state.productQualityPct}%, unchanged since then.`,
    );
  }

  const mvpDecision = decisions.find((d) => d.decisionType === "mvp_ready");
  if (mvpDecision?.choice === "launch_now" && state.totalUsers > 0) {
    const retentionRate = state.returningUsers / state.totalUsers;
    if (retentionRate < 0.4) {
      notes.push(
        `You launched without testing onboarding on day ${mvpDecision.virtualDay}. That may be ` +
          `contributing to weaker-than-typical returning-user numbers now ` +
          `(${Math.round(retentionRate * 100)}% of users are returning).`,
      );
    }
  }

  const marketEventDecision = decisions.find((d) => d.decisionType === "user_or_market_event");
  if (marketEventDecision?.choice === "double_down_marketing" && state.monthlyRevenue < state.monthlyCost) {
    notes.push(
      `Spending more on acquisition on day ${marketEventDecision.virtualDay} grew users, but monthly ` +
        `revenue ($${state.monthlyRevenue}) still hasn't caught up to monthly cost ($${state.monthlyCost}).`,
    );
  }

  return notes;
}
