import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AddOutcomeForm } from "./AddOutcomeForm";
import { OutcomeChart } from "./OutcomeChart";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Monitor" };

const METRIC_LABEL: Record<string, string> = {
  users: "Total users",
  revenue: "Revenue ($/mo)",
  cost: "Cost ($/mo)",
  retention: "Retention (%)",
  other: "Other",
};

const CURRENCY_METRICS = new Set(["revenue", "cost"]);

export default async function MonitorPage({
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

  const { data: outcomesData } = await supabase
    .from("venture_outcomes")
    .select("id, reported_at, metric_type, metric_value, note")
    .eq("venture_id", venture.id)
    .order("reported_at", { ascending: true });

  const outcomes = outcomesData ?? [];

  const byMetric = new Map<string, { id: string; reported_at: string; metric_value: number | null; note: string | null }[]>();
  for (const o of outcomes) {
    const list = byMetric.get(o.metric_type) ?? [];
    list.push(o);
    byMetric.set(o.metric_type, list);
  }

  const metricOrder = ["users", "revenue", "cost", "retention", "other"];
  const trackedMetrics = metricOrder.filter((m) => byMetric.has(m));

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href={`/venture/${venture.id}`} className="text-sm text-vs-fg-muted hover:underline">
        ← {venture.name}
      </Link>
      <h1 className="mt-4 text-xl font-semibold text-vs-fg">Monitor</h1>
      <p className="mt-1 text-sm text-vs-fg-muted">
        Log what&apos;s actually happening after launch — real numbers, not the simulation&apos;s
        projections. Nothing here is estimated or auto-filled.
      </p>

      <Card className="mt-4">
        <AddOutcomeForm ventureId={venture.id} />
      </Card>

      {trackedMetrics.length > 0 && (
        <Card className="mt-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">Trend</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {trackedMetrics.map((metric) => {
              const points = (byMetric.get(metric) ?? [])
                .filter((o) => o.metric_value !== null)
                .map((o) => ({ reportedAt: o.reported_at, value: o.metric_value as number }));
              return (
                <OutcomeChart
                  key={metric}
                  title={METRIC_LABEL[metric] ?? metric}
                  format={CURRENCY_METRICS.has(metric) ? "currency" : "number"}
                  points={points}
                />
              );
            })}
          </div>
        </Card>
      )}

      {outcomes.length > 0 ? (
        <Card className="mt-4">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">Log</p>
          <ul className="space-y-1.5">
            {[...outcomes].reverse().map((o) => (
              <li key={o.id} className="text-sm text-vs-fg-muted">
                <span className="font-medium text-vs-fg">
                  {new Date(o.reported_at).toLocaleDateString()}
                </span>{" "}
                — {METRIC_LABEL[o.metric_type] ?? o.metric_type}: {o.metric_value ?? "—"}
                {o.note ? ` (${o.note})` : ""}
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="mt-4">
          <p className="text-sm text-vs-fg-muted">
            No real-world numbers logged yet. Add the first one above once this venture has
            something to report.
          </p>
        </Card>
      )}
    </main>
  );
}
