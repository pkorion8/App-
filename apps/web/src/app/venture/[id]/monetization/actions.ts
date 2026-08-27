"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMonetizationExperiments } from "@venture-sandbox/domain";

export async function selectExperiment(formData: FormData) {
  const ventureId = String(formData.get("ventureId") || "");
  const key = String(formData.get("experimentKey") || "");
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/sign-in");

  const [{ data: venture }, { data: shape }] = await Promise.all([
    db.from("ventures").select("workspace_id,target_user,geography,raw_idea_text").eq("id", ventureId).maybeSingle(),
    db.from("venture_shapes").select("pricing_model,problem_statement").eq("venture_id", ventureId).maybeSingle(),
  ]);
  if (!venture) throw new Error("Invalid venture");
  const experiment = createMonetizationExperiments({
    geography: venture.geography,
    audience: venture.target_user,
    product: shape?.problem_statement || venture.raw_idea_text,
    pricingModel: shape?.pricing_model,
    hasCompetitorPricing: false,
  }).find((e) => e.key === key);
  if (!experiment) throw new Error("Invalid monetization experiment");

  const { error } = await db.from("monetization_experiments").upsert({
    venture_id: ventureId,
    workspace_id: venture.workspace_id,
    experiment_key: key,
    hypothesis: experiment.hypothesis,
    deciding_metric: experiment.metric,
    pricing_model_override: experiment.pricingModelOverride || null,
    selected: true,
  }, { onConflict: "venture_id,experiment_key" });
  if (error) throw new Error("Monetization persistence is unavailable until migration 0011 is applied.");

  if (experiment.pricingModelOverride) {
    const { data: updatedShape, error: shapeError } = await db
      .from("venture_shapes")
      .update({ pricing_model: experiment.pricingModelOverride })
      .eq("venture_id", ventureId)
      .select("venture_id")
      .maybeSingle();
    if (shapeError || !updatedShape) {
      throw new Error("The monetization experiment was saved, but its pricing-model assumption could not be synchronized to the venture shape. Please retry after the venture shape is available.");
    }
  }
  revalidatePath(`/venture/${ventureId}/monetization`);
  revalidatePath(`/venture/${ventureId}/simulate`);
  revalidatePath(`/venture/${ventureId}`);
}
