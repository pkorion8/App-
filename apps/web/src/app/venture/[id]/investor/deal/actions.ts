"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { boundCounter, equityDeal } from "@venture-sandbox/domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function verifiedSession(ventureId: string, sessionId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const db = supabase as any;
  const [{ data: session }, { data: venture }] = await Promise.all([
    db.from("investor_sessions").select("id,workspace_id,stage").eq("id", sessionId).eq("venture_id", ventureId).maybeSingle(),
    db.from("ventures").select("workspace_id").eq("id", ventureId).maybeSingle(),
  ]);
  if (!session || !venture || session.workspace_id !== venture.workspace_id) return null;
  return { db, session, workspaceId: venture.workspace_id };
}

export async function saveSimulatedOffer(formData: FormData) {
  const ventureId = String(formData.get("ventureId") || "");
  const sessionId = String(formData.get("sessionId") || "");
  const intent = formData.get("intent") === "counter" ? "countered" : "offered";
  const bounded = boundCounter({
    investment: Number(formData.get("investment") || 0),
    preMoney: Number(formData.get("preMoney") || 0),
  });
  const employeePoolPct = Math.min(30, Math.max(0, Number(formData.get("employeePoolPct") || 0)));
  const verified = await verifiedSession(ventureId, sessionId);
  if (!verified) return;
  const deal = equityDeal({ ...bounded, employeePoolPct });

  await verified.db.from("investor_offers").insert({
    investor_session_id: sessionId,
    workspace_id: verified.workspaceId,
    instrument: "equity",
    offer_state: intent,
    investment_amount: bounded.investment,
    pre_money_valuation: bounded.preMoney,
    terms: {
      employeePoolPct,
      postMoney: deal.postMoney,
      investorPct: deal.investorPct,
      founderPct: deal.founderPct,
      founderDilutionPct: deal.founderDilutionPct,
      simulated: true,
    },
  });
  await verified.db.from("investor_sessions").update({ stage: "negotiation" }).eq("id", sessionId);
  revalidatePath(`/venture/${ventureId}/investor/deal`);
  revalidatePath(`/venture/${ventureId}/investor`);
}

export async function respondToSimulatedOffer(formData: FormData) {
  const ventureId = String(formData.get("ventureId") || "");
  const sessionId = String(formData.get("sessionId") || "");
  const offerId = String(formData.get("offerId") || "");
  const response = String(formData.get("response") || "");
  if (response !== "accepted" && response !== "declined") return;
  const verified = await verifiedSession(ventureId, sessionId);
  if (!verified) return;

  await verified.db.from("investor_offers").update({ offer_state: response }).eq("id", offerId).eq("investor_session_id", sessionId);
  await verified.db.from("investor_sessions").update({
    stage: response === "accepted" ? "closed" : "passed",
    outcome_reason: response === "accepted"
      ? "Founder accepted the terms in the negotiation rehearsal. This is not a real investor offer or transaction."
      : "Founder declined the terms in the negotiation rehearsal. This is not a real investor decision.",
  }).eq("id", sessionId);
  revalidatePath(`/venture/${ventureId}/investor/deal`);
  revalidatePath(`/venture/${ventureId}/investor`);
}
