import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Badge, Button, Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { CreateVentureForm } from "./CreateVentureForm";
import { seedDemoVentures } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your ventures" };

export default async function DashboardPage() {
  const configured = isSupabaseConfigured({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  if (!configured) return <SupabaseSetupNotice />;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: ventures } = await supabase.from("ventures").select("id, name, raw_idea_text, status, created_at, target_user, geography").order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">Sim Venture</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-vs-fg">Test your idea before you build it.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-vs-fg-muted">Describe an app or startup idea in normal words. We help you understand the problem, improve the idea, explore how it could make money, simulate difficult decisions, plan what to build, and compare the plan with real results later.</p></div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><Link href="/channels" className="text-sm text-vs-fg-muted hover:underline">Updates</Link><Link href="/billing" className="text-sm text-vs-fg-muted hover:underline">Billing</Link><form action={signOut}><Button type="submit" variant="ghost">Sign out</Button></form></div>
      </div>

      <Card className="mt-6 border-vs-primary/20 bg-vs-primary/5">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2"><Badge status="warning">DEMO</Badge><h2 className="font-semibold text-vs-fg">Want to see how it works first?</h2></div><p className="mt-2 max-w-2xl text-sm leading-6 text-vs-fg-muted">Load two sample ideas that already contain research, a simulated journey and an investor-practice example. Everything in these examples is clearly marked as demo or simulated.</p></div><form action={seedDemoVentures}><Button type="submit">Try the 2 sample ventures</Button></form></div>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.4fr]">
        <Card><h2 className="text-lg font-semibold text-vs-fg">Start with your idea</h2><p className="mb-4 mt-1 text-sm text-vs-fg-muted">No business plan or technical knowledge needed. A rough idea is enough.</p><CreateVentureForm /></Card>
        <div className="space-y-3">
          <div><h2 className="font-semibold text-vs-fg">Your ideas</h2><p className="mt-1 text-sm text-vs-fg-muted">Open one to continue from where you left off.</p></div>
          {ventures && ventures.length > 0 ? ventures.map((venture) => {
            const isDemo = venture.name.startsWith("[DEMO]");
            return <Link key={venture.id} href={`/venture/${venture.id}`}><Card className="transition-colors hover:border-vs-primary"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="flex items-center gap-2"><p className="font-medium text-vs-fg">{venture.name}</p>{isDemo && <Badge status="warning">DEMO</Badge>}</div><p className="mt-1 line-clamp-2 text-sm text-vs-fg-muted">{venture.raw_idea_text}</p></div><span className="rounded-full border border-vs-border px-2 py-1 text-[10px] font-semibold uppercase text-vs-fg-muted">{venture.status.replaceAll("_", " ")}</span></div>{(venture.target_user || venture.geography) && <p className="mt-3 text-xs text-vs-fg-muted">{venture.target_user || "Who it is for: not decided"} · {venture.geography || "Market: not decided"}</p>}</Card></Link>;
          }) : <Card className="text-sm text-vs-fg-muted">You have not added an idea yet. Start with a rough idea on the left, or try the sample ventures above.</Card>}
        </div>
      </div>
    </main>
  );
}
