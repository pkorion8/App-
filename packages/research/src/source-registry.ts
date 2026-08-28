export type SourceAccessState = "live" | "partial" | "unavailable";
export type IntelligenceCategory = "competitors" | "market" | "technology" | "reviews" | "pricing" | "regulatory";

export type SourceRegistryEntry = {
  category: IntelligenceCategory;
  provider: string;
  access: SourceAccessState;
  limitations: string;
  claimBoundary: string;
};

export const SOURCE_REGISTRY: SourceRegistryEntry[] = [
  {
    category: "competitors",
    provider: "Apple iTunes Search API",
    access: "live",
    limitations: "Public App Store discovery, ratings, rating counts and listing metadata only.",
    claimBoundary: "May describe discovered apps and rating-count signals. Must not label those signals as traction, downloads, revenue, market share or success.",
  },
  {
    category: "market",
    provider: "World Bank Open Data",
    access: "live",
    limitations: "Country-level public indicators only; coverage varies by indicator and year.",
    claimBoundary: "May report the sourced indicator and year. Must not convert population or macro indicators into TAM, demand, revenue potential or willingness to pay.",
  },
  {
    category: "technology",
    provider: "GitHub repository search",
    access: "partial",
    limitations: "Public repository discovery and activity signals; repository metadata can be incomplete and is not product evidence.",
    claimBoundary: "May describe related repositories and observed activity. Must not treat repository counts or activity as customer demand, commercial traction, stack suitability or feasibility proof.",
  },
  {
    category: "reviews",
    provider: "No connected review provider",
    access: "unavailable",
    limitations: "Sentiment and complaint themes are unavailable until a reliable review source is connected.",
    claimBoundary: "Do not infer, synthesize or fabricate review sentiment, complaint frequency or user satisfaction.",
  },
  {
    category: "pricing",
    provider: "No connected pricing provider",
    access: "unavailable",
    limitations: "Competitor pricing is unavailable from a dedicated connected source.",
    claimBoundary: "Do not infer or fabricate competitor pricing, ARPU, willingness to pay or monetization benchmarks.",
  },
  {
    category: "regulatory",
    provider: "No connected regulatory provider",
    access: "unavailable",
    limitations: "Regulatory conclusions require jurisdiction-specific authoritative sources that are not connected here.",
    claimBoundary: "Do not present regulatory requirements, compliance status or legal conclusions as researched facts.",
  },
];

export function sourcesFor(category: IntelligenceCategory) {
  return SOURCE_REGISTRY.filter((source) => source.category === category);
}

export function sourceFor(category: IntelligenceCategory) {
  return SOURCE_REGISTRY.find((source) => source.category === category);
}

export function isCategoryAvailable(category: IntelligenceCategory) {
  return sourceFor(category)?.access !== "unavailable";
}
