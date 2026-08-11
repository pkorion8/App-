/**
 * Turns a venture's name + idea text into a handful of real search
 * keywords instead of always searching on the bare venture name. This is
 * the "extraction_method: heuristic" tier (same tier as
 * extraction/heuristic-claims.ts) -- stopword-stripped keyword extraction,
 * not category-aware semantic understanding (that needs an LLM, which
 * isn't connected yet -- see AGENTS.md). It's a real, useful pass at
 * surfacing idea-specific terms ("ordering", "delivery", "marketplace")
 * that a name-only search misses entirely, not a claim that two
 * completely different ideas get bespoke domain taxonomies.
 */

const STOPWORDS = new Set([
  "a", "an", "the", "for", "and", "or", "of", "to", "in", "on", "with", "that", "this",
  "is", "are", "was", "were", "be", "been", "being", "it", "its", "as", "by", "at",
  "from", "into", "about", "app", "apps", "application", "users", "user", "people",
  "platform", "product", "service", "idea", "new", "help", "helps", "lets", "let",
  "allows", "using", "use", "who", "want", "wants", "need", "needs", "get", "gets",
  "make", "makes", "which", "their", "them", "they", "you", "your", "our", "we",
  "will", "can", "would", "could", "so", "also", "each", "other", "more", "most",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Returns a compact search query: the venture name's own words (still the
 * strongest single signal for a name/description match) plus up to
 * `maxExtraTerms` additional distinctive words pulled from the idea text
 * that the name doesn't already cover. Deliberately capped small --
 * over-constraining a keyword search can return zero results, which is
 * worse than a slightly broader one.
 */
export function deriveSearchKeywords(ventureName: string, ideaText: string, maxExtraTerms = 3): string {
  const nameWords = tokenize(ventureName);
  const nameWordSet = new Set(nameWords);

  const ideaWords = tokenize(ideaText).filter((w) => w.length > 2 && !STOPWORDS.has(w));

  const seen = new Set<string>(nameWordSet);
  const extraTerms: string[] = [];
  for (const w of ideaWords) {
    if (seen.has(w)) continue;
    seen.add(w);
    extraTerms.push(w);
    if (extraTerms.length >= maxExtraTerms) break;
  }

  return [...nameWords, ...extraTerms].join(" ").trim();
}
