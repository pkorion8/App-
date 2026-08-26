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
import { classifyRatingVolume } from "@venture-sandbox/research";
import { logEvent } from "@venture-sandbox/observability";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  if (!recentMission) return DEFAULT_MARKET_CONTEXT;

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

  const buildCost = buildPackage?.cost_estimate as unknown as { totalMonthly?: number } | undefined;
  const estimatedMonthlyCost = typeof buildCost?.totalMonthly === "number" ? buildCost.totalMonthly : null;
  const costNote = estimatedMonthlyCost !== null
    ? ` Build Studio estimates $${estimatedMonthlyCost}/mo in operating costs, added to this simulation's ongoing monthly cost once launched.`
    : "";

  const latestByAppId = new Map<number, { appName: string; ratingCount: number }>();
  for (const row of snapshotRows ?? []) {
    if (!latestByAppId.has(row.app_id)) latestByAppId.set(row.app_id, { appName: row.app_name, ratingCount: row.rating_count });
  }

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

  const reachNote = internetPenetrationPct !== null && internetPenetrationPct < 85
    ? ` Internet access in this geography is ${internetPenetrationPct.toFixed(0)}%; the simulator treats that only as a reach constraint, not as demand evidence.`
    : "";
  const techNote = activeRelatedReposFound !== null && activeRelatedReposFound >= 2
    ? ` Research also found ${activeRelatedReposFound} actively-maintained related open-source projects; the simulator uses that only as a technical-territory signal, not commercial proof.`
    : "";

  if (latestByAppId.size === 0) {
    return {
      hasResearch: true,
      ratingVolumeBand: "None",
      topCompetitorName: null,
      summary: "Research has been run for this venture, but its App Store search returned no usable competitor matches. That is not proof of no competition or low demand, so the simulation applies no competitor-based growth adjustment." + reachNote + techNote + costNote,
      internetPenetrationPct,
      activeRelatedReposFound,
      estimatedMonthlyCost,
    };
  }

  const entries = [...latestByAppId.values()];
  const ratingVolumeBand = classifyRatingVolume(entries.map((e) => e.ratingCount));
  const top = entries.reduce((best, e) => (e.ratingCount > best.ratingCount ? e : best));

  return {
    hasResearch: true,
    ratingVolumeBand,
    topCompetitorName: top.appName,
    summary:
      `Research found ${entries.length} App Store competitor${entries.length === 1 ? "" : "s"}. ` +
      `The observed rating-volume band is ${ratingVolumeBand.toLowerCase()} (largest listing: ${top.appName}, ${top.ratingCount.toLocaleString()} ratings). ` +
      `Rating counts are descriptive evidence only — not downloads, revenue, market share, success, or traction — and do not change simulated growth.${reachNote}${techNote}${costNote}`,
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
  const parsed = startSimulationSchema.safeParse({ budgetTotal: formData.get("budgetTotal") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  const realityMode = formData.get("simulationMode") === "reality";
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: venture } = await supabase.from("ventures").select("workspace_id").eq("id", ventureId).maybeSingle();
  if (!venture) return { status: "error", message: "Couldn't find this venture." };

  const [marketContext, shapeResult] = await Promise.all([
    buildMarketContext(supabase, ventureId),
    supabase.from("venture_shapes").select("pricing_model").eq("venture_id", ventureId).maybeSingle(),
  ]);
  const pricingModel = (shapeResult.data?.pricing_model ?? "subscription") as
    | "subscription" | "one_time" | "commission" | "ad_supported";
  const initial = createInitialState(parsed.data.budgetTotal, marketContext, pricingModel);
  const db = supabase as any;
  const { error } = await db.from("simulation_runs").insert({
    venture_id: ventureId,
    workspace_id: venture.workspace_id,
    ...simulationStateToRow(initial),
    reality_mode: realityMode,
    rewind_count: 0,
    parent_run_id: null,
    branch_origin_checkpoint_id: null,
    branch_label: realityMode ? "Reality timeline" : "Primary timeline",
  });

  if (error) return { status: "error", message: error.message };
  await supabase.from("ventures").update({ status: "simulating" }).eq("id", ventureId);

  logEvent({
    event: "simulation.started",
    actorId: user.id,
    workspaceId: venture.workspace_id,
    entityType: "venture",
    entityId: ventureId,
    metadata: {
      budget_total: parsed.data.budgetTotal,
      has_research: marketContext.hasResearch,
      rating_volume_band: marketContext.ratingVolumeBand ?? null,
      pricing_model: pricingModel,
      reality_mode: realityMode,
    },
  });

  redirect(`/venture/${ventureId}/simulate`);
}

async function loadRun(ventureId: string, runId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: run } = await supabase.from("simulation_runs").select("*").eq("id", runId).eq("venture_id", ventureId).maybeSingle();
  return { supabase, run };
}

