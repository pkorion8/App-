import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Badge, Button, Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { CreateVentureForm } from "./CreateVentureForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your ventures" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ idea?: string; name?: string }> }) {
  const { idea = "", name = "" } = await searchParams;
  const configured = isSupabaseConfigured({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  if (!configured) return <SupabaseSetupNotice />;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const workspaceId = membership?.workspace_id ?? null;

  const { data: ventures } = workspaceId
    ? await supabase
        .from("ventures")
        .select("id, name, raw_idea_text, status, created_at, target_user, geography")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
    : { data: [] };
  const compareStart = ventures && ventures.length >= 2 ? ventures[0]?.id : null;

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="vs-panel-shadow rounded-[30px] border border-vs-ink/10 bg-vs-lavender-soft p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[.16em] text-vs-fg-muted">Your venture workspace</p><h1 className="mt-3 max-w-3xl text-4xl font-medium leading-none tracking-[-.045em] text-vs-ink sm:text-5xl">Test the idea. Make the next decision clear.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-vs-fg-muted">Start in normal words, connect real evidence, simulate the difficult choices and turn what you learn into a practical first build.</p></div>
          <div className="flex flex-wrap items-center gap-2"><Link href="/explore"><Button variant="secondary">Explore ideas</Button></Link><Link href="/channels" className="rounded-full px-3 py-2 text-sm text-vs-fg-muted hover:bg-white/50">Updates</Link><Link href="/billing" className="rounded-full px-3 py-2 text-sm text-vs-fg-muted hover:bg-white/50">Billing</Link><form action={signOut}><Button type="submit" variant="ghost">Sign out</Button></form></div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link href="/explore" className="block"><Card className="h-full border-vs-ink/10 bg-vs-orange transition-transform hover:-translate-y-1"><div className="flex items-start justify-between"><span className="text-2xl">⌕</span><span>↗</span></div><p className="mt-10 text-xs font-semibold uppercase tracking-[.14em]">Explore / Search</p><h2 className="mt-2 text-2xl font-medium tracking-tight text-vs-ink">Find what already exists</h2><p className="mt-3 max-w-lg text-sm leading-6 text-vs-fg-muted">Search real App Store listings, inspect competitors and bring a promising direction into a venture.</p></Card></Link>
        {compareStart ? <Link href={`/venture/${compareStart}/compare`} className="block"><Card className="h-full border-vs-ink/10 bg-vs-mint transition-transform hover:-translate-y-1"><div className="flex items-start justify-between"><span className="text-2xl">⇄</span><span>↗</span></div><p className="mt-10 text-xs font-semibold uppercase tracking-[.14em]">Compare ideas</p><h2 className="mt-2 text-2xl font-medium tracking-tight text-vs-ink">Put two ventures side by side</h2><p className="mt-3 max-w-lg text-sm leading-6 text-vs-fg-muted">Compare their latest evidence, market context, technology signals and simulation results.</p></Card></Link> : <Card className="h-full border-vs-ink/10 bg-vs-mint-soft"><div className="flex items-start justify-between"><span className="text-2xl">⇄</span><span className="text-vs-fg-muted">Locked</span></div><p className="mt-10 text-xs font-semibold uppercase tracking-[.14em] text-vs-fg-muted">Compare ideas</p><h2 className="mt-2 text-2xl font-medium tracking-tight text-vs-fg">Create a second venture to compare</h2><p className="mt-3 text-sm leading-6 text-vs-fg-muted">Comparison becomes available as soon as you have two real ideas in your workspace.</p></Card>}
      </div>

      {idea && <Card className="mt-6 border-vs-primary/30 bg-vs-primary/5"><div className="flex flex-col items-start gap-3 sm:flex-row"><Badge status="success">FROM EXPLORE</Badge><div className="min-w-0"><h2 className="font-semibold text-vs-fg">Continue with the idea you just researched</h2><p className="mt-1 text-sm text-vs-fg-muted">The form below is prefilled from your live Explore search. Adjust it before creating the venture if needed.</p></div></div></Card>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.4fr]">
        <Card className="border-vs-ink/10 bg-white/75"><p className="text-xs font-semibold uppercase tracking-[.14em] text-vs-fg-muted">New venture</p><h2 className="mt-2 text-2xl font-medium tracking-tight text-vs-fg">Start with your idea</h2><p className="mb-5 mt-2 text-sm text-vs-fg-muted">No business plan or technical knowledge needed. A rough idea is enough.</p><CreateVentureForm defaultName={name} defaultIdea={idea} /></Card>
        <div className="min-w-0 space-y-3">
          <div><h2 className="font-semibold text-vs-fg">Your ideas</h2><p className="mt-1 text-sm text-vs-fg-muted">Open one to continue from where you left off.</p></div>
          {ventures && ventures.length > 0 ? ventures.map((venture) => {
            const isDemo = venture.name.startsWith("[DEMO]");
            return <Link key={venture.id} href={`/venture/${venture.id}`} className="block"><Card className="border-vs-ink/10 bg-white/65 transition-all hover:-translate-y-0.5 hover:border-vs-ink/40"><div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="break-words text-lg font-semibold tracking-tight text-vs-fg">{venture.name}</p>{isDemo && <Badge status="warning">DEMO</Badge>}</div><p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-vs-fg-muted">{venture.raw_idea_text}</p></div><span className="self-start rounded-full border border-vs-border bg-vs-bg-subtle px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-vs-fg-muted">{venture.status.replaceAll("_", " ")}</span></div>{(venture.target_user || venture.geography) && <p className="mt-4 break-words border-t border-vs-border/60 pt-3 text-xs text-vs-fg-muted">{venture.target_user || "Who it is for: not decided"} · {venture.geography || "Market: not decided"}</p>}</Card></Link>;
          }) : <Card className="text-sm text-vs-fg-muted">You have not added an idea yet. Start with a rough idea on the left, or research the market first in Explore / Search.</Card>}
        </div>
      </div>
    </main>
  );
}
