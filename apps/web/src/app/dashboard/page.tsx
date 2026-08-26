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

  const { data: ventures } = await supabase.from("ventures").select("id, name, raw_idea_text, status, created_at, target_user, geography").order("created_at", { ascending: false });
  const compareStart = ventures && ventures.length >= 2 ? ventures[0]?.id : null;

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">Sim Venture</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-vs-fg sm:text-3xl">Test your idea before you build it.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-vs-fg-muted">Describe an app or startup idea in normal words. We help you understand the problem, improve the idea, explore how it could make money, simulate difficult decisions, plan what to build, and compare the plan with real results later.</p></div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><Link href="/explore" className="text-sm font-medium text-vs-primary hover:underline">Explore / Search</Link><Link href="/channels" className="text-sm text-vs-fg-muted hover:underline">Updates</Link><Link href="/billing" className="text-sm text-vs-fg-muted hover:underline">Billing</Link><form action={signOut}><Button type="submit" variant="ghost">Sign out</Button></form></div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/explore" className="block"><Card className="h-full transition-colors hover:border-vs-primary"><p className="text-xs font-semibold uppercase tracking-wide text-vs-primary">Explore / Search</p><h2 className="mt-2 text-lg font-semibold text-vs-fg">Find what already exists</h2><p className="mt-2 text-sm leading-6 text-vs-fg-muted">Search real App Store listings, inspect competitors and bring a promising direction into a venture.</p></Card></Link>
        {compareStart ? <Link href={`/venture/${compareStart}/compare`} className="block"><Card className="h-full transition-colors hover:border-vs-primary"><p className="text-xs font-semibold uppercase tracking-wide text-vs-primary">Compare ideas</p><h2 className="mt-2 text-lg font-semibold text-vs-fg">Put two ventures side by side</h2><p className="mt-2 text-sm leading-6 text-vs-fg-muted">Compare their latest research, App Store rating-volume signals, market context, technology signals, simulation results and build-cost estimates.</p></Card></Link> : <Card className="h-full opacity-70"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Compare ideas</p><h2 className="mt-2 text-lg font-semibold text-vs-fg">Create a second venture to compare</h2><p className="mt-2 text-sm leading-6 text-vs-fg-muted">Comparison becomes available as soon as you have two real ideas in your workspace.</p></Card>}
      </div>

      {idea && <Card className="mt-6 border-vs-primary/30 bg-vs-primary/5"><div className="flex flex-col items-start gap-3 sm:flex-row"><Badge status="success">FROM EXPLORE</Badge><div className="min-w-0"><h2 className="font-semibold text-vs-fg">Continue with the idea you just researched</h2><p className="mt-1 text-sm text-vs-fg-muted">The form below is prefilled from your live Explore search. Adjust it before creating the venture if needed.</p></div></div></Card>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.4fr]">
        <Card><h2 className="text-lg font-semibold text-vs-fg">Start with your idea</h2><p className="mb-4 mt-1 text-sm text-vs-fg-muted">No business plan or technical knowledge needed. A rough idea is enough.</p><CreateVentureForm defaultName={name} defaultIdea={idea} /></Card>
        <div className="min-w-0 space-y-3">
          <div><h2 className="font-semibold text-vs-fg">Your ideas</h2><p className="mt-1 text-sm text-vs-fg-muted">Open one to continue from where you left off.</p></div>
          {ventures && ventures.length > 0 ? ventures.map((venture) => {
            const isDemo = venture.name.startsWith("[DEMO]");
            return <Link key={venture.id} href={`/venture/${venture.id}`} className="block"><Card className="transition-colors hover:border-vs-primary"><div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="break-words font-medium text-vs-fg">{venture.name}</p>{isDemo && <Badge status="warning">DEMO</Badge>}</div><p className="mt-1 line-clamp-2 break-words text-sm text-vs-fg-muted">{venture.raw_idea_text}</p></div><span className="self-start rounded-full border border-vs-border px-2 py-1 text-[10px] font-semibold uppercase text-vs-fg-muted">{venture.status.replaceAll("_", " ")}</span></div>{(venture.target_user || venture.geography) && <p className="mt-3 break-words text-xs text-vs-fg-muted">{venture.target_user || "Who it is for: not decided"} · {venture.geography || "Market: not decided"}</p>}</Card></Link>;
          }) : <Card className="text-sm text-vs-fg-muted">You have not added an idea yet. Start with a rough idea on the left, or research the market first in Explore / Search.</Card>}
        </div>
      </div>
    </main>
  );
}
