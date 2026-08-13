"use server";

import { redirect } from "next/navigation";
import { createVentureSchema } from "@venture-sandbox/schemas";
import { logEvent } from "@venture-sandbox/observability";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CreateVentureState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "rawIdeaText", string>>;
}

async function getWorkspace() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: membership, error } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", user.id).limit(1).maybeSingle();
  return { supabase, user, workspaceId: error || !membership ? null : membership.workspace_id };
}

export async function createVenture(
  _prevState: CreateVentureState,
  formData: FormData,
): Promise<CreateVentureState> {
  const parsed = createVentureSchema.safeParse({ name: formData.get("name"), rawIdeaText: formData.get("rawIdeaText") });
  if (!parsed.success) {
    const fieldErrors: CreateVentureState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "name" || key === "rawIdeaText") fieldErrors[key] = issue.message;
    }
    return { status: "error", fieldErrors };
  }

  const { supabase, user, workspaceId } = await getWorkspace();
  if (!workspaceId) return { status: "error", message: "Couldn't find your workspace. Try signing in again." };

  const { data: venture, error: insertError } = await supabase.from("ventures").insert({ workspace_id: workspaceId, name: parsed.data.name, raw_idea_text: parsed.data.rawIdeaText }).select("id").single();
  if (insertError || !venture) return { status: "error", message: insertError?.message ?? "Couldn't create the venture." };

  await supabase.from("audit_log").insert({ actor_id: user.id, workspace_id: workspaceId, action: "venture.created", entity_type: "venture", entity_id: venture.id, metadata: { name: parsed.data.name } });
  logEvent({ event: "venture.created", actorId: user.id, workspaceId, entityType: "venture", entityId: venture.id });
  redirect(`/venture/${venture.id}`);
}

const DEMOS = [
  {
    name: "[DEMO] ClaimKeeper",
    idea: "A consumer app that stores receipts and warranty/rebate deadlines, then reminds people what can still be claimed before value expires.",
    audience: "Busy Canadian households who lose track of receipts, warranties, returns and rebate deadlines",
    geography: "Canada",
    problem: "People miss time-sensitive refunds, warranty claims and rebates because proof of purchase and deadlines are scattered across email, paper and retailer accounts.",
    value: "One calm place to capture proof of purchase, surface approaching deadlines and explain the next claim step.",
    mvp: "Receipt capture, manual deadline entry, reminder queue, claim history and basic retailer/contact notes.",
    differentiation: "Deadline-first claim workflow rather than a generic receipt archive.",
    pricing: "subscription" as const,
    findings: [
      ["The problem is understandable without specialist knowledge.", "DEMO observation: the scenario is framed around a concrete missed-deadline job, but no live customer interviews are attached.", "MIXED"],
      ["Users would need strong trust in receipt and purchase-data handling.", "DEMO inference: the product handles sensitive purchase records, so privacy and data portability are material adoption questions.", "SOLID"],
      ["Reminder value is recurring only while users keep purchases up to date.", "DEMO hypothesis: retention likely depends on low-friction capture and useful alerts; this has not been validated with real retention data.", "UNKNOWN"],
      ["Subscription willingness to pay is unresolved.", "DEMO assumption: a paid plan is modeled for simulation, but no live pricing evidence is connected.", "UNKNOWN"],
      ["A focused MVP can avoid retailer integrations initially.", "DEMO build hypothesis: manual capture and reminders reduce integration dependency for the first version.", "MIXED"],
    ],
    sim: { cash: 7600, budget: 12000, users: 540, returning: 180, revenue: 620, cost: 910, quality: 72, build: 100 },
  },
  {
    name: "[DEMO] LocalLens",
    idea: "An AI-assisted workspace that helps small creative teams adapt social content for a target market without reducing localization to translation.",
    audience: "Small creator and marketing teams publishing the same campaign across multiple markets",
    geography: "India",
    problem: "Teams can translate copy but still miss local expression, credibility, search behavior, cultural context and platform-native conventions.",
    value: "Turn one campaign brief into a market-specific adaptation checklist, evidence pack and production brief while keeping assumptions visible.",
    mvp: "Brief intake, localization checklist, source/evidence panel, adaptation suggestions and exportable production brief.",
    differentiation: "Evidence-aware localization guidance rather than translation-only generation.",
    pricing: "subscription" as const,
    findings: [
      ["Localization quality is broader than literal translation.", "DEMO framing: the scenario treats language, credibility, discovery and cultural expression as separate workstreams.", "MIXED"],
      ["Teams need provenance when AI recommends culturally specific changes.", "DEMO inference: source traceability is modeled as a trust requirement, not proven market demand.", "MIXED"],
      ["The product risks becoming a generic AI writing interface.", "DEMO risk: differentiation depends on persistent evidence, workflow memory and market-specific decision support.", "SOLID"],
      ["Pricing is unvalidated.", "DEMO assumption: subscription is used in the simulation because no live willingness-to-pay evidence is attached.", "UNKNOWN"],
      ["A first version can combine structured rules with bounded AI generation.", "DEMO technical hypothesis: deterministic workflow state can constrain generative outputs, but production quality is not proven here.", "MIXED"],
    ],
    sim: { cash: 13800, budget: 20000, users: 310, returning: 126, revenue: 1180, cost: 1650, quality: 78, build: 100 },
  },
] as const;

