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

  const { data: venture } = await supabase
    .from("ventures")
    .select("name, raw_idea_text, workspace_id")
    .eq("id", ventureId)
    .maybeSingle();
  if (!venture) return;

  const pkg = generateBuildPackage({
    ventureName: venture.name,
    ideaText: venture.raw_idea_text,
  });

  await supabase.from("build_packages").insert({
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
  await supabase.from("ventures").update({ status: "build_ready" }).eq("id", ventureId);

  logEvent({
    event: "build_package.generated",
    actorId: user.id,
    workspaceId: venture.workspace_id,
    entityType: "venture",
    entityId: ventureId,
    metadata: { total_monthly_cost: pkg.costEstimate.totalMonthly },
  });

  redirect(`/venture/${ventureId}/build`);
}
