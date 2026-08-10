import type { SimulationState } from "./types";

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
  };
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
    status: state.stage === "complete" ? ("complete" as const) : ("running" as const),
  };
}
