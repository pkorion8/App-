"use server";

import { redirect } from "next/navigation";
import { clarificationSchema } from "@venture-sandbox/schemas";
import {
  generateDemoFindings,
  researchAppStoreCompetitors,
  researchGitHubActivity,
  researchMarketIndicators,
} from "@venture-sandbox/research";
import { logEvent } from "@venture-sandbox/observability";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface StartResearchState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"targetUser" | "geography", string>>;
}

export async function startResearch(
  ventureId: string,
  _prevState: StartResearchState,
  formData: FormData,
): Promise<StartResearchState> {
  const parsed = clarificationSchema.safeParse({
    targetUser: formData.get("targetUser"),
    geography: formData.get("geography"),
  });

  if (!parsed.success) {
    const fieldErrors: StartResearchState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "targetUser" || key === "geography") {
        fieldErrors[key] = issue.message;
      }
    }
    return { status: "error", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: venture, error: ventureError } = await supabase
    .from("ventures")
    .select("id, name, raw_idea_text, workspace_id")
    .eq("id", ventureId)
    .maybeSingle();

  if (ventureError || !venture) {
    return { status: "error", message: "Couldn't find this venture." };
  }

  // Every run fires 3 live calls against free, unauthenticated external
  // APIs (App Store, World Bank, GitHub) -- a cooldown here isn't about
  // this app's own load, it's protecting those APIs' shared IP-based rate
  // limits from a spam-click loop that would degrade or block the source
  // for every user, not just this one.
  const { data: recentMission } = await supabase
    .from("research_missions")
    .select("created_at")
    .eq("venture_id", ventureId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const RESEARCH_COOLDOWN_SECONDS = 30;
  if (recentMission) {
    const secondsSinceLast = (Date.now() - new Date(recentMission.created_at).getTime()) / 1000;
    if (secondsSinceLast < RESEARCH_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(RESEARCH_COOLDOWN_SECONDS - secondsSinceLast);
      return {
        status: "error",
        message: `Research was just run for this venture — wait ${waitSeconds}s before running it again.`,
      };
    }
  }

  const { targetUser, geography } = parsed.data;

  const { data: mission, error: missionError } = await supabase
    .from("research_missions")
    .insert({
      venture_id: venture.id,
      workspace_id: venture.workspace_id,
      target_user: targetUser,
      geography,
      status: "complete",
    })
    .select("id")
    .single();

  if (missionError || !mission) {
    return {
      status: "error",
      message: missionError?.message ?? "Couldn't start research.",
    };
  }

  const demoFindings = generateDemoFindings({
    ventureName: venture.name,
    ideaText: venture.raw_idea_text,
    targetUser,
    geography,
  });

  // Most recent snapshot per app (by app_id) for this venture, so the App
  // Store search below can show real trend since last research run --
  // deduped client-side rather than with a DISTINCT ON query, since this
  // is a small per-venture row count and keeps the query trivial.
  const { data: snapshotRows } = await supabase
    .from("research_competitor_snapshots")
    .select("app_id, rating_count, checked_at")
    .eq("venture_id", ventureId)
    .order("checked_at", { ascending: false });

  const previousSnapshots: { appId: number; ratingCount: number; checkedAt: string }[] = [];
  const seenAppIds = new Set<number>();
  for (const row of snapshotRows ?? []) {
    if (seenAppIds.has(row.app_id)) continue;
    seenAppIds.add(row.app_id);
    previousSnapshots.push({ appId: row.app_id, ratingCount: row.rating_count, checkedAt: row.checked_at });
  }

  // Slots 0, 4, and 5 try real, free sources first (App Store search,
  // World Bank Open Data, GitHub search); each falls back to its honest
  // DEMO placeholder if the live call fails or finds nothing. Slots 1-3
  // stay DEMO until their sources (YouTube, Trends, etc.) are connected too.
  // Slots 6-8 (revenue, reviews, growth trend) have no live-source branch
  // at all and never will until either a paid provider or new scheduled-
  // tracking infrastructure is in place -- see demo-findings.ts.
  const [liveCompetitorFinding, liveMarketIndicators, liveGitHubActivity] = await Promise.all([
    researchAppStoreCompetitors({
      ventureName: venture.name,
      ideaText: venture.raw_idea_text,
      geography,
      previousSnapshots,
    }),
    researchMarketIndicators({ geography }),
    researchGitHubActivity({ ventureName: venture.name }),
  ]);

  const findingsToInsert = demoFindings.map((f, i) => {
    if (i === 0 && liveCompetitorFinding) {
      return { ...liveCompetitorFinding, isDemo: false };
    }
    if (i === 4 && liveMarketIndicators) {
      return { ...liveMarketIndicators, isDemo: false };
    }
    if (i === 5 && liveGitHubActivity) {
      return { ...liveGitHubActivity, isDemo: false };
    }
    return { ...f, isDemo: true };
  });

  const { error: findingsError } = await supabase.from("findings").insert(
    findingsToInsert.map((f) => ({
      mission_id: mission.id,
      workspace_id: venture.workspace_id,
      normalized_claim: f.normalizedClaim,
      user_facing_summary: f.userFacingSummary,
      state: f.state,
      is_demo: f.isDemo,
      limitations: f.limitations,
      next_test: f.nextTest,
      metadata: "metadata" in f ? (f.metadata as unknown as Record<string, unknown> | null) : null,
    })),
  );

  if (findingsError) {
    return { status: "error", message: findingsError.message };
  }

  if (liveCompetitorFinding && liveCompetitorFinding.snapshots.length > 0) {
    await supabase.from("research_competitor_snapshots").insert(
      liveCompetitorFinding.snapshots.map((s) => ({
        venture_id: ventureId,
        workspace_id: venture.workspace_id,
        app_id: s.appId,
        app_name: s.name,
        rating_count: s.ratingCount,
      })),
    );
  }

  const liveFindingsCount = findingsToInsert.filter((f) => !f.isDemo).length;

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    workspace_id: venture.workspace_id,
    action: "research_mission.completed",
    entity_type: "research_mission",
    entity_id: mission.id,
    metadata: {
      venture_id: venture.id,
      total_findings: findingsToInsert.length,
      live_findings: liveFindingsCount,
    },
  });

  logEvent({
    event: "research_mission.completed",
    actorId: user.id,
    workspaceId: venture.workspace_id,
    entityType: "research_mission",
    entityId: mission.id,
    metadata: {
      total_findings: findingsToInsert.length,
      live_findings: liveFindingsCount,
    },
  });

  redirect(`/venture/${venture.id}/research`);
}
