import Link from "next/link";
import { Badge, Card } from "@venture-sandbox/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runCommitteeReview } from "./actions";

const labels: Record<string, string> = {
  market: "Market",
  technical: "Technical",
  operator: "Operator",
  skeptic: "Skeptic",
  finance: "Finance",
  portfolio: "Portfolio conflict",
};

function committeeOutcomeLabel(outcome?: string | null) {
  // Historical rows used `conditional_interest`; present them using the current source-truth language.
  if (outcome === "negotiation_rehearsal_ready" || outcome === "conditional_interest") return "Ready for negotiation rehearsal";
  if (outcome === "pass") return "Rehearsal stopped";
  return "More evidence needed";
}

function committeeOutcomeStatus(outcome?: string | null): "success" | "danger" | "warning" {
  if (outcome === "negotiation_rehearsal_ready" || outcome === "conditional_interest") return "success";
  if (outcome === "pass") return "danger";
  return "warning";
}

export default async function Committee({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ session?: string }> }) {
  const { id } = await params;
  const { session } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const db = supabase as any;
  const { data: review } = session
    ? await db.from("investment_committee_reviews").select("*").eq("investor_session_id", session).order("created_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const rationale = (review?.rationale ?? {}) as Record<string, string>;
  const outcomeLabel = committeeOutcomeLabel(review?.outcome);
  const outcomeStatus = committeeOutcomeStatus(review?.outcome);

  return <main className="mx-auto max-w-5xl p-4 sm:p-6">
    <Badge status="warning">SIMULATED COMMITTEE</Badge>
    <h1 className="mt-3 text-3xl font-semibold text-vs-fg">Investment Committee</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-vs-fg-muted">A deterministic committee rehearsal reads persisted venture context and claim states. It does not represent a real investor decision, investor interest, funding probability, or a real offer.</p>

    {!session ? <Card className="mt-6"><p className="text-sm text-vs-fg-muted">Open this room from an active Investor World session to run a persisted committee rehearsal.</p></Card> : <>
      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Committee state</p><p className="mt-1 text-sm text-vs-fg-muted">The rehearsal can be rerun after the venture accumulates stronger evidence.</p></div><form action={runCommitteeReview}><input type="hidden" name="ventureId" value={id}/><input type="hidden" name="sessionId" value={session}/><button className="rounded-vs-sm bg-vs-primary px-4 py-2 text-sm font-semibold text-vs-primary-fg">{review ? "Run rehearsal again" : "Run committee rehearsal"}</button></form></div>
      </Card>

      {review ? <>
        <div className="mt-4 grid gap-3 md:grid-cols-2">{Object.entries(labels).map(([key, name]) => <Card key={key}><div className="flex items-start justify-between gap-3"><h2 className="font-semibold text-vs-fg">{name}</h2>{key === "portfolio" && <Badge status="neutral">UNKNOWN</Badge>}</div><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{rationale[key] || "No persisted rationale for this lens."}</p></Card>)}</div>
        <Card className="mt-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Persisted rehearsal outcome</p><p className="mt-2 text-2xl font-semibold text-vs-fg">{outcomeLabel}</p></div><Badge status={outcomeStatus}>{outcomeLabel}</Badge></div><p className="mt-3 text-sm leading-6 text-vs-fg-muted">This outcome only controls which rehearsal room opens next. It is not evidence that any real investor is interested or willing to invest.</p>{review.missing_evidence?.length ? <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">What would change the discussion</p><ul className="mt-2 space-y-1 text-sm text-vs-fg-muted">{review.missing_evidence.map((item: string) => <li key={item}>• {item}</li>)}</ul></div> : <p className="mt-3 text-sm text-vs-fg-muted">No additional evidence gate was generated for this rehearsal outcome.</p>}</Card>
      </> : <Card className="mt-4"><p className="text-sm text-vs-fg-muted">No committee rehearsal has been persisted yet. Run it to create one from the current evidence and claim state.</p></Card>}
    </>}

    <div className="mt-6 flex flex-wrap gap-4 text-sm"><Link className="font-medium text-vs-primary" href={`/venture/${id}/investor${session ? `?session=${session}` : ""}`}>← Investor World</Link><Link className="font-medium text-vs-primary" href={`/venture/${id}/investor/deal${session ? `?session=${session}` : ""}`}>Deal rehearsal →</Link></div>
  </main>;
}
