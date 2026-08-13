import { notFound } from "next/navigation";
import { Badge, Card } from "@venture-sandbox/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMonetizationExperiments } from "@venture-sandbox/domain";
import { selectExperiment } from "./actions";

export default async function Monetization({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createSupabaseServerClient();
  const { data: v } = await db.from("ventures").select("id, raw_idea_text, target_user, geography").eq("id", id).maybeSingle();
  if (!v) notFound();
  const [{ data: shape }, { data: build }, { data: selected }] = await Promise.all([
    db.from("venture_shapes").select("pricing_model, problem_statement").eq("venture_id", id).maybeSingle(),
    db.from("build_packages").select("cost_estimate").eq("venture_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("monetization_experiments").select("experiment_key").eq("venture_id", id).eq("selected", true),
  ]);
  const cost = (build?.cost_estimate || {}) as { totalMonthly?: number };
  const cards = createMonetizationExperiments({ geography: v.geography, audience: v.target_user, product: shape?.problem_statement || v.raw_idea_text, pricingModel: shape?.pricing_model, monthlyCost: cost.totalMonthly, hasCompetitorPricing: false });
  const keys = new Set((selected || []).map((s) => s.experiment_key));

  return <main className="mx-auto max-w-6xl p-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><Badge status="primary">FOUNDER DECISION</Badge><h1 className="mt-3 text-3xl font-semibold text-vs-fg">Monetization Lab</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-vs-fg-muted">Compare business-model hypotheses without pretending there is a proven price. Selected experiments persist and can change the revenue-model assumption used by the next simulation run.</p></div><Badge status={keys.size ? "success" : "warning"}>{keys.size ? `${keys.size} EXPERIMENT${keys.size === 1 ? "" : "S"} SELECTED` : "PRICING EVIDENCE LIMITED"}</Badge></div>
    <Card className="mt-6"><div className="grid gap-3 sm:grid-cols-3"><Mini label="Current model" value={shape?.pricing_model?.replaceAll("_", " ") || "Not decided"}/><Mini label="Build cost floor" value={typeof cost.totalMonthly === "number" ? `$${cost.totalMonthly}/mo` : "Not generated"}/><Mini label="Competitor pricing" value="UNAVAILABLE in connected sources"/></div><p className="mt-3 text-xs text-vs-fg-muted">These inputs constrain the hypotheses below. They do not establish willingness to pay.</p></Card>
    <div className="mt-6 grid gap-4 lg:grid-cols-2">{cards.map((c) => <Card key={c.key} className={keys.has(c.key) ? "border-vs-primary/60" : ""}><div className="flex items-start justify-between gap-3"><h2 className="text-lg font-semibold text-vs-fg">{c.title}</h2>{keys.has(c.key) && <Badge status="success">SELECTED</Badge>}</div><p className="mt-3 text-sm font-medium leading-6 text-vs-fg">{c.hypothesis}</p><dl className="mt-4 space-y-3 text-sm"><div><dt className="font-semibold text-vs-fg">Why it might fit</dt><dd className="text-vs-fg-muted">{c.fit}</dd></div><div><dt className="font-semibold text-vs-fg">Evidence used</dt><dd><ul className="list-inside list-disc text-vs-fg-muted">{c.evidence.map((e) => <li key={e}>{e}</li>)}</ul></dd></div><div><dt className="font-semibold text-vs-fg">Assumptions / unknowns</dt><dd className="text-vs-fg-muted">{c.unknowns}</dd></div><div><dt className="font-semibold text-vs-fg">Deciding metric</dt><dd className="text-vs-fg-muted">{c.metric}</dd></div>{c.invalidates && <div><dt className="font-semibold text-vs-fg">What would invalidate it</dt><dd className="text-vs-fg-muted">{c.invalidates}</dd></div>}</dl><form action={selectExperiment} className="mt-5"><input type="hidden" name="ventureId" value={id}/><input type="hidden" name="experimentKey" value={c.key}/><button className="rounded-vs-sm border border-vs-primary px-3 py-2 text-sm font-semibold text-vs-primary hover:bg-vs-primary hover:text-vs-primary-fg" type="submit">{keys.has(c.key) ? "Selected" : "Select experiment"}</button></form></Card>)}</div>
  </main>;
}

function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-vs-sm bg-vs-bg-subtle p-3"><p className="text-[10px] uppercase tracking-wide text-vs-fg-muted">{label}</p><p className="mt-1 text-sm font-semibold text-vs-fg">{value}</p></div>; }
