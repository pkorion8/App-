import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@venture-sandbox/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const STOP = new Set(["about","after","again","against","because","before","being","could","from","have","into","people","their","there","these","they","this","that","with","would","your","users","app","product","idea","tool","using"]);
function keywords(text: string) {
  return [...new Set(text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w)))].slice(0, 10);
}

export default async function IntelligenceFeed({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = (await createSupabaseServerClient()) as any;
  const [{ data: venture }, { data: mission }, { data: creatorClaims }, { data: snapshots }] = await Promise.all([
    db.from("ventures").select("id,name,raw_idea_text,target_user,geography").eq("id", id).maybeSingle(),
    db.from("research_missions").select("id,created_at").eq("venture_id", id).eq("status", "complete").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("creator_claims").select("id,video_title,video_url,published_at,claim_type,claim_text,confidence,created_at").order("created_at", { ascending: false }).limit(60),
    db.from("research_competitor_snapshots").select("app_id,app_name,rating_count,checked_at").eq("venture_id", id).order("checked_at", { ascending: false }).limit(20),
  ]);
  if (!venture) notFound();

  const terms = keywords([venture.raw_idea_text, venture.target_user, venture.geography].filter(Boolean).join(" "));
  const relevantClaims = (creatorClaims ?? []).filter((c: any) => {
    const hay = `${c.video_title} ${c.claim_text}`.toLowerCase();
    return terms.some((t) => hay.includes(t));
  }).slice(0, 6);

  let findings: any[] = [];
  if (mission?.id) {
    const { data } = await db.from("findings").select("id,normalized_claim,user_facing_summary,state,is_demo,metadata,created_at").eq("mission_id", mission.id).order("created_at", { ascending: false });
    findings = data ?? [];
  }

  const latestCompetitors = new Map<number, any>();
  for (const s of snapshots ?? []) if (!latestCompetitors.has(s.app_id)) latestCompetitors.set(s.app_id, s);
  const competitorSignals = [...latestCompetitors.values()].slice(0, 5);
  const totalSignals = findings.length + relevantClaims.length + competitorSignals.length;

  return <main className="mx-auto max-w-6xl p-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">Intelligence Feed</p><h1 className="mt-2 text-3xl font-semibold text-vs-fg">Signals relevant to this venture</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-vs-fg-muted">A light feed built only from signals already connected to Venture Sandbox: saved research, App Store competitor snapshots and monitored creator claims. It is not a claim of continuous whole-web monitoring.</p></div><Badge status={totalSignals ? "primary" : "warning"}>{totalSignals ? `${totalSignals} CONNECTED SIGNALS` : "NO SIGNALS YET"}</Badge></div>

    <Card className="mt-6"><div className="flex flex-wrap gap-2"><span className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Matching terms</span>{terms.length ? terms.map((t) => <span key={t} className="rounded-full bg-vs-bg-subtle px-2.5 py-1 text-xs text-vs-fg-muted">{t}</span>) : <span className="text-xs text-vs-fg-muted">No useful keywords extracted.</span>}</div><p className="mt-2 text-xs text-vs-fg-muted">Keyword matching is a relevance heuristic, not semantic proof that a creator claim applies to the venture.</p></Card>

    <section className="mt-5 grid gap-4 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-vs-fg">Research signals</h2><Link href={`/venture/${id}/evidence`} className="text-sm text-vs-primary">Evidence Explorer →</Link></div>
        {findings.length ? findings.slice(0, 8).map((f: any) => { const md = (f.metadata ?? {}) as Record<string, any>; return <Card key={f.id}><div className="flex flex-wrap items-center gap-2"><Badge status={f.is_demo ? "warning" : f.state === "SOLID" ? "success" : f.state === "UNKNOWN" || f.state === "WEAK" ? "warning" : "primary"}>{f.is_demo ? "DEMO" : f.state}</Badge><Badge status="neutral">{typeof md.kind === "string" ? md.kind : "research"}</Badge></div><h3 className="mt-3 font-semibold text-vs-fg">{f.normalized_claim}</h3><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{f.user_facing_summary}</p></Card>; }) : <Card><p className="text-sm text-vs-fg-muted">No completed research findings yet.</p></Card>}
      </div>

      <div className="space-y-4">
        <div><h2 className="text-lg font-semibold text-vs-fg">Competitor movement snapshot</h2>{competitorSignals.length ? <div className="mt-3 space-y-2">{competitorSignals.map((s: any) => <Card key={s.app_id}><p className="font-medium text-vs-fg">{s.app_name}</p><p className="mt-1 text-sm text-vs-fg-muted">{Number(s.rating_count).toLocaleString()} public ratings at last check</p><p className="mt-1 text-[10px] text-vs-fg-muted">Checked {new Date(s.checked_at).toLocaleDateString()} · rating count is a public traction signal, not downloads or revenue</p></Card>)}</div> : <Card className="mt-3"><p className="text-sm text-vs-fg-muted">No App Store competitor snapshots available.</p></Card>}</div>

        <div><h2 className="text-lg font-semibold text-vs-fg">Creator / YouTube claims</h2>{relevantClaims.length ? <div className="mt-3 space-y-2">{relevantClaims.map((c: any) => <Card key={c.id}><div className="flex gap-2"><Badge status={c.confidence === "corroborated" ? "success" : "warning"}>{c.confidence}</Badge><Badge status="neutral">{c.claim_type}</Badge></div><p className="mt-2 text-sm text-vs-fg">{c.claim_text}</p><a href={c.video_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-vs-primary">{c.video_title} ↗</a></Card>)}</div> : <Card className="mt-3"><p className="text-sm text-vs-fg-muted">No monitored creator claim matched this venture&apos;s current keywords.</p></Card>}</div>
      </div>
    </section>
  </main>;
}
