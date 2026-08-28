"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function runCommitteeReview(formData: FormData) {
  const ventureId = String(formData.get("ventureId") || "");
  const sessionId = String(formData.get("sessionId") || "");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const db = supabase as any;

  const [{ data: session }, { data: venture }, { data: claims }, { data: research }, { data: simulation }] = await Promise.all([
    db.from("investor_sessions").select("id,workspace_id,stage").eq("id", sessionId).eq("venture_id", ventureId).maybeSingle(),
    db.from("ventures").select("workspace_id").eq("id", ventureId).maybeSingle(),
    db.from("investor_claims").select("claim_state").eq("investor_session_id", sessionId),
    db.from("research_missions").select("id").eq("venture_id", ventureId).eq("status", "complete").limit(1).maybeSingle(),
    db.from("simulation_runs").select("id").eq("venture_id", ventureId).limit(1).maybeSingle(),
  ]);
  if (!session || !venture || session.workspace_id !== venture.workspace_id) return;

  const states = (claims ?? []).map((c: any) => c.claim_state as string);
  const supported = states.filter((s: string) => s === "SUPPORTED" || s === "PARTIAL").length;
  const contradicted = states.filter((s: string) => s === "CONTRADICTED").length;
  const missing: string[] = [];
  if (!research) missing.push("Completed external research");
  if (!simulation) missing.push("A completed or active simulation run");
  if (states.length < 3) missing.push("More founder claims tested under investor questioning");
  if (supported < 1) missing.push("At least one claim linked to supporting evidence");

  // This is a deterministic rehearsal gate only. Never persist or imply real investor interest.
  let outcome: "more_evidence" | "pass" | "negotiation_rehearsal_ready" = "more_evidence";
  if (contradicted > 0) outcome = "pass";
  else if (research && simulation && states.length >= 3 && supported >= 1) outcome = "negotiation_rehearsal_ready";

  const rationale = {
    market: research ? "Research exists, so market claims can be challenged against saved evidence." : "No completed research is connected.",
    technical: "Technical confidence remains bounded by the venture's saved technology and simulation context.",
    operator: simulation ? "A simulation exists, giving the committee observable operating assumptions to inspect." : "No simulation exists yet.",
    skeptic: contradicted > 0 ? `${contradicted} contradicted claim(s) materially reduce trust.` : "No persisted contradicted claims were found.",
    finance: "Any capital discussion should buy a defined milestone; this review does not infer a valuation.",
    portfolio: "No real portfolio dataset is connected, so portfolio conflict remains UNKNOWN.",
  };

  await db.from("investment_committee_reviews").insert({
    investor_session_id: sessionId,
    workspace_id: venture.workspace_id,
    outcome,
    rationale,
    missing_evidence: missing,
  });

  const nextStage = outcome === "negotiation_rehearsal_ready" ? "negotiation" : outcome === "pass" ? "passed" : "committee";
  await db.from("investor_sessions").update({ stage: nextStage, outcome_reason: outcome === "pass" ? "Committee rehearsal found a contradicted founder claim." : null }).eq("id", sessionId);
  revalidatePath(`/venture/${ventureId}/investor/committee`);
  revalidatePath(`/venture/${ventureId}/investor`);
}
