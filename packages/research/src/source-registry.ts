export type SourceAccessState = "live" | "partial" | "unavailable";
export type IntelligenceCategory = "competitors" | "market" | "technology" | "reviews" | "pricing" | "regulatory";

export type SourceRegistryEntry = {
  category: IntelligenceCategory;
  provider: string;
  access: SourceAccessState;
  limitations: string;
};

export const SOURCE_REGISTRY: SourceRegistryEntry[] = [
  { category: "competitors", provider: "Apple iTunes Search API", access: "live", limitations: "Public App Store discovery and rating-count signals only; not full traction." },
  { category: "market", provider: "World Bank Open Data", access: "live", limitations: "Country-level indicators; not a direct estimate of addressable market." },
  { category: "technology", provider: "GitHub repository search", access: "partial", limitations: "Useful for ecosystem signals; repository activity does not prove stack suitability." },
  { category: "reviews", provider: "No connected review provider", access: "unavailable", limitations: "Sentiment and complaint themes must remain unavailable until a reliable source is connected." },
  { category: "pricing", provider: "No connected pricing provider", access: "unavailable", limitations: "Competitor pricing must not be inferred or fabricated." },
  { category: "regulatory", provider: "No connected regulatory provider", access: "unavailable", limitations: "Regulatory conclusions require jurisdiction-specific authoritative sources." },
];

export function sourcesFor(category: IntelligenceCategory) {
  return SOURCE_REGISTRY.filter((source) => source.category === category);
}
