import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const configured = isSupabaseConfigured({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  if (!configured) return { title: "Venture" };
  const supabase = await createSupabaseServerClient();
  const { data: venture } = await supabase.from("ventures").select("name").eq("id", id).maybeSingle();
  return { title: venture?.name ?? "Venture" };
}

const actions = [
  ["Shape", "shape", "Define the user, market and business model."],
  ["Research", "research", "Collect evidence before making a build decision."],
  ["Simulate", "simulate", "Run the venture forward under pressure."],
  ["Build", "build", "Turn the strongest version into a build plan."],
  ["Compare", "compare", "Put this idea beside another venture."],
  ["Learn", "monitor", "Track what happens once the product is real."],
] as const;

export default async function VenturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const configured = isSupabaseConfigured({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  if (!configured) return <SupabaseSetupNotice />;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: venture } = await supabase.from("ventures").select("id, name, raw_idea_text, target_user, geography, status, created_at").eq("id", id).maybeSingle();
  if (!venture) notFound();

  const { data: shape } = await supabase.from("venture_shapes").select("problem_statement, value_proposition").eq("venture_id", venture.id).maybeSingle();
  const shaped = Boolean(venture.target_user && venture.geography);

  return (
    <main className="vs-shell py-7 sm:py-9">
      <section className="grid gap-4 lg:grid-cols-[1.22fr_.78fr]">
        <div className="rounded-[34px] bg-[#f4f4f1] p-8 sm:p-10 lg:min-h-[360px]">
          <p className="vs-kicker">Venture overview</p>
          <h1 className="vs-display mt-9 max-w-4xl text-[54px] font-semibold text-black sm:text-[72px]">{venture.name}</h1>
          <p className="mt-7 max-w-2xl whitespace-pre-wrap text-[15px] leading-7 text-vs-fg-muted">{venture.raw_idea_text}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[34px] bg-[#25d078] p-7 text-[#07150d]">
            <div className="flex h-full min-h-[160px] flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[.15em] opacity-60">Status</span>
              <div><p className="text-[34px] font-semibold leading-none tracking-[-.05em] capitalize">{venture.status.replaceAll("_", " ")}</p><p className="mt-2 text-sm opacity-70">Current venture state</p></div>
            </div>
          </div>
          <div className="rounded-[34px] bg-black p-7 text-white">
            <div className="flex h-full min-h-[160px] flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[.15em] text-white/45">Market frame</span>
              <div><p className="text-[22px] font-semibold leading-tight tracking-[-.03em]">{venture.target_user || "Audience not shaped"}</p><p className="mt-2 text-sm text-white/55">{venture.geography || "Market not chosen"}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-[34px] bg-[#f4f4f1] p-7 sm:p-8">
          <p className="vs-kicker">Definition</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.02] tracking-[-.045em] text-black">What this venture is becoming</h2>
          {shaped ? (
            <div className="mt-7 space-y-6">
              <div><p className="text-[11px] font-bold uppercase tracking-[.13em] text-vs-fg-muted">Target</p><p className="mt-2 text-lg font-semibold tracking-[-.02em] text-black">{venture.target_user} · {venture.geography}</p></div>
              {shape?.problem_statement && <div><p className="text-[11px] font-bold uppercase tracking-[.13em] text-vs-fg-muted">Problem</p><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{shape.problem_statement}</p></div>}
              {shape?.value_proposition && <div><p className="text-[11px] font-bold uppercase tracking-[.13em] text-vs-fg-muted">Value proposition</p><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{shape.value_proposition}</p></div>}
              <Link href={`/venture/${venture.id}/shape`} className="inline-flex rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white">Edit shape</Link>
            </div>
          ) : (
            <div className="mt-7 rounded-[24px] bg-white p-5">
              <p className="text-sm leading-6 text-vs-fg-muted">Shape the audience and geography before relying heavily on research or simulation.</p>
              <Link href={`/venture/${venture.id}/shape`} className="mt-4 inline-flex rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white">Shape this venture →</Link>
            </div>
          )}
        </div>

        <div className="rounded-[34px] bg-white p-2">
          <div className="px-4 pb-5 pt-4">
            <p className="vs-kicker">Journey</p>
            <h2 className="mt-3 text-[32px] font-semibold tracking-[-.045em] text-black">Choose the next move</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {actions.map(([label, route, description], index) => (
              <Link key={route} href={`/venture/${venture.id}/${route}`} className="group rounded-[28px] bg-[#f7f7f5] p-6 transition-transform hover:-translate-y-0.5">
                <div className="flex items-center justify-between"><span className="text-[11px] font-bold tracking-[.14em] text-vs-fg-muted">0{index + 1}</span><span className="text-xs font-semibold text-black">↗</span></div>
                <h3 className="mt-9 text-[24px] font-semibold tracking-[-.04em] text-black">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-vs-fg-muted">{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
