import { Badge, Card } from "@venture-sandbox/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addVentureNote, addVentureResource } from "./actions";

export async function VentureMemory({ ventureId }: { ventureId: string }) {
  const db = (await createSupabaseServerClient()) as any;
  const [{ data: notes }, { data: resources }] = await Promise.all([
    db.from("venture_notes").select("id,note,created_at").eq("venture_id", ventureId).order("created_at", { ascending: false }).limit(6),
    db.from("venture_resources").select("id,title,url,resource_type,notes,created_at").eq("venture_id", ventureId).order("created_at", { ascending: false }).limit(6),
  ]);

  return <section className="mt-5 grid gap-4 lg:grid-cols-2">
    <Card>
      <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Venture memory</p><h2 className="mt-1 text-xl font-semibold text-vs-fg">Founder notes</h2></div><Badge status="neutral">PERSISTENT</Badge></div>
      <form action={addVentureNote} className="mt-4 flex gap-2"><input type="hidden" name="ventureId" value={ventureId}/><textarea name="note" required maxLength={4000} rows={2} placeholder="Decision, observation, promise, risk, or follow-up..." className="min-w-0 flex-1 rounded-vs-md border border-vs-border bg-vs-bg px-3 py-2 text-sm text-vs-fg"/><button className="self-end rounded-vs-sm bg-vs-primary px-3 py-2 text-sm font-semibold text-vs-primary-fg">Save note</button></form>
      {notes?.length ? <ul className="mt-4 space-y-2">{notes.map((n:any)=><li key={n.id} className="rounded-vs-sm bg-vs-bg-subtle p-3"><p className="text-sm leading-6 text-vs-fg">{n.note}</p><p className="mt-1 text-[10px] text-vs-fg-muted">{new Date(n.created_at).toLocaleString()}</p></li>)}</ul> : <p className="mt-4 text-sm text-vs-fg-muted">No founder notes yet.</p>}
    </Card>

    <Card>
      <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Saved resources</p><h2 className="mt-1 text-xl font-semibold text-vs-fg">Useful references</h2></div><Badge status="neutral">NOT EVIDENCE BY DEFAULT</Badge></div>
      <form action={addVentureResource} className="mt-4 grid gap-2 sm:grid-cols-2"><input type="hidden" name="ventureId" value={ventureId}/><input name="title" required placeholder="Resource title" className="rounded-vs-md border border-vs-border bg-vs-bg px-3 py-2 text-sm"/><input name="url" type="url" placeholder="https://... (optional)" className="rounded-vs-md border border-vs-border bg-vs-bg px-3 py-2 text-sm"/><select name="resourceType" className="rounded-vs-md border border-vs-border bg-vs-bg px-3 py-2 text-sm"><option value="link">Link</option><option value="document">Document</option><option value="video">Video</option><option value="tool">Tool</option><option value="other">Other</option></select><input name="notes" placeholder="Why it matters (optional)" className="rounded-vs-md border border-vs-border bg-vs-bg px-3 py-2 text-sm"/><button className="rounded-vs-sm border border-vs-primary px-3 py-2 text-sm font-semibold text-vs-primary sm:col-span-2">Save resource</button></form>
      {resources?.length ? <ul className="mt-4 space-y-2">{resources.map((r:any)=><li key={r.id} className="rounded-vs-sm border border-vs-border p-3"><div className="flex flex-wrap items-center gap-2"><Badge status="neutral">{r.resource_type}</Badge>{r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="font-medium text-vs-primary">{r.title} ↗</a> : <span className="font-medium text-vs-fg">{r.title}</span>}</div>{r.notes && <p className="mt-1 text-xs text-vs-fg-muted">{r.notes}</p>}</li>)}</ul> : <p className="mt-4 text-sm text-vs-fg-muted">No saved resources yet.</p>}
    </Card>
  </section>;
}
