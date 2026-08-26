import type { Metadata } from "next";
import Link from "next/link";
import {
  SOURCE_REGISTRY,
  researchGitHubActivity,
  researchMarketIndicators,
  searchAppStore,
} from "@venture-sandbox/research";
import { Badge, Card } from "@venture-sandbox/ui";

export const metadata: Metadata = { title: "Explore · Sim Venture" };
export const dynamic = "force-dynamic";

const COUNTRIES = [
  ["us", "United States"],
  ["ca", "Canada"],
  ["gb", "United Kingdom"],
  ["au", "Australia"],
  ["sg", "Singapore"],
  ["in", "India"],
] as const;

function isRecentRelease(date: string | null) {
  if (!date) return false;
  const released = new Date(date).getTime();
  if (Number.isNaN(released)) return false;
  const ageDays = (Date.now() - released) / 86_400_000;
  return ageDays >= 0 && ageDays <= 365;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1]! + sorted[middle]!) / 2) : sorted[middle]!;
}

async function safeLookup<T>(lookup: Promise<T>): Promise<T | null> {
  try {
    return await lookup;
  } catch {
    return null;
  }
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string; country?: string }> }) {
  const { q, country: requestedCountry } = await searchParams;
  const query = q?.trim() ?? "";
  const country = COUNTRIES.some(([code]) => code === requestedCountry) ? requestedCountry! : "us";
  const countryLabel = COUNTRIES.find(([code]) => code === country)?.[1] ?? "United States";
  let results: Awaited<ReturnType<typeof searchAppStore>> = [];
  let appStoreFailed = false;

  const [marketFinding, githubFinding] = query
    ? await Promise.all([
        safeLookup(researchMarketIndicators({ geography: countryLabel })),
        safeLookup(researchGitHubActivity({ ventureName: query, ideaText: query })),
      ])
    : [null, null];

  if (query) {
    try {
      results = await searchAppStore(query, country, 20);
    } catch {
      appStoreFailed = true;
    }
  }

  const ratingCounts = results.map((app) => app.ratingCount);
  const totalRatings = ratingCounts.reduce((sum, value) => sum + value, 0);
  const medianRatings = median(ratingCounts);
  const topByRatings = [...results].sort((a, b) => b.ratingCount - a.ratingCount)[0] ?? null;
  const newcomerCount = results.filter((app) => isRecentRelease(app.releaseDate)).length;
  const freeCount = results.filter((app) => app.price.toLowerCase() === "free").length;

  const sourceState = (category: string) => {
    if (!query) return "Ready";
    if (category === "competitors") return appStoreFailed ? "Unavailable this search" : "Live";
    if (category === "market") return marketFinding ? "Live" : "Unavailable this search";
    if (category === "technology") return githubFinding ? "Connected · partial signal" : "Unavailable this search";
    return "Not connected";
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-vs-primary">Explore</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-vs-fg">Search before you build.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-vs-fg-muted">Search a category, problem or app concept. Explore checks connected public sources and labels gaps explicitly instead of filling them with generated market claims.</p>
        </div>
        <Badge status="success">LIVE SOURCE SEARCH</Badge>
      </div>

      <form className="mt-8 grid gap-3 sm:grid-cols-[1fr_190px_auto]" action="/explore" method="get">
        <input name="q" defaultValue={query} placeholder="Try: receipt warranty, meal planner, habit tracker..." className="min-h-12 rounded-vs-md border border-vs-border bg-vs-bg px-4 text-sm text-vs-fg outline-none focus:border-vs-primary" />
        <select name="country" defaultValue={country} className="min-h-12 rounded-vs-md border border-vs-border bg-vs-bg px-3 text-sm text-vs-fg outline-none focus:border-vs-primary">
          {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
        <button className="rounded-vs-md bg-vs-primary px-5 py-3 text-sm font-semibold text-vs-primary-fg" type="submit">Search sources</button>
      </form>

      {!query && (
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">1 · Search</p><h2 className="mt-2 font-semibold text-vs-fg">See what already exists</h2><p className="mt-2 text-sm text-vs-fg-muted">Check real App Store competition, country-level World Bank indicators and related public GitHub activity.</p></Card>
          <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">2 · Compare</p><h2 className="mt-2 font-semibold text-vs-fg">Shortlist ideas</h2><p className="mt-2 text-sm text-vs-fg-muted">Create ventures from promising directions, then compare them side by side.</p></Card>
          <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">3 · Test</p><h2 className="mt-2 font-semibold text-vs-fg">Move into the venture lab</h2><p className="mt-2 text-sm text-vs-fg-muted">Research, shape, monetize, simulate and plan the first build.</p></Card>
        </div>
      )}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Source status</p>
            <h2 className="mt-1 text-xl font-semibold text-vs-fg">What Explore can verify right now</h2>
          </div>
          <Link className="text-xs font-semibold text-vs-primary hover:underline" href="/methodology">Evidence rules →</Link>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SOURCE_REGISTRY.map((source) => (
            <Card key={`${source.category}-${source.provider}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">{source.category}</p>
                  <p className="mt-1 font-semibold text-vs-fg">{source.provider}</p>
                </div>
                <Badge status={sourceState(source.category).startsWith("Live") || sourceState(source.category).startsWith("Connected") ? "success" : "neutral"}>{sourceState(source.category)}</Badge>
              </div>
              <p className="mt-3 text-xs leading-5 text-vs-fg-muted">{source.limitations}</p>
            </Card>
          ))}
        </div>
      </section>

      {query && appStoreFailed && <Card className="mt-8"><p className="font-semibold text-vs-fg">App Store search is temporarily unavailable.</p><p className="mt-2 text-sm text-vs-fg-muted">No competitor results are being fabricated. Other connected-source results below can still be used independently.</p></Card>}

      {query && (
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Search-results dashboard · {countryLabel}</p><h2 className="mt-1 text-2xl font-semibold text-vs-fg">Evidence for “{query}”</h2></div>
            <Link className="rounded-vs-sm bg-vs-fg px-3 py-2 text-xs font-semibold text-vs-bg" href={`/dashboard?name=${encodeURIComponent(query)}&idea=${encodeURIComponent(query)}`}>Create this venture →</Link>
          </div>

          {!appStoreFailed && results.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Card><p className="text-xs text-vs-fg-muted">App Store matches</p><p className="mt-1 text-xl font-semibold text-vs-fg">{results.length}</p></Card>
              <Card><p className="text-xs text-vs-fg-muted">Total ratings</p><p className="mt-1 text-xl font-semibold text-vs-fg">{totalRatings.toLocaleString()}</p></Card>
              <Card><p className="text-xs text-vs-fg-muted">Median ratings</p><p className="mt-1 text-xl font-semibold text-vs-fg">{medianRatings.toLocaleString()}</p></Card>
              <Card><p className="text-xs text-vs-fg-muted">New in 12 months</p><p className="mt-1 text-xl font-semibold text-vs-fg">{newcomerCount}</p></Card>
              <Card><p className="text-xs text-vs-fg-muted">Free listings</p><p className="mt-1 text-xl font-semibold text-vs-fg">{freeCount}</p></Card>
            </div>
          )}

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Market context</p><h3 className="mt-1 font-semibold text-vs-fg">World Bank · {countryLabel}</h3></div><Badge status={marketFinding ? "success" : "neutral"}>{marketFinding ? "LIVE" : "UNAVAILABLE"}</Badge></div>
              {marketFinding ? (
                <div className="mt-4 space-y-3">
                  {marketFinding.metadata.indicators.map((indicator) => <div key={indicator.id} className="flex items-baseline justify-between gap-3 border-b border-vs-border pb-2 text-sm"><span className="text-vs-fg-muted">{indicator.label} · {indicator.year}</span><strong className="text-vs-fg">{indicator.formatted}</strong></div>)}
                  <p className="text-xs leading-5 text-vs-fg-muted">Country-level context only. These figures are not a category TAM, demand forecast or success probability.</p>
                </div>
              ) : <p className="mt-3 text-sm text-vs-fg-muted">World Bank data did not return a usable result for this search. No replacement estimate is being generated.</p>}
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Technology signal</p><h3 className="mt-1 font-semibold text-vs-fg">GitHub public repositories</h3></div><Badge status={githubFinding ? "success" : "neutral"}>{githubFinding ? "PARTIAL" : "UNAVAILABLE"}</Badge></div>
              {githubFinding?.metadata ? (
                <div className="mt-4">
                  <p className="text-sm text-vs-fg"><strong>{githubFinding.metadata.totalFound}</strong> related repositories found · <strong>{githubFinding.metadata.activeCount}</strong> active in the last 180 days.</p>
                  <div className="mt-3 space-y-2">{githubFinding.metadata.repos.map((repo) => <div key={repo.fullName} className="flex items-baseline justify-between gap-3 text-xs"><span className="truncate text-vs-fg-muted">{repo.fullName}</span><span className="shrink-0 font-semibold text-vs-fg">{repo.stars.toLocaleString()}★</span></div>)}</div>
                  <p className="mt-3 text-xs leading-5 text-vs-fg-muted">Repository activity is an ecosystem signal only. It does not prove commercial demand, product quality or stack suitability.</p>
                </div>
              ) : githubFinding ? <p className="mt-3 text-sm text-vs-fg-muted">The live GitHub search completed but did not surface a usable close-match set.</p> : <p className="mt-3 text-sm text-vs-fg-muted">GitHub search did not return a usable result this time. No technology claim is being substituted.</p>}
            </Card>
          </div>

          {topByRatings && <Card className="mt-4 border-vs-primary/20"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Strongest rating-volume signal in this App Store result set</p><p className="mt-2 font-semibold text-vs-fg">{topByRatings.name} · {topByRatings.ratingCount.toLocaleString()} ratings</p><p className="mt-1 text-xs text-vs-fg-muted">This is only an App Store rating-count signal. It is not downloads, revenue, market share or proof of product quality.</p></Card>}

          {!appStoreFailed && results.length === 0 ? (
            <Card className="mt-4"><p className="font-semibold text-vs-fg">No close App Store matches surfaced.</p><p className="mt-2 text-sm text-vs-fg-muted">That may mean weak direct competition or simply that the search phrase is too narrow. Try a broader phrase or another country.</p></Card>
          ) : !appStoreFailed ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.map((app) => {
                const idea = `${query}. A live App Store example found during exploration is ${app.name} by ${app.seller}.`;
                return (
                  <Card key={`${app.appId ?? app.name}-${app.seller}`}>
                    <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-vs-fg">{app.name}</h3><p className="mt-1 text-xs text-vs-fg-muted">{app.seller}</p></div><Badge status="neutral">{app.genre}</Badge></div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs"><div><p className="text-vs-fg-muted">Rating</p><p className="mt-1 font-semibold text-vs-fg">{app.rating === null ? "—" : `${app.rating.toFixed(1)}★`}</p></div><div><p className="text-vs-fg-muted">Ratings</p><p className="mt-1 font-semibold text-vs-fg">{app.ratingCount.toLocaleString()}</p></div><div><p className="text-vs-fg-muted">Price</p><p className="mt-1 font-semibold text-vs-fg">{app.price}</p></div></div>
                    <div className="mt-3 text-xs text-vs-fg-muted">{isRecentRelease(app.releaseDate) ? "Released within the last 12 months" : "Established or release date unavailable"}</div>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs"><a className="font-semibold text-vs-primary hover:underline" href={app.url} target="_blank" rel="noreferrer">Open App Store ↗</a><Link className="font-semibold text-vs-fg hover:underline" href={`/dashboard?name=${encodeURIComponent(query)}&idea=${encodeURIComponent(idea)}`}>Create venture →</Link></div>
                  </Card>
                );
              })}
            </div>
          ) : null}
        </section>
      )}

      <Card className="mt-8 bg-vs-bg-subtle"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Still unavailable</p><p className="mt-2 text-sm leading-6 text-vs-fg-muted">Google Play coverage, review-text sentiment, real downloads, competitor revenue, subscription pricing, market share and regulatory conclusions are not connected. Explore leaves those fields unknown rather than inferring them from weaker signals.</p></Card>

      <div className="mt-8 flex flex-wrap gap-3"><Link className="rounded-vs-sm bg-vs-primary px-4 py-2 text-sm font-semibold text-vs-primary-fg" href="/dashboard">Open My Ideas</Link><Link className="rounded-vs-sm border border-vs-border px-4 py-2 text-sm text-vs-fg" href="/methodology">How it works</Link></div>
    </main>
  );
}
