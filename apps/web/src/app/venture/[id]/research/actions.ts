"use server";

import { redirect } from "next/navigation";
import { clarificationSchema } from "@venture-sandbox/schemas";
import { generateDemoFindings } from "@venture-sandbox/research";
import { logEvent } from "@venture-sandbox/observability";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface StartResearchState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"targetUser" | "geography", string>>;
}

export async function startResearch(
  ventureId: string,
  _prevState: StartResearchState,
  formData: FormData,
): Promise<StartResearchState> {
  const parsed = clarificationSchema.safeParse({
    targetUser: formData.get("targetUser"),
    geography: formData.get("geography"),
  });

  if (!parsed.success) {
    const fieldErrors: StartResearchState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "targetUser" || key === "geography") {
        fieldErrors[key] = issue.message;
      }
    }
    return { status: "error", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: venture, error: ventureError } = await supabase
    .from("ventures")
    .select("id, name, raw_idea_text, workspace_id")
    .eq("id", ventureId)
    .maybeSingle();

  if (ventureError || !venture) {
    return { status: "error", message: "Couldn't find this venture." };
  }

  const { targetUser, geography } = parsed.data;

  const { data: mission, error: missionError } = await supabase
    .from("research_missions")
    .insert({
      venture_id: venture.id,
      workspace_id: venture.workspace_id,
      target_user: targetUser,
      geography,
      status: "complete",
    })
    .select("id")
    .single();

  if (missionError || !mission) {
    return {
      status: "error",
      message: missionError?.message ?? "Couldn't start research.",
    };
  }

  const demoFindings = generateDemoFindings({
    ventureName: venture.name,
    ideaText: venture.raw_idea_text,
    targetUser,
    geography,
  });

  const { error: findingsError } = await supabase.from("findings").insert(
    demoFindings.map((f) => ({
      mission_id: mission.id,
      workspace_id: venture.workspace_id,
      normalized_claim: f.normalizedClaim,
      user_facing_summary: f.userFacingSummary,
      state: f.state,
      is_demo: true,
      limitations: f.limitations,
      next_test: f.nextTest,
    })),
  );

  if (findingsError) {
    return { status: "error", message: findingsError.message };
  }

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    workspace_id: venture.workspace_id,
    action: "research_mission.completed",
    entity_type: "research_mission",
    entity_id: mission.id,
    metadata: { venture_id: venture.id, is_demo: true },
  });

  logEvent({
    event: "research_mission.completed",
    actorId: user.id,
    workspaceId: venture.workspace_id,
    entityType: "research_mission",
    entityId: mission.id,
    metadata: { is_demo: true },
  });

  redirect(`/venture/${venture.id}/research`);
}
