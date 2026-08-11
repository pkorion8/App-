import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import {
  requiresDecision,
  getDecisionOptions,
  getDelayedConsequenceNotes,
  rowToSimulationState,
} from "@venture-sandbox/simulator";
import { Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { StartSimulationForm } from "./StartSimulationForm";
import { RunControls } from "./RunControls";
import { CheckpointPanel } from "./CheckpointPanel";
import { HistoryChart } from "./HistoryChart";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Simulate" };

const STAGE_LABEL: Record<string, string> = {
  setup: "Setting up",
  resource_planning: "Planning resources",
  build: "Building",
  build_event: "Build — blocker hit",
  mvp_ready: "First version ready",
  pre_launch: "Pre-launch",
  launch: "Launching",
  first_users: "Growing",
  user_or_market_event: "Growing — event",
  adaptation: "Adapting",
  month_1: "Month 1 review",
  complete: "Complete",
};

export default async function SimulatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const configured = isSupabaseConfigured({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!configured) return <SupabaseSetupNotice />;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: venture } = await supabase
    .from("ventures")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!venture) notFound();

  const { data: run } = await supabase
    .from("simulation_runs")
    .select("*")
    .eq("venture_id", venture.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let events: { id: string; virtual_day: number; description: string; event_type: string }[] = [];
  let decisions: { virtual_day: number; decision_type: string; choice: string }[] = [];
  let checkpoints: { id: string; virtual_day: number; label: string | null; created_at: string }[] = [];
  if (run) {
    const [{ data: eventData }, { data: decisionData }, { data: checkpointData }] = await Promise.all([
      supabase
        .from("simulation_events")
        .select("id, virtual_day, description, event_type")
        .eq("simulation_run_id", run.id)
        .order("virtual_day", { ascending: false })
        .limit(15),
      supabase
        .from("simulation_decisions")
        .select("virtual_day, decision_type, choice")
        .eq("simulation_run_id", run.id)
        .order("virtual_day", { ascending: true }),
      supabase
        .from("simulation_checkpoints")
        .select("id, virtual_day, label, created_at")
        .eq("simulation_run_id", run.id)
        .order("created_at", { ascending: false }),
    ]);
    events = eventData ?? [];
    decisions = decisionData ?? [];
    checkpoints = checkpointData ?? [];
  }

  const runState = run ? rowToSimulationState(run) : null;

  const delayedConsequenceNotes = runState
    ? getDelayedConsequenceNotes(
        runState,
        decisions.map((d) => ({
          virtualDay: d.virtual_day,
          decisionType: d.decision_type,
          choice: d.choice,
        })),
      )
    : [];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href={`/venture/${venture.id}`} className="text-sm text-vs-fg-muted hover:underline">
        ← {venture.name}
      </Link>
      <h1 className="mt-4 text-xl font-semibold text-vs-fg">Simulate</h1>

      {!run ? (
        <Card className="mt-4">
          <p className="mb-4 text-sm text-vs-fg-muted">
            Set a starting budget. From there you&apos;ll build, launch, and see
            how the venture plays out — decisions here have real, delayed
            consequences, not a fixed script.
          </p>
          <StartSimulationForm ventureId={venture.id} />
        </Card>
      ) : (
        <div className="mt-4 space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">
                Day {run.virtual_day} · {STAGE_LABEL[run.stage] ?? run.stage}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Stat label="Cash" value={`$${run.cash_remaining.toLocaleString()}`} />
              <Stat label="Build" value={`${run.build_progress_pct}%`} />
              <Stat label="Quality" value={`${run.product_quality_pct}%`} />
              <Stat label="Tech risk" value={run.technical_risk} />
              <Stat label="Users" value={run.total_users.toLocaleString()} />
              <Stat label="Returning" value={run.returning_users.toLocaleString()} />
              <Stat label="Revenue/mo" value={`$${run.monthly_revenue.toLocaleString()}`} />
              <Stat label="Cost/mo" value={`$${run.monthly_cost.toLocaleString()}`} />
            </div>
          </Card>

          {runState && runState.history.length >= 2 && (
            <Card>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">
                Trend
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <HistoryChart
                  title="Cash remaining"
                  format="currency"
                  points={runState.history.map((h) => ({ day: h.day, value: h.cashRemaining }))}
                />
                <HistoryChart
                  title="Total users"
                  format="number"
                  points={runState.history.map((h) => ({ day: h.day, value: h.totalUsers }))}
                />
                <HistoryChart
                  title="Revenue / mo"
                  format="currency"
                  points={runState.history.map((h) => ({ day: h.day, value: h.monthlyRevenue }))}
                />
              </div>
            </Card>
          )}

          <Card>
            <RunControls
              ventureId={venture.id}
              runId={run.id}
              awaitingDecision={requiresDecision(rowToSimulationState(run))}
              decisionOptions={getDecisionOptions(rowToSimulationState(run))}
              isComplete={run.stage === "complete"}
            />
          </Card>

          {delayedConsequenceNotes.length > 0 && (
            <Card className="border-vs-primary/40 bg-vs-primary/5">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">
                Why this is happening
              </p>
              <ul className="space-y-1.5">
                {delayedConsequenceNotes.map((note) => (
                  <li key={note} className="text-sm text-vs-fg">
                    {note}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CheckpointPanel
              ventureId={venture.id}
              runId={run.id}
              checkpoints={checkpoints}
              currentDay={run.virtual_day}
            />
          </Card>

          {events.length > 0 && (
            <Card>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">
                Log
              </p>
              <ul className="space-y-1.5">
                {events.map((e) => (
                  <li key={e.id} className="text-sm text-vs-fg-muted">
                    <span className="font-medium text-vs-fg">Day {e.virtual_day}</span> — {e.description}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-vs-fg-muted">{label}</p>
      <p className="font-medium text-vs-fg">{value}</p>
    </div>
  );
}
