import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ShapeForm } from "./ShapeForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shape" };

export default async function ShapePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const configured = isSupabaseConfigured({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!configured) return <SupabaseSetupNotice />;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: venture } = await supabase
    .from("ventures")
    .select("id, name, target_user, geography")
    .eq("id", id)
    .maybeSingle();
  if (!venture) notFound();

  const { data: shape } = await supabase
    .from("venture_shapes")
    .select("problem_statement, value_proposition, mvp_scope, differentiation, pricing_model")
    .eq("venture_id", venture.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href={`/venture/${venture.id}`} className="text-sm text-vs-fg-muted hover:underline">
        ← {venture.name}
      </Link>
      <h1 className="mt-4 text-xl font-semibold text-vs-fg">Shape</h1>
      <p className="mt-1 text-sm text-vs-fg-muted">
        Turn the raw idea into a structured brief before researching or simulating it — who
        it&apos;s for, what problem it solves, and what actually belongs in a first version.
      </p>

      <Card className="mt-4">
        <ShapeForm
          ventureId={venture.id}
          defaults={{
            targetUser: venture.target_user ?? "",
            geography: venture.geography ?? "",
            problemStatement: shape?.problem_statement ?? "",
            valueProposition: shape?.value_proposition ?? "",
            mvpScope: shape?.mvp_scope ?? "",
            differentiation: shape?.differentiation ?? "",
            pricingModel: shape?.pricing_model ?? "",
          }}
        />
      </Card>
    </main>
  );
}
