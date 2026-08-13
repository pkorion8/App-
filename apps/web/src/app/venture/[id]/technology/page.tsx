import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@venture-sandbox/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function inferNeeds(text: string) {
  const t = text.toLowerCase();
  return {
    ai: /\b(ai|llm|generate|generation|assistant|model)\b/.test(t),
    media: /\b(image|photo|video|audio|camera|music)\b/.test(t),
    payments: /\b(payment|subscription|marketplace|commission|checkout|purchase)\b/.test(t),
    realtime: /\b(chat|collaborat|live|real[- ]?time|sync)\b/.test(t),
    mobile: /\bmobile|iphone|android|camera|notification|push)\b/.test(t),
  };
}

export default async function Technology({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = (await createSupabaseServerClient()) as any;
  const [{ data: venture }, { data: shape }, { data: mission }, { data: build }] = await Promise.all([
    db.from("ventures").select("id,name,raw_idea_text,target_user,geography").eq("id", id).maybeSingle(),
    db.from("venture_shapes").select("problem_statement,value_proposition,mvp_scope,differentiation,pricing_model").eq("venture_id", id).maybeSingle(),
    db.from("research_missions").select("id").eq("venture_id", id).eq("status", "complete").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("build_packages").select("recommended_stack,cost_estimate").eq("venture_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!venture) notFound();

  const text = [venture.raw_idea_text, shape?.problem_statement, shape?.mvp_scope].filter(Boolean).join(" ");
  const needs = inferNeeds(text);
  let githubEvidence = 0;
  if (mission?.id) {
    const { data: findings } = await db.from("findings").select("metadata").eq("mission_id", mission.id);
    for (const f of findings ?? []) {
      const md = f.metadata as Record<string, any> | null;
      if (md?.kind === "github" && typeof md.activeCount === "number") githubEvidence = Math.max(githubEvidence, md.activeCount);
    }
  }
  const generatedStack = build?.recommended_stack as Record<string, any> | null;
  const monthlyCost = Number((build?.cost_estimate as Record<string, any> | null)?.totalMonthly ?? 0) || null;
  const dependencies = [needs.ai && "AI/model provider", needs.media && "Media storage/processing", needs.payments && "Payments", needs.realtime && "Realtime sync", needs.mobile && "Mobile notifications/device APIs"].filter(Boolean) as string[];

  const paths = [
    { title: "Fastest MVP", stack: "Managed web app + hosted database", provenance: "IDEA-SPECIFIC HEURISTIC", status: "primary" as const, fit: `Best when the first goal is testing ${shape?.problem_statement ? "the shaped problem" : "the core workflow"} before investing in custom infrastructure.`, speed: "Fast", ownership: "Medium", lockIn: "Medium", scale: "Good for early validation; replace constrained services later if evidence justifies it." },
    { title: "Lowest initial cost", stack: "Free tiers + minimal backend surface", provenance: "IDEA-SPECIFIC HEURISTIC", status: "primary" as const, fit: `Reduces burn while ${dependencies.length ? `the venture still depends on ${dependencies.join(", ")}` : "the core demand assumption is still unresolved"}.`, speed: "Fast", ownership: "Medium", lockIn: "Medium", scale: "Cost-efficient at low volume; free-tier ceilings are not a scale forecast." },
    { title: "Best ownership/control", stack: "Portable database + explicit export + replaceable APIs", provenance: "IDEA-SPECIFIC HEURISTIC", status: "primary" as const, fit: "Prioritizes data portability, API abstraction and migration paths over the fastest one-vendor setup.", speed: "Medium", ownership: "High", lockIn: "Lower", scale: "More setup work, but stronger long-term control of data and critical interfaces." },
    { title: "Easiest for a non-technical founder", stack: "Managed builder + bounded server functions", provenance: "IDEA-SPECIFIC HEURISTIC", status: "primary" as const, fit: "Keeps infrastructure decisions limited while preserving a path to move critical logic into owned code.", speed: "Fast", ownership: "Medium", lockIn: "Medium–high", scale: "Appropriate for prototype learning; watch exportability and custom logic limits." },
    { title: "Reference implementation", stack: generatedStack ? `${generatedStack.database ?? "Database"} + ${generatedStack.auth ?? "Auth"} + ${generatedStack.hosting ?? "Hosting"}` : "Next.js + Supabase + Vercel", provenance: "REFERENCE ASSUMPTION", status: "neutral" as const, fit: generatedStack ? "Build Studio has already generated this project reference stack." : "This is the product's own reference stack, not a researched winner for this venture.", speed: "Medium", ownership: "Medium–high", lockIn: "Medium", scale: "Useful reference architecture; validate against actual usage before treating it as final." },
  ];

  return <main className="mx-auto max-w-6xl p-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">Technology & ownership</p><h1 className="mt-2 text-3xl font-semibold text-vs-fg">Choose a build path, not a fashionable stack</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-vs-fg-muted">Recommendations below are derived from this venture&apos;s saved idea and shape. Source evidence and heuristics stay visibly separate.</p></div>{githubEvidence > 0 ? <Badge status="success">{githubEvidence} active related repos observed</Badge> : <Badge status="warning">TECH EVIDENCE LIMITED</Badge>}</div>

    <Card className="mt-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Mini label="Detected dependencies" value={dependencies.length ? dependencies.join(" · ") : "No special dependency inferred"}/><Mini label="Existing Build cost floor" value={monthlyCost !== null ? `$${monthlyCost}/mo` : "Not generated"}/><Mini label="Target audience" value={venture.target_user || "Not shaped"}/><Mini label="Market" value={venture.geography || "Not chosen"}/></div><p className="mt-3 text-xs text-vs-fg-muted">Keyword-based dependency detection is an IDEA-SPECIFIC HEURISTIC, not source evidence or a security review.</p></Card>

    <div className="mt-5 grid gap-4 lg:grid-cols-2">{paths.map((p) => <Card key={p.title}><div className="flex flex-wrap items-start justify-between gap-3"><div><Badge status={p.status}>{p.provenance}</Badge><h2 className="mt-3 text-xl font-semibold text-vs-fg">{p.title}</h2><p className="mt-1 text-base font-medium text-vs-fg">{p.stack}</p></div></div><p className="mt-3 text-sm leading-6 text-vs-fg-muted">{p.fit}</p><div className="mt-4 grid grid-cols-3 gap-2"><Mini label="Speed" value={p.speed}/><Mini label="Ownership" value={p.ownership}/><Mini label="Lock-in" value={p.lockIn}/></div><p className="mt-3 text-xs text-vs-fg-muted"><strong>Scale path:</strong> {p.scale}</p></Card>)}</div>

    <Card className="mt-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><Badge status={githubEvidence > 0 ? "success" : "warning"}>{githubEvidence > 0 ? "EVIDENCE CONNECTED" : "PARTIAL"}</Badge><h2 className="mt-3 font-semibold text-vs-fg">Technical evidence boundary</h2></div></div><p className="mt-2 text-sm leading-6 text-vs-fg-muted">GitHub activity, when present, indicates related technical territory. It does not prove this product is easy to build, that a specific stack is best, or that production security/scaling concerns are solved.</p><div className="mt-3 flex gap-4"><Link href={`/venture/${id}/evidence`} className="text-sm text-vs-primary">Open evidence →</Link><Link href={`/venture/${id}/build`} className="text-sm text-vs-primary">Open Build Studio →</Link></div></Card>
  </main>;
}

function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-vs-sm bg-vs-bg-subtle p-3"><p className="text-[10px] uppercase tracking-wide text-vs-fg-muted">{label}</p><p className="mt-1 text-sm font-semibold text-vs-fg">{value}</p></div>; }
