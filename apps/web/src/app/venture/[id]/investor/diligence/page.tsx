import Link from "next/link";
import { Badge, Card } from "@venture-sandbox/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { initializeDiligence, updateDiligenceItem } from "./actions";

const statusFor = (state: string) => state === "ready" ? "success" : state === "missing" ? "warning" : "neutral";

export default async function Diligence({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ session?: string }> }) {
  const { id } = await params;
  const { session } = await searchParams;
  const db = (await createSupabaseServerClient()) as any;
  const { data: items } = session ? await db.from("diligence_items").select("*").eq("investor_session_id", session).order("created_at", { ascending: true }) : { data: null };
  const counts = { ready: 0, partial: 0, missing: 0, not_applicable: 0 } as Record<string, number>;
  for (const item of items ?? []) counts[item.state] = (counts[item.state] ?? 0) + 1;

  return <main className="mx-auto max-w-5xl p-6">
    <Badge status="warning">SIMULATED DILIGENCE</Badge>
    <h1 className="mt-3 text-3xl font-semibold text-vs-fg">Diligence Room</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-vs-fg-muted">Idea-stage ventures can be incomplete. The checklist is persisted per investor session so missing, partial and not-applicable states can evolve without inventing documents.</p>

    {!session ? <Card className="mt-6"><p className="text-sm text-vs-fg-muted">Open Diligence from an active Investor World session.</p></Card> : <>
      <Card className="mt-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="grid grid-cols-4 gap-2"><Mini label="Ready" value={counts.ready}/><Mini label="Partial" value={counts.partial}/><Mini label="Missing" value={counts.missing}/><Mini label="N/A" value={counts.not_applicable}/></div><form action={initializeDiligence}><input type="hidden" name="ventureId" value={id}/><input type="hidden" name="sessionId" value={session}/><button className="rounded-vs-sm bg-vs-primary px-4 py-2 text-sm font-semibold text-vs-primary-fg">{items?.length ? "Refresh from current venture" : "Build diligence checklist"}</button></form></div><p className="mt-3 text-xs text-vs-fg-muted">Refresh recalculates the initial checklist from connected venture state. Manual item notes/states should be considered before refreshing because the current checklist is replaced.</p></Card>

      {items?.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{items.map((item:any) => <Card key={item.id}><div className="flex items-start justify-between gap-3"><h2 className="font-semibold text-vs-fg">{item.category}</h2><Badge status={statusFor(item.state) as "success" | "warning" | "neutral"}>{item.state.replaceAll("_", " ").toUpperCase()}</Badge></div><p className="mt-2 text-sm text-vs-fg-muted">{item.item}</p><form action={updateDiligenceItem} className="mt-4 space-y-2"><input type="hidden" name="ventureId" value={id}/><input type="hidden" name="sessionId" value={session}/><input type="hidden" name="itemId" value={item.id}/><select name="state" defaultValue={item.state} className="w-full rounded-vs-sm border border-vs-border bg-vs-bg px-3 py-2 text-sm"><option value="ready">Ready</option><option value="partial">Partial</option><option value="missing">Missing</option><option value="not_applicable">Not applicable</option></select><input name="notes" defaultValue={item.notes ?? ""} placeholder="Evidence, gap, or why N/A" className="w-full rounded-vs-sm border border-vs-border bg-vs-bg px-3 py-2 text-sm"/><button className="text-xs font-semibold text-vs-primary">Save item</button></form></Card>)}</div> : <Card className="mt-4"><p className="text-sm text-vs-fg-muted">No persisted diligence checklist yet.</p></Card>}
    </>}

    <div className="mt-6 flex gap-4 text-sm"><Link className="font-medium text-vs-primary" href={`/venture/${id}/investor${session ? `?session=${session}` : ""}`}>← Investor World</Link><Link className="font-medium text-vs-primary" href={`/venture/${id}/investor/committee${session ? `?session=${session}` : ""}`}>Committee →</Link></div>
  </main>;
}

function Mini({ label, value }: { label: string; value: number }) { return <div className="rounded-vs-sm bg-vs-bg-subtle px-3 py-2 text-center"><p className="text-[10px] uppercase text-vs-fg-muted">{label}</p><p className="mt-1 font-semibold text-vs-fg">{value}</p></div>; }
