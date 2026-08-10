export type SimulationStage =
  | "setup"
  | "resource_planning"
  | "build"
  | "build_event"
  | "mvp_ready"
  | "pre_launch"
  | "launch"
  | "first_users"
  | "user_or_market_event"
  | "adaptation"
  | "month_1"
  | "complete";

export type TechnicalRisk = "low" | "medium" | "high";
export type MarketConfidence = "unknown" | "weak" | "mixed" | "strong";

/** One point-in-time snapshot of the metrics that are worth charting over the run. */
export interface SimulationHistoryPoint {
  day: number;
  cashRemaining: number;
  totalUsers: number;
  monthlyRevenue: number;
  buildProgressPct: number;
  productQualityPct: number;
}

export interface SimulationState {
  stage: SimulationStage;
  virtualDay: number;
  cashRemaining: number;
  budgetTotal: number;
  buildProgressPct: number;
  productQualityPct: number;
  technicalRisk: TechnicalRisk;
  launchReadinessPct: number;
  totalUsers: number;
  returningUsers: number;
  monthlyRevenue: number;
  monthlyCost: number;
  marketConfidence: MarketConfidence;
  /** Append-only day-by-day trail, oldest first -- what the Simulate page charts. */
  history: SimulationHistoryPoint[];
}

export interface SimulationEvent {
  eventType: "build" | "technical" | "market" | "user" | "competitor" | "decision_effect";
  description: string;
  effect: Record<string, unknown>;
}

export interface AdvanceDayResult {
  state: SimulationState;
  events: SimulationEvent[];
  /** True when the stage now requires a decision before another day can advance. */
  awaitingDecision: boolean;
}

export type DecisionType = "build_event_response" | "mvp_launch_choice" | "market_event_response";

export interface DecisionOption {
  id: string;
  label: string;
  immediateEffectSummary: string;
}
