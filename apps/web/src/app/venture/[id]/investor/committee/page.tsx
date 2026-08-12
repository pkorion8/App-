import Link from "next/link";
import { Badge, Card } from "@venture-sandbox/ui";

const perspectives = [
  ["Market", "Evidence of a painful problem matters more than a large top-down market claim.", "Needs stronger customer proof"],
  ["Technical", "Feasibility may be reasonable, but dependencies and ownership need explicit review.", "Dependency risk unresolved"],
  ["Operator", "The venture needs a concrete next milestone that reduces uncertainty before scaling spend.", "Execution plan can improve"],
  ["Skeptic", "Founder claims should not outrun external evidence or simulation assumptions.", "Challenge unsupported claims"],
  ["Finance", "Capital should buy a defined milestone; valuation is secondary to clarity on use of funds.", "Capital purpose incomplete"],
  ["Portfolio conflict", "No real portfolio data is connected, so conflict cannot be assessed.", "UNKNOWN"],
] as const;

export default async function Committee({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ session?: string }> }) {
  const { id } = await params; const { session } = await searchParams;
  return <main className="mx-auto max-w-5xl p-6"><Badge status="warning">SIMULATED COMMITTEE</Badge><h1 className="mt-3 text-3xl font-semibold text-vs-fg">Investment Committee</h1><p className="mt-2 max-w-3xl text-sm text-vs-fg-muted">Bounded specialist perspectives expose arguments and missing information. This is not a real investment decision.</p><div className="mt-6 space-y-3">{perspectives.map(([name, argument, concern]) => <Card key={name}><div className="flex flex-wrap items-start justify-between gap-3"><h2 className="font-semibold text-vs-fg">{name}</h2><Badge status="neutral">{concern}</Badge></div><p className="mt-2 text-sm text-vs-fg-muted">{argument}</p></Card>)}</div><Card className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Current rehearsal outcome</p><p className="mt-2 text-xl font-semibold text-vs-fg">More evidence requested</p><p className="mt-1 text-sm text-vs-fg-muted">This outcome is deliberately conservative and should change only when the venture accumulates stronger evidence.</p></Card><div className="mt-6 flex gap-4 text-sm"><Link className="font-medium text-vs-primary" href={`/venture/${id}/investor${session ? `?session=${session}` : ""}`}>← Investor World</Link><Link className="font-medium text-vs-primary" href={`/venture/${id}/investor/deal${session ? `?session=${session}` : ""}`}>Deal lab →</Link></div></main>;
}
