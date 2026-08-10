export interface YoutubeChannel {
  id: string;
  channelId: string;
  channelHandle: string | null;
  channelName: string | null;
  addedBy: string | null;
  isActive: boolean;
  lastCheckedAt: string | null;
  createdAt: string;
}

export type ClaimType =
  | "cost"
  | "revenue"
  | "users"
  | "tooling"
  | "timeline"
  | "problem"
  | "marketing"
  | "other";

export type ExtractionMethod = "heuristic" | "llm" | "manual";
export type ClaimConfidence = "unverified" | "corroborated";

export interface CreatorClaim {
  id: string;
  channelId: string;
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  publishedAt: string | null;
  claimType: ClaimType;
  claimText: string;
  videoTimestampSeconds: number | null;
  extractionMethod: ExtractionMethod;
  confidence: ClaimConfidence;
  createdAt: string;
}

export interface DiscoveredVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
}
