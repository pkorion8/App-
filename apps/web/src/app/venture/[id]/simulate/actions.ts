"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { startSimulationSchema } from "@venture-sandbox/schemas";
import {
  advanceDay,
  createInitialState,
  requiresDecision,
  resolveDecision,
  rowToSimulationState,
  simulationStateToRow,
  type SimulationEvent,
} from "@venture-sandbox/simulator";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const initial = createInitialState(parsed.data.budgetTotal);

  const { error } = await supabase.from("simulation_runs").insert({
    venture_id: ventureId,
    workspace_id: venture.workspace_id,
    ...simulationStateToRow(initial),
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  redirect(`/venture/${ventureId}/simulate`);
}

async function loadRun(ventureId: string, runId: string) {
  const supabase = await createSupabaseServerClient();
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
