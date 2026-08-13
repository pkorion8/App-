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
    <main className="vs-shell py-6 sm:py-8">
      <section className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
        <div className="vs-brand-panel vs-dot-pattern relative min-h-[300px] overflow-hidden p-7 sm:p-9">
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-white/65">Venture overview</p>
            <h1 className="vs-display mt-4 text-5xl font-semibold sm:text-6xl">{venture.name}</h1>
            <p className="mt-5 max-w-xl whitespace-pre-wrap text-sm leading-6 text-white/80">{venture.raw_idea_text}</p>
          </div>
          <div className="absolute -bottom-20 -right-12 h-64 w-64 rounded-full border-[38px] border-white/14" />
        </div>

        <div className="grid gap-4">
          <Card className="flex min-h-[142px] flex-col justify-between">
            <span className="vs-kicker">Status</span>
            <div><p className="text-3xl font-semibold tracking-[-.04em] capitalize">{venture.status.replaceAll("_", " ")}</p><p className="mt-1 text-sm text-vs-fg-muted">Current venture state</p></div>
          </Card>
          <Card className="flex min-h-[142px] flex-col justify-between bg-vs-fg text-white">
            <span className="text-[11px] font-bold uppercase tracking-[.16em] text-white/55">Market frame</span>
            <div><p className="text-lg font-semibold">{venture.target_user || "Audience not shaped"}</p><p className="mt-1 text-sm text-white/60">{venture.geography || "Market not chosen"}</p></div>
          </Card>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <Card className="p-6 sm:p-7">
          <p className="vs-kicker">Definition</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">What this venture is becoming</h2>
          {shaped ? (
            <div className="mt-6 space-y-5">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Target</p><p className="mt-1 text-base font-medium">{venture.target_user} · {venture.geography}</p></div>
              {shape?.problem_statement && <div><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Problem</p><p className="mt-1 text-sm leading-6 text-vs-fg-muted">{shape.problem_statement}</p></div>}
              {shape?.value_proposition && <div><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Value proposition</p><p className="mt-1 text-sm leading-6 text-vs-fg-muted">{shape.value_proposition}</p></div>}
              <Link href={`/venture/${venture.id}/shape`} className="inline-flex rounded-full bg-vs-bg-subtle px-4 py-2 text-sm font-semibold text-vs-fg">Edit shape</Link>
            </div>
          ) : (
            <div className="mt-6 rounded-vs-md bg-vs-primary/8 p-5">
              <p className="text-sm leading-6 text-vs-fg-muted">Shape the audience and geography before relying heavily on research or simulation. Those stages become more useful when they are working from a specific market.</p>
              <Link href={`/venture/${venture.id}/shape`} className="mt-4 inline-flex rounded-full bg-vs-primary px-4 py-2 text-sm font-semibold text-white">Shape this venture →</Link>
            </div>
          )}
        </Card>

        <Card className="p-6 sm:p-7">
          <p className="vs-kicker">Journey</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Choose the next move</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {actions.map(([label, route, description], index) => (
              <Link key={route} href={`/venture/${venture.id}/${route}`} className="group rounded-vs-md border border-vs-border/75 bg-vs-bg-subtle/45 p-5 transition hover:-translate-y-0.5 hover:border-vs-primary/40 hover:bg-white hover:shadow-sm">
                <div className="flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-bold text-vs-fg">0{index + 1}</span><span className="text-xs font-semibold text-vs-primary">Open →</span></div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{label}</h3>
                <p className="mt-1 text-sm leading-6 text-vs-fg-muted">{description}</p>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
