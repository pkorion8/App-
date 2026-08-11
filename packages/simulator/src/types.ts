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
export type CompetitorTraction = "None" | "Weak" | "Moderate" | "Strong";

/**
 * What this run's starting conditions were calibrated against, carried
 * over from the venture's own Research findings (real App Store
 * competitor data) rather than the simulation starting blind. `hasResearch:
 * false` is an honest, visible state -- not silently ignored -- so a run
 * started before Research ever ran says so instead of pretending to have
 * market context it doesn't.
 */
export interface MarketContext {
  hasResearch: boolean;
  competitorTraction: CompetitorTraction;
  topCompetitorName: string | null;
  summary: string;
}

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
  /** Real market signal this run was seeded with, if any -- see MarketContext. */
  marketContext: MarketContext;
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
