import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { SOURCE_REGISTRY } from "@venture-sandbox/research";
import { Badge, Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VentureModeSection } from "../VentureModeSection";
import { ClarificationForm } from "./ClarificationForm";
import { FindingCard, type FindingRow } from "./FindingCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Research" };

const CONNECTED_EXTERNAL_KINDS = new Set(["competitors", "market", "github"]);

function hasConnectedExternalSource(finding: FindingRow): boolean {
  if (finding.is_demo) return false;
  const metadata = (finding.metadata || {}) as Record<string, unknown>;
  const kind = typeof metadata.kind === "string" ? metadata.kind.toLowerCase() : "";
  return (
    CONNECTED_EXTERNAL_KINDS.has(kind) ||
    typeof metadata.source === "string" ||
    typeof metadata.sourceUrl === "string"
  );
}

export default async function ResearchPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ again?: string }> }) {
  const { id } = await params;
  const { again } = await searchParams;
  const configured = isSupabaseConfigured({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  if (!configured) return <SupabaseSetupNotice />;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: venture } = await supabase.from("ventures").select("id, name, raw_idea_text, target_user, geography").eq("id", id).maybeSingle();
  if (!venture) notFound();
  const { data: mission } = await supabase.from("research_missions").select("id, target_user, geography, status, created_at").eq("venture_id", venture.id).eq("status", "complete").order("created_at", { ascending: false }).limit(1).maybeSingle();

  const showForm = !mission || again === "1";
  let findings: FindingRow[] = [];
  if (mission && !showForm) {
    const { data } = await supabase.from("findings").select("id, normalized_claim, user_facing_summary, state, is_demo, limitations, next_test, metadata").eq("mission_id", mission.id).order("created_at", { ascending: true });
    findings = data ?? [];
  }

  const solid = findings.filter((f) => f.state === "SOLID");
  const mixed = findings.filter((f) => f.state === "MIXED");
  const unresolved = findings.filter((f) => f.state === "WEAK" || f.state === "UNKNOWN");
  const externallySourced = findings.filter(hasConnectedExternalSource);
  const sourceTraceable = findings.filter(hasConnectedExternalSource);
  const coverage = findings.length ? Math.round(((solid.length + mixed.length * 0.5) / findings.length) * 100) : 0;
  const traceability = findings.length ? Math.round((sourceTraceable.length / findings.length) * 100) : 0;
  const strongest = solid.find((f) => !f.is_demo) ?? solid[0] ?? findings[0];
  const biggestUnknown = unresolved[0] ?? findings.find((f) => f.limitations);

  const groups = [
    { title: "Demand & people", kinds: ["demand", "audience", "problem", "people"], fallback: findings.slice(0, 2) },
    { title: "Alternatives & competition", kinds: ["competition", "competitor", "itunes"], fallback: findings.slice(2, 4) },
    { title: "Market & money", kinds: ["market", "pricing", "money"], fallback: findings.slice(4, 5).concat(findings.slice(6, 7)) },
    { title: "Technology & feasibility", kinds: ["github", "technology", "technical"], fallback: findings.slice(5, 6) },
    { title: "Risks & reasons to be careful", kinds: ["risk", "regulatory", "warning"], fallback: findings.slice(7) },
  ].map((group) => {
    const matches = findings.filter((f) => { const md = (f.metadata || {}) as Record<string, unknown>; const kind = typeof md.kind === "string" ? md.kind.toLowerCase() : ""; return group.kinds.some((candidate) => kind.includes(candidate)); });
    return { title: group.title, items: matches.length ? matches : group.fallback };
  });
  const competitionSignal = groups.find((g) => g.title.startsWith("Alternatives"))?.items[0];
  const techSignal = groups.find((g) => g.title.startsWith("Technology"))?.items[0];
  const hasFindings = findings.length > 0;

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <VentureModeSection mode="simple">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">Step 1</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-vs-fg">Is this problem real?</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-vs-fg-muted">We look for signs that people have this problem, what they use today, and what still needs to be checked. You do not need to understand research jargon.</p>
      </VentureModeSection>
      <VentureModeSection mode="pro">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">Understand</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-vs-fg">Research intelligence</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-vs-fg-muted">Evidence first. Strong conclusions stay separate from weak signals, demo material and unresolved questions.</p></div>
          <Link href={`/venture/${venture.id}/evidence`} className="text-sm font-medium text-vs-primary">Open Evidence Explorer →</Link>
        </div>
      </VentureModeSection>

      <SourceStatus />

      {showForm ? (
        <Card className="mt-6 max-w-3xl">
          <VentureModeSection mode="simple"><p className="mb-4 text-sm text-vs-fg-muted">Tell us who you think would use this and where you want to start. If you are unsure, use your best guess—we can change it later.</p></VentureModeSection>
          <VentureModeSection mode="pro"><p className="mb-4 text-sm text-vs-fg-muted">We use the audience and market already saved in Shape. Review them here before starting research.</p></VentureModeSection>
          <ClarificationForm ventureId={venture.id} targetUser={venture.target_user} geography={venture.geography} />
        </Card>
      ) : (
        <div className="mt-6 space-y-5">
          {!hasFindings ? <NoFindings ventureId={venture.id} targetUser={mission!.target_user} geography={mission!.geography} /> : null}
          <VentureModeSection mode="simple" className="space-y-4">
            <Card className="border-vs-primary/20 bg-vs-primary/5"><div className="flex flex-wrap items-center justify-between gap-3"><div><Badge status={hasFindings ? "primary" : "neutral"}>{hasFindings ? "WHAT WE FOUND" : "NO LIVE FINDINGS YET"}</Badge><p className="mt-2 text-sm text-vs-fg">{hasFindings ? <>We checked this idea for <strong>{mission!.target_user}</strong> in <strong>{mission!.geography}</strong>.</> : <>The connected sources returned no usable evidence for <strong>{mission!.target_user}</strong> in <strong>{mission!.geography}</strong>. We did not replace the missing evidence with generated estimates.</>}</p></div><Link href={`/venture/${venture.id}/research?again=1`} className="text-sm font-medium text-vs-primary">Check again →</Link></div></Card>
            <section className="grid gap-4 md:grid-cols-2">
              <SimpleAnswer title="What looks promising" text={strongest?.user_facing_summary || strongest?.normalized_claim || "We do not have enough evidence yet to call out a strong signal."} tone="good" />
              <SimpleAnswer title="What still needs checking" text={biggestUnknown?.next_test || biggestUnknown?.limitations || biggestUnknown?.normalized_claim || "No evidence was returned, so the audience, geography, and search wording should be checked before drawing a conclusion."} tone="careful" />
              <SimpleAnswer title="What already exists" text={competitionSignal?.user_facing_summary || competitionSignal?.normalized_claim || "We have not found a clear competitor signal yet."} />
              <SimpleAnswer title="Can it be built?" text={techSignal?.user_facing_summary || techSignal?.normalized_claim || "We do not yet have enough technical evidence to say much here."} />
            </section>
            <Card className="border-vs-primary/30"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">What should I do next?</p><p className="mt-2 text-lg font-semibold text-vs-fg">{hasFindings ? "Make the idea clearer before testing it." : "Refine the research inputs, then check again."}</p><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{hasFindings ? "Define who needs it most, the exact problem to solve first, and the smallest useful first version." : "A zero-result mission is not proof that there is no market. Tighten the target user or geography, then rerun the connected sources before making a market claim."}</p><Link href={hasFindings ? `/venture/${venture.id}/shape` : `/venture/${venture.id}/research?again=1`} className="mt-4 inline-flex rounded-vs-sm bg-vs-primary px-4 py-2 text-sm font-semibold text-vs-primary-fg">{hasFindings ? "Make my idea better →" : "Refine and check again →"}</Link></Card>
          </VentureModeSection>

          <VentureModeSection mode="pro" className="space-y-5">
            <Card className="border-vs-primary/20 bg-vs-primary/5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><Badge status={hasFindings ? "primary" : "neutral"}>{hasFindings ? "LATEST MISSION" : "MISSION COMPLETE · NO LIVE FINDINGS"}</Badge><p className="mt-2 text-sm text-vs-fg">For <strong>{mission!.target_user}</strong> in <strong>{mission!.geography}</strong></p><p className="mt-1 text-xs text-vs-fg-muted">Completed {new Date(mission!.created_at).toLocaleDateString()}</p></div><Link href={`/venture/${venture.id}/research?again=1`} className="text-sm font-medium text-vs-primary">Run research again →</Link></div></Card>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><ResearchMetric label="Evidence coverage" value={`${coverage}%`} note={hasFindings ? "Strength-weighted coverage of recorded findings; not a success score." : "No recorded live findings; 0% is not a market or success score."} /><ResearchMetric label="Source traceability" value={`${traceability}%`} note={hasFindings ? `${sourceTraceable.length} of ${findings.length} findings are tied to a connected external source.` : "No findings were returned to trace."} /><ResearchMetric label="Agreement state" value={`${solid.length} strong`} note={`${mixed.length} mixed · ${unresolved.length} weak/unknown`} /><ResearchMetric label="Externally sourced" value={`${externallySourced.length}/${findings.length}`} note={hasFindings ? `${findings.length - externallySourced.length} findings are demo, synthetic, heuristic, or otherwise not backed by a connected external source.` : "No synthetic fallback findings were created."} /></section>
            <section className="grid gap-4 lg:grid-cols-2"><Card><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-vs-fg-muted">Primary conclusion</p><p className="mt-2 text-lg font-semibold leading-7 text-vs-fg">{strongest?.normalized_claim ?? "No evidence-backed conclusion yet."}</p><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{strongest?.user_facing_summary ?? "The connected sources did not return a usable finding for this mission."}</p></Card><Card className="border-vs-warning/30"><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-vs-fg-muted">Largest unresolved question</p><p className="mt-2 text-lg font-semibold leading-7 text-vs-fg">{biggestUnknown?.normalized_claim ?? "Do the current audience and geography produce usable evidence?"}</p><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{biggestUnknown?.next_test || biggestUnknown?.limitations || "Refine the audience/geography and rerun research before drawing a conclusion."}</p></Card></section>
            <nav className="grid gap-2 sm:grid-cols-4" aria-label="Research modules"><Link href={`/venture/${venture.id}/reviews`} className="rounded-vs-md border border-vs-border p-3 text-sm font-medium text-vs-fg hover:border-vs-primary/40">Reviews</Link><Link href={`/venture/${venture.id}/technology`} className="rounded-vs-md border border-vs-border p-3 text-sm font-medium text-vs-fg hover:border-vs-primary/40">Technology & ownership</Link><Link href={`/venture/${venture.id}/evidence`} className="rounded-vs-md border border-vs-border p-3 text-sm font-medium text-vs-fg hover:border-vs-primary/40">Evidence explorer</Link><Link href={`/venture/${venture.id}/monetization`} className="rounded-vs-md border border-vs-border p-3 text-sm font-medium text-vs-fg hover:border-vs-primary/40">Monetization lab</Link></nav>
            {groups.filter((group) => group.items.length).map((group) => <section key={group.title}><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold text-vs-fg">{group.title}</h2><span className="text-xs text-vs-fg-muted">{group.items.length} finding{group.items.length === 1 ? "" : "s"}</span></div><div className="space-y-3">{group.items.map((f) => <FindingCard key={`${group.title}-${f.id}`} f={f} />)}</div></section>)}
          </VentureModeSection>
        </div>
      )}
    </main>
  );
}

function NoFindings({ ventureId, targetUser, geography }: { ventureId: string; targetUser: string; geography: string }) {
  return (
    <Card className="border-vs-warning/30 bg-vs-warning/5">
      <Badge status="warning">SOURCE-LIMITED RESULT</Badge>
      <h2 className="mt-3 text-lg font-semibold text-vs-fg">The mission completed, but no connected source returned a usable finding.</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-vs-fg-muted">This means we have no evidence to report for <strong>{targetUser}</strong> in <strong>{geography}</strong>. It does not mean the market is empty, demand is zero, or the idea will fail. Sim Venture does not invent substitute market data when a source has no result.</p>
      <Link href={`/venture/${ventureId}/research?again=1`} className="mt-4 inline-flex text-sm font-semibold text-vs-primary">Refine audience or geography and rerun →</Link>
    </Card>
  );
}

function SourceStatus() {
  return (
    <Card className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Connected research sources</p><p className="mt-1 text-sm text-vs-fg">Live where possible; unavailable sources stay explicitly unavailable.</p></div>
        <span className="text-xs text-vs-fg-muted">No invented reviews, pricing or regulatory conclusions.</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SOURCE_REGISTRY.map((source) => (
          <div key={`${source.category}-${source.provider}`} className="rounded-vs-md border border-vs-border bg-vs-bg-subtle p-3">
            <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-vs-fg">{source.provider}</p><Badge status={source.access === "live" ? "success" : source.access === "partial" ? "warning" : "neutral"}>{source.access.toUpperCase()}</Badge></div>
            <p className="mt-2 text-xs leading-5 text-vs-fg-muted">{source.limitations}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SimpleAnswer({ title, text, tone = "normal" }: { title: string; text: string; tone?: "normal" | "good" | "careful" }) {
  return <Card className={tone === "good" ? "border-vs-success/30" : tone === "careful" ? "border-vs-warning/30" : ""}><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">{title}</p><p className="mt-2 text-base leading-7 text-vs-fg">{text}</p></Card>;
}
function ResearchMetric({ label, value, note }: { label: string; value: string; note: string }) { return <Card><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-vs-fg-muted">{label}</p><p className="mt-2 text-2xl font-semibold text-vs-fg">{value}</p><p className="mt-1 text-xs leading-5 text-vs-fg-muted">{note}</p></Card>; }
