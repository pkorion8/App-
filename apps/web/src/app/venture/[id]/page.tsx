import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Badge, Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const configured = isSupabaseConfigured({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!configured) return { title: "Venture" };
  const supabase = await createSupabaseServerClient();
  const { data: venture } = await supabase.from("ventures").select("name").eq("id", id).maybeSingle();
  return { title: venture?.name ?? "Venture" };
}

export default async function VenturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const configured = isSupabaseConfigured({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!configured) return <SupabaseSetupNotice />;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: venture } = await supabase
    .from("ventures")
    .select("id, name, raw_idea_text, target_user, geography, status, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!venture) notFound();

  const [shapeResult, missionResult, runResult, monetizationResult, buildResult, outcomeResult] = await Promise.all([
    supabase.from("venture_shapes").select("problem_statement, value_proposition, mvp_scope, differentiation, pricing_model").eq("venture_id", venture.id).maybeSingle(),
    supabase.from("research_missions").select("id, status, created_at").eq("venture_id", venture.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("simulation_runs").select("id, status, stage, virtual_day, cash_remaining, total_users, monthly_revenue, monthly_cost, technical_risk, market_confidence, created_at").eq("venture_id", venture.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("monetization_experiments").select("id, hypothesis, deciding_metric, selected").eq("venture_id", venture.id).eq("selected", true).limit(1).maybeSingle(),
    supabase.from("build_packages").select("id, recommended_stack, cost_estimate, created_at").eq("venture_id", venture.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("venture_outcomes").select("id, metric_type, metric_value, note, reported_at").eq("venture_id", venture.id).order("reported_at", { ascending: false }).limit(3),
  ]);

  const shape = shapeResult.data;
  const mission = missionResult.data;
  const run = runResult.data;
  const monetization = monetizationResult.data;
  const build = buildResult.data;
  const outcomes = outcomeResult.data ?? [];

  let findingCount = 0;
  let solidCount = 0;
  let unknownCount = 0;
  let demoCount = 0;
  let topFinding: string | null = null;
  let biggestUnknown: string | null = null;
  if (mission?.id) {
    const { data: findings } = await supabase
      .from("findings")
      .select("normalized_claim, state, is_demo, limitations, next_test")
      .eq("mission_id", mission.id);
    const list = findings ?? [];
    findingCount = list.length;
    solidCount = list.filter((f) => f.state === "SOLID").length;
    unknownCount = list.filter((f) => f.state === "UNKNOWN" || f.state === "WEAK").length;
    demoCount = list.filter((f) => f.is_demo).length;
    topFinding = list.find((f) => f.state === "SOLID" && !f.is_demo)?.normalized_claim ?? list[0]?.normalized_claim ?? null;
    biggestUnknown = list.find((f) => f.state === "UNKNOWN" || f.state === "WEAK")?.next_test ?? list.find((f) => f.limitations)?.limitations ?? null;
  }

  const researchCoverage = findingCount === 0 ? 0 : Math.round(((solidCount + (findingCount - solidCount - unknownCount) * 0.5) / findingCount) * 100);
  const nextAction = !venture.target_user || !venture.geography
    ? { label: "Clarify audience and market", href: `/venture/${venture.id}/shape`, reason: "Research and simulation need a defined target." }
    : !mission
      ? { label: "Run venture research", href: `/venture/${venture.id}/research`, reason: "The venture has no evidence base yet." }
      : !monetization
        ? { label: "Test monetization", href: `/venture/${venture.id}/monetization`, reason: "Pricing assumptions have not been selected." }
        : !run
          ? { label: "Start simulation", href: `/venture/${venture.id}/simulate`, reason: "Stress-test the current assumptions through time." }
          : !build
            ? { label: "Prepare build path", href: `/venture/${venture.id}/build`, reason: "Translate the validated direction into an MVP plan." }
            : { label: "Log real outcomes", href: `/venture/${venture.id}/monitor`, reason: "Compare reality with the simulated assumptions." };

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <section className="rounded-[28px] border border-vs-border bg-vs-bg-subtle/60 p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge status="primary">VENTURE INTELLIGENCE</Badge>
              <Badge status="neutral">{venture.status.replaceAll("_", " ")}</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-vs-fg sm:text-4xl">{venture.name}</h1>
            <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-vs-fg-muted">{venture.raw_idea_text}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-vs-fg-muted">
              <span className="rounded-full border border-vs-border px-3 py-1.5">Audience: {venture.target_user || "not shaped"}</span>
              <span className="rounded-full border border-vs-border px-3 py-1.5">Market: {venture.geography || "not chosen"}</span>
              {shape?.pricing_model && <span className="rounded-full border border-vs-border px-3 py-1.5">Model: {shape.pricing_model.replaceAll("_", " ")}</span>}
            </div>
          </div>
          <Card className="min-w-[280px] border-vs-primary/30 bg-vs-primary/5">
            <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-vs-primary">Next best action</p>
            <p className="mt-2 text-lg font-semibold text-vs-fg">{nextAction.label}</p>
            <p className="mt-1 text-xs leading-5 text-vs-fg-muted">{nextAction.reason}</p>
            <Link href={nextAction.href} className="mt-4 inline-flex rounded-vs-sm bg-vs-primary px-3 py-2 text-sm font-medium text-vs-primary-fg">Continue →</Link>
          </Card>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SignalCard label="Evidence coverage" value={findingCount ? `${researchCoverage}%` : "Not researched"} note={findingCount ? `${solidCount} solid · ${unknownCount} weak/unknown${demoCount ? ` · ${demoCount} demo` : ""}` : "Run Research to create an evidence base."} href={`/venture/${venture.id}/evidence`} />
        <SignalCard label="Latest simulation" value={run ? `Day ${run.virtual_day}` : "Not run"} note={run ? `${run.stage.replaceAll("_", " ")} · ${run.technical_risk} tech risk` : "No simulated timeline yet."} href={`/venture/${venture.id}/simulate`} />
        <SignalCard label="Monetization" value={monetization ? "Experiment selected" : "Open question"} note={monetization?.hypothesis ?? "Choose a pricing hypothesis to test."} href={`/venture/${venture.id}/monetization`} />
        <SignalCard label="Build readiness" value={build ? "Build package ready" : "Not prepared"} note={build ? "Architecture, backlog and cost assumptions are available." : "Build Studio has not produced a package yet."} href={`/venture/${venture.id}/build`} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Current intelligence</p><h2 className="mt-1 text-xl font-semibold text-vs-fg">What we know — and what we do not</h2></div>
            <Link href={`/venture/${venture.id}/research`} className="text-sm font-medium text-vs-primary">Open research →</Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-vs-md border border-vs-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Strongest current signal</p>
              <p className="mt-2 text-sm leading-6 text-vs-fg">{topFinding || "No evidence-backed conclusion yet."}</p>
            </div>
            <div className="rounded-vs-md border border-vs-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Biggest unresolved question</p>
              <p className="mt-2 text-sm leading-6 text-vs-fg">{biggestUnknown || "No unresolved question has been recorded yet."}</p>
            </div>
          </div>
          {(shape?.problem_statement || shape?.value_proposition || shape?.differentiation) && (
            <div className="mt-4 rounded-vs-md bg-vs-bg-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Current shape</p>
              {shape?.problem_statement && <p className="mt-2 text-sm text-vs-fg"><strong>Problem:</strong> {shape.problem_statement}</p>}
              {shape?.value_proposition && <p className="mt-2 text-sm text-vs-fg"><strong>Value:</strong> {shape.value_proposition}</p>}
              {shape?.differentiation && <p className="mt-2 text-sm text-vs-fg"><strong>Difference:</strong> {shape.differentiation}</p>}
            </div>
          )}
        </Card>

        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Reality loop</p>
          <h2 className="mt-1 text-xl font-semibold text-vs-fg">Simulation → real outcome</h2>
          {run ? (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <MiniStat label="Cash" value={`$${run.cash_remaining.toLocaleString()}`} />
              <MiniStat label="Users" value={run.total_users.toLocaleString()} />
              <MiniStat label="Revenue / mo" value={`$${run.monthly_revenue.toLocaleString()}`} />
              <MiniStat label="Cost / mo" value={`$${run.monthly_cost.toLocaleString()}`} />
            </div>
          ) : <p className="mt-4 text-sm text-vs-fg-muted">No simulated expectation exists yet.</p>}
          <div className="mt-4 border-t border-vs-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Latest real observations</p>
            {outcomes.length ? <ul className="mt-2 space-y-2">{outcomes.map((o) => <li key={o.id} className="text-sm text-vs-fg"><span className="font-medium">{o.metric_type}</span>{typeof o.metric_value === "number" ? `: ${o.metric_value.toLocaleString()}` : ""}{o.note ? ` — ${o.note}` : ""}</li>)}</ul> : <p className="mt-2 text-sm text-vs-fg-muted">Nothing real has been logged yet. Simulated outcomes remain separate from reality.</p>}
          </div>
        </Card>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionLink href={`/venture/${venture.id}/research`} title="Understand" detail="Demand, alternatives, market, technology and risk" />
        <ActionLink href={`/venture/${venture.id}/simulate`} title="Simulate" detail="Run the venture through time and decisions" />
        <ActionLink href={`/venture/${venture.id}/investor`} title="Investor World" detail="Rehearse screening, diligence and deal mechanics" />
        <ActionLink href={`/venture/${venture.id}/system`} title="System View" detail="Inspect how evidence and assumptions connect" />
      </section>
    </main>
  );
}

function SignalCard({ label, value, note, href }: { label: string; value: string; note: string; href: string }) {
  return <Link href={href}><Card className="h-full transition hover:-translate-y-0.5 hover:border-vs-primary/40"><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-vs-fg-muted">{label}</p><p className="mt-2 text-xl font-semibold text-vs-fg">{value}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-vs-fg-muted">{note}</p></Card></Link>;
}
function MiniStat({ label, value }: { label: string; value: string }) { return <div className="rounded-vs-sm bg-vs-bg-subtle p-3"><p className="text-[10px] uppercase tracking-wide text-vs-fg-muted">{label}</p><p className="mt-1 font-semibold text-vs-fg">{value}</p></div>; }
function ActionLink({ href, title, detail }: { href: string; title: string; detail: string }) { return <Link href={href} className="rounded-vs-md border border-vs-border p-4 transition hover:border-vs-primary/50 hover:bg-vs-primary/5"><p className="font-semibold text-vs-fg">{title}</p><p className="mt-1 text-xs leading-5 text-vs-fg-muted">{detail}</p></Link>; }
