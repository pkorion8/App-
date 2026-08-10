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

  await supabase.from("venture_comparisons").insert({
    workspace_id: venture.workspace_id,
    venture_id_a: ventureIdA,
    venture_id_b: otherVentureId,
  });

  redirect(`/venture/${ventureIdA}/compare?with=${otherVentureId}`);
}
