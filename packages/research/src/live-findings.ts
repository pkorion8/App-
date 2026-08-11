import type { FindingState } from "@venture-sandbox/domain";
import { searchAppStore } from "./sources/itunes-search";
import { fetchWorldBankIndicators, type WorldBankIndicatorResult } from "./sources/world-bank";
import { searchGitHubRepos } from "./sources/github";
import { resolveCountryCode } from "./geography";
import { compareSnapshots, type PreviousAppSnapshot, type TrendResult } from "./trend";
import type { DemoFinding } from "./demo-findings";

export interface CompetitorSnapshotToPersist {
  appId: number;
  name: string;
  ratingCount: number;
}

function guessStoreCountry(geography: string): string {
  return (resolveCountryCode(geography) ?? "US").toLowerCase();
}

export function classifyTraction(ratingCounts: number[]): "Strong" | "Moderate" | "Weak" {
  const max = Math.max(0, ...ratingCounts);
  if (max >= 1000) return "Strong";
  if (max >= 100) return "Moderate";
  return "Weak";
}

const NEWCOMER_WINDOW_DAYS = 365;

/**
 * A "newcomer" is an app whose original App Store release date (not its
 * latest update) falls inside the trailing year -- a single, real,
 * computable signal from the same search, not a guess. No historical
 * snapshot store needed: this is always relative to "now."
 */
export function isNewcomer(releaseDate: string | null): boolean {
  if (!releaseDate) return false;
  const releasedAt = new Date(releaseDate).getTime();
  if (Number.isNaN(releasedAt)) return false;
  const ageDays = (Date.now() - releasedAt) / (1000 * 60 * 60 * 24);
  return ageDays >= 0 && ageDays <= NEWCOMER_WINDOW_DAYS;
}

/**
 * Real App Store competitor search (spec's "Layer 1: Market" research).
 * Returns null if the live call fails or finds nothing usable — the caller
 * falls back to the honest DEMO placeholder rather than showing a broken
 * or empty card.
 *
 * State is capped at MIXED, never SOLID: this is one uncorroborated source
 * (App Store listings only, no independent cross-check), which is exactly
 * what MIXED means in the spec's evidence model (§7 of the master spec) —
 * real, but not yet verified against a second independent source.
 */
export async function researchAppStoreCompetitors(input: {
  ventureName: string;
  ideaText: string;
  geography: string;
  /** Prior runs' snapshots for this venture, if any -- enables real trend detection without any new scheduled infrastructure. */
  previousSnapshots?: PreviousAppSnapshot[];
}): Promise<
  | (Omit<DemoFinding, "state"> & { state: FindingState; snapshots: CompetitorSnapshotToPersist[] })
  | null
