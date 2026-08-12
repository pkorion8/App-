import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@venture-sandbox/ui";
import { INVESTOR_PROFILES, investorQuestions } from "@venture-sandbox/domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnswerForm } from "./AnswerForm";
import { answerInvestorQuestion, startInvestorSession } from "./actions";

const STAGES = ["Readiness","Screening","Meeting","Diligence","Committee","Negotiation","Close/pass"];

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
  if (session) {
    [{ data: messages }, { data: claims }] = await Promise.all([
      db.from("investor_messages").select("*").eq("investor_session_id", session.id).order("created_at", { ascending: true }),
      db.from("investor_claims").select("*").eq("investor_session_id", session.id).order("created_at", { ascending: false }),
    ]);
    questions = investorQuestions(session.investor_profile, { audience: venture.target_user, problem: shape?.problem_statement, differentiation: shape?.differentiation, hasResearch: !!research, hasSimulation: !!simulation });
  }

  return <main className="mx-auto max-w-6xl p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><Badge status="warning">SIMULATED REHEARSAL</Badge><h1 className="mt-3 text-3xl font-semibold text-vs-fg">Investor World</h1><p className="mt-2 max-w-3xl text-sm text-vs-fg-muted">Practice investor scrutiny using this venture&apos;s saved context. Nothing here represents real investor interest, funding probability, or legal advice.</p></div><Link className="text-sm font-medium text-vs-primary" href={`/venture/${id}/system`}>System view →</Link></div>

    <Card className="mt-6"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Investor journey</p><div className="mt-3 flex flex-wrap gap-2">{STAGES.map((stage, i) => <span key={stage} className="rounded-full border border-vs-border px-3 py-1.5 text-xs text-vs-fg-muted">{i+1}. {stage}</span>)}</div></Card>

    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_2fr]">
      <div className="space-y-4">
        <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Context coverage</p><p className="mt-2 text-3xl font-semibold text-vs-fg">{coverage}/4</p><p className="mt-1 text-xs text-vs-fg-muted">Measures only presence of audience, shaped problem, completed research and a simulation run. It is not a fundability score.</p></Card>
        {!session && <Card><h2 className="font-semibold text-vs-fg">Choose a rehearsal investor</h2><div className="mt-4 space-y-3">{INVESTOR_PROFILES.map((p) => <form action={startInvestorSession} key={p.key} className="rounded-vs-md border border-vs-border p-3"><input type="hidden" name="ventureId" value={id}/><input type="hidden" name="profile" value={p.key}/><p className="font-medium text-vs-fg">{p.name}</p><p className="mt-1 text-xs text-vs-fg-muted">{p.focus}</p><p className="mt-1 text-xs text-vs-fg-muted">{p.check}</p><button className="mt-3 text-sm font-semibold text-vs-primary">Start rehearsal →</button></form>)}</div></Card>}
        {session && <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Current stage</p><p className="mt-2 text-xl font-semibold capitalize text-vs-fg">{session.stage}</p><div className="mt-4 flex flex-col gap-2 text-sm"><Link className="text-vs-primary" href={`/venture/${id}/investor/diligence?session=${session.id}`}>Diligence room →</Link><Link className="text-vs-primary" href={`/venture/${id}/investor/committee?session=${session.id}`}>Investment committee →</Link><Link className="text-vs-primary" href={`/venture/${id}/investor/deal?session=${session.id}`}>Deal lab →</Link></div></Card>}
      </div>

      {session && <div className="space-y-4"><Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Current question</p><h2 className="mt-2 text-xl font-semibold text-vs-fg">{questions[session.question_index] || "The structured question set is complete. Continue into diligence or committee review."}</h2>{questions[session.question_index] && <div className="mt-4"><AnswerForm action={answerInvestorQuestion} sessionId={session.id} ventureId={id}/></div>}</Card>
      <Card><h2 className="font-semibold text-vs-fg">Meeting transcript</h2>{messages?.length ? <div className="mt-3 space-y-3">{messages.map((m:any) => <div key={m.id} className="rounded-vs-md bg-vs-bg-subtle p-3"><p className="text-[11px] font-semibold uppercase text-vs-fg-muted">{m.role}</p><p className="mt-1 text-sm text-vs-fg">{m.message}</p></div>)}</div> : <p className="mt-2 text-sm text-vs-fg-muted">No answers recorded yet.</p>}</Card>
      <Card><h2 className="font-semibold text-vs-fg">Claim Ledger</h2><p className="mt-1 text-xs text-vs-fg-muted">Founder statements remain claims until evidence supports them.</p>{claims?.length ? <div className="mt-3 space-y-2">{claims.map((c:any) => <div key={c.id} className="flex items-start gap-3 rounded-vs-md border border-vs-border p-3"><Badge status={c.claim_state === "SUPPORTED" ? "success" : c.claim_state === "CONTRADICTED" ? "danger" : "warning"}>{c.claim_state}</Badge><p className="text-sm text-vs-fg">{c.claim_text}</p></div>)}</div> : <p className="mt-3 text-sm text-vs-fg-muted">Claims will appear after the founder answers questions.</p>}</Card></div>}
    </div>
  </main>;
}
