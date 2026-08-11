"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { startSimulationSchema } from "@venture-sandbox/schemas";
import {
  advanceDay,
  createInitialState,
  DEFAULT_MARKET_CONTEXT,
  requiresDecision,
  resolveDecision,
  rowToSimulationState,
  simulationStateToRow,
  type MarketContext,
  type SimulationEvent,
} from "@venture-sandbox/simulator";
import { classifyTraction } from "@venture-sandbox/research";
import { logEvent } from "@venture-sandbox/observability";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Seeds a run's starting conditions from the venture's own Research
 * findings instead of ignoring them. Beyond competitor traction (from the
 * most recent live App Store search, stored per-app in
 * research_competitor_snapshots), this also reads the same research run's
 * World Bank and GitHub findings (findings.metadata) for internet-access
 * reach and technical-territory evidence -- reusing the structured data
 * the Research page's cards already render, not a new data model. If
 * Research has never been run for this venture, that's stated plainly
 * rather than silently defaulting.
 */
async function buildMarketContext(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ventureId: string,
): Promise<MarketContext> {
  const { data: recentMission } = await supabase
    .from("research_missions")
    .select("id, created_at")
    .eq("venture_id", ventureId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!recentMission) {
    return DEFAULT_MARKET_CONTEXT;
  }

  const [{ data: snapshotRows }, { data: findingRows }, { data: buildPackage }] = await Promise.all([
    supabase
      .from("research_competitor_snapshots")
      .select("app_id, app_name, rating_count, checked_at")
      .eq("venture_id", ventureId)
      .order("checked_at", { ascending: false }),
    supabase.from("findings").select("metadata").eq("mission_id", recentMission.id),
    supabase
      .from("build_packages")
      .select("cost_estimate")
      .eq("venture_id", ventureId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // Build Studio's real cost estimate, if one has been generated -- a
  // number that already exists and was previously completely disconnected
  // from the simulator's own (burn-rate-only) monthlyCost.
  const buildCost = buildPackage?.cost_estimate as unknown as { totalMonthly?: number } | undefined;
  const estimatedMonthlyCost = typeof buildCost?.totalMonthly === "number" ? buildCost.totalMonthly : null;
  const costNote =
    estimatedMonthlyCost !== null
      ? ` Build Studio estimates $${estimatedMonthlyCost}/mo in real operating costs, added to this simulation's ongoing monthly cost once launched.`
      : "";

  // Most recent snapshot per app, same dedup pattern as the research
  // action that writes these rows.
  const latestByAppId = new Map<number, { appName: string; ratingCount: number }>();
  for (const row of snapshotRows ?? []) {
    if (!latestByAppId.has(row.app_id)) {
      latestByAppId.set(row.app_id, { appName: row.app_name, ratingCount: row.rating_count });
    }
  }

  // Same findings.metadata the Research page's cards render -- read here
  // too rather than re-fetching or re-deriving from live APIs, since this
  // run's Research results are already the source of truth on file.
  let internetPenetrationPct: number | null = null;
  let activeRelatedReposFound: number | null = null;
  for (const row of findingRows ?? []) {
    const meta = row.metadata as { kind?: string } | null;
    if (meta?.kind === "market") {
      const indicators = (meta as { indicators?: { id: string; value: number }[] }).indicators ?? [];
      const internet = indicators.find((i) => i.id === "IT.NET.USER.ZS");
      if (internet) internetPenetrationPct = internet.value;
    }
    if (meta?.kind === "github") {
      const activeCount = (meta as { activeCount?: number }).activeCount;
      if (typeof activeCount === "number") activeRelatedReposFound = activeCount;
    }
  }

  const reachNote =
    internetPenetrationPct !== null && internetPenetrationPct < 85
      ? ` Internet access in this market is ${internetPenetrationPct.toFixed(0)}%, which tempers organic reach.`
      : "";
  const techNote =
    activeRelatedReposFound !== null && activeRelatedReposFound >= 2
      ? ` Research also found ${activeRelatedReposFound} actively-maintained related open-source projects — ` +
        `less unproven technical territory than average, reflected in a lower starting technical risk.`
      : "";

  if (latestByAppId.size === 0) {
    return {
      hasResearch: true,
      competitorTraction: "None",
      topCompetitorName: null,
      summary:
        "Research has been run for this venture, but its App Store search found no " +
        `competitors — simulation proceeding without a competitive-pressure adjustment.${reachNote}${techNote}${costNote}`,
      internetPenetrationPct,
      activeRelatedReposFound,
      estimatedMonthlyCost,
    };
  }

  const entries = [...latestByAppId.values()];
  const competitorTraction = classifyTraction(entries.map((e) => e.ratingCount));
  const top = entries.reduce((best, e) => (e.ratingCount > best.ratingCount ? e : best));

  return {
    hasResearch: true,
    competitorTraction,
    topCompetitorName: top.appName,
    summary:
      `Research found ${entries.length} competitor${entries.length === 1 ? "" : "s"} in the App Store, ` +
      `with ${competitorTraction.toLowerCase()} traction overall (top: ${top.appName}, ` +
      `${top.ratingCount.toLocaleString()} ratings). This simulation's growth conditions are calibrated to that.` +
      `${reachNote}${techNote}${costNote}`,
    internetPenetrationPct,
    activeRelatedReposFound,
    estimatedMonthlyCost,
  };
}

export interface StartSimulationState {
  status: "idle" | "error";
  message?: string;
}

export async function startSimulation(
  ventureId: string,
  _prevState: StartSimulationState,
  formData: FormData,
): Promise<StartSimulationState> {
  const parsed = startSimulationSchema.safeParse({
    budgetTotal: formData.get("budgetTotal"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: venture } = await supabase
    .from("ventures")
    .select("workspace_id")
    .eq("id", ventureId)
    .maybeSingle();
  if (!venture) {
    return { status: "error", message: "Couldn't find this venture." };
  }

  const [marketContext, shapeResult] = await Promise.all([
    buildMarketContext(supabase, ventureId),
    supabase.from("venture_shapes").select("pricing_model").eq("venture_id", ventureId).maybeSingle(),
  ]);
  // A founder decision from Shape, not Research evidence -- "not decided
  // yet" (null, including no Shape at all) falls back to "subscription",
  // the engine's original default behavior, same neutral-default pattern
  // as every MarketContext field.
  const pricingModel = (shapeResult.data?.pricing_model ?? "subscription") as
    | "subscription"
    | "one_time"
    | "commission"
    | "ad_supported";
  const initial = createInitialState(parsed.data.budgetTotal, marketContext, pricingModel);

  const { error } = await supabase.from("simulation_runs").insert({
    venture_id: ventureId,
    workspace_id: venture.workspace_id,
    ...simulationStateToRow(initial),
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  logEvent({
    event: "simulation.started",
    actorId: user.id,
    workspaceId: venture.workspace_id,
    entityType: "venture",
    entityId: ventureId,
    metadata: {
      budget_total: parsed.data.budgetTotal,
      has_research: marketContext.hasResearch,
      competitor_traction: marketContext.competitorTraction,
      pricing_model: pricingModel,
    },
  });

  redirect(`/venture/${ventureId}/simulate`);
}

async function loadRun(ventureId: string, runId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: run } = await supabase
    .from("simulation_runs")
    .select("*")
    .eq("id", runId)
    .eq("venture_id", ventureId)
    .maybeSingle();
  return { supabase, run };
}

/**
 * Advances up to `days` days in one call ("run next day" = 1, "run 3
 * days" = 3, "advance to next checkpoint" = a high cap that stops itself
 * the moment a decision is required or the run completes -- whichever
 * comes first, same loop, just a bigger ceiling).
 */
export async function advanceSimDay(
  ventureId: string,
  runId: string,
  days = 1,
): Promise<void> {
  const { supabase, run } = await loadRun(ventureId, runId);
  if (!run) return;

  let currentState = rowToSimulationState(run);
  const allEvents: { virtualDay: number; eventType: SimulationEvent["eventType"]; description: string; effect: Record<string, unknown> }[] = [];

  for (let i = 0; i < days; i++) {
    if (requiresDecision(currentState) || currentState.stage === "complete") break;
    const result = advanceDay(currentState);
    currentState = result.state;
    for (const e of result.events) {
      allEvents.push({
        virtualDay: result.state.virtualDay,
        eventType: e.eventType,
        description: e.description,
        effect: e.effect,
      });
    }
  }

  await supabase
    .from("simulation_runs")
    .update(simulationStateToRow(currentState))
    .eq("id", runId);

  if (allEvents.length > 0) {
    await supabase.from("simulation_events").insert(
      allEvents.map((e) => ({
        simulation_run_id: runId,
        workspace_id: run.workspace_id,
        virtual_day: e.virtualDay,
        event_type: e.eventType,
        description: e.description,
        effect: e.effect,
      })),
    );
  }

  revalidatePath(`/venture/${ventureId}/simulate`);
}

/** "Advance to next checkpoint": run until blocked, capped so it can't hang. */
export async function advanceToNextCheckpoint(ventureId: string, runId: string): Promise<void> {
  await advanceSimDay(ventureId, runId, 60);
}

export async function saveCheckpoint(ventureId: string, runId: string, label: string): Promise<void> {
  const { supabase, run } = await loadRun(ventureId, runId);
  if (!run) return;

  await supabase.from("simulation_checkpoints").insert({
    simulation_run_id: runId,
    workspace_id: run.workspace_id,
    virtual_day: run.virtual_day,
    label: label || null,
    state_snapshot: simulationStateToRow(rowToSimulationState(run)),
  });

  revalidatePath(`/venture/${ventureId}/simulate`);
}

/**
 * "Try a different path": creates a brand-new simulation_run seeded from
 * a saved checkpoint's state, so the original run stays intact and both
 * can be looked at side by side (via Compare, or just switching between
 * them) -- duplicate-and-replay rather than a full branching tree, which
 * is the V1 scope this was explicitly agreed to.
 */
export async function rewindToCheckpoint(ventureId: string, checkpointId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: checkpoint } = await supabase
    .from("simulation_checkpoints")
    .select("workspace_id, state_snapshot")
    .eq("id", checkpointId)
    .maybeSingle();
  if (!checkpoint) return;

  // ventureId comes from the caller (ultimately a route param), not from
  // the checkpoint itself -- verify it actually belongs to the same
  // workspace as the checkpoint before using it, so a member of workspace
  // A can't seed a new simulation_run against a venture_id that belongs
  // to workspace B while tagging it with workspace A's workspace_id.
  const { data: venture } = await supabase
    .from("ventures")
    .select("workspace_id")
    .eq("id", ventureId)
    .maybeSingle();
  if (!venture || venture.workspace_id !== checkpoint.workspace_id) return;

  const snapshot = checkpoint.state_snapshot as unknown as ReturnType<typeof simulationStateToRow>;

  const { data: newRun } = await supabase
    .from("simulation_runs")
    .insert({
      venture_id: ventureId,
      workspace_id: checkpoint.workspace_id,
      ...snapshot,
    })
    .select("id")
    .single();

  if (newRun) {
    redirect(`/venture/${ventureId}/simulate?run=${newRun.id}`);
  }
}

export async function submitSimDecision(
  ventureId: string,
  runId: string,
  choiceId: string,
): Promise<void> {
  const { supabase, run } = await loadRun(ventureId, runId);
  if (!run) return;

  const currentState = rowToSimulationState(run);
  if (!requiresDecision(currentState)) return;

  const decisionType = currentState.stage;
  const { state: nextState, event } = resolveDecision(currentState, choiceId);

  await supabase.from("simulation_runs").update(simulationStateToRow(nextState)).eq("id", runId);

  await supabase.from("simulation_decisions").insert({
    simulation_run_id: runId,
    workspace_id: run.workspace_id,
    virtual_day: nextState.virtualDay,
    decision_type: decisionType,
    choice: choiceId,
    immediate_effect: event.description,
  });

  revalidatePath(`/venture/${ventureId}/simulate`);
}
