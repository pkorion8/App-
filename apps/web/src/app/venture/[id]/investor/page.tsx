import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@venture-sandbox/ui";
import { INVESTOR_PROFILES, investorQuestions } from "@venture-sandbox/domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnswerForm } from "./AnswerForm";
import { answerInvestorQuestion, startInvestorSession } from "./actions";

const STAGES = ["Screening", "Meeting", "Diligence", "Committee", "Negotiation", "Close / pass"];
const STAGE_INDEX: Record<string, number> = { readiness: 0, screening: 0, meeting: 1, diligence: 2, committee: 3, negotiation: 4, closed: 5, passed: 5 };

export default async function InvestorWorld({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ session?: string }> }) {
  const { id } = await params;
  const { session: requestedSession } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const db = supabase as any;
  const [{ data: venture }, { data: shape }, { data: research }, { data: simulation }] = await Promise.all([
    db.from("ventures").select("id,name,workspace_id,target_user,geography").eq("id", id).maybeSingle(),
    db.from("venture_shapes").select("problem_statement,differentiation").eq("venture_id", id).maybeSingle(),
    db.from("research_missions").select("id").eq("venture_id", id).eq("status", "complete").limit(1).maybeSingle(),
    db.from("simulation_runs").select("id").eq("venture_id", id).limit(1).maybeSingle(),
  ]);
  if (!venture) notFound();

  const { data: sessions } = await db.from("investor_sessions").select("*").eq("venture_id", id).order("created_at", { ascending: false });
  const session = (requestedSession ? sessions?.find((s: any) => s.id === requestedSession) : sessions?.[0]) || null;
  const coverage = [venture.target_user, shape?.problem_statement, research?.id, simulation?.id].filter(Boolean).length;

  let messages: any[] = [];
  let claims: any[] = [];
  let questions: string[] = [];
  let committee: any = null;
  let offer: any = null;
  if (session) {
    const results = await Promise.all([
      db.from("investor_messages").select("*").eq("investor_session_id", session.id).order("created_at", { ascending: true }),
      db.from("investor_claims").select("*").eq("investor_session_id", session.id).order("created_at", { ascending: false }),
      db.from("investment_committee_reviews").select("*").eq("investor_session_id", session.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("investor_offers").select("*").eq("investor_session_id", session.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    messages = results[0].data ?? [];
    claims = results[1].data ?? [];
    committee = results[2].data;
    offer = results[3].data;
    questions = investorQuestions(session.investor_profile, { audience: venture.target_user, problem: shape?.problem_statement, differentiation: shape?.differentiation, hasResearch: !!research, hasSimulation: !!simulation });
  }

  const activeStage = session ? STAGE_INDEX[session.stage] ?? 0 : 0;
  const unsupportedClaims = claims.filter((c:any) => ["ASSUMPTION","NEW CLAIM","UNKNOWN","CONTRADICTED"].includes(c.claim_state)).length;
  const profile = session ? INVESTOR_PROFILES.find((p) => p.key === session.investor_profile) : null;
  const state = session?.qualitative_state || {};
  const ended = session && ["passed", "closed"].includes(session.stage);
  const canDiligence = session && ["diligence", "committee", "negotiation", "closed"].includes(session.stage);
  const canCommittee = session && ["committee", "negotiation", "closed"].includes(session.stage);
  const canDeal = session && ["negotiation", "closed"].includes(session.stage);

  return <main className="mx-auto max-w-7xl p-4 sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-lg text-white">◎</span><Badge status="warning">SIMULATED INVESTOR</Badge></div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-vs-fg">Investor World · Live Meeting</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-vs-fg-muted">Defend the venture under pressure. The meeting can challenge weak answers, flag unsupported claims, or end early. This is rehearsal, not a prediction of real investor interest.</p>
      </div>
      <Link className="text-sm font-semibold text-vs-primary" href={`/venture/${id}/system`}>How this simulation works →</Link>
    </div>

    {!session ? <div className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <Card className="border-slate-200 bg-slate-950 text-white">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-slate-400">Before the meeting</p>
        <h2 className="mt-3 text-2xl font-semibold">Choose who is sitting across the table.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">Each persona focuses on a different weakness. The same answer may be acceptable to one investor and insufficient to another.</p>
        <div className="mt-6 grid grid-cols-2 gap-3"><DarkMetric label="Venture context ready" value={`${coverage}/4`} /><DarkMetric label="Mode" value="Rehearsal" /></div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-3">{INVESTOR_PROFILES.map((p, index) => <form action={startInvestorSession} key={p.key} className="rounded-2xl border border-vs-border bg-white p-5 shadow-sm"><input type="hidden" name="ventureId" value={id}/><input type="hidden" name="profile" value={p.key}/><div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-700">{index === 0 ? "OA" : index === 1 ? "TA" : "VC"}</div><h2 className="mt-4 text-lg font-semibold text-vs-fg">{p.name}</h2><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{p.focus}</p><p className="mt-3 text-xs font-semibold text-vs-fg-muted">{p.check}</p><button className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Enter meeting →</button></form>)}</div>
    </div> : <>
      <section className="mt-6 overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 text-white shadow-xl">
        <div className="border-b border-white/10 px-5 py-3 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${ended ? "bg-rose-400" : "animate-pulse bg-emerald-400"}`} /><span className="text-xs font-semibold uppercase tracking-[.2em] text-slate-300">{ended ? "Meeting ended" : "Meeting live"}</span></div>
            <div className="flex gap-2">{STAGES.map((stage, i) => <span key={stage} className={`hidden rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline ${i === activeStage ? "bg-white text-slate-950" : i < activeStage ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-slate-500"}`}>{stage}</span>)}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[270px_1fr_280px]">
          <aside className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
            <div className="grid h-28 w-28 place-items-center rounded-[30px] bg-gradient-to-br from-slate-700 to-slate-900 text-3xl font-bold shadow-inner">{profile?.key === "operator-angel" ? "OA" : profile?.key === "technical-angel" ? "TA" : "VC"}</div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-slate-500">Your investor</p>
            <h2 className="mt-1 text-xl font-semibold">{profile?.name || session.investor_profile}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{profile?.focus}</p>
            <div className="mt-5 space-y-2"><StateRow label="Trust" value={String(state.trust || "uncertain")} /><StateRow label="Clarity" value={String(state.clarity || "uncertain")} /><StateRow label="Pressure" value={state.meeting_status === "challenging" ? "high" : ended ? "ended" : "normal"} /></div>
          </aside>

          <section className="p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-slate-500">Investor asks</p>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold leading-9">{ended ? session.outcome_reason : questions[session.question_index] || "The structured questions are complete. The investor can now decide whether to invite deeper diligence."}</h2>
            {state.meeting_status === "challenging" && !ended && <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100"><strong>The investor is pushing back.</strong> Your last answer did not resolve the question. Answer it again with clearer reasoning or evidence.</div>}
            {!ended && questions[session.question_index] && <div className="mt-6 rounded-2xl bg-white p-5 text-slate-950"><AnswerForm action={answerInvestorQuestion} sessionId={session.id} ventureId={id}/></div>}
            {ended && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-5"><p className="font-semibold text-rose-100">This branch of the investor journey has ended.</p><p className="mt-2 text-sm text-rose-200/80">You can start another rehearsal, improve the venture, or return later with stronger evidence.</p><Link href={`/venture/${id}/investor`} className="mt-4 inline-block rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950">Start another meeting</Link></div>}
          </section>

          <aside className="border-t border-white/10 p-5 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-slate-500">Meeting intelligence</p>
            <div className="mt-4 space-y-3"><DarkMetric label="Context available" value={`${coverage}/4`} /><DarkMetric label="Unresolved claims" value={String(unsupportedClaims)} /><DarkMetric label="Stage" value={String(session.stage).replaceAll("_", " ")} /></div>
            <div className="mt-6 border-t border-white/10 pt-5"><p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-500">Next rooms</p><div className="mt-3 space-y-2 text-sm"><LockedLink enabled={!!canDiligence} href={`/venture/${id}/investor/diligence?session=${session.id}`} label="Diligence room" /><LockedLink enabled={!!canCommittee} href={`/venture/${id}/investor/committee?session=${session.id}`} label="Investment committee" /><LockedLink enabled={!!canDeal} href={`/venture/${id}/investor/deal?session=${session.id}`} label="Deal negotiation" /></div></div>
          </aside>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <Card><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Meeting transcript</p><h2 className="mt-1 text-lg font-semibold text-vs-fg">What was actually said</h2></div><span className="text-xs text-vs-fg-muted">{messages.length} messages</span></div>{messages.length ? <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">{messages.map((m:any) => <div key={m.id} className={`rounded-xl p-4 ${m.role === "founder" ? "ml-8 bg-vs-primary/5" : "mr-8 bg-slate-50"}`}><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-vs-fg-muted">{m.role === "founder" ? "You" : "Investor"}</p><p className="mt-1 text-sm leading-6 text-vs-fg">{m.message}</p></div>)}</div> : <p className="mt-4 text-sm text-vs-fg-muted">The transcript begins after your first answer.</p>}</Card>

        <div className="space-y-5">
          <Card><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Claim ledger</p><h2 className="mt-1 font-semibold text-vs-fg">What you are asking the investor to believe</h2></div><Badge status={unsupportedClaims ? "warning" : "success"}>{unsupportedClaims ? `${unsupportedClaims} unresolved` : "clear"}</Badge></div>{claims.length ? <div className="mt-4 space-y-3">{claims.slice(0, 6).map((c:any) => <div key={c.id} className="rounded-xl border border-vs-border p-3"><div className="flex items-start gap-2"><Badge status={c.claim_state === "SUPPORTED" ? "success" : c.claim_state === "CONTRADICTED" ? "danger" : "warning"}>{c.claim_state}</Badge><p className="text-sm leading-5 text-vs-fg">{c.claim_text}</p></div>{c.investor_concern && <p className="mt-2 border-t border-vs-border pt-2 text-xs leading-5 text-vs-fg-muted">Investor challenge: {c.investor_concern}</p>}</div>)}</div> : <p className="mt-3 text-sm text-vs-fg-muted">Claims appear as you answer.</p>}</Card>
          {sessions?.length > 1 && <Card><p className="text-xs font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Investor memory</p><div className="mt-3 flex flex-wrap gap-2">{sessions.map((s:any) => <Link key={s.id} href={`/venture/${id}/investor?session=${s.id}`} className={`rounded-full border px-3 py-1.5 text-xs ${session.id === s.id ? "border-slate-950 bg-slate-950 text-white" : "border-vs-border text-vs-fg"}`}>{s.investor_profile.replaceAll("-", " ")} · {s.stage}</Link>)}</div></Card>}
          {committee && <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Latest committee</p><p className="mt-2 text-lg font-semibold text-vs-fg">{String(committee.outcome).replaceAll("_", " ")}</p></Card>}
          {offer && <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Latest negotiation</p><p className="mt-2 text-lg font-semibold text-vs-fg">${Number(offer.investment_amount).toLocaleString()} · {offer.offer_state}</p><p className="mt-1 text-xs text-vs-fg-muted">Simulated terms only</p></Card>}
        </div>
      </div>
    </>}
  </main>;
}

function DarkMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold capitalize text-white">{value}</p></div>; }
function StateRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs"><span className="text-slate-500">{label}</span><span className="font-semibold capitalize text-slate-200">{value}</span></div>; }
function LockedLink({ enabled, href, label }: { enabled: boolean; href: string; label: string }) { return enabled ? <Link href={href} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 font-semibold text-white hover:bg-white/10"><span>{label}</span><span>→</span></Link> : <div className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-slate-600"><span>{label}</span><span>locked</span></div>; }
