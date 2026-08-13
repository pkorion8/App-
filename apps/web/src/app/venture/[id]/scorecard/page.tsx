import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@venture-sandbox/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ScorecardActions } from "./ScorecardActions";

export default async function VentureScorecard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = (await createSupabaseServerClient()) as any;
  const [{ data: venture }, { data: shape }, { data: mission }, { data: run }, { data: build }] = await Promise.all([
    db.from("ventures").select("id,name,raw_idea_text,target_user,geography,status").eq("id", id).maybeSingle(),
    db.from("venture_shapes").select("problem_statement,value_proposition,differentiation,pricing_model").eq("venture_id", id).maybeSingle(),
    db.from("research_missions").select("id,status,created_at").eq("venture_id", id).eq("status", "complete").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("simulation_runs").select("budget_total,virtual_day,technical_risk,market_confidence,total_users,monthly_revenue,monthly_cost,status").eq("venture_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("build_packages").select("recommended_stack,cost_estimate").eq("venture_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!venture) notFound();

  let findings: any[] = [];
  if (mission?.id) {
    const { data } = await db.from("findings").select("normalized_claim,state,is_demo,limitations,next_test,metadata").eq("mission_id", mission.id);
    findings = data ?? [];
  }
  const solid = findings.filter((f) => f.state === "SOLID" && !f.is_demo).length;
  const mixed = findings.filter((f) => f.state === "MIXED" && !f.is_demo).length;
  const weakUnknown = findings.filter((f) => f.state === "WEAK" || f.state === "UNKNOWN").length;
  const demo = findings.filter((f) => f.is_demo).length;
  const liveDenominator = findings.filter((f) => !f.is_demo).length;
  const coverage = liveDenominator ? Math.round(((solid + mixed * 0.5) / liveDenominator) * 100) : 0;
  const confidence = liveDenominator === 0 ? "Evidence-limited" : solid >= 3 && weakUnknown <= 1 ? "Stronger" : solid + mixed >= 3 ? "Mixed" : "Limited";

  const { data: snapshots } = await db.from("research_competitor_snapshots").select("app_id,app_name,rating_count,checked_at").eq("venture_id", id).order("checked_at", { ascending: false });
  const competitors = new Map<number, any>();
  for (const row of snapshots ?? []) if (!competitors.has(row.app_id)) competitors.set(row.app_id, row);
  const competitorCount = competitors.size;
  const topCompetitor = [...competitors.values()].sort((a, b) => b.rating_count - a.rating_count)[0] ?? null;

  const stack = build?.recommended_stack as Record<string, any> | null;
  const cost = build?.cost_estimate as Record<string, any> | null;
  const dependencyCount = Array.isArray(stack?.notableApis) ? stack.notableApis.length : 0;
  const technical = run?.technical_risk ? `${String(run.technical_risk).toUpperCase()} modeled risk` : dependencyCount >= 3 ? "Higher dependency complexity (heuristic)" : dependencyCount > 0 ? "Moderate dependency complexity (heuristic)" : "Not assessed";
  const capital = run ? `$${Number(run.budget_total).toLocaleString()} modeled starting budget${typeof cost?.totalMonthly === "number" ? ` · $${cost.totalMonthly}/mo generated cost floor` : ""}` : typeof cost?.totalMonthly === "number" ? `$${cost.totalMonthly}/mo generated cost floor; starting capital not modeled` : "Not modeled";
  const unresolved = findings.find((f) => f.state === "UNKNOWN" || f.state === "WEAK")?.next_test || findings.find((f) => f.limitations)?.limitations || "No explicit unresolved question recorded.";
  const recommendation = !mission ? "Run Research before making a build or funding decision." : weakUnknown >= 2 ? "Resolve the highest-impact unknowns before increasing commitment." : !run ? "Run the Simulator to stress-test the current evidence and monetization assumptions." : !build ? "Translate the current direction into an MVP build package." : "Proceed with the smallest real-world test that can challenge the remaining assumptions.";

  const summary = `${venture.name}\nAudience: ${venture.target_user || "not shaped"}\nMarket: ${venture.geography || "not chosen"}\nEvidence coverage: ${liveDenominator ? `${coverage}% of current non-demo findings by the scorecard rule` : "no live evidence"}\nCompetition: ${competitorCount ? `${competitorCount} App Store competitors observed` : "no connected competitor snapshot"}\nTechnical: ${technical}\nCapital: ${capital}\nConfidence: ${confidence}\nBiggest unresolved question: ${unresolved}\nRecommendation: ${recommendation}\nThis scorecard is not a probability of startup success.`;

  return <main className="mx-auto max-w-5xl p-6 print:max-w-none">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="flex flex-wrap gap-2"><Badge status="primary">VENTURE SCORECARD</Badge>{venture.name.startsWith("[DEMO]") && <Badge status="warning">DEMO FIXTURE</Badge>}</div><h1 className="mt-3 text-3xl font-semibold text-vs-fg">{venture.name}</h1><p className="mt-2 max-w-3xl text-sm text-vs-fg-muted">A share-ready summary of what the system can actually support. It deliberately avoids probability-of-success scoring.</p></div><ScorecardActions summary={summary}/></div>

    <Card className="mt-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Score label="Evidence coverage" value={liveDenominator ? `${coverage}%` : "No live evidence"} note={liveDenominator ? `${solid} solid · ${mixed} mixed · ${weakUnknown} weak/unknown` : `${demo} demo finding${demo === 1 ? "" : "s"}; excluded from live coverage`} /><Score label="Competition" value={competitorCount ? `${competitorCount} observed` : "Unavailable"} note={topCompetitor ? `Highest rating-count signal: ${topCompetitor.app_name} (${Number(topCompetitor.rating_count).toLocaleString()} ratings)` : "No connected App Store competitor snapshot."} /><Score label="Technical difficulty" value={technical} note="Modeled risk or dependency heuristic, not an engineering estimate." /><Score label="Capital requirement" value={capital} note="Simulation/build assumptions, not a fundraising recommendation." /></div></Card>

    <section className="mt-4 grid gap-4 lg:grid-cols-2">
      <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Problem & value</p><h2 className="mt-2 text-lg font-semibold text-vs-fg">{shape?.problem_statement || venture.raw_idea_text}</h2><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{shape?.value_proposition || "Value proposition has not been shaped yet."}</p>{shape?.differentiation && <p className="mt-3 text-sm text-vs-fg"><strong>Differentiation:</strong> {shape.differentiation}</p>}</Card>
      <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Confidence in conclusions</p><p className="mt-2 text-2xl font-semibold text-vs-fg">{confidence}</p><p className="mt-2 text-sm text-vs-fg-muted">This label reflects the current finding mix and presence of live evidence. It is not founder quality, market probability, or investment probability.</p></Card>
      <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Biggest unresolved question</p><p className="mt-2 text-lg font-semibold text-vs-fg">{unresolved}</p></Card>
      <Card className="border-vs-primary/30 bg-vs-primary/5"><p className="text-xs font-semibold uppercase tracking-wide text-vs-primary">Recommendation</p><p className="mt-2 text-lg font-semibold text-vs-fg">{recommendation}</p></Card>
    </section>

    <Card className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Truth boundary</p><p className="mt-2 text-sm leading-6 text-vs-fg-muted">Facts, source claims, observations, inferences, assumptions, hypotheses, simulated values, demo fixtures and unknowns must remain distinguishable in the underlying venture record. This scorecard summarizes those records; it does not create new evidence.</p></Card>
    <div className="mt-6 flex gap-4 text-sm print:hidden"><Link href={`/venture/${id}`} className="font-medium text-vs-primary">← Venture Home</Link><Link href={`/venture/${id}/evidence`} className="font-medium text-vs-primary">Evidence Explorer →</Link></div>
  </main>;
}

function Score({ label, value, note }: { label: string; value: string; note: string }) { return <div className="rounded-vs-md border border-vs-border p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-vs-fg-muted">{label}</p><p className="mt-2 text-xl font-semibold text-vs-fg">{value}</p><p className="mt-2 text-xs leading-5 text-vs-fg-muted">{note}</p></div>; }
