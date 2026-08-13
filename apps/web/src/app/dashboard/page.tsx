import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Button, Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { CreateVentureForm } from "./CreateVentureForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Venture Lab" };

export default async function DashboardPage() {
  const configured = isSupabaseConfigured({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  if (!configured) return <SupabaseSetupNotice />;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: ventures } = await supabase.from("ventures").select("id, name, raw_idea_text, status, created_at").order("created_at", { ascending: false });
  const activeCount = ventures?.filter((venture) => venture.status !== "completed").length ?? 0;

  return (
    <main className="vs-shell py-5 sm:py-8">
      <header className="vs-panel flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold tracking-tight text-vs-fg">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-vs-primary text-sm font-bold text-vs-primary-fg">V</span>
          Venture Lab
        </Link>
        <nav className="flex items-center gap-1 rounded-full bg-vs-bg-subtle p-1 text-sm">
          <span className="rounded-full bg-vs-fg px-4 py-2 font-medium text-white">Ventures</span>
          <Link href="/explore" className="rounded-full px-4 py-2 text-vs-fg-muted hover:text-vs-fg">Explore</Link>
          <Link href="/methodology" className="hidden rounded-full px-4 py-2 text-vs-fg-muted hover:text-vs-fg sm:block">Method</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/billing" className="text-sm text-vs-fg-muted hover:text-vs-fg">Plan</Link>
          <form action={signOut}><Button type="submit" variant="ghost">Sign out</Button></form>
        </div>
      </header>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.45fr_.55fr]">
        <div className="vs-brand-panel vs-dot-pattern relative min-h-[280px] overflow-hidden p-7 sm:p-9">
          <div className="relative z-10 max-w-xl">
            <p className="text-sm font-medium text-white/75">Test the idea before you build the product.</p>
            <h1 className="vs-display mt-4 text-5xl font-semibold sm:text-6xl">Turn an app idea into evidence.</h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/80">Shape the opportunity, research the market, simulate pressure and decide what deserves your time and money.</p>
          </div>
          <div className="absolute -bottom-16 -right-10 h-56 w-56 rounded-full border-[34px] border-white/15" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="flex min-h-[132px] flex-col justify-between">
            <span className="vs-kicker">Active ventures</span>
            <div><strong className="text-4xl font-medium tracking-[-.05em]">{activeCount}</strong><p className="mt-1 text-sm text-vs-fg-muted">Ideas currently moving through the lab</p></div>
          </Card>
          <Card className="flex min-h-[132px] flex-col justify-between bg-vs-fg text-white">
            <span className="text-[11px] font-bold uppercase tracking-[.16em] text-white/55">Your next move</span>
            <div><p className="text-lg font-medium">Start with the question, not the build.</p><p className="mt-1 text-sm text-white/60">Create a venture and pressure-test it.</p></div>
          </Card>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[.72fr_1.28fr]">
        <Card className="p-6 sm:p-7">
          <div className="mb-6"><p className="vs-kicker">New venture</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">What are you thinking about building?</h2></div>
          <CreateVentureForm />
        </Card>

        <Card className="p-6 sm:p-7">
          <div className="mb-5 flex items-end justify-between gap-4"><div><p className="vs-kicker">Workspace</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Your ventures</h2></div><span className="text-xs text-vs-fg-muted">{user.email}</span></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {ventures && ventures.length > 0 ? ventures.map((venture, index) => (
              <Link key={venture.id} href={`/venture/${venture.id}`} className={index === 0 ? "sm:col-span-2" : ""}>
                <div className="group h-full rounded-vs-md border border-vs-border/80 bg-vs-bg-subtle/45 p-5 transition hover:-translate-y-0.5 hover:border-vs-primary/45 hover:bg-white hover:shadow-sm">
                  <div className="flex items-start justify-between gap-4"><p className="text-lg font-semibold tracking-tight text-vs-fg">{venture.name}</p><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-vs-fg-muted">{venture.status.replaceAll("_", " ")}</span></div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-vs-fg-muted">{venture.raw_idea_text}</p>
                  <p className="mt-5 text-xs font-semibold text-vs-primary">Open venture →</p>
                </div>
              </Link>
            )) : <div className="sm:col-span-2 rounded-vs-md bg-vs-bg-subtle p-8 text-center text-sm text-vs-fg-muted">No ventures yet. Your first idea starts on the left.</div>}
          </div>
        </Card>
      </section>

      <div className="mt-4 flex justify-between px-2 text-xs text-vs-fg-muted"><Link href="/channels" className="hover:text-vs-fg">Monitored signals</Link><span>Understand → Shape → Simulate → Build → Learn</span></div>
    </main>
  );
}
