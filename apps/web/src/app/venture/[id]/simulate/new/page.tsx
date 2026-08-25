import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StartSimulationForm } from "../StartSimulationForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New simulation" };

export default async function NewSimulationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const configured = isSupabaseConfigured({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!configured) return <SupabaseSetupNotice />;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/venture/${id}/simulate/new`)}`);

  const { data: venture } = await supabase
    .from("ventures")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!venture) notFound();

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <Link href={`/venture/${venture.id}/simulate`} className="text-sm font-medium text-vs-primary">
        ← Back to simulator
      </Link>
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">Fresh timeline</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-vs-fg">Start another simulation</h1>
        <p className="mt-2 text-sm leading-6 text-vs-fg-muted">
          Create an independent run for {venture.name}. Choose a new starting budget and Standard or Reality Mode. Existing timelines remain unchanged.
        </p>
      </div>

      <Card className="mt-6 border-vs-primary/20">
        <StartSimulationForm ventureId={venture.id} />
      </Card>

      <p className="mt-4 text-xs leading-5 text-vs-fg-muted">
        Simulation outputs are scenario results, not forecasts, traction claims, success probabilities, or investor signals.
      </p>
    </main>
  );
}
