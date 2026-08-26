/**
 * Structured companion to a finding's prose summary. Live sources return
 * both: user_facing_summary stays the readable paragraph/bullet text,
 * metadata carries the same numbers in a shape the UI can render as real
 * stat tiles / ranked bars / meters instead of parsing prose. Optional and
 * additive -- a finding with no metadata (any DEMO placeholder, or a row
 * from before this existed) just renders as plain text, same as before.
 */

export interface CompetitorAppSummary {
  name: string;
  seller: string;
  rating: number | null;
  ratingCount: number;
  price: string;
  lastUpdated: string | null;
  isNew: boolean;
}

export interface CompetitorTrendSummary {
  name: string;
  direction: "up" | "down" | "flat";
  delta: number;
  daysSincePrevious: number;
  previousRatingCount: number;
  currentRatingCount: number;
}

export interface CompetitorFindingMetadata {
  kind: "competitors";
  totalFound: number;
  /**
   * Descriptive band derived only from the largest App Store rating count in
   * the returned result set. It is not downloads, revenue, market share,
   * product success, or verified traction.
   */
  ratingVolumeBand?: "High" | "Medium" | "Low";
  /**
   * @deprecated Historical rows stored this rating-count band under a
   * misleading `traction` key. Keep it optional for backward-compatible
   * reads while new UI/code migrates to `ratingVolumeBand`.
   */
  traction?: "Strong" | "Moderate" | "Weak";
  newcomerCount: number;
  weakest: { name: string; ratingCount: number } | null;
  apps: CompetitorAppSummary[];
  trends: CompetitorTrendSummary[];
}

export interface MarketIndicatorSummary {
  id: string;
  label: string;
  year: string;
  value: number;
  formatted: string;
}

export interface MarketFindingMetadata {
  kind: "market";
  geography: string;
  indicators: MarketIndicatorSummary[];
  /** Labels of tracked indicators that didn't come back this run (World Bank is empirically flaky) -- shown so a shorter card reads as "temporarily missing," not broken or arbitrary. */
  missingIndicatorLabels: string[];
}

export interface GithubRepoSummary {
  fullName: string;
  stars: number;
  pushedAt: string | null;
  description: string | null;
  isActive: boolean;
}

export interface GithubFindingMetadata {
  kind: "github";
  totalFound: number;
  activeCount: number;
  repos: GithubRepoSummary[];
}

export type FindingMetadata = CompetitorFindingMetadata | MarketFindingMetadata | GithubFindingMetadata;
