import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PickVentureForm } from "./PickVentureForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compare" };

async function loadVentureSummary(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ventureId: string,
) {
  const { data: venture } = await supabase
    .from("ventures")
    .select("id, name, raw_idea_text, status")
    .eq("id", ventureId)
    .maybeSingle();
  if (!venture) return null;

  const { data: findings } = await supabase
    .from("findings")
    .select("is_demo")
    .in(
      "mission_id",
      (
        await supabase.from("research_missions").select("id").eq("venture_id", ventureId)
      ).data?.map((m) => m.id) ?? [],
    );

  const { data: run } = await supabase
    .from("simulation_runs")
    .select("stage, virtual_day, total_users, monthly_revenue, cash_remaining")
    .eq("venture_id", ventureId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: build } = await supabase
    .from("build_packages")
    .select("cost_estimate")
    .eq("venture_id", ventureId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const liveFindings = (findings ?? []).filter((f) => !f.is_demo).length;
  const buildCost = build?.cost_estimate as unknown as { totalMonthly?: number } | undefined;

  return {
    venture,
    findingsCount: findings?.length ?? 0,
    liveFindingsCount: liveFindings,
    run,
    monthlyCost: buildCost?.totalMonthly,
  };
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ with?: string }>;
}) {
  const { id } = await params;
  const { with: otherId } = await searchParams;

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

  const a = await loadVentureSummary(supabase, id);
  if (!a) notFound();

  if (!otherId) {
    const { data: others } = await supabase
      .from("ventures")
      .select("id, name")
      .neq("id", id)
      .order("created_at", { ascending: false });

    return (
      <main className="mx-auto max-w-3xl p-6">
        <Link href={`/venture/${id}`} className="text-sm text-vs-fg-muted hover:underline">
          ← {a.venture.name}
        </Link>
        <h1 className="mt-4 text-xl font-semibold text-vs-fg">Compare</h1>
        <Card className="mt-4">
          <p className="mb-4 text-sm text-vs-fg-muted">Compare against another venture:</p>
          <PickVentureForm ventureId={id} otherVentures={others ?? []} />
        </Card>
      </main>
    );
  }

  const b = await loadVentureSummary(supabase, otherId);
  if (!b) notFound();

  const rows: [string, string, string][] = [
    ["Idea", a.venture.raw_idea_text, b.venture.raw_idea_text],
    ["Status", a.venture.status, b.venture.status],
    [
      "Research",
      `${a.findingsCount} findings (${a.liveFindingsCount} live)`,
      `${b.findingsCount} findings (${b.liveFindingsCount} live)`,
    ],
    [
      "Simulation",
      a.run ? `Day ${a.run.virtual_day} · ${a.run.stage} · ${a.run.total_users} users · $${a.run.monthly_revenue}/mo` : "Not run yet",
      b.run ? `Day ${b.run.virtual_day} · ${b.run.stage} · ${b.run.total_users} users · $${b.run.monthly_revenue}/mo` : "Not run yet",
    ],
    [
      "Est. monthly cost",
      a.monthlyCost !== undefined ? `$${a.monthlyCost}` : "Not generated yet",
      b.monthlyCost !== undefined ? `$${b.monthlyCost}` : "Not generated yet",
    ],
  ];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href={`/venture/${id}/compare`} className="text-sm text-vs-fg-muted hover:underline">
        ← Pick a different venture
      </Link>
      <h1 className="mt-4 text-xl font-semibold text-vs-fg">
        {a.venture.name} vs {b.venture.name}
      </h1>

      <Card className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-vs-border text-left">
              <th className="py-2 pr-4 text-vs-fg-muted">Dimension</th>
              <th className="py-2 pr-4 text-vs-fg">{a.venture.name}</th>
              <th className="py-2 text-vs-fg">{b.venture.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, valA, valB]) => (
              <tr key={label} className="border-b border-vs-border last:border-0">
                <td className="py-2 pr-4 font-medium text-vs-fg-muted">{label}</td>
                <td className="py-2 pr-4 text-vs-fg">{valA}</td>
                <td className="py-2 text-vs-fg">{valB}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-vs-fg-muted">
        This is a factual side-by-side of what each venture has actually produced so far —
        not a computed &quot;winner&quot; score.
      </p>
    </main>
  );
}
