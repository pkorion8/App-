import type { FindingState } from "@venture-sandbox/domain";
import { searchAppStore } from "./sources/itunes-search";
import type { DemoFinding } from "./demo-findings";

const COUNTRY_TO_STORE_CODE: Record<string, string> = {
  "united states": "us",
  usa: "us",
  us: "us",
  canada: "ca",
  "united kingdom": "gb",
  uk: "gb",
  australia: "au",
  india: "in",
  germany: "de",
  france: "fr",
};

function guessStoreCountry(geography: string): string {
  const normalized = geography.trim().toLowerCase();
  return COUNTRY_TO_STORE_CODE[normalized] ?? "us";
}

function classifyTraction(ratingCounts: number[]): "Strong" | "Moderate" | "Weak" {
  const max = Math.max(0, ...ratingCounts);
  if (max >= 1000) return "Strong";
  if (max >= 100) return "Moderate";
  return "Weak";
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
}): Promise<Omit<DemoFinding, "state"> & { state: FindingState } | null> {
  const country = guessStoreCountry(input.geography);

  let results;
  try {
    results = await searchAppStore(input.ventureName, country, 6);
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
    };
  }

  const traction = classifyTraction(results.map((r) => r.ratingCount));
  const top = results.slice(0, 4);
  const listLines = top
    .map((r) => {
      const rating = r.rating !== null ? `${r.rating.toFixed(1)}★` : "no rating";
      const updated = r.lastUpdated
        ? new Date(r.lastUpdated).toISOString().slice(0, 10)
        : "unknown update date";
      return `${r.name} (${r.seller}) — ${rating}, ${r.ratingCount.toLocaleString()} ratings, ${r.price}, last updated ${updated}`;
    })
    .join("; ");

  return {
    normalizedClaim: `Live App Store competitors for "${input.ventureName}"`,
    userFacingSummary:
      `Real App Store search (${input.geography}, Apple only): ${results.length} ` +
      `${results.length === 1 ? "app" : "apps"} found. ` +
      `Traction signal: ${traction} — based on ratings volume of the closest matches. ${listLines}.`,
    state: "MIXED",
    limitations:
      "Apple App Store only (no Google Play), matched by name/keyword only, and rating " +
      "counts are a proxy for traction, not actual download or revenue figures.",
    nextTest: "Cross-check the top matches on Google Play and read their recent reviews directly.",
  };
}
