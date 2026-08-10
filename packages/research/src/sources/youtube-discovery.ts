import type { DiscoveredVideo } from "@venture-sandbox/domain";

/**
 * Official YouTube Data API v3 usage only -- this file must never scrape.
 * Uses the cheap path (channels.list + playlistItems.list, 1 quota unit
 * each) rather than search.list (100 units) so ~100 monitored channels
 * costs ~200 units/day against the default 10,000/day free quota.
 */

const API_BASE = "https://www.googleapis.com/youtube/v3";
const FETCH_TIMEOUT_MS = 8000;

async function youtubeFetch(path: string, params: Record<string, string>, apiKey: string) {
  const url = new URL(`${API_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`YouTube API ${path} returned ${res.status}: ${body.slice(0, 200)}`);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function getUploadsPlaylistId(channelId: string, apiKey: string): Promise<string | null> {
  const data = await youtubeFetch(
    "channels",
    { part: "contentDetails", id: channelId },
    apiKey,
  );
  const item = data.items?.[0];
  return item?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

/**
 * Recent uploads for one channel, filtered to the last `sinceDays` days.
 * Returns [] (not an error) if the channel has no uploads playlist or no
 * recent videos -- that's a normal, expected outcome for a quiet channel,
 * not a failure.
 */
export async function getRecentUploads(
  channelId: string,
  apiKey: string,
  sinceDays = 7,
): Promise<DiscoveredVideo[]> {
  const uploadsPlaylistId = await getUploadsPlaylistId(channelId, apiKey);
  if (!uploadsPlaylistId) return [];

  const data = await youtubeFetch(
    "playlistItems",
    { part: "snippet", playlistId: uploadsPlaylistId, maxResults: "15" },
    apiKey,
  );

  const cutoff = Date.now() - sinceDays * 24 * 60 * 60 * 1000;

  const items: Array<{
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      channelTitle?: string;
      resourceId?: { videoId?: string };
    };
  }> = data.items ?? [];

  return items
    .filter((item) => {
      const publishedAt = item.snippet?.publishedAt;
      return publishedAt && new Date(publishedAt).getTime() >= cutoff;
    })
    .map((item) => ({
      videoId: item.snippet!.resourceId?.videoId ?? "",
      title: item.snippet!.title ?? "",
      description: item.snippet!.description ?? "",
      publishedAt: item.snippet!.publishedAt!,
      channelTitle: item.snippet!.channelTitle ?? "",
    }))
    .filter((v) => v.videoId);
}

export interface DiscoveredComment {
  text: string;
  authorDisplayName: string;
  likeCount: number;
  publishedAt: string;
}

/** Top-level comments only, newest first. Returns [] if comments are disabled. */
export async function getVideoComments(
  videoId: string,
  apiKey: string,
  maxResults = 20,
): Promise<DiscoveredComment[]> {
  try {
    const data = await youtubeFetch(
      "commentThreads",
      { part: "snippet", videoId, maxResults: String(maxResults), order: "relevance" },
      apiKey,
    );
    const items: Array<{
      snippet?: {
        topLevelComment?: {
          snippet?: {
            textOriginal?: string;
            authorDisplayName?: string;
            likeCount?: number;
            publishedAt?: string;
          };
        };
      };
    }> = data.items ?? [];

    return items
      .map((item) => item.snippet?.topLevelComment?.snippet)
      .filter((s): s is NonNullable<typeof s> => Boolean(s?.textOriginal))
      .map((s) => ({
        text: s.textOriginal ?? "",
        authorDisplayName: s.authorDisplayName ?? "",
        likeCount: s.likeCount ?? 0,
        publishedAt: s.publishedAt ?? "",
      }));
  } catch {
    // Comments disabled or region-blocked -- not a failure worth surfacing.
    return [];
  }
}
