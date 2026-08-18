"use client";

import Link from "next/link";
import { Badge, Button, Card } from "@venture-sandbox/ui";

const rows = [
  ["Problem clarity", "Clear: missed deadlines can cost money", "Clear: people waste food and struggle to plan meals"],
  ["Competition", "Crowded receipt/warranty utilities", "Very crowded meal-planning and AI recipe apps"],
  ["Differentiation", "Deadline-first action layer", "Could focus on household inventory + budget"],
  ["Build difficulty", "Medium", "Medium-high if image recognition/inventory automation is included"],
  ["Monetization", "Subscription / freemium hypothesis", "Subscription / affiliate / grocery partnership hypotheses"],
  ["Biggest unknown", "Will users maintain purchases and pay?", "Will users keep inventory data accurate?"],
  ["Best first test", "Interview + manual reminder prototype", "Concierge meal plan using real household inputs"],
] as const;

export default function CompareReviewPage(){
  return <main className="min-h-screen bg-vs-bg px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <header className="mb-8 flex flex-wrap items-center gap-3"><Link href="/review" className="text-lg font-semibold text-vs-fg">Sim Venture</Link><Badge status="warning">COMPARE MODE · FICTIONAL DATA</Badge><nav className="ml-auto flex gap-2"><Link href="/review/search"><Button variant="secondary">Search / Explore</Button></Link><Link href="/review"><Button variant="secondary">Venture review</Button></Link></nav></header>

    <section className="rounded-3xl bg-violet-700 p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.2em] text-white/70">Compare before choosing</p><h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Which idea deserves the next week of your time?</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">Compare two ideas using the same questions. This is not a fake winner score; it exposes trade-offs, unknowns and the next test for each idea.</p></section>

    <section className="mt-6 grid gap-4 lg:grid-cols-2"><Card className="border-violet-500/30"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Idea A</p><h2 className="mt-2 text-2xl font-semibold text-vs-fg">ClaimKeeper</h2><p className="mt-2 text-sm leading-6 text-vs-fg-muted">A receipt assistant that warns households before returns, rebates and warranties expire.</p></Card><Card className="border-cyan-500/30"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Idea B</p><h2 className="mt-2 text-2xl font-semibold text-vs-fg">FridgePilot</h2><p className="mt-2 text-sm leading-6 text-vs-fg-muted">An AI meal planner that uses household inventory and budget to reduce food waste.</p></Card></section>

    <Card className="mt-5 overflow-hidden p-0"><div className="grid grid-cols-[.8fr_1fr_1fr] border-b border-vs-border bg-vs-bg-subtle p-4 text-xs font-semibold uppercase tracking-wide text-vs-fg-muted"><span>Dimension</span><span>ClaimKeeper</span><span>FridgePilot</span></div>{rows.map(([label,a,b])=><div key={label} className="grid grid-cols-[.8fr_1fr_1fr] gap-4 border-b border-vs-border p-4 last:border-b-0"><p className="text-sm font-semibold text-vs-fg">{label}</p><p className="text-sm leading-6 text-vs-fg-muted">{a}</p><p className="text-sm leading-6 text-vs-fg-muted">{b}</p></div>)}</Card>

    <section className="mt-5 grid gap-4 md:grid-cols-3"><Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Idea A advantage</p><p className="mt-2 text-lg font-semibold text-vs-fg">Narrower first problem</p><p className="mt-2 text-sm text-vs-fg-muted">The first MVP is easier to describe and constrain.</p></Card><Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Idea B advantage</p><p className="mt-2 text-lg font-semibold text-vs-fg">Potentially higher usage frequency</p><p className="mt-2 text-sm text-vs-fg-muted">Meal planning may create more frequent engagement if inventory friction is solved.</p></Card><Card className="border-vs-warning/30"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">What Sim Venture recommends next</p><p className="mt-2 text-lg font-semibold text-vs-fg">Do not choose from this table alone.</p><p className="mt-2 text-sm text-vs-fg-muted">Run one cheap real-world test for each idea, then compare evidence rather than opinions.</p></Card></section>

    <div className="mt-6 flex flex-wrap gap-3"><Link href="/review/search"><Button variant="secondary">← Back to Search</Button></Link><Link href="/review"><Button>Open ClaimKeeper venture →</Button></Link></div>
  </div></main>;
}
