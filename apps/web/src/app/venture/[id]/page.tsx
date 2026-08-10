import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FUTURE_TABS = ["Research", "Simulate", "Build"] as const;

export default async function VenturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const configured = isSupabaseConfigured({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!configured) {
    return <SupabaseSetupNotice />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: venture } = await supabase
    .from("ventures")
    .select("id, name, raw_idea_text, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!venture) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/dashboard" className="text-sm text-vs-fg-muted hover:underline">
        ← Your ventures
      </Link>

      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-vs-fg">{venture.name}</h1>
          <span className="rounded-vs-sm bg-vs-bg-subtle px-2 py-1 text-xs uppercase tracking-wide text-vs-fg-muted">
            {venture.status}
          </span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm text-vs-fg-muted">
          {venture.raw_idea_text}
        </p>
      </Card>

      <div className="mt-6 flex gap-2">
        {FUTURE_TABS.map((tab) => (
          <span
            key={tab}
            className="cursor-not-allowed rounded-vs-sm border border-vs-border px-3 py-1.5 text-sm text-vs-fg-muted"
            title="Lands in a later vertical slice — see spec §21.2"
          >
            {tab}
          </span>
        ))}
      </div>
    </main>
  );
}
