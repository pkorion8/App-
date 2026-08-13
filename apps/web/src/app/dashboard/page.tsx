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
    <main className="vs-shell pb-12 pt-5 sm:pt-7">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 pb-5">
        <Link href="/dashboard" className="flex items-center gap-2.5 text-[15px] font-semibold text-black">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-black text-xs font-bold text-white">VL</span>
          Venture Lab
        </Link>
        <nav className="flex items-center gap-6 text-sm text-vs-fg-muted">
          <span className="font-semibold text-black">Ventures</span>
          <Link href="/explore" className="hover:text-black">Explore</Link>
          <Link href="/methodology" className="hidden hover:text-black sm:inline">Method</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/billing" className="text-sm text-vs-fg-muted hover:text-black">Plan</Link>
          <form action={signOut}><Button type="submit" variant="ghost">Sign out</Button></form>
        </div>
      </header>

      <section className="grid gap-4 pt-6 lg:grid-cols-[1.18fr_.82fr]">
        <div className="rounded-[34px] bg-[#f4f4f1] p-8 sm:p-10 lg:min-h-[390px]">
          <p className="vs-kicker">Venture workspace</p>
          <h1 className="vs-display mt-8 max-w-3xl text-[52px] font-semibold text-black sm:text-[72px] lg:text-[82px]">
            Test the idea before you build it.
          </h1>
          <p className="mt-7 max-w-xl text-[15px] leading-7 text-vs-fg-muted">
            Shape the opportunity, research the market, simulate pressure and decide what deserves your time and money.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[34px] bg-[#25d078] p-7 text-[#07150d] sm:p-8">
            <div className="flex h-full min-h-[180px] flex-col justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[.15em] opacity-65">Active ventures</p>
              <div>
                <strong className="text-7xl font-semibold tracking-[-.07em]">{activeCount}</strong>
                <p className="mt-2 max-w-[220px] text-sm leading-6 opacity-75">Ideas currently moving through the lab.</p>
              </div>
            </div>
          </div>
          <div className="rounded-[34px] bg-black p-7 text-white sm:p-8">
            <div className="flex h-full min-h-[180px] flex-col justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[.15em] text-white/45">Current principle</p>
              <div>
                <p className="max-w-[270px] text-[28px] font-medium leading-[1.05] tracking-[-.04em]">Evidence before effort.</p>
                <p className="mt-3 text-sm leading-6 text-white/55">Start with the question, not the build.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[.72fr_1.28fr]">
        <div className="rounded-[34px] bg-[#f4f4f1] p-7 sm:p-8">
          <div className="mb-7">
            <p className="vs-kicker">New venture</p>
            <h2 className="mt-3 max-w-md text-[32px] font-semibold leading-[1.02] tracking-[-.045em] text-black">What are you thinking about building?</h2>
          </div>
          <CreateVentureForm />
        </div>

        <div className="rounded-[34px] bg-white p-1 sm:p-2">
          <div className="mb-5 flex items-end justify-between gap-4 px-3 pt-3 sm:px-4">
            <div>
              <p className="vs-kicker">Workspace</p>
              <h2 className="mt-3 text-[32px] font-semibold tracking-[-.045em] text-black">Your ventures</h2>
            </div>
            <span className="hidden text-xs text-vs-fg-muted sm:block">{user.email}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {ventures && ventures.length > 0 ? ventures.map((venture, index) => (
              <Link key={venture.id} href={`/venture/${venture.id}`} className={index === 0 ? "sm:col-span-2" : ""}>
                <article className={`group h-full rounded-[28px] p-6 transition-transform hover:-translate-y-0.5 ${index === 0 ? "bg-[#f4f4f1]" : "bg-[#f7f7f5]"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[22px] font-semibold leading-tight tracking-[-.035em] text-black">{venture.name}</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em] text-vs-fg-muted">{venture.status.replaceAll("_", " ")}</span>
                  </div>
                  <p className="mt-5 line-clamp-2 max-w-2xl text-sm leading-6 text-vs-fg-muted">{venture.raw_idea_text}</p>
                  <p className="mt-8 text-xs font-semibold text-black">Open venture ↗</p>
                </article>
              </Link>
            )) : (
              <div className="sm:col-span-2 rounded-[28px] bg-[#f4f4f1] p-10 text-center text-sm text-vs-fg-muted">No ventures yet. Start your first idea on the left.</div>
            )}
          </div>
        </div>
      </section>

      <footer className="mt-8 flex flex-wrap justify-between gap-3 border-t border-black/5 pt-5 text-xs text-vs-fg-muted">
        <Link href="/channels" className="hover:text-black">Monitored signals</Link>
        <span>Understand → Shape → Simulate → Build → Learn</span>
      </footer>
    </main>
  );
}
