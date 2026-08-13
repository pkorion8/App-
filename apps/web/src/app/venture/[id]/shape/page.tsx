import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VentureModeSection } from "../VentureModeSection";
import { ShapeForm } from "./ShapeForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shape" };

export default async function ShapePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const configured = isSupabaseConfigured({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  if (!configured) return <SupabaseSetupNotice />;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: venture } = await supabase.from("ventures").select("id, name, target_user, geography").eq("id", id).maybeSingle();
  if (!venture) notFound();
  const { data: shape } = await supabase.from("venture_shapes").select("problem_statement, value_proposition, mvp_scope, differentiation, pricing_model").eq("venture_id", venture.id).maybeSingle();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href={`/venture/${venture.id}`} className="text-sm text-vs-fg-muted hover:underline">← {venture.name}</Link>
      <VentureModeSection mode="simple" className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">Step 2</p>
        <h1 className="mt-2 text-3xl font-semibold text-vs-fg">Make the idea better</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-vs-fg-muted">You do not need a business plan. Just answer these in normal words: who needs this, what problem should version 1 solve, and what is the smallest useful first version?</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3"><Tip title="Keep it specific" text="A smaller clear problem is easier to test."/><Tip title="Keep version 1 small" text="Leave nice-to-have features for later."/><Tip title="It is okay not to know" text="You can write that something is still unclear."/></div>
      </VentureModeSection>
      <VentureModeSection mode="pro" className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">Shape</p>
        <h1 className="mt-2 text-3xl font-semibold text-vs-fg">Structure the venture brief</h1>
        <p className="mt-2 text-sm leading-6 text-vs-fg-muted">Define audience, problem, value proposition, MVP boundary, differentiation and the current monetization assumption before downstream research and simulation.</p>
      </VentureModeSection>

      <Card className="mt-6"><ShapeForm ventureId={venture.id} defaults={{ targetUser: venture.target_user ?? "", geography: venture.geography ?? "", problemStatement: shape?.problem_statement ?? "", valueProposition: shape?.value_proposition ?? "", mvpScope: shape?.mvp_scope ?? "", differentiation: shape?.differentiation ?? "", pricingModel: shape?.pricing_model ?? "" }} /></Card>

      <VentureModeSection mode="simple" className="mt-4">
        <Card className="border-vs-primary/30"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Next</p><p className="mt-2 text-lg font-semibold text-vs-fg">Test the idea in the simulator.</p><p className="mt-1 text-sm text-vs-fg-muted">Once the shape feels reasonable, run it through time, choices and consequences.</p><Link href={`/venture/${venture.id}/simulate`} className="mt-4 inline-flex rounded-vs-sm bg-vs-primary px-4 py-2 text-sm font-semibold text-vs-primary-fg">Test my idea →</Link></Card>
      </VentureModeSection>
    </main>
  );
}

function Tip({ title, text }: { title: string; text: string }) { return <div className="rounded-vs-md border border-vs-border bg-vs-bg-subtle p-3"><p className="text-sm font-semibold text-vs-fg">{title}</p><p className="mt-1 text-xs leading-5 text-vs-fg-muted">{text}</p></div>; }
