/**
 * GitHub's public search API — free, no key required for reasonable
 * volume (unauthenticated search is rate-limited to 10 req/min, which
 * this app's usage pattern stays well under). Surfaces open-source
 * activity related to the idea: existing projects, how active they are,
 * and rough popularity (stars) as a proxy for developer/community interest.
 *
 * NOTE ON TESTING: this sandbox's network egress intercepts all
 * api.github.com traffic and scopes it to the session's attached repos
 * only ("sessions are bound to their configured repositories"), so this
 * connector could not be verified live the way the App Store and World
 * Bank connectors were. It's written against GitHub's stable, long-
 * documented REST API (https://docs.github.com/en/rest/search/search#search-repositories)
 * with the required User-Agent header and defensive error handling, but
 * treat it the same as the YouTube transcript connector: best-effort,
 * verify against the real deployed app, don't assume it's bulletproof
 * until it's been watched succeed in production.
 */

export interface GitHubRepoResult {
  fullName: string;
  description: string | null;
  stars: number;
  url: string;
  pushedAt: string | null;
}

const FETCH_TIMEOUT_MS = 8000;
// GitHub's default search matches README content too, not just the name/
// description -- that's how a totally unrelated idea can match a repo
// whose README happens to contain some coincidental phrase (observed
// live: a CS homework repo whose README was someone's copy-pasted movie
// script). Restricting to name+description cuts a lot of that noise.
const SEARCH_QUALIFIER = "in:name,description";
// A repo's description is free text from a stranger, unbounded in
// length -- cap it hard before it ever reaches a finding's summary text,
// regardless of how irrelevant or long what GitHub returns turns out to be.
const MAX_DESCRIPTION_LENGTH = 160;

export function truncateDescription(description: string | null): string | null {
  if (!description) return null;
  const trimmed = description.trim();
  if (trimmed.length <= MAX_DESCRIPTION_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_DESCRIPTION_LENGTH).trimEnd()}…`;
}

export async function searchGitHubRepos(query: string, limit = 5): Promise<GitHubRepoResult[]> {
  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", `${query} ${SEARCH_QUALIFIER}`);
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", String(limit));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "venture-sandbox-research",
      },
    });
    // Includes rate-limit (403) and validation (422/empty-query) responses --
    // both should degrade to "no signal" rather than throw.
    if (!res.ok) return [];

    const data: {
      items?: Array<{
        full_name?: string;
        description?: string | null;
        stargazers_count?: number;
        html_url?: string;
        pushed_at?: string | null;
      }>;
    } = await res.json();

    return (data.items ?? [])
      .filter((r) => r.full_name && r.html_url)
      .map((r) => ({
        fullName: r.full_name as string,
        description: truncateDescription(r.description ?? null),
        stars: r.stargazers_count ?? 0,
        url: r.html_url as string,
        pushedAt: r.pushed_at ?? null,
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
