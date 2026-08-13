"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addOutcomeSchema } from "@venture-sandbox/schemas";
import { logEvent } from "@venture-sandbox/observability";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AddOutcomeState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"metricType" | "metricValue" | "note", string>>;
}

export async function addOutcome(ventureId: string, _prevState: AddOutcomeState, formData: FormData): Promise<AddOutcomeState> {
  const parsed = addOutcomeSchema.safeParse({ metricType: formData.get("metricType"), metricValue: formData.get("metricValue"), note: formData.get("note") || undefined });
  if (!parsed.success) {
    const fieldErrors: AddOutcomeState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "metricType" || key === "metricValue" || key === "note") fieldErrors[key] = issue.message;
    }
    return { status: "error", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: venture } = await supabase.from("ventures").select("workspace_id").eq("id", ventureId).maybeSingle();
  if (!venture) return { status: "error", message: "Couldn't find this venture." };

  // The generated Database type is intentionally hand-maintained and lags migration 0014;
  // use the runtime client for this insert until regenerated types land.
  const db = supabase as any;
  const { error } = await db.from("venture_outcomes").insert({
    venture_id: ventureId,
    workspace_id: venture.workspace_id,
    metric_type: parsed.data.metricType,
    metric_value: parsed.data.metricValue,
    note: parsed.data.note ?? null,
    source: "manual",
  });
  if (error) return { status: "error", message: error.message };

  await supabase.from("ventures").update({ status: "learning" }).eq("id", ventureId);
  logEvent({ event: "venture_outcome.logged", actorId: user.id, workspaceId: venture.workspace_id, entityType: "venture", entityId: ventureId, metadata: { metric_type: parsed.data.metricType } });
  revalidatePath(`/venture/${ventureId}/monitor`);
  revalidatePath(`/venture/${ventureId}`);
  return { status: "idle" };
}