> {
  const country = guessStoreCountry(input.geography);

  let results;
  try {
    results = await searchAppStore(input.ventureName, country, 15);
  } catch {
    return null;
  }

  if (results.length === 0) {
    return {
      normalizedClaim: `App Store search for "${input.ventureName}"`,
      userFacingSummary:
        `A live App Store search for "${input.ventureName}" in ${input.geography} ` +
        `didn't surface a close match. That could mean little direct competition — ` +
        `or just that the search terms need adjusting. Worth trying a broader search yourself.`,
      state: "WEAK",
      limitations:
        "Covers only the Apple App Store, only by name match, and only what Apple's " +
        "public listing search returns — not Google Play, and not download/revenue data.",
      nextTest: "Try a broader or differently-worded search on the App Store and Google Play directly.",
      snapshots: [],
    };
  }

  const traction = classifyTraction(results.map((r) => r.ratingCount));
  // Sorted strongest-traction-first so both ends of the list are visible
  // at a glance: the established leaders, and the weakest-traction match
  // at the bottom -- a real, derived signal (lowest rating volume in this
  // result set), not a guess at *why* it's weak, which isn't knowable
  // from listing data alone.
  const sorted = [...results].sort((a, b) => b.ratingCount - a.ratingCount);
  const shown = sorted.slice(0, 10);
  const formatEntry = (r: (typeof shown)[number]) => {
    const rating = r.rating !== null ? `${r.rating.toFixed(1)}★` : "no rating";
    const updated = r.lastUpdated
      ? new Date(r.lastUpdated).toISOString().slice(0, 10)
      : "unknown update date";
    const newcomerTag = isNewcomer(r.releaseDate) ? ", NEW in the last year" : "";
    return `• ${r.name} (${r.seller}) — ${rating}, ${r.ratingCount.toLocaleString()} ratings, ${r.price}, last updated ${updated}${newcomerTag}`;
  };
  const listLines = shown.map(formatEntry).join("\n");

  const weakest = sorted[sorted.length - 1];
  const weakestNote =
    shown.length > 1 && weakest
      ? `Weakest traction in this set: ${weakest.name} (${weakest.ratingCount.toLocaleString()} ratings) — ` +
        `could mean an underserved angle, or just a newer/lower-effort listing. Worth a manual look before reading much into it.`
      : "";

  const newcomers = results.filter((r) => isNewcomer(r.releaseDate));
  const newcomerSentence =
    newcomers.length > 0
      ? `${newcomers.length} of ${results.length} launched within the last year: ${newcomers
          .map((r) => r.name)
          .join(", ")} — worth watching as active new entrants, not just established players.`
      : `None of the ${results.length} matches launched within the last year — this looks like an established field rather than one with fresh entrants right now.`;

  // Real trend detection, no fabrication: only apps present in BOTH this
  // run and a previous run for this same venture get a direction at all.
  // First-ever research on a venture always has zero trend results --
  // that's correct, not a bug, since there's nothing yet to compare against.
  const trendable = results
    .filter((r): r is typeof r & { appId: number } => r.appId !== null)
    .map((r) => ({ appId: r.appId, name: r.name, ratingCount: r.ratingCount }));
  const trends = compareSnapshots(trendable, input.previousSnapshots ?? []);
  const trendSection = formatTrendSection(trends);

  return {
    normalizedClaim: `Live App Store competitors for "${input.ventureName}"${
      newcomers.length > 0 ? ` (${newcomers.length} newcomer${newcomers.length === 1 ? "" : "s"})` : ""
    }`,
    userFacingSummary:
      `Real App Store search (${input.geography}, Apple only): ${results.length} ` +
      `${results.length === 1 ? "app" : "apps"} found${results.length > shown.length ? `, top ${shown.length} shown by ratings volume` : ""}. ` +
      `Traction signal: ${traction} — based on ratings volume of the closest matches.\n\n` +
      `${listLines}\n\n${newcomerSentence}${weakestNote ? `\n\n${weakestNote}` : ""}${trendSection}`,
    state: "MIXED",
    limitations:
      "Apple App Store only (no Google Play), matched by name/keyword only, and rating " +
      "counts are a proxy for traction, not actual download or revenue figures. \"Newcomer\" is " +
      "based on the app's original release date being within the last 12 months, not on repeated checks over time. " +
      "No revenue, subscription pricing, or review content is available from this free API.",
    nextTest: "Cross-check the top matches on Google Play and read their recent reviews directly.",
    snapshots: trendable,
  };
}

function formatTrendSection(trends: TrendResult[]): string {
  if (trends.length === 0) return "";
  const lines = trends
    .map((t) => {
      const arrow = t.direction === "up" ? "↑" : t.direction === "down" ? "↓" : "→";
      const deltaText = t.delta === 0 ? "no change" : `${t.delta > 0 ? "+" : ""}${t.delta.toLocaleString()} ratings`;
      return `• ${t.name}: ${arrow} ${deltaText} over the last ${t.daysSincePrevious} day${t.daysSincePrevious === 1 ? "" : "s"} (${t.previousRatingCount.toLocaleString()} → ${t.currentRatingCount.toLocaleString()})`;
    })
    .join("\n");
  return `\n\nTrend since this venture's last research run:\n\n${lines}`;
}

function formatIndicatorValue(indicator: WorldBankIndicatorResult): string {
  switch (indicator.indicatorId) {
    case "SP.POP.TOTL":
      return `${Math.round(indicator.value).toLocaleString()} people`;
    case "NY.GDP.PCAP.CD":
      return `$${Math.round(indicator.value).toLocaleString()}`;
    case "IT.NET.USER.ZS":
      return `${indicator.value.toFixed(1)}%`;
    default:
      return indicator.value.toLocaleString();
  }
}

