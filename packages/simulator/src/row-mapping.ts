import { DEFAULT_MARKET_CONTEXT } from "./engine";
import type { MarketContext, PricingModel, SimulationHistoryPoint, SimulationState } from "./types";

/**
 * Snake_case DB row <-> camelCase engine state. Lives here (not in
 * apps/web) so both the server actions that write state and any UI that
 * reads it use the exact same conversion -- a hand-cast in one call site
 * is how state fields silently drift out of sync with the engine's shape.
 */
export interface SimulationRunRow {
  stage: string;
  virtual_day: number;
  cash_remaining: number;
  budget_total: number;
  build_progress_pct: number;
  product_quality_pct: number;
  technical_risk: string;
  launch_readiness_pct: number;
  total_users: number;
  returning_users: number;
  monthly_revenue: number;
  monthly_cost: number;
  market_confidence: string;
  history?: unknown;
  market_context?: unknown;
  pricing_model?: string;
}

export function rowToSimulationState(row: SimulationRunRow): SimulationState {
  return {
    stage: row.stage as SimulationState["stage"],
    virtualDay: row.virtual_day,
    cashRemaining: row.cash_remaining,
    budgetTotal: row.budget_total,
    buildProgressPct: row.build_progress_pct,
    productQualityPct: row.product_quality_pct,
    technicalRisk: row.technical_risk as SimulationState["technicalRisk"],
    launchReadinessPct: row.launch_readiness_pct,
    totalUsers: row.total_users,
    returningUsers: row.returning_users,
    monthlyRevenue: row.monthly_revenue,
    monthlyCost: row.monthly_cost,
    marketConfidence: row.market_confidence as SimulationState["marketConfidence"],
    history: Array.isArray(row.history) ? (row.history as SimulationHistoryPoint[]) : [],
    // Spread onto defaults rather than trusting the stored JSON shape
    // outright -- a row written before a MarketContext field existed
    // (e.g. internetPenetrationPct/activeRelatedReposFound) would
    // otherwise deserialize with that field `undefined`, not `null`,
    // which the engine's `=== null` neutral-evidence checks don't treat
    // the same way.
    marketContext: isMarketContext(row.market_context)
      ? { ...DEFAULT_MARKET_CONTEXT, ...row.market_context }
      : DEFAULT_MARKET_CONTEXT,
    // "subscription" for rows written before this column existed --
    // exactly the engine's original, still-default revenue formula, so
    // old rows keep behaving the same as before this feature existed.
    pricingModel: (row.pricing_model as PricingModel | undefined) ?? "subscription",
  };
}

function isMarketContext(value: unknown): value is Partial<MarketContext> {
  return typeof value === "object" && value !== null && "hasResearch" in value;
}

export function simulationStateToRow(state: SimulationState) {
  return {
    stage: state.stage,
    virtual_day: state.virtualDay,
    cash_remaining: state.cashRemaining,
    budget_total: state.budgetTotal,
    build_progress_pct: state.buildProgressPct,
    product_quality_pct: state.productQualityPct,
    technical_risk: state.technicalRisk,
    launch_readiness_pct: state.launchReadinessPct,
    total_users: state.totalUsers,
    returning_users: state.returningUsers,
    monthly_revenue: state.monthlyRevenue,
    monthly_cost: state.monthlyCost,
    market_confidence: state.marketConfidence,
    history: state.history as unknown as Record<string, unknown>[],
    market_context: state.marketContext as unknown as Record<string, unknown>,
    pricing_model: state.pricingModel,
    status: state.stage === "complete" ? ("complete" as const) : ("running" as const),
  };
}