export async function seedDemoVentures() {
  const { supabase, user, workspaceId } = await getWorkspace();
  if (!workspaceId) redirect("/dashboard");
  const db = supabase as any;

  const { data: existing } = await db.from("ventures").select("id,name").eq("workspace_id", workspaceId).in("name", DEMOS.map((d) => d.name));
  const existingByName = new Map<string, string>((existing ?? []).map((v: any) => [String(v.name), String(v.id)]));
  let firstId: string | null = existingByName.get(DEMOS[0].name) ?? null;

  for (const demo of DEMOS) {
    if (existingByName.has(demo.name)) continue;
    const { data: venture } = await db.from("ventures").insert({
      workspace_id: workspaceId,
      name: demo.name,
      raw_idea_text: demo.idea,
      target_user: demo.audience,
      geography: demo.geography,
      status: "simulated",
    }).select("id").single();
    if (!venture) continue;
    if (!firstId) firstId = String(venture.id);

    await db.from("venture_shapes").insert({
      venture_id: venture.id,
      workspace_id: workspaceId,
      problem_statement: demo.problem,
      value_proposition: demo.value,
      mvp_scope: demo.mvp,
      differentiation: demo.differentiation,
      pricing_model: demo.pricing,
    });

    const { data: mission } = await db.from("research_missions").insert({
      venture_id: venture.id,
      workspace_id: workspaceId,
      target_user: demo.audience,
      geography: demo.geography,
      status: "complete",
    }).select("id").single();

    let findingIds: string[] = [];
    if (mission) {
      const { data: insertedFindings } = await db.from("findings").insert(demo.findings.map(([claim, summary, state]) => ({
        mission_id: mission.id,
        workspace_id: workspaceId,
        normalized_claim: claim,
        user_facing_summary: summary,
        state,
        is_demo: true,
        limitations: "Presentation fixture only. This finding is not live market evidence.",
        next_test: "Replace this demo claim with sourced research or a real-world validation test.",
        metadata: { kind: "demo", source: "Presentation demo fixture", evidenceType: "DEMO" },
      }))).select("id");
      findingIds = (insertedFindings ?? []).map((f: any) => String(f.id));
    }

    const history = [
      { day: 0, cashRemaining: demo.sim.budget, totalUsers: 0, monthlyRevenue: 0 },
      { day: 15, cashRemaining: Math.round((demo.sim.budget + demo.sim.cash) / 2), totalUsers: Math.round(demo.sim.users * 0.18), monthlyRevenue: Math.round(demo.sim.revenue * 0.12) },
      { day: 30, cashRemaining: Math.round(demo.sim.cash * 1.18), totalUsers: Math.round(demo.sim.users * 0.48), monthlyRevenue: Math.round(demo.sim.revenue * 0.42) },
      { day: 60, cashRemaining: demo.sim.cash, totalUsers: demo.sim.users, monthlyRevenue: demo.sim.revenue },
    ];
    const { data: run } = await db.from("simulation_runs").insert({
      venture_id: venture.id,
      workspace_id: workspaceId,
      status: "complete",
      stage: "complete",
      virtual_day: 60,
      cash_remaining: demo.sim.cash,
      budget_total: demo.sim.budget,
      build_progress_pct: demo.sim.build,
      product_quality_pct: demo.sim.quality,
      technical_risk: "medium",
      launch_readiness_pct: 100,
      total_users: demo.sim.users,
      returning_users: demo.sim.returning,
      monthly_revenue: demo.sim.revenue,
      monthly_cost: demo.sim.cost,
      market_confidence: "mixed",
      history,
      market_context: { hasResearch: true, competitorTraction: "Unknown", topCompetitorName: null, summary: "DEMO simulation context. Replace with live research before making a real decision.", internetPenetrationPct: null, activeRelatedReposFound: null, estimatedMonthlyCost: null },
      pricing_model: demo.pricing,
      reality_mode: false,
      rewind_count: 1,
      branch_label: "Presentation demo timeline",
    }).select("id").single();

    if (run) {
      await db.from("simulation_decisions").insert([
        { simulation_run_id: run.id, workspace_id: workspaceId, virtual_day: 8, decision_type: "resource_planning", choice: "lean_scope", immediate_effect: "DEMO: smaller initial scope preserved cash." },
        { simulation_run_id: run.id, workspace_id: workspaceId, virtual_day: 27, decision_type: "pre_launch", choice: "delay_for_quality", immediate_effect: "DEMO: launch moved later in exchange for higher modeled product quality." },
      ]);
    }

    const { data: investorSession } = await db.from("investor_sessions").insert({
      venture_id: venture.id,
      workspace_id: workspaceId,
      investor_profile: "operator-angel",
      stage: "committee",
      question_index: 5,
      qualitative_state: { trust: "uncertain", clarity: "improving", demo: true },
    }).select("id").single();
    if (investorSession) {
      await db.from("investor_messages").insert([
        { investor_session_id: investorSession.id, workspace_id: workspaceId, role: "investor", message: "DEMO: What evidence is strongest, and what would you still refuse to claim as fact?" },
        { investor_session_id: investorSession.id, workspace_id: workspaceId, role: "founder", message: "DEMO: The venture has structured scenario evidence, but pricing and willingness to pay remain assumptions." },
      ]);
      await db.from("investor_claims").insert([
        { investor_session_id: investorSession.id, workspace_id: workspaceId, claim_text: "DEMO: The problem framing is clear enough to test with target users.", claim_state: "PARTIAL", evidence_finding_id: findingIds[0] ?? null, investor_concern: "Still needs real customer evidence." },
        { investor_session_id: investorSession.id, workspace_id: workspaceId, claim_text: "DEMO: Customers will pay the modeled subscription price.", claim_state: "ASSUMPTION", investor_concern: "No willingness-to-pay evidence attached." },
      ]);
    }

    await db.from("audit_log").insert({ actor_id: user.id, workspace_id: workspaceId, action: "venture.demo_seeded", entity_type: "venture", entity_id: venture.id, metadata: { demo: true, name: demo.name } });
  }

  redirect(firstId ? `/venture/${firstId}` : "/dashboard");
}
