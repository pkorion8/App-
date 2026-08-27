"use server";

import { redirect } from "next/navigation";
import { generateBuildPackage } from "@venture-sandbox/build";
import { logEvent } from "@venture-sandbox/observability";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateBuild(ventureId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: venture, error: ventureError } = await supabase
    .from("ventures")
    .select("name, raw_idea_text, workspace_id")
    .eq("id", ventureId)
    .maybeSingle();
  if (ventureError) throw new Error(`Could not load venture for Build Studio: ${ventureError.message}`);
  if (!venture) throw new Error("Could not find this venture for Build Studio.");

  const pkg = generateBuildPackage({
    ventureName: venture.name,
    ideaText: venture.raw_idea_text,
  });

  const { error: packageError } = await supabase.from("build_packages").insert({
    venture_id: ventureId,
    workspace_id: venture.workspace_id,
    // jsonb columns are typed as Record<string, unknown> / unknown[],
    // which a concrete interface without an index signature never
    // structurally satisfies -- same cast used symmetrically when this
    // gets read back in page.tsx.
    recommended_stack: pkg.recommendedStack as unknown as Record<string, unknown>,
    backlog: pkg.backlog as unknown as Record<string, unknown>[],
    cost_estimate: pkg.costEstimate as unknown as Record<string, unknown>,
  });
  if (packageError) throw new Error(`Could not save the Build Studio package: ${packageError.message}`);

  const { data: updatedVenture, error: statusError } = await supabase
    .from("ventures")
    .update({ status: "build_ready" })
    .eq("id", ventureId)
    .select("id")
    .maybeSingle();
  if (statusError || !updatedVenture) {
    throw new Error(
      "The build package was saved, but the venture could not be moved to Build Ready. Refresh before generating another build package.",
    );
  }

  logEvent({
    event: "build_package.generated",
    actorId: user.id,
    workspaceId: venture.workspace_id,
    entityType: "venture",
    entityId: ventureId,
    metadata: { pricing_status: "not_connected" },
  });

  redirect(`/venture/${ventureId}/build`);
}
