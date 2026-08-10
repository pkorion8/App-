/**
 * Apple's public iTunes Search API — free, no API key, no rate-limit
 * registration required. This is distinct from the paid/developer Apple
 * Search Ads API the master spec flagged as having archived docs and
 * uncertain terms (addendum §7.1); this endpoint is a different, ordinary
 * public search API Apple has run for years: https://itunes.apple.com/search
 *
 * Only covers the iOS App Store. Google Play has no equivalent free public
 * search API — that stays a later source to add (scraping or a paid API).
 */
export interface AppStoreResult {
  name: string;
  seller: string;
  rating: number | null;
  ratingCount: number;
  price: string;
  url: string;
  genre: string;
  lastUpdated: string | null;
  /** The app's original App Store release date (not its latest update) — what newcomer detection is based on. */
  releaseDate: string | null;
}

interface ITunesRawResult {
  trackName?: string;
  sellerName?: string;
  averageUserRating?: number;
  userRatingCount?: number;
  formattedPrice?: string;
  trackViewUrl?: string;
  primaryGenreName?: string;
  currentVersionReleaseDate?: string;
  releaseDate?: string;
}

const FETCH_TIMEOUT_MS = 6000;

export async function searchAppStore(
  query: string,
  country = "us",
  limit = 8,
): Promise<AppStoreResult[]> {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", query);
  url.searchParams.set("country", country);
  url.searchParams.set("entity", "software");
  url.searchParams.set("limit", String(limit));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`iTunes Search API returned ${res.status}`);
    }
    const data: { results?: ITunesRawResult[] } = await res.json();
    return (data.results ?? [])
      .filter((r) => r.trackName)
      .map((r) => ({
        name: r.trackName ?? "Unknown",
        seller: r.sellerName ?? "Unknown",
        rating: typeof r.averageUserRating === "number" ? r.averageUserRating : null,
        ratingCount: r.userRatingCount ?? 0,
        price: r.formattedPrice ?? "Unknown",
        url: r.trackViewUrl ?? "",
        genre: r.primaryGenreName ?? "Unknown",
        lastUpdated: r.currentVersionReleaseDate ?? null,
        releaseDate: r.releaseDate ?? null,
      }));
  } finally {
    clearTimeout(timeout);
  }
}
