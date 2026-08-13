import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { requiresDecision, getDecisionOptions, getDelayedConsequenceNotes, rowToSimulationState } from "@venture-sandbox/simulator";
import { Badge, Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StartSimulationForm } from "./StartSimulationForm";
import { RunControls } from "./RunControls";
import { CheckpointPanel } from "./CheckpointPanel";
import { HistoryChart } from "./HistoryChart";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Simulate" };

const STAGE_LABEL: Record<string, string> = {
  setup: "Setting up", resource_planning: "Planning resources", build: "Building", build_event: "Build blocker", mvp_ready: "MVP ready", pre_launch: "Pre-launch", launch: "Launching", first_users: "First users", user_or_market_event: "Market event", adaptation: "Adapting", month_1: "Month 1 review", complete: "Complete",
};
const PRICING_MODEL_LABEL: Record<string, string> = { subscription: "Subscription", one_time: "One-time purchase", commission: "Marketplace / commission", ad_supported: "Free, ad-supported" };

export default async function SimulatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ run?: string }> }) {
  const { id } = await params;
  const { run: requestedRunId } = await searchParams;
  const configured = isSupabaseConfigured({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  if (!configured) return <SupabaseSetupNotice />;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: venture } = await supabase.from("ventures").select("id, name").eq("id", id).maybeSingle();
  if (!venture) notFound();

  const { data: runs } = await supabase.from("simulation_runs").select("*").eq("venture_id", venture.id).order("created_at", { ascending: false });
  const run = (requestedRunId ? runs?.find((candidate) => candidate.id === requestedRunId) : runs?.[0]) ?? null;

  let events: { id: string; virtual_day: number; description: string; event_type: string }[] = [];
  let decisions: { virtual_day: number; decision_type: string; choice: string }[] = [];
  let checkpoints: { id: string; virtual_day: number; label: string | null; created_at: string }[] = [];
  if (run) {
    const [{ data: eventData }, { data: decisionData }, { data: checkpointData }] = await Promise.all([
      supabase.from("simulation_events").select("id, virtual_day, description, event_type").eq("simulation_run_id", run.id).order("virtual_day", { ascending: false }).limit(20),
      supabase.from("simulation_decisions").select("virtual_day, decision_type, choice").eq("simulation_run_id", run.id).order("virtual_day", { ascending: true }),
      supabase.from("simulation_checkpoints").select("id, virtual_day, label, created_at").eq("simulation_run_id", run.id).order("created_at", { ascending: false }),
    ]);
    events = eventData ?? []; decisions = decisionData ?? []; checkpoints = checkpointData ?? [];
  }

  const runState = run ? rowToSimulationState(run) : null;
  const awaitingDecision = runState ? requiresDecision(runState) : false;
  const delayedConsequenceNotes = runState ? getDelayedConsequenceNotes(runState, decisions.map((d) => ({ virtualDay: d.virtual_day, decisionType: d.decision_type, choice: d.choice }))) : [];
  const burnDelta = run ? run.monthly_revenue - run.monthly_cost : 0;

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">Startup flight simulator</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-vs-fg">Run the venture through time</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-vs-fg-muted">Advance through build, launch and market events. Decisions change deterministic state now and can create delayed consequences later.</p>
        </div>
        {run && <Badge status={awaitingDecision ? "warning" : run.stage === "complete" ? "success" : "primary"}>{awaitingDecision ? "DECISION REQUIRED" : run.stage === "complete" ? "TIMELINE COMPLETE" : "RUNNING"}</Badge>}
      </div>

      {!run ? (
        <Card className="mt-6 max-w-3xl border-vs-primary/20">
          <h2 className="text-xl font-semibold text-vs-fg">Start a new timeline</h2>
          <p className="mb-4 mt-2 text-sm leading-6 text-vs-fg-muted">Set a starting budget. Research, pricing and build context are reused where available; missing evidence stays explicit.</p>
          <StartSimulationForm ventureId={venture.id} />
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {(runs?.length ?? 0) > 1 && (
            <Card>
              <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Timeline library</p><p className="mt-1 text-sm text-vs-fg-muted">Original runs and checkpoint rewinds remain separate, so earlier history is not erased.</p></div><span className="text-xs text-vs-fg-muted">{runs!.length} timelines</span></div>
              <div className="mt-3 flex flex-wrap gap-2">{runs!.map((item, index) => <Link key={item.id} href={`/venture/${venture.id}/simulate?run=${item.id}`} className={`rounded-full border px-3 py-1.5 text-sm ${item.id === run.id ? "border-vs-primary bg-vs-primary text-vs-primary-fg" : "border-vs-border text-vs-fg"}`}>Timeline {runs!.length-index} · Day {item.virtual_day}</Link>)}</div>
            </Card>
          )}

          <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Virtual timeline</p><h2 className="mt-1 text-2xl font-semibold text-vs-fg">Day {run.virtual_day} · {STAGE_LABEL[run.stage] ?? run.stage}</h2></div>
                <span className="rounded-full border border-vs-border px-3 py-1.5 text-xs text-vs-fg-muted">{PRICING_MODEL_LABEL[run.pricing_model] ?? run.pricing_model}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Cash" value={`$${run.cash_remaining.toLocaleString()}`} />
                <Stat label="Build" value={`${run.build_progress_pct}%`} />
                <Stat label="Quality" value={`${run.product_quality_pct}%`} />
                <Stat label="Tech risk" value={run.technical_risk} />
                <Stat label="Users" value={run.total_users.toLocaleString()} />
                <Stat label="Returning" value={run.returning_users.toLocaleString()} />
                <Stat label="Revenue / mo" value={`$${run.monthly_revenue.toLocaleString()}`} />
                <Stat label="Net / mo" value={`${burnDelta >= 0 ? "+" : "-"}$${Math.abs(burnDelta).toLocaleString()}`} />
              </div>
            </Card>
            <Card className={runState?.marketContext.hasResearch ? "" : "border-vs-danger/40 bg-vs-danger/5"}>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Context loaded into this run</p>
              <p className="mt-3 text-sm leading-6 text-vs-fg-muted">{runState?.marketContext.summary}</p>
              {!runState?.marketContext.hasResearch && <Link href={`/venture/${venture.id}/research`} className="mt-3 inline-block text-sm font-medium text-vs-primary">Run Research →</Link>}
            </Card>
          </section>

          {runState && runState.history.length >= 2 && (
            <Card>
              <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Observable consequences</p><p className="mt-1 text-sm text-vs-fg-muted">State changes over virtual time, not a success score.</p></div></div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <HistoryChart title="Cash remaining" format="currency" points={runState.history.map((h) => ({ day: h.day, value: h.cashRemaining }))} />
                <HistoryChart title="Total users" format="number" points={runState.history.map((h) => ({ day: h.day, value: h.totalUsers }))} />
                <HistoryChart title="Revenue / mo" format="currency" points={runState.history.map((h) => ({ day: h.day, value: h.monthlyRevenue }))} />
              </div>
            </Card>
          )}

          <Card><RunControls ventureId={venture.id} runId={run.id} awaitingDecision={awaitingDecision} decisionOptions={getDecisionOptions(rowToSimulationState(run))} isComplete={run.stage === "complete"} /></Card>

          {delayedConsequenceNotes.length > 0 && <Card className="border-vs-primary/40 bg-vs-primary/5"><p className="text-xs font-semibold uppercase tracking-[.18em] text-vs-primary">Delayed consequences</p><ul className="mt-3 space-y-2">{delayedConsequenceNotes.map((note) => <li key={note} className="text-sm leading-6 text-vs-fg">{note}</li>)}</ul></Card>}

          <section className="grid gap-4 lg:grid-cols-2">
            <Card><CheckpointPanel ventureId={venture.id} runId={run.id} checkpoints={checkpoints} currentDay={run.virtual_day} /></Card>
            <Card>
              <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Decision history</p><span className="text-xs text-vs-fg-muted">{decisions.length} decisions</span></div>
              {!decisions.length ? <p className="mt-3 text-sm text-vs-fg-muted">No founder decisions recorded yet.</p> : <ol className="mt-3 space-y-2">{decisions.slice(-8).reverse().map((d, index) => <li key={`${d.virtual_day}-${d.choice}-${index}`} className="rounded-vs-sm border border-vs-border p-3 text-sm"><span className="font-medium text-vs-fg">Day {d.virtual_day}</span><span className="text-vs-fg-muted"> · {d.decision_type.replaceAll("_", " ")} → {d.choice.replaceAll("_", " ")}</span></li>)}</ol>}
            </Card>
          </section>

          {events.length > 0 && <Card><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Timeline log</p><span className="text-xs text-vs-fg-muted">latest {events.length}</span></div><ul className="mt-3 grid gap-2 md:grid-cols-2">{events.map((e) => <li key={e.id} className="rounded-vs-sm bg-vs-bg-subtle p-3 text-sm text-vs-fg-muted"><span className="font-medium text-vs-fg">Day {e.virtual_day}</span> · {e.description}</li>)}</ul></Card>}
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-vs-sm bg-vs-bg-subtle p-3"><p className="text-[10px] uppercase tracking-wide text-vs-fg-muted">{label}</p><p className="mt-1 font-semibold text-vs-fg">{value}</p></div>; }
