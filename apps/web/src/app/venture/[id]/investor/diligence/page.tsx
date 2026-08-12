import Link from "next/link";
import { Badge, Card } from "@venture-sandbox/ui";

const sections = [
  ["Company", "Basic venture identity, purpose and current stage", "ready"],
  ["Ownership", "Founder ownership, entities and IP assignment", "missing"],
  ["Product", "MVP scope and current product evidence", "partial"],
  ["Technology", "Architecture, dependencies and ownership risks", "partial"],
  ["Customer evidence", "Interviews, usage or paid demand evidence", "missing"],
  ["Market", "Market evidence and unresolved assumptions", "partial"],
  ["Competition", "Alternatives and competitor evidence", "partial"],
  ["Financials", "Revenue, costs and capital plan", "missing"],
  ["Risks", "Known product, technical, market and regulatory risks", "partial"],
] as const;

export default async function Diligence({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ session?: string }> }) {
  const { id } = await params; const { session } = await searchParams;
  return <main className="mx-auto max-w-5xl p-6"><Badge status="warning">SIMULATED DILIGENCE</Badge><h1 className="mt-3 text-3xl font-semibold text-vs-fg">Diligence Room</h1><p className="mt-2 max-w-3xl text-sm text-vs-fg-muted">Idea-stage ventures can be incomplete. Missing and not-applicable states are more trustworthy than invented documents.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{sections.map(([title, note, state]) => <Card key={title}><div className="flex items-start justify-between gap-3"><h2 className="font-semibold text-vs-fg">{title}</h2><Badge status={state === "ready" ? "success" : state === "missing" ? "warning" : "neutral"}>{state.toUpperCase()}</Badge></div><p className="mt-2 text-sm text-vs-fg-muted">{note}</p></Card>)}</div><div className="mt-6 flex gap-4 text-sm"><Link className="font-medium text-vs-primary" href={`/venture/${id}/investor${session ? `?session=${session}` : ""}`}>← Investor World</Link><Link className="font-medium text-vs-primary" href={`/venture/${id}/investor/committee${session ? `?session=${session}` : ""}`}>Committee →</Link></div></main>;
}
