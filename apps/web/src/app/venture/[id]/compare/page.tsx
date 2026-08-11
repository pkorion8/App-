import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Badge, Card, StatTile } from "@venture-sandbox/ui";
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

  // Independent of each other once we know the venture exists -- run in
  // parallel rather than as 3 sequential round trips (this function runs
  // twice per page load, once per compared venture, so this halves what
  // was ~6-8 sequential Postgres round trips down to ~4).
  const [missionsResult, runResult, buildResult] = await Promise.all([
    supabase.from("research_missions").select("id").eq("venture_id", ventureId),
    supabase
      .from("simulation_runs")
      .select("stage, virtual_day, total_users, monthly_revenue, cash_remaining")
      .eq("venture_id", ventureId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("build_packages")
      .select("cost_estimate")
      .eq("venture_id", ventureId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const missionIds = missionsResult.data?.map((m) => m.id) ?? [];
  const { data: findings } =
    missionIds.length > 0
      ? await supabase.from("findings").select("is_demo").in("mission_id", missionIds)
      : { data: [] };

  const run = runResult.data;
  const build = buildResult.data;

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

  if (!otherId) {
    // Only the venture's name is needed for this view -- skip the full
    // findings/run/build fetch loadVentureSummary does, which would be
    // wasted work here (none of it is rendered on the picker screen).
    const [{ data: venture }, { data: others }] = await Promise.all([
      supabase.from("ventures").select("id, name").eq("id", id).maybeSingle(),
      supabase.from("ventures").select("id, name").neq("id", id).order("created_at", { ascending: false }),
    ]);
    if (!venture) notFound();

    return (
      <main className="mx-auto max-w-3xl p-6">
        <Link href={`/venture/${id}`} className="text-sm text-vs-fg-muted hover:underline">
          ← {venture.name}
        </Link>
        <h1 className="mt-4 text-xl font-semibold text-vs-fg">Compare</h1>
        <Card className="mt-4">
          <p className="mb-4 text-sm text-vs-fg-muted">Compare against another venture:</p>
          <PickVentureForm ventureId={id} otherVentures={others ?? []} />
        </Card>
      </main>
    );
  }

  const [a, b] = await Promise.all([
    loadVentureSummary(supabase, id),
    loadVentureSummary(supabase, otherId),
  ]);
  if (!a) notFound();
  if (!b) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href={`/venture/${id}/compare`} className="text-sm text-vs-fg-muted hover:underline">
        ← Pick a different venture
      </Link>
      <h1 className="mt-4 text-xl font-semibold text-vs-fg">
        {a.venture.name} vs {b.venture.name}
      </h1>

      <div className="mt-4 space-y-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Idea</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-vs-md border border-vs-border bg-vs-bg-subtle p-3">
              <p className="text-xs text-vs-fg-muted">{a.venture.name}</p>
              <p className="mt-1 text-sm text-vs-fg">{a.venture.raw_idea_text}</p>
            </div>
            <div className="rounded-vs-md border border-vs-border bg-vs-bg-subtle p-3">
              <p className="text-xs text-vs-fg-muted">{b.venture.name}</p>
              <p className="mt-1 text-sm text-vs-fg">{b.venture.raw_idea_text}</p>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Status</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Badge status="neutral">
              {a.venture.name}: {a.venture.status}
            </Badge>
            <Badge status="neutral">
              {b.venture.name}: {b.venture.status}
            </Badge>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Research</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatTile
              label={a.venture.name}
              value={`${a.findingsCount} findings`}
              hint={`${a.liveFindingsCount} live, ${a.findingsCount - a.liveFindingsCount} pending`}
            />
            <StatTile
              label={b.venture.name}
              value={`${b.findingsCount} findings`}
              hint={`${b.liveFindingsCount} live, ${b.findingsCount - b.liveFindingsCount} pending`}
            />
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Simulation</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatTile
              label={a.venture.name}
              value={a.run ? `${a.run.total_users.toLocaleString()} users` : "Not started"}
              hint={a.run ? `Day ${a.run.virtual_day} · ${a.run.stage} · $${a.run.monthly_revenue}/mo` : undefined}
            />
            <StatTile
              label={b.venture.name}
              value={b.run ? `${b.run.total_users.toLocaleString()} users` : "Not started"}
              hint={b.run ? `Day ${b.run.virtual_day} · ${b.run.stage} · $${b.run.monthly_revenue}/mo` : undefined}
            />
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">
            Estimated monthly cost
          </p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatTile
              label={a.venture.name}
              value={a.monthlyCost !== undefined ? `$${a.monthlyCost}` : "—"}
              hint={a.monthlyCost === undefined ? "No build plan generated yet" : undefined}
            />
            <StatTile
              label={b.venture.name}
              value={b.monthlyCost !== undefined ? `$${b.monthlyCost}` : "—"}
              hint={b.monthlyCost === undefined ? "No build plan generated yet" : undefined}
            />
          </div>
        </Card>
      </div>

      <p className="mt-3 text-xs text-vs-fg-muted">
        This is a factual side-by-side of what each venture has actually produced so far —
        not a computed &quot;winner&quot; score.
      </p>
    </main>
  );
}