/**
 * Real World Bank Open Data lookup (population, GDP per capita, internet
 * penetration) for the venture's target geography. Free, no key. Returns
 * null if the geography couldn't be matched to a country or every
 * indicator call failed, so the caller falls back to the DEMO placeholder
 * rather than showing a broken or empty card.
 *
 * State is capped at MIXED, same reasoning as the App Store source above:
 * one real source (however official), no independent cross-check.
 */
export async function researchMarketIndicators(input: {
  geography: string;
}): Promise<(Omit<DemoFinding, "state"> & { state: FindingState }) | null> {
  const countryCode = resolveCountryCode(input.geography);
  if (!countryCode) return null;

  const indicators = await fetchWorldBankIndicators(countryCode);
  if (indicators.length === 0) return null;

  const lines = indicators
    .map((ind) => `• ${ind.label} (${ind.year}): ${formatIndicatorValue(ind)}`)
    .join("\n");

  return {
    normalizedClaim: `World Bank market indicators for ${input.geography}`,
    userFacingSummary: `Live World Bank data for ${input.geography}:\n\n${lines}`,
    state: "MIXED",
    limitations:
      "World Bank's most recently reported figures per indicator, which can lag a year or " +
      "more and may not all be for the same year. This is macro country-level data, not " +
      "product-category-specific market sizing.",
    nextTest:
      "Cross-reference with a market-sizing source specific to this product category " +
      "(industry reports, local trade or app-store category data).",
  };
}

const ACTIVE_REPO_WINDOW_DAYS = 180;

export function isActivelyMaintained(pushedAt: string | null): boolean {
  if (!pushedAt) return false;
  const pushedAtMs = new Date(pushedAt).getTime();
  if (Number.isNaN(pushedAtMs)) return false;
  const ageDays = (Date.now() - pushedAtMs) / (1000 * 60 * 60 * 24);
  return ageDays >= 0 && ageDays <= ACTIVE_REPO_WINDOW_DAYS;
}

/**
 * Real GitHub search for open-source projects related to the idea (the
 * "Tech" half of Similar Apps/Tech, alongside the App Store competitor
 * search above). Free, no key, unauthenticated. Returns null if nothing
 * usable comes back, so the caller falls back to the DEMO placeholder.
 *
 * State is capped at MIXED for the same reason as every other live
 * source here: one uncorroborated source, no independent cross-check.
 */
export async function researchGitHubActivity(input: {
  ventureName: string;
}): Promise<(Omit<DemoFinding, "state"> & { state: FindingState }) | null> {
  let results;
  try {
    results = await searchGitHubRepos(input.ventureName, 5);
  } catch {
    return null;
  }

  if (results.length === 0) {
    return {
      normalizedClaim: `Open-source search for "${input.ventureName}"`,
      userFacingSummary:
        `A GitHub search for "${input.ventureName}" didn't surface a close match. That could ` +
        `mean this hasn't been built as an open-source project before — or just that the ` +
        `search terms need adjusting.`,
      state: "WEAK",
      limitations: "Covers only public GitHub repositories, matched by name/keyword only.",
      nextTest: "Try a broader or differently-worded search on GitHub directly.",
    };
  }

  const activeCount = results.filter((r) => isActivelyMaintained(r.pushedAt)).length;
  const top = results.slice(0, 4);
  const listLines = top
    .map((r) => {
      const updated = r.pushedAt ? new Date(r.pushedAt).toISOString().slice(0, 10) : "unknown";
      const desc = r.description ? ` — ${r.description}` : "";
      return `• ${r.fullName} (${r.stars.toLocaleString()}★, last pushed ${updated})${desc}`;
    })
    .join("\n");

  return {
    normalizedClaim: `Related open-source projects for "${input.ventureName}"`,
    userFacingSummary:
      `Real GitHub search: ${results.length} related ${results.length === 1 ? "repo" : "repos"} found, ` +
      `${activeCount} actively maintained (pushed to in the last ${ACTIVE_REPO_WINDOW_DAYS} days).\n\n` +
      listLines,
    state: "MIXED",
    limitations:
      "Public GitHub repositories only, matched by name/keyword only. Star count is a rough " +
      "popularity proxy, not a measure of real-world usage or commercial competition.",
    nextTest: "Check whether any close matches are actively used in production, not just starred.",
  };
}