export async function advanceSimDay(ventureId: string, runId: string, days = 1): Promise<void> {
  const { supabase, run } = await loadRun(ventureId, runId);
  if (!run) return;

  let currentState = rowToSimulationState(run);
  const allEvents: { virtualDay: number; eventType: SimulationEvent["eventType"]; description: string; effect: Record<string, unknown> }[] = [];

  for (let i = 0; i < days; i++) {
    if (requiresDecision(currentState) || currentState.stage === "complete") break;
    const result = advanceDay(currentState);
    currentState = result.state;
    for (const e of result.events) allEvents.push({ virtualDay: result.state.virtualDay, eventType: e.eventType, description: e.description, effect: e.effect });
  }

  await supabase.from("simulation_runs").update(simulationStateToRow(currentState)).eq("id", runId);
  if (currentState.stage === "complete") await supabase.from("ventures").update({ status: "simulated" }).eq("id", ventureId);

  if (allEvents.length > 0) {
    await supabase.from("simulation_events").insert(allEvents.map((e) => ({
      simulation_run_id: runId,
      workspace_id: run.workspace_id,
      virtual_day: e.virtualDay,
      event_type: e.eventType,
      description: e.description,
      effect: e.effect,
    })));
  }
  revalidatePath(`/venture/${ventureId}/simulate`);
}

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
 * Creates a preserved alternate timeline from a checkpoint. Standard runs
 * allow at most three rewinds along a timeline path; Reality Mode allows none.
 */
export async function rewindToCheckpoint(ventureId: string, checkpointId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const db = supabase as any;

  const { data: checkpoint } = await db.from("simulation_checkpoints")
    .select("workspace_id, state_snapshot, simulation_run_id, virtual_day, label")
    .eq("id", checkpointId)
    .maybeSingle();
  if (!checkpoint) return;

  const [{ data: venture }, { data: sourceRun }] = await Promise.all([
    db.from("ventures").select("workspace_id").eq("id", ventureId).maybeSingle(),
    db.from("simulation_runs").select("id, venture_id, workspace_id, reality_mode, rewind_count").eq("id", checkpoint.simulation_run_id).maybeSingle(),
  ]);
  if (!venture || !sourceRun || venture.workspace_id !== checkpoint.workspace_id || sourceRun.venture_id !== ventureId) return;
  if (sourceRun.reality_mode) return;
  if ((sourceRun.rewind_count ?? 0) >= 3) return;

  const nextRewindCount = (sourceRun.rewind_count ?? 0) + 1;
  const snapshot = checkpoint.state_snapshot as unknown as ReturnType<typeof simulationStateToRow>;

  const { data: newRun } = await db.from("simulation_runs").insert({
    venture_id: ventureId,
    workspace_id: checkpoint.workspace_id,
    ...snapshot,
    parent_run_id: sourceRun.id,
    branch_origin_checkpoint_id: checkpointId,
    rewind_count: nextRewindCount,
    reality_mode: false,
    branch_label: `Alternate ${nextRewindCount} · from day ${checkpoint.virtual_day}`,
  }).select("id").single();

  if (newRun) {
    await db.from("simulation_runs").update({ rewind_count: nextRewindCount }).eq("id", sourceRun.id);
    redirect(`/venture/${ventureId}/simulate?run=${newRun.id}`);
  }
}

export async function submitSimDecision(ventureId: string, runId: string, choiceId: string): Promise<void> {
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
