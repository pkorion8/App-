import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import type { RecommendedStack, BacklogItem, CostEstimate } from "@venture-sandbox/build";
import { Badge, BarList, Card, StatTile, type BadgeStatus } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GenerateButton } from "./GenerateButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Build" };

const CATEGORY_LABEL: Record<string, string> = { setup: "Setup", core: "Core", auth: "Auth", payments: "Payments", polish: "Polish", launch: "Launch" };
const CATEGORY_BADGE_STATUS: Record<string, BadgeStatus> = { setup: "neutral", core: "primary", auth: "neutral", payments: "warning", polish: "neutral", launch: "success" };

export default async function BuildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const configured = isSupabaseConfigured({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  if (!configured) return <SupabaseSetupNotice />;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [{ data: venture }, { data: shape }, { data: simulation }] = await Promise.all([
    supabase.from("ventures").select("id, name, target_user, geography").eq("id", id).maybeSingle(),
    supabase.from("venture_shapes").select("mvp_scope,problem_statement,differentiation").eq("venture_id", id).maybeSingle(),
    supabase.from("simulation_runs").select("technical_risk,build_progress_pct,product_quality_pct").eq("venture_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!venture) notFound();

  const { data: pkg } = await supabase.from("build_packages").select("recommended_stack, backlog, cost_estimate, created_at").eq("venture_id", venture.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const stack = pkg?.recommended_stack as unknown as RecommendedStack | undefined;
  const backlog = pkg?.backlog as unknown as BacklogItem[] | undefined;
  const cost = pkg?.cost_estimate as unknown as CostEstimate | undefined;
  const mustHave = (backlog ?? []).filter((i) => ["setup","core","auth","payments"].includes(i.category));
  const later = (backlog ?? []).filter((i) => ["polish","launch"].includes(i.category));

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">Build Studio</p><h1 className="mt-2 text-3xl font-semibold text-vs-fg">Turn the venture into an executable MVP</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-vs-fg-muted">Architecture and backlog suggestions are implementation aids. Provenance stays visible so reference-stack assumptions are not mistaken for researched technical truth.</p></div><Link href={`/venture/${venture.id}/technology`} className="text-sm font-medium text-vs-primary">Technology & ownership →</Link></div>

      {!pkg || !stack || !backlog || !cost ? <Card className="mt-6 max-w-3xl"><p className="mb-4 text-sm text-vs-fg-muted">Generate a starting stack recommendation, venture-specific task list, and rough monthly cost floor.</p><GenerateButton ventureId={venture.id} /></Card> : <div className="mt-6 space-y-4">
        <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Card><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">MVP direction</p><h2 className="mt-1 text-xl font-semibold text-vs-fg">{shape?.mvp_scope || "Use the generated backlog as the current MVP boundary."}</h2></div><Badge status="primary">IDEA-SPECIFIC HEURISTIC</Badge></div>{shape?.problem_statement && <p className="mt-3 text-sm leading-6 text-vs-fg-muted"><strong>Problem being built for:</strong> {shape.problem_statement}</p>}{shape?.differentiation && <p className="mt-2 text-sm leading-6 text-vs-fg-muted"><strong>Difference to preserve:</strong> {shape.differentiation}</p>}</Card>
          <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Simulation handoff</p>{simulation ? <div className="mt-3 grid grid-cols-3 gap-2"><Mini label="Tech risk" value={simulation.technical_risk}/><Mini label="Build modeled" value={`${simulation.build_progress_pct}%`}/><Mini label="Quality modeled" value={`${simulation.product_quality_pct}%`}/></div> : <p className="mt-3 text-sm text-vs-fg-muted">No simulation has stress-tested the build assumptions yet.</p>}<p className="mt-3 text-xs text-vs-fg-muted">Simulation values are modeled state, not engineering estimates.</p></Card>
        </section>

        <Card>
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">Reference architecture</p><p className="mt-1 text-xs text-vs-fg-muted">A starting implementation, not a personalized winner.</p></div><Badge status="neutral">REFERENCE ASSUMPTION</Badge></div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"><StatTile label="Database" value={stack.database} /><StatTile label="Auth" value={stack.auth} /><StatTile label="Hosting" value={stack.hosting} /></div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2"><div className="rounded-vs-md border border-vs-border p-4"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">API / service dependencies</p>{stack.notableApis.length ? <ul className="mt-2 list-inside list-disc text-sm text-vs-fg-muted">{stack.notableApis.map((api) => <li key={api}>{api}</li>)}</ul> : <p className="mt-2 text-sm text-vs-fg-muted">No notable external API was inferred by the build generator.</p>}</div><div className="rounded-vs-md border border-vs-border p-4"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Ownership guardrails</p><ul className="mt-2 space-y-1 text-sm text-vs-fg-muted"><li>• Keep venture data exportable.</li><li>• Isolate replaceable third-party APIs behind owned interfaces.</li><li>• Avoid putting irreplaceable product logic only inside a vendor workflow.</li><li>• Re-evaluate lock-in after real usage establishes what deserves custom engineering.</li></ul></div></div>
        </Card>

        <Card><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">Build paths</p><p className="mt-1 text-xs text-vs-fg-muted">Different founder constraints can justify different implementation paths.</p></div><Badge status="primary">IDEA-SPECIFIC HEURISTIC</Badge></div><div className="mt-3 grid gap-3 md:grid-cols-2">{stack.builderOptions.map((opt) => <div key={opt.name} className="rounded-vs-md border border-vs-border bg-vs-bg-subtle p-4"><p className="text-sm font-medium text-vs-fg">{opt.name}</p><div className="mt-2 flex flex-wrap gap-1.5"><Badge status="primary">Speed: {opt.speed}</Badge><Badge status="neutral">Ownership: {opt.ownership}</Badge></div><p className="mt-2 text-xs leading-5 text-vs-fg-muted">{opt.costNote}</p></div>)}</div><p className="mt-3 text-xs text-vs-fg-muted">{stack.rationale}</p></Card>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">Must-have first</p><Badge status="primary">{mustHave.length} tasks</Badge></div><TaskList items={mustHave} /></Card>
          <Card><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">Polish / launch after core</p><Badge status="neutral">{later.length} tasks</Badge></div><TaskList items={later} /></Card>
        </section>

        <Card><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">Estimated monthly cost floor</p><p className="mt-1 text-xs text-vs-fg-muted">Low-volume assumptions, using free tiers where possible; not a permanent operating forecast.</p></div><StatTile label="Current generated floor" value={`$${cost.totalMonthly}/mo`} /></div><BarList className="mt-4" items={cost.items.map((item) => ({ label: item.name, sublabel: item.note, value: item.monthlyCost, valueLabel: `$${item.monthlyCost}` }))} /></Card>
      </div>}
    </main>
  );
}

function TaskList({ items }: { items: BacklogItem[] }) { return items.length ? <ul className="mt-3 space-y-2">{items.map((item) => <li key={item.title} className="rounded-vs-md border border-vs-border p-3"><div className="flex items-baseline gap-2"><Badge status={CATEGORY_BADGE_STATUS[item.category] ?? "neutral"}>{CATEGORY_LABEL[item.category] ?? item.category}</Badge><span className="text-sm font-medium text-vs-fg">{item.title}</span></div><p className="mt-1 text-xs leading-5 text-vs-fg-muted">{item.description}</p></li>)}</ul> : <p className="mt-3 text-sm text-vs-fg-muted">No tasks in this group.</p>; }
function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-vs-sm bg-vs-bg-subtle p-3"><p className="text-[10px] uppercase tracking-wide text-vs-fg-muted">{label}</p><p className="mt-1 text-sm font-semibold capitalize text-vs-fg">{value}</p></div>; }
