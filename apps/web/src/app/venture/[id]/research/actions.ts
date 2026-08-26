"use server";

import { redirect } from "next/navigation";
import { clarificationSchema } from "@venture-sandbox/schemas";
import {
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

  // Every run fires live calls against free external APIs. The cooldown is
  // deliberately per venture so a spam-click loop cannot burn shared
  // provider rate limits for other users.
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

  // Persist the clarification the user just confirmed so the rest of the
  // venture flow (Shape, Compare, Simulator, Build) uses the same audience
  // and geography instead of leaving Research as an isolated branch.
  const { error: ventureUpdateError } = await supabase
    .from("ventures")
    .update({ target_user: targetUser, geography, status: "researching" })
    .eq("id", ventureId);

  if (ventureUpdateError) {
    return { status: "error", message: ventureUpdateError.message };
  }

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
    await supabase.from("ventures").update({ status: "draft" }).eq("id", ventureId);
    return {
      status: "error",
      message: missionError?.message ?? "Couldn't start research.",
    };
  }

  // Most recent snapshot per app (by app_id) for this venture, so the App
  // Store search below can show the change in public rating count since the
  // previous research run. Rating-count movement is not downloads, revenue,
  // market share, or verified traction.
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

  // Only persist findings returned by connected live sources. If a source
  // fails, returns no match, or is not connected, it contributes no finding;
  // the Research UI exposes source availability separately through the
  // source registry. We intentionally do not manufacture fallback/demo rows.
  const [liveCompetitorFinding, liveMarketIndicators, liveGitHubActivity] = await Promise.all([
    researchAppStoreCompetitors({
      ventureName: venture.name,
      ideaText: venture.raw_idea_text,
      geography,
      previousSnapshots,
    }),
    researchMarketIndicators({ geography }),
    researchGitHubActivity({ ventureName: venture.name, ideaText: venture.raw_idea_text }),
  ]);

  const findingsToInsert = [liveCompetitorFinding, liveMarketIndicators, liveGitHubActivity]
    .filter((finding): finding is NonNullable<typeof finding> => Boolean(finding))
    .map((finding) => ({ ...finding, isDemo: false as const }));

  if (findingsToInsert.length > 0) {
    const { error: findingsError } = await supabase.from("findings").insert(
      findingsToInsert.map((f) => ({
        mission_id: mission.id,
        workspace_id: venture.workspace_id,
        normalized_claim: f.normalizedClaim,
        user_facing_summary: f.userFacingSummary,
        state: f.state,
        is_demo: false,
        limitations: f.limitations,
        next_test: f.nextTest,
        metadata: "metadata" in f ? (f.metadata as unknown as Record<string, unknown> | null) : null,
      })),
    );

    if (findingsError) {
      await supabase.from("ventures").update({ status: "draft" }).eq("id", ventureId);
      return { status: "error", message: findingsError.message };
    }
  }

  await supabase.from("ventures").update({ status: "researched" }).eq("id", ventureId);

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

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    workspace_id: venture.workspace_id,
    action: "research_mission.completed",
    entity_type: "research_mission",
    entity_id: mission.id,
    metadata: {
      venture_id: venture.id,
      total_findings: findingsToInsert.length,
      live_findings: findingsToInsert.length,
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
      live_findings: findingsToInsert.length,
    },
  });

  redirect(`/venture/${venture.id}/research`);
}
