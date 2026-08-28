import Link from "next/link";
import { Badge, Card } from "@venture-sandbox/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DealCalculator } from "./DealCalculator";
import { respondToSimulatedOffer } from "./actions";

function rehearsalStateLabel(state: string) {
  if (state === "accepted") return "accepted in rehearsal";
  if (state === "declined") return "declined in rehearsal";
  if (state === "withdrawn") return "withdrawn in rehearsal";
  if (state === "countered") return "founder counter rehearsal";
  return "simulated terms";
}

export default async function DealLab({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ session?: string }> }) {
  const { id } = await params;
  const { session } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const db = supabase as any;
  const { data: offer } = session ? await db.from("investor_offers").select("*").eq("investor_session_id", session).order("created_at", { ascending: false }).limit(1).maybeSingle() : { data: null };
  const terms = (offer?.terms ?? {}) as Record<string, number>;

  return <main className="mx-auto max-w-5xl p-6">
    <Badge status="warning">NEGOTIATION REHEARSAL</Badge>
    <h1 className="mt-3 text-3xl font-semibold text-vs-fg">Deal Lab & Cap Table</h1>
    <p className="mt-2 max-w-3xl text-sm text-vs-fg-muted">Change assumptions and persist rehearsal terms or a founder counter. Ownership consequences are deterministic calculations from the values entered here. Nothing on this page is a real investor offer, valuation recommendation, funding signal, or legal advice.</p>

    {!session ? <Card className="mt-6"><p className="text-sm text-vs-fg-muted">Open Deal Lab from an active Investor World rehearsal to persist negotiation state.</p></Card> : <>
      {offer && <Card className="mt-6 border-vs-primary/20">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Latest persisted rehearsal terms</p><p className="mt-1 text-2xl font-semibold text-vs-fg">${Number(offer.investment_amount).toLocaleString()} simulated investment</p><p className="mt-1 text-sm text-vs-fg-muted">${Number(offer.pre_money_valuation).toLocaleString()} assumed pre-money · {Number(terms.investorPct ?? 0).toFixed(1)}% simulated investor ownership · {Number(terms.founderPct ?? 0).toFixed(1)}% founder ownership</p></div><Badge status={offer.offer_state === "accepted" ? "success" : offer.offer_state === "declined" || offer.offer_state === "withdrawn" ? "danger" : "primary"}>{rehearsalStateLabel(offer.offer_state)}</Badge></div>
        <p className="mt-3 text-xs text-vs-fg-muted">These terms were created inside Sim Venture for practice. They do not indicate that a real investor made an offer, accepted these terms, or intends to invest.</p>
        {(offer.offer_state === "offered" || offer.offer_state === "countered") && <div className="mt-4 flex flex-wrap gap-2"><form action={respondToSimulatedOffer}><input type="hidden" name="ventureId" value={id}/><input type="hidden" name="sessionId" value={session}/><input type="hidden" name="offerId" value={offer.id}/><button name="response" value="accepted" className="rounded-vs-sm bg-vs-primary px-4 py-2 text-sm font-semibold text-vs-primary-fg">Accept in rehearsal</button></form><form action={respondToSimulatedOffer}><input type="hidden" name="ventureId" value={id}/><input type="hidden" name="sessionId" value={session}/><input type="hidden" name="offerId" value={offer.id}/><button name="response" value="declined" className="rounded-vs-sm border border-vs-border px-4 py-2 text-sm font-semibold text-vs-fg">Decline in rehearsal</button></form></div>}
      </Card>}

      <Card className="mt-6"><DealCalculator ventureId={id} sessionId={session} initialInvestment={offer ? Number(offer.investment_amount) : 250000} initialPreMoney={offer ? Number(offer.pre_money_valuation) : 2000000} initialPool={offer ? Number(terms.employeePoolPct ?? 10) : 10}/></Card>
    </>}

    <div className="mt-4 grid gap-3 sm:grid-cols-3"><Card><h2 className="font-semibold text-vs-fg">Pre-money</h2><p className="mt-2 text-sm text-vs-fg-muted">The company value assumed immediately before the simulated investment.</p></Card><Card><h2 className="font-semibold text-vs-fg">Post-money</h2><p className="mt-2 text-sm text-vs-fg-muted">Pre-money plus the simulated investment in this simplified equity rehearsal.</p></Card><Card><h2 className="font-semibold text-vs-fg">Dilution</h2><p className="mt-2 text-sm text-vs-fg-muted">The reduction in founder percentage ownership after simulated investor and employee-pool ownership are included.</p></Card></div>
    <div className="mt-6 flex gap-4 text-sm"><Link className="font-medium text-vs-primary" href={`/venture/${id}/investor${session ? `?session=${session}` : ""}`}>← Investor World</Link><Link className="font-medium text-vs-primary" href={`/venture/${id}/build`}>Continue to Build →</Link></div>
  </main>;
}
