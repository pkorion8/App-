"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function context(ventureId: string, sessionId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const db = supabase as any;
  const [{ data: session }, { data: venture }] = await Promise.all([
    db.from("investor_sessions").select("id,workspace_id").eq("id", sessionId).eq("venture_id", ventureId).maybeSingle(),
    db.from("ventures").select("workspace_id").eq("id", ventureId).maybeSingle(),
  ]);
  if (!session || !venture || session.workspace_id !== venture.workspace_id) return null;
  return { db, workspaceId: venture.workspace_id };
}

export async function initializeDiligence(formData: FormData) {
  const ventureId = String(formData.get("ventureId") || "");
  const sessionId = String(formData.get("sessionId") || "");
  const ctx = await context(ventureId, sessionId);
  if (!ctx) return;

  const [{ data: shape }, { data: research }, { data: build }, { data: outcomes }, { data: snapshots }, { data: findings }] = await Promise.all([
    ctx.db.from("venture_shapes").select("mvp_scope,problem_statement").eq("venture_id", ventureId).maybeSingle(),
    ctx.db.from("research_missions").select("id").eq("venture_id", ventureId).eq("status", "complete").limit(1).maybeSingle(),
    ctx.db.from("build_packages").select("id").eq("venture_id", ventureId).limit(1).maybeSingle(),
    ctx.db.from("venture_outcomes").select("id").eq("venture_id", ventureId).limit(1),
    ctx.db.from("research_competitor_snapshots").select("id").eq("venture_id", ventureId).limit(1),
    ctx.db.from("findings").select("limitations").eq("workspace_id", ctx.workspaceId).not("limitations", "is", null).limit(1),
  ]);

  const items = [
    ["Company", "Basic venture identity, purpose and current stage", "ready"],
    ["Ownership", "Founder ownership, entities, IP assignment and third-party rights", "missing"],
    ["Product", "MVP scope and current product evidence", shape?.mvp_scope || shape?.problem_statement ? "partial" : "missing"],
    ["Technology", "Architecture, dependencies, portability and ownership risks", build ? "partial" : "missing"],
    ["Customer evidence", "Interviews, usage, paid demand or other real customer evidence", outcomes?.length ? "partial" : "missing"],
    ["Market", "Market evidence and unresolved assumptions", research ? "partial" : "missing"],
    ["Competition", "Alternatives and competitor evidence", snapshots?.length ? "partial" : "missing"],
    ["Financials", "Revenue, costs, runway and capital plan", build ? "partial" : "missing"],
    ["Risks", "Known product, technical, market, regulatory and execution risks", findings?.length ? "partial" : "missing"],
  ] as const;

  await ctx.db.from("diligence_items").delete().eq("investor_session_id", sessionId);
  await ctx.db.from("diligence_items").insert(items.map(([category, item, state]) => ({ investor_session_id: sessionId, workspace_id: ctx.workspaceId, category, item, state })));
  await ctx.db.from("investor_sessions").update({ stage: "diligence" }).eq("id", sessionId);
  revalidatePath(`/venture/${ventureId}/investor/diligence`);
  revalidatePath(`/venture/${ventureId}/investor`);
}

export async function updateDiligenceItem(formData: FormData) {
  const ventureId = String(formData.get("ventureId") || "");
  const sessionId = String(formData.get("sessionId") || "");
  const itemId = String(formData.get("itemId") || "");
  const state = String(formData.get("state") || "");
  const notes = String(formData.get("notes") || "").trim();
  if (!["ready","partial","missing","not_applicable"].includes(state)) return;
  const ctx = await context(ventureId, sessionId);
  if (!ctx) return;
  await ctx.db.from("diligence_items").update({ state, notes: notes ? notes.slice(0, 1000) : null }).eq("id", itemId).eq("investor_session_id", sessionId);
  revalidatePath(`/venture/${ventureId}/investor/diligence`);
}
