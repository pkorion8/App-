import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Badge, Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VentureModeSection } from "../VentureModeSection";
import { AddOutcomeForm } from "./AddOutcomeForm";
import { OutcomeChart } from "./OutcomeChart";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Learn" };

const METRIC_LABEL: Record<string, string> = { users: "Total users", revenue: "Revenue ($/mo)", cost: "Cost ($/mo)", retention: "Retention (%)", conversion: "Conversion (%)", activation: "Activation (%)", churn: "Churn (%)", qualitative: "Qualitative signal", milestone: "Milestone completion", other: "Other" };
const CURRENCY_METRICS = new Set(["revenue", "cost"]);

export default async function MonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const configured = isSupabaseConfigured({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  if (!configured) return <SupabaseSetupNotice />;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/sign-in");
  const { data: venture } = await supabase.from("ventures").select("id, name").eq("id", id).maybeSingle(); if (!venture) notFound();
  const [{ data: outcomesData }, { data: simulation }] = await Promise.all([
    supabase.from("venture_outcomes").select("id, reported_at, metric_type, metric_value, note").eq("venture_id", venture.id).order("reported_at", { ascending: true }),
    supabase.from("simulation_runs").select("id,virtual_day,total_users,monthly_revenue,monthly_cost,status").eq("venture_id", venture.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const outcomes = outcomesData ?? [];
  const byMetric = new Map<string, { id: string; reported_at: string; metric_value: number | null; note: string | null }[]>();
  for (const o of outcomes) { const list = byMetric.get(o.metric_type) ?? []; list.push(o); byMetric.set(o.metric_type, list); }
  const metricOrder = ["users", "revenue", "cost", "retention", "conversion", "activation", "churn", "milestone", "qualitative", "other"];
  const trackedMetrics = metricOrder.filter((m) => byMetric.has(m));
  const latest = (metric: string) => { const values = byMetric.get(metric) ?? []; return [...values].reverse().find((o) => o.metric_value !== null)?.metric_value ?? null; };
  const compareRows = simulation ? [["Users", simulation.total_users, latest("users")], ["Revenue / mo", simulation.monthly_revenue, latest("revenue")], ["Cost / mo", simulation.monthly_cost, latest("cost")]] as const : [];

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link href={`/venture/${venture.id}`} className="text-sm text-vs-fg-muted hover:underline">← {venture.name}</Link>
      <VentureModeSection mode="simple" className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">Step 6</p>
        <h1 className="mt-2 text-3xl font-semibold text-vs-fg">What did you observe?</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-vs-fg-muted">After you test or launch, come back and add the numbers you observed. These are user-reported observations: Sim Venture stores them separately from research and simulation, but does not independently verify them.</p>
      </VentureModeSection>
      <VentureModeSection mode="pro" className="mt-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">Learn</p><h1 className="mt-1 text-3xl font-semibold text-vs-fg">Reported observations vs the model</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-vs-fg-muted">Log what you observed after testing or launch. Reported observations remain separate from simulated expectations, so variance can inform future decisions without rewriting history. Sim Venture does not independently verify these entries.</p></div><Badge status="primary">USER-REPORTED</Badge></div></VentureModeSection>

      <VentureModeSection mode="simple" className="mt-6 space-y-4">
        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Add a reported observation</p><p className="mt-2 text-sm leading-6 text-vs-fg-muted">Examples: how many people tried it, monthly revenue, monthly cost, retention, or an important milestone.</p><div className="mt-4"><AddOutcomeForm ventureId={venture.id} /></div></Card>
          <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Simulation vs reported observation</p>{!simulation ? <p className="mt-3 text-sm text-vs-fg-muted">You have not run a simulation yet, so there is nothing to compare.</p> : <div className="mt-4 space-y-3">{compareRows.map(([label, simulated, reported]) => <SimpleCompare key={label} label={label} simulated={simulated} reported={reported} />)}</div>}<p className="mt-3 text-xs leading-5 text-vs-fg-muted">A difference does not automatically mean the simulation was “wrong.” It tells you which assumptions deserve another look.</p></Card>
        </section>
        {trackedMetrics.length > 0 && <Card><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Reported progress</p><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{trackedMetrics.map((metric) => { const points = (byMetric.get(metric) ?? []).filter((o) => o.metric_value !== null).map((o) => ({ reportedAt: o.reported_at, value: o.metric_value as number })); return <OutcomeChart key={metric} title={METRIC_LABEL[metric] ?? metric} format={CURRENCY_METRICS.has(metric) ? "currency" : "number"} points={points} />; })}</div></Card>}
        {outcomes.length > 0 ? <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">What you have reported</p><ul className="mt-3 space-y-2">{[...outcomes].reverse().slice(0, 8).map((o) => <li key={o.id} className="rounded-vs-sm bg-vs-bg-subtle p-3 text-sm text-vs-fg-muted"><span className="font-medium text-vs-fg">{new Date(o.reported_at).toLocaleDateString()}</span> — {METRIC_LABEL[o.metric_type] ?? o.metric_type}: {o.metric_value ?? "—"}{o.note ? ` · ${o.note}` : ""}</li>)}</ul></Card> : <Card><p className="text-sm text-vs-fg-muted">No observations have been reported yet. That is normal if you have not launched or tested with people.</p></Card>}
        <Card className="border-vs-primary/30"><p className="text-lg font-semibold text-vs-fg">This closes the first learning loop.</p><p className="mt-2 text-sm leading-6 text-vs-fg-muted">Idea → research → shape → monetization → simulation → build → reported observations → better decisions. Earlier assumptions stay visible instead of being silently rewritten.</p><div className="mt-4 flex flex-wrap gap-3"><Link href={`/venture/${venture.id}/research`} className="rounded-vs-sm border border-vs-border px-4 py-2 text-sm font-semibold text-vs-fg">Revisit research</Link><Link href={`/venture/${venture.id}`} className="rounded-vs-sm bg-vs-primary px-4 py-2 text-sm font-semibold text-vs-primary-fg">Back to venture home</Link></div></Card>
      </VentureModeSection>

      <VentureModeSection mode="pro" className="mt-6 space-y-4">
        <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]"><Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Expectation vs reported observation</p>{!simulation ? <p className="mt-3 text-sm text-vs-fg-muted">No simulation exists yet, so there is no modeled expectation to compare.</p> : <div className="mt-4 space-y-3">{compareRows.map(([label, simulated, reported]) => { const variance = reported === null ? null : reported - simulated; return <div key={label} className="grid grid-cols-3 gap-3 rounded-vs-md border border-vs-border p-3 text-sm"><div><p className="text-[10px] uppercase text-vs-fg-muted">Metric</p><p className="mt-1 font-medium text-vs-fg">{label}</p></div><div><p className="text-[10px] uppercase text-vs-fg-muted">Simulated</p><p className="mt-1 font-medium text-vs-fg">{simulated.toLocaleString()}</p></div><div><p className="text-[10px] uppercase text-vs-fg-muted">Reported / variance</p><p className="mt-1 font-medium text-vs-fg">{reported === null ? "Not reported" : `${reported.toLocaleString()} (${variance! >= 0 ? "+" : ""}${variance!.toLocaleString()})`}</p></div></div>; })}</div>}<p className="mt-3 text-xs text-vs-fg-muted">Variance is descriptive only. It does not verify the observation, automatically change the simulator, or claim causality.</p></Card><Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Add a reported observation</p><div className="mt-3"><AddOutcomeForm ventureId={venture.id} /></div></Card></section>
        <Card className="border-dashed"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Recalibration map · EXPLAINED, NOT AUTOMATIC</p><p className="mt-2 text-sm text-vs-fg-muted">Users/activation can challenge adoption assumptions; revenue/conversion can challenge monetization assumptions; cost can challenge operating-cost assumptions; retention/churn can challenge repeat-value assumptions. The system records these reported signals but does not silently rewrite a simulation today.</p></Card>
        {trackedMetrics.length > 0 && <Card><p className="mb-3 text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">Reported trend</p><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{trackedMetrics.map((metric) => { const points = (byMetric.get(metric) ?? []).filter((o) => o.metric_value !== null).map((o) => ({ reportedAt: o.reported_at, value: o.metric_value as number })); return <OutcomeChart key={metric} title={METRIC_LABEL[metric] ?? metric} format={CURRENCY_METRICS.has(metric) ? "currency" : "number"} points={points} />; })}</div></Card>}
        {outcomes.length > 0 ? <Card><p className="mb-2 text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">Observation log</p><ul className="space-y-2">{[...outcomes].reverse().map((o) => <li key={o.id} className="rounded-vs-sm bg-vs-bg-subtle p-3 text-sm text-vs-fg-muted"><span className="font-medium text-vs-fg">{new Date(o.reported_at).toLocaleDateString()}</span> — {METRIC_LABEL[o.metric_type] ?? o.metric_type}: {o.metric_value ?? "—"}{o.note ? ` · ${o.note}` : ""}</li>)}</ul></Card> : <Card><p className="text-sm text-vs-fg-muted">No user-reported observations logged yet.</p></Card>}
      </VentureModeSection>
    </main>
  );
}

function SimpleCompare({ label, simulated, reported }: { label: string; simulated: number; reported: number | null }) { const difference = reported === null ? null : reported - simulated; return <div className="rounded-vs-md border border-vs-border p-3"><div className="flex items-center justify-between gap-3"><p className="font-medium text-vs-fg">{label}</p><p className="text-xs text-vs-fg-muted">Simulation: {simulated.toLocaleString()}</p></div><p className="mt-2 text-sm text-vs-fg-muted">{reported === null ? "Reported observation: not added yet" : `Reported observation: ${reported.toLocaleString()} · ${difference! >= 0 ? "+" : ""}${difference!.toLocaleString()} from the simulation`}</p></div>; }
