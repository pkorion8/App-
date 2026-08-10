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

export async function advanceSimDay(ventureId: string, runId: string): Promise<void> {
  const { supabase, run } = await loadRun(ventureId, runId);
  if (!run) return;

  const currentState = rowToSimulationState(run);
  const result = advanceDay(currentState);

  await supabase
    .from("simulation_runs")
    .update(simulationStateToRow(result.state))
    .eq("id", runId);

  if (result.events.length > 0) {
    await supabase.from("simulation_events").insert(
      result.events.map((e) => ({
        simulation_run_id: runId,
        workspace_id: run.workspace_id,
        virtual_day: result.state.virtualDay,
        event_type: e.eventType,
        description: e.description,
        effect: e.effect,
      })),
    );
  }

  revalidatePath(`/venture/${ventureId}/simulate`);
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
