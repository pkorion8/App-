import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge, Card } from "@venture-sandbox/ui";

export const dynamic = "force-dynamic";

export default async function Evidence({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createSupabaseServerClient();
  const { data: venture } = await db.from("ventures").select("id, name").eq("id", id).maybeSingle();
  if (!venture) notFound();

  const { data: mission } = await db
    .from("research_missions")
    .select("id, created_at")
    .eq("venture_id", id)
    .eq("status", "complete")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: findings } = mission
    ? await db
        .from("findings")
        .select("id, normalized_claim, user_facing_summary, state, is_demo, limitations, next_test, metadata, created_at")
        .eq("mission_id", mission.id)
        .order("created_at", { ascending: true })
    : { data: null };

  const list = findings ?? [];
  const live = list.filter((f) => !f.is_demo);
  const solid = list.filter((f) => f.state === "SOLID");
  const mixed = list.filter((f) => f.state === "MIXED");
  const weakUnknown = list.filter((f) => f.state === "WEAK" || f.state === "UNKNOWN");
  const withSource = list.filter((f) => {
    const md = (f.metadata || {}) as Record<string, unknown>;
    return typeof md.source === "string" || typeof md.sourceUrl === "string";
  });
  const coverage = list.length ? Math.round(((solid.length + mixed.length * 0.5) / list.length) * 100) : 0;
  const traceability = list.length ? Math.round((withSource.length / list.length) * 100) : 0;

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">Evidence Explorer</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-vs-fg">Trace every conclusion back to evidence</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-vs-fg-muted">Conclusion → synthesis → finding → source. Gaps stay visible; missing provenance is never silently filled in.</p>
        </div>
        <Link href={`/venture/${id}/research`} className="text-sm font-medium text-vs-primary">Back to Research →</Link>
      </div>

      {!list.length ? (
        <Card className="mt-6">
          <Badge status="warning">UNAVAILABLE</Badge>
          <p className="mt-3 text-sm text-vs-fg-muted">No research findings exist yet. Run Research first to build an evidence trail.</p>
        </Card>
      ) : (
        <>
          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Evidence coverage" value={`${coverage}%`} note="Based on recorded finding strength, not venture success." />
            <Metric label="Source traceability" value={`${traceability}%`} note={`${withSource.length} of ${list.length} findings carry source metadata.`} />
            <Metric label="Strong findings" value={`${solid.length}`} note={`${mixed.length} mixed · ${weakUnknown.length} weak/unknown`} />
            <Metric label="Live vs demo" value={`${live.length} live`} note={`${list.length - live.length} demo or synthetic findings`} />
          </section>

          <section className="mt-6 space-y-4">
            {list.map((f) => {
              const md = (f.metadata || {}) as Record<string, unknown>;
              const source = typeof md.source === "string" ? md.source : "Source metadata unavailable";
              const sourceUrl = typeof md.sourceUrl === "string" ? md.sourceUrl : null;
              const kind = typeof md.kind === "string" ? md.kind : "general";
              const checked = f.created_at ? new Date(f.created_at).toLocaleDateString() : "Date unavailable";
              const status = f.state === "SOLID" ? "success" : f.state === "MIXED" ? "warning" : "neutral";
              return (
                <Card key={f.id} className="overflow-hidden">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <Badge status={f.is_demo ? "warning" : "success"}>{f.is_demo ? "DEMO" : "LIVE"}</Badge>
                        <Badge status={status}>{f.state}</Badge>
                        <Badge status="neutral">{kind}</Badge>
                      </div>
                      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[.16em] text-vs-fg-muted">Conclusion</p>
                      <h2 className="mt-1 text-lg font-semibold text-vs-fg">{f.normalized_claim}</h2>
                      <p className="mt-3 text-sm leading-6 text-vs-fg-muted">{f.user_facing_summary}</p>
                    </div>
                    <div className="w-full rounded-vs-md bg-vs-bg-subtle p-4 lg:w-72">
                      <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-vs-fg-muted">Source record</p>
                      <p className="mt-2 text-sm font-medium text-vs-fg">{source}</p>
                      <p className="mt-1 text-xs text-vs-fg-muted">Checked {checked}</p>
                      {sourceUrl ? <a className="mt-3 inline-block text-xs font-medium text-vs-primary" href={sourceUrl} rel="noreferrer" target="_blank">Open original source ↗</a> : <p className="mt-3 text-xs text-vs-fg-muted">Original-source URL unavailable.</p>}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 border-t border-vs-border pt-4 md:grid-cols-2">
                    <EvidenceField label="Limitations / contradiction" value={f.limitations || "No contradiction metadata recorded. This does not prove none exists."} />
                    <EvidenceField label="Next validation test" value={f.next_test || "No next test has been recorded for this finding."} />
                  </div>
                </Card>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <Card><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-vs-fg-muted">{label}</p><p className="mt-2 text-2xl font-semibold text-vs-fg">{value}</p><p className="mt-1 text-xs leading-5 text-vs-fg-muted">{note}</p></Card>;
}

function EvidenceField({ label, value }: { label: string; value: string }) {
  return <div className="rounded-vs-sm border border-vs-border p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-vs-fg-muted">{label}</p><p className="mt-2 text-sm leading-5 text-vs-fg">{value}</p></div>;
}
