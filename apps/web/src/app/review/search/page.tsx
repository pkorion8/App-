"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Card } from "@venture-sandbox/ui";

const RESULTS = [
  { name: "ReceiptHero", category: "Receipt organizer", signal: "Stores receipts and purchase records", gap: "Weak deadline-first workflow", strength: "Established utility pattern" },
  { name: "Warranty Wallet", category: "Warranty tracker", signal: "Tracks warranty dates and product details", gap: "Less focused on returns and rebates", strength: "Clear single-purpose positioning" },
  { name: "Retailer Accounts", category: "Existing alternative", signal: "Receipts already live inside many retailer accounts", gap: "Fragmented across merchants", strength: "Zero extra setup for users" },
  { name: "Email + Calendar", category: "Manual workaround", signal: "People can search receipts and set reminders manually", gap: "High effort and inconsistent", strength: "Free and familiar" },
] as const;

export default function ReviewSearchPage() {
  const [query, setQuery] = useState("receipt warranty reminder app");
  const [searched, setSearched] = useState(true);
  const visible = useMemo(() => searched ? RESULTS : [], [searched]);

  return (
    <main className="min-h-screen bg-vs-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center gap-3">
          <Link href="/review" className="text-lg font-semibold text-vs-fg">Sim Venture</Link>
          <Badge status="warning">REVIEW MODE · FICTIONAL SEARCH DATA</Badge>
          <nav className="ml-auto flex gap-2 text-sm">
            <Link href="/review"><Button variant="secondary">Venture review</Button></Link>
            <Link href="/review/compare"><Button variant="secondary">Compare ideas</Button></Link>
          </nav>
        </header>

        <section className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-white/60">Explore before you build</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Search an idea, problem, category or opportunity.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">This is the pre-venture discovery layer: understand what already exists, where the gaps may be, and whether an opportunity is worth turning into a venture.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input value={query} onChange={(e)=>setQuery(e.target.value)} className="min-h-12 flex-1 rounded-xl border border-white/20 bg-white px-4 text-sm text-slate-950 outline-none" placeholder="e.g. AI meal planner for families" />
            <Button onClick={()=>setSearched(true)}>Search opportunities</Button>
          </div>
        </section>

        {visible.length > 0 && <>
          <section className="mt-7 grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
            <Card>
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Search results dashboard</p><h2 className="mt-2 text-2xl font-semibold text-vs-fg">What already exists around “{query}”</h2></div><Badge status="neutral">4 EXAMPLE RESULTS</Badge></div>
              <div className="mt-5 space-y-3">{visible.map((r)=><div key={r.name} className="grid gap-3 rounded-2xl border border-vs-border p-4 md:grid-cols-[1fr_1fr_1fr]"><div><p className="font-semibold text-vs-fg">{r.name}</p><p className="mt-1 text-xs text-vs-fg-muted">{r.category}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wide text-vs-fg-muted">What it shows</p><p className="mt-1 text-sm text-vs-fg">{r.signal}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wide text-vs-fg-muted">Possible gap</p><p className="mt-1 text-sm text-vs-fg">{r.gap}</p></div></div>)}</div>
            </Card>
            <div className="space-y-4">
              <Card className="border-vs-warning/30"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Opportunity signal</p><p className="mt-3 text-lg font-semibold text-vs-fg">The category exists, but the workflow is fragmented.</p><p className="mt-2 text-sm leading-6 text-vs-fg-muted">The possible opening is not “store receipts”; it is helping users act before value expires across retailers.</p></Card>
              <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Still unknown</p><p className="mt-3 text-sm leading-6 text-vs-fg">Whether people care enough to maintain another app or pay for premium reminders.</p></Card>
              <Link href="/review/compare"><Button className="w-full">Compare this with another idea →</Button></Link>
            </div>
          </section>

          <section className="mt-5 grid gap-4 md:grid-cols-3">
            <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Competition</p><p className="mt-2 text-2xl font-semibold text-vs-fg">Existing</p><p className="mt-2 text-sm text-vs-fg-muted">Multiple direct and indirect alternatives.</p></Card>
            <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Differentiation to test</p><p className="mt-2 text-2xl font-semibold text-vs-fg">Deadline-first</p><p className="mt-2 text-sm text-vs-fg-muted">Action before expiry rather than storage alone.</p></Card>
            <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Next action</p><p className="mt-2 text-2xl font-semibold text-vs-fg">Create venture</p><p className="mt-2 text-sm text-vs-fg-muted">Move the opportunity into Research and Simulation.</p></Card>
          </section>
        </>}
      </div>
    </main>
  );
}
