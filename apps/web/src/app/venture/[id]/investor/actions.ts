"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { classifyFounderClaim, evaluateInvestorAnswer, investorQuestions, nextInvestorStage, type InvestorStage } from "@venture-sandbox/domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function startInvestorSession(formData: FormData) {
  const ventureId = String(formData.get("ventureId") || "");
  const profile = String(formData.get("profile") || "");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const db = supabase as any;
  const { data: venture } = await db.from("ventures").select("workspace_id").eq("id", ventureId).maybeSingle();
  if (!venture) throw new Error("Venture not found");
  const { data: session, error } = await db.from("investor_sessions").insert({
    venture_id: ventureId,
    workspace_id: venture.workspace_id,
    investor_profile: profile,
    stage: "screening",
    question_index: 0,
    qualitative_state: { trust: "uncertain", clarity: "uncertain", challenge_count: 0, meeting_status: "live" },
  }).select("id").single();
  if (error) throw new Error("Investor World persistence is unavailable until migration 0012 is applied.");
  revalidatePath(`/venture/${ventureId}/investor`);
  redirect(`/venture/${ventureId}/investor?session=${session.id}`);
}

export async function answerInvestorQuestion(formData: FormData) {
  const ventureId = String(formData.get("ventureId") || "");
  const sessionId = String(formData.get("sessionId") || "");
  const answer = String(formData.get("answer") || "").trim();
  if (!answer) return;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const db = supabase as any;

  const [{ data: session }, { data: venture }, { data: shape }, { data: research }, { data: simulation }] = await Promise.all([
    db.from("investor_sessions").select("*").eq("id", sessionId).eq("venture_id", ventureId).maybeSingle(),
    db.from("ventures").select("workspace_id,target_user").eq("id", ventureId).maybeSingle(),
    db.from("venture_shapes").select("problem_statement,differentiation").eq("venture_id", ventureId).maybeSingle(),
    db.from("research_missions").select("id").eq("venture_id", ventureId).eq("status", "complete").limit(1).maybeSingle(),
    db.from("simulation_runs").select("id").eq("venture_id", ventureId).limit(1).maybeSingle(),
  ]);
  if (!session || !venture || ["passed", "closed"].includes(session.stage)) return;

  const questions = investorQuestions(session.investor_profile, {
    audience: venture.target_user,
    problem: shape?.problem_statement,
    differentiation: shape?.differentiation,
    hasResearch: !!research,
    hasSimulation: !!simulation,
  });
  const currentQuestion = questions[session.question_index] || "Tell me the most important claim you want this investor to believe.";
  const evaluation = evaluateInvestorAnswer(answer);
  const previousState = session.qualitative_state || {};
  const previousChallenges = Number(previousState.challenge_count || 0);
  const challengeCount = evaluation.outcome === "challenge" ? previousChallenges + 1 : Math.max(0, previousChallenges - 1);

  const transcript = [
    { investor_session_id: sessionId, workspace_id: venture.workspace_id, role: "investor", message: currentQuestion },
    { investor_session_id: sessionId, workspace_id: venture.workspace_id, role: "founder", message: answer },
    { investor_session_id: sessionId, workspace_id: venture.workspace_id, role: "investor", message: evaluation.reaction },
  ];
  await db.from("investor_messages").insert(transcript);

  const claimState = evaluation.reason === "unsupported_traction" ? "NEW CLAIM" : classifyFounderClaim(answer);
  const concern = evaluation.outcome === "challenge" ? evaluation.reaction : evaluation.outcome === "end" ? "Meeting ended because founder conduct broke the conversation." : null;
  await db.from("investor_claims").insert({
    investor_session_id: sessionId,
    workspace_id: venture.workspace_id,
    claim_text: answer,
    claim_state: claimState,
    investor_concern: concern,
  });

  if (evaluation.outcome === "end") {
    await db.from("investor_sessions").update({
      stage: "passed",
      outcome_reason: "Meeting ended early: founder conduct caused a trust breakdown.",
      qualitative_state: { ...previousState, trust: "damaged", clarity: "weak", meeting_status: "ended", last_reason: evaluation.reason, challenge_count: challengeCount },
    }).eq("id", sessionId);
    revalidatePath(`/venture/${ventureId}/investor`);
    return;
  }

  if (evaluation.outcome === "challenge") {
    const repeatedWeakness = challengeCount >= 3;
    await db.from("investor_sessions").update({
      stage: repeatedWeakness ? "passed" : session.stage,
      outcome_reason: repeatedWeakness ? "Meeting ended early after repeated answers failed to address investor questions." : null,
      qualitative_state: {
        ...previousState,
        trust: repeatedWeakness ? "damaged" : evaluation.trust,
        clarity: evaluation.clarity,
        meeting_status: repeatedWeakness ? "ended" : "challenging",
        last_reason: evaluation.reason,
        challenge_count: challengeCount,
      },
    }).eq("id", sessionId);
    if (repeatedWeakness) {
      await db.from("investor_messages").insert({
        investor_session_id: sessionId,
        workspace_id: venture.workspace_id,
        role: "investor",
        message: "I don’t think we’re getting enough clarity to continue this meeting. I’m going to pass for now. Come back when you can answer these questions with clearer evidence or reasoning.",
      });
    }
    revalidatePath(`/venture/${ventureId}/investor`);
    return;
  }

  const nextIndex = session.question_index + 1;
  let stage = session.stage as InvestorStage;
  if (nextIndex >= questions.length) stage = nextInvestorStage(stage === "screening" ? "meeting" : stage);
  else if (stage === "screening" && nextIndex >= 2) stage = "meeting";

  await db.from("investor_sessions").update({
    question_index: nextIndex,
    stage,
    outcome_reason: null,
    qualitative_state: {
      ...previousState,
      trust: evaluation.trust,
      clarity: evaluation.clarity,
      meeting_status: "live",
      last_reason: evaluation.reason,
      challenge_count: challengeCount,
    },
  }).eq("id", sessionId);
  revalidatePath(`/venture/${ventureId}/investor`);
}
