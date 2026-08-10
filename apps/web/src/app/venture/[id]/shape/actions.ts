"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { shapeSchema } from "@venture-sandbox/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SaveShapeState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<"targetUser" | "geography", string>>;
}

export async function saveShape(
  ventureId: string,
  _prevState: SaveShapeState,
  formData: FormData,
): Promise<SaveShapeState> {
  const parsed = shapeSchema.safeParse({
    targetUser: formData.get("targetUser"),
    geography: formData.get("geography"),
    problemStatement: formData.get("problemStatement") || undefined,
    valueProposition: formData.get("valueProposition") || undefined,
    mvpScope: formData.get("mvpScope") || undefined,
    differentiation: formData.get("differentiation") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: SaveShapeState["fieldErrors"] = {};
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
  if (!user) redirect("/sign-in");

  const { data: venture } = await supabase
    .from("ventures")
    .select("workspace_id, status")
    .eq("id", ventureId)
    .maybeSingle();
  if (!venture) {
    return { status: "error", message: "Couldn't find this venture." };
  }

  const { targetUser, geography, problemStatement, valueProposition, mvpScope, differentiation } =
    parsed.data;

  const ventureUpdate: { target_user: string; geography: string; status?: "shaped" } = {
    target_user: targetUser,
    geography,
  };
  // Only move status forward from "draft" -- never regress a venture that's
  // already further along (researching/simulating/built/launched) just
  // because its Shape brief got edited later.
  if (venture.status === "draft") {
    ventureUpdate.status = "shaped";
  }

  const { error: ventureError } = await supabase
    .from("ventures")
    .update(ventureUpdate)
    .eq("id", ventureId);
  if (ventureError) {
    return { status: "error", message: ventureError.message };
  }

  const { error: shapeError } = await supabase.from("venture_shapes").upsert(
    {
      venture_id: ventureId,
      workspace_id: venture.workspace_id,
      problem_statement: problemStatement ?? null,
      value_proposition: valueProposition ?? null,
      mvp_scope: mvpScope ?? null,
      differentiation: differentiation ?? null,
    },
    { onConflict: "venture_id" },
  );
  if (shapeError) {
    return { status: "error", message: shapeError.message };
  }

  revalidatePath(`/venture/${ventureId}`);
  revalidatePath(`/venture/${ventureId}/shape`);
  return { status: "success" };
}
