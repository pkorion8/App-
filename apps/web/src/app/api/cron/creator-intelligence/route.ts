import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@venture-sandbox/integrations";
import { getRecentUploads } from "@venture-sandbox/research/youtube-discovery";
import { fetchTranscriptViaBrowser } from "@venture-sandbox/research/youtube-transcript";
import { extractHeuristicClaims } from "@venture-sandbox/research/heuristic-claims";

// Vercel Hobby plan caps function duration at 60s even with this set --
// that's the hard constraint this whole route is designed around. A full
// browser launch + navigation per video is too slow to run against many
// videos in one invocation, hence MAX_TRANSCRIPTS_PER_RUN below rather
// than "process everything discovered today."
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const DEFAULT_SINCE_DAYS = 7;
const DEFAULT_MAX_TRANSCRIPTS_PER_RUN = 6;
// The real daily schedule (vercel.json) always hits this route with no
// query params, so it gets the defaults above. These params exist for
// manual backfills -- e.g. registering a channel and wanting its last two
// months, not just what's new today -- invoked by hand with the same
// CRON_SECRET, not by the scheduler.
const MAX_SINCE_DAYS = 120;
const MAX_LIMIT_PER_RUN = 10;

interface RunSummary {
  channelsChecked: number;
  videosDiscovered: number;
  videosAttempted: number;
  transcriptsFound: number;
  claimsExtracted: number;
  errors: string[];
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sinceDaysParam = Number(request.nextUrl.searchParams.get("sinceDays"));
  const sinceDays =
    Number.isFinite(sinceDaysParam) && sinceDaysParam > 0
      ? Math.min(sinceDaysParam, MAX_SINCE_DAYS)
      : DEFAULT_SINCE_DAYS;

  const limitParam = Number(request.nextUrl.searchParams.get("limit"));
  const maxTranscriptsPerRun =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_LIMIT_PER_RUN)
      : DEFAULT_MAX_TRANSCRIPTS_PER_RUN;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Supabase service role not configured" },
      { status: 500 },
    );
  }
  if (!youtubeApiKey) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY not configured" },
      { status: 500 },
    );
  }

  const supabase = createSupabaseServiceClient(supabaseUrl, serviceRoleKey);
  const summary: RunSummary = {
    channelsChecked: 0,
    videosDiscovered: 0,
    videosAttempted: 0,
    transcriptsFound: 0,
    claimsExtracted: 0,
    errors: [],
  };

  const { data: channels, error: channelsError } = await supabase
    .from("youtube_channels")
    .select("id, channel_id, channel_name")
    .eq("is_active", true);

  if (channelsError) {
    return NextResponse.json({ error: channelsError.message }, { status: 500 });
  }
  if (!channels || channels.length === 0) {
    return NextResponse.json({ ...summary, message: "No active channels registered." });
  }

  // Step 1: official-API discovery across every channel. Cheap (1 quota
  // unit per call) and fast -- no reason to cap this part.
  const discovered: Array<{
    channelRowId: string;
    channelId: string;
    videoId: string;
    title: string;
    publishedAt: string;
  }> = [];

  for (const channel of channels) {
    summary.channelsChecked++;
    try {
      const uploads = await getRecentUploads(channel.channel_id, youtubeApiKey, sinceDays);
      for (const video of uploads) {
        discovered.push({
          channelRowId: channel.id,
          channelId: channel.channel_id,
          videoId: video.videoId,
          title: video.title,
          publishedAt: video.publishedAt,
        });
      }
    } catch (e) {
      summary.errors.push(`discovery failed for ${channel.channel_name ?? channel.channel_id}: ${(e as Error).message}`);
    }
  }
  summary.videosDiscovered = discovered.length;

  // Mark every checked channel as checked regardless of whether it had new
  // videos -- "checked, found nothing" is a real, useful outcome to record.
  await supabase
    .from("youtube_channels")
    .update({ last_checked_at: new Date().toISOString() })
    .in(
      "id",
      channels.map((c) => c.id),
    );

  // Step 2: transcript + extraction, capped per run (see maxDuration
  // comment above). Newest videos first.
  discovered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const toProcess = discovered.slice(0, maxTranscriptsPerRun);

  const chromiumExecutablePath = await resolveChromiumExecutablePath();
  if (!chromiumExecutablePath) {
    summary.errors.push("No Chromium executable available -- skipping transcript step this run.");
    return NextResponse.json(summary);
  }

  for (const video of toProcess) {
    summary.videosAttempted++;
    try {
      const { data: existing } = await supabase
        .from("creator_claims")
        .select("id")
        .eq("video_id", video.videoId)
        .limit(1);
      if (existing && existing.length > 0) continue; // already processed on a prior run

      const segments = await fetchTranscriptViaBrowser(video.videoId, {
        executablePath: chromiumExecutablePath,
      });
      if (!segments || segments.length === 0) continue;
      summary.transcriptsFound++;

      const claims = extractHeuristicClaims(segments);
      if (claims.length === 0) continue;

      const { error: insertError } = await supabase.from("creator_claims").insert(
        claims.map((c) => ({
          channel_id: video.channelRowId,
          video_id: video.videoId,
          video_title: video.title,
          video_url: `https://www.youtube.com/watch?v=${video.videoId}`,
          published_at: video.publishedAt,
          claim_type: c.claimType,
          claim_text: c.claimText,
          video_timestamp_seconds: c.videoTimestampSeconds,
          extraction_method: "heuristic" as const,
          confidence: "unverified" as const,
        })),
      );
      if (insertError) {
        summary.errors.push(`insert failed for video ${video.videoId}: ${insertError.message}`);
      } else {
        summary.claimsExtracted += claims.length;
      }
    } catch (e) {
      summary.errors.push(`processing failed for video ${video.videoId}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json(summary);
}

async function resolveChromiumExecutablePath(): Promise<string | null> {
  // Local/dev: point CHROMIUM_EXECUTABLE_PATH at a real Chromium binary.
  // Production (Vercel): @sparticuz/chromium provides a Lambda-compatible
  // build; regular desktop Chromium is too large to bundle into a
  // serverless function.
  if (process.env.CHROMIUM_EXECUTABLE_PATH) {
    return process.env.CHROMIUM_EXECUTABLE_PATH;
  }
  try {
    const sparticuz = await import("@sparticuz/chromium");
    return await sparticuz.default.executablePath();
  } catch {
    return null;
  }
}
