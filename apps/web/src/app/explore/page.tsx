import type { Metadata } from "next";
import Link from "next/link";
import { searchAppStore } from "@venture-sandbox/research";
import { Badge, Card } from "@venture-sandbox/ui";

export const metadata: Metadata = { title: "Explore · Sim Venture" };
export const dynamic = "force-dynamic";

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  let results: Awaited<ReturnType<typeof searchAppStore>> = [];
  let failed = false;

  if (query) {
    try {
      results = await searchAppStore(query, "us", 12);
    } catch {
      failed = true;
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-vs-primary">Explore</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-vs-fg">Search before you build.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-vs-fg-muted">Search a category, problem or app concept. Results below come from Apple&apos;s live public App Store search, not demo data.</p>
        </div>
        <Badge status="success">LIVE SOURCE · APP STORE</Badge>
      </div>

      <form className="mt-8 flex flex-col gap-3 sm:flex-row" action="/explore" method="get">
        <input
          name="q"
          defaultValue={query}
          placeholder="Try: receipt warranty, meal planner, habit tracker..."
          className="min-h-12 flex-1 rounded-vs-md border border-vs-border bg-vs-bg px-4 text-sm text-vs-fg outline-none focus:border-vs-primary"
        />
        <button className="rounded-vs-md bg-vs-primary px-5 py-3 text-sm font-semibold text-vs-primary-fg" type="submit">Search apps</button>
      </form>

      {!query && (
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">1 · Search</p><h2 className="mt-2 font-semibold text-vs-fg">See what already exists</h2><p className="mt-2 text-sm text-vs-fg-muted">Use a real app/problem phrase and inspect live App Store matches.</p></Card>
          <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">2 · Compare</p><h2 className="mt-2 font-semibold text-vs-fg">Shortlist ideas</h2><p className="mt-2 text-sm text-vs-fg-muted">Create ventures from promising directions, then compare them side by side.</p></Card>
          <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">3 · Test</p><h2 className="mt-2 font-semibold text-vs-fg">Move into the venture lab</h2><p className="mt-2 text-sm text-vs-fg-muted">Research, shape, monetize, simulate and plan the first build.</p></Card>
        </div>
      )}

      {query && failed && <Card className="mt-8"><p className="font-semibold text-vs-fg">Live search is temporarily unavailable.</p><p className="mt-2 text-sm text-vs-fg-muted">No results are being fabricated. Try again shortly.</p></Card>}

      {query && !failed && (
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Live search results</p><h2 className="mt-1 text-2xl font-semibold text-vs-fg">{results.length} App Store matches for “{query}”</h2></div>
            <p className="text-xs text-vs-fg-muted">Ratings are traction signals only — not downloads, revenue or market size.</p>
          </div>

          {results.length === 0 ? (
            <Card className="mt-4"><p className="font-semibold text-vs-fg">No close matches surfaced.</p><p className="mt-2 text-sm text-vs-fg-muted">That may mean weak direct competition or simply that the search phrase is too narrow. Try a broader phrase.</p></Card>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.map((app) => (
                <Card key={`${app.appId ?? app.name}-${app.seller}`}>
                  <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-vs-fg">{app.name}</h3><p className="mt-1 text-xs text-vs-fg-muted">{app.seller}</p></div><Badge status="neutral">{app.genre}</Badge></div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs"><div><p className="text-vs-fg-muted">Rating</p><p className="mt-1 font-semibold text-vs-fg">{app.rating === null ? "—" : `${app.rating.toFixed(1)}★`}</p></div><div><p className="text-vs-fg-muted">Ratings</p><p className="mt-1 font-semibold text-vs-fg">{app.ratingCount.toLocaleString()}</p></div><div><p className="text-vs-fg-muted">Price</p><p className="mt-1 font-semibold text-vs-fg">{app.price}</p></div></div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs"><a className="font-semibold text-vs-primary hover:underline" href={app.url} target="_blank" rel="noreferrer">Open App Store ↗</a><Link className="font-semibold text-vs-fg hover:underline" href="/dashboard">Create venture →</Link></div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-3"><Link className="rounded-vs-sm bg-vs-primary px-4 py-2 text-sm font-semibold text-vs-primary-fg" href="/dashboard">Open My Ideas</Link><Link className="rounded-vs-sm border border-vs-border px-4 py-2 text-sm text-vs-fg" href="/methodology">How it works</Link></div>
    </main>
  );
}
