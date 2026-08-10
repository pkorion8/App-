"use server";

import { redirect } from "next/navigation";
import { createVentureSchema } from "@venture-sandbox/schemas";
import { logEvent } from "@venture-sandbox/observability";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CreateVentureState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "rawIdeaText", string>>;
}

export async function createVenture(
  _prevState: CreateVentureState,
  formData: FormData,
): Promise<CreateVentureState> {
  const parsed = createVentureSchema.safeParse({
    name: formData.get("name"),
    rawIdeaText: formData.get("rawIdeaText"),
  });

  if (!parsed.success) {
    const fieldErrors: CreateVentureState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "name" || key === "rawIdeaText") {
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

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      status: "error",
      message: "Couldn't find your workspace. Try signing in again.",
    };
  }

  const { data: venture, error: insertError } = await supabase
    .from("ventures")
    .insert({
      workspace_id: membership.workspace_id,
      name: parsed.data.name,
      raw_idea_text: parsed.data.rawIdeaText,
    })
    .select("id")
    .single();

  if (insertError || !venture) {
    return {
      status: "error",
      message: insertError?.message ?? "Couldn't create the venture.",
    };
  }

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    workspace_id: membership.workspace_id,
    action: "venture.created",
    entity_type: "venture",
    entity_id: venture.id,
    metadata: { name: parsed.data.name },
  });

  logEvent({
    event: "venture.created",
    actorId: user.id,
    workspaceId: membership.workspace_id,
    entityType: "venture",
    entityId: venture.id,
  });

  redirect(`/venture/${venture.id}`);
}
