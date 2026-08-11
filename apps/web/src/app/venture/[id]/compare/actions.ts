"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createComparison(
  ventureIdA: string,
  otherVentureId: string,
): Promise<void> {
  if (!otherVentureId || otherVentureId === ventureIdA) return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: venture } = await supabase
    .from("ventures")
    .select("workspace_id")
    .eq("id", ventureIdA)
    .maybeSingle();
  if (!venture) return;

  // otherVentureId is caller-supplied -- confirm it's actually in the same
  // workspace as ventureIdA before recording the comparison, rather than
  // trusting it (the UI's picker only ever offers same-workspace ventures,
  // but a server action can be invoked directly with any id).
  const { data: otherVenture } = await supabase
    .from("ventures")
    .select("workspace_id")
    .eq("id", otherVentureId)
    .maybeSingle();
  if (!otherVenture || otherVenture.workspace_id !== venture.workspace_id) return;

  await supabase.from("venture_comparisons").insert({
    workspace_id: venture.workspace_id,
    venture_id_a: ventureIdA,
    venture_id_b: otherVentureId,
  });

  redirect(`/venture/${ventureIdA}/compare?with=${otherVentureId}`);
}
