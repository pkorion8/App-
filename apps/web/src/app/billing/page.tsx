import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { isStripeConfigured } from "@venture-sandbox/integrations/stripe";
import { Button, Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCheckoutSession, createPortalSession } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Billing" };

const ERROR_MESSAGE: Record<string, string> = {
  not_configured: "Billing isn't configured yet — Pro checkout isn't live.",
  no_workspace: "Couldn't find a workspace for your account.",
  no_customer: "No billing history on this account yet.",
  checkout_failed: "Couldn't start checkout — try again in a moment.",
  portal_failed: "Couldn't open the billing portal — try again in a moment.",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; error?: string }>;
}) {
  const { checkout, error } = await searchParams;

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

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const billing = workspace
    ? (
        await supabase
          .from("billing_accounts")
          .select("plan, status, stripe_customer_id")
          .eq("workspace_id", workspace.id)
          .maybeSingle()
      ).data
    : null;

  const stripeConfigured = isStripeConfigured({
    secretKey: process.env.STRIPE_SECRET_KEY,
    proPriceId: process.env.STRIPE_PRICE_ID_PRO,
  });

  const plan = billing?.plan ?? "free";
  const status = billing?.status ?? "active";

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/dashboard" className="text-sm text-vs-fg-muted hover:underline">
        ← Your ventures
      </Link>
      <h1 className="mt-4 text-xl font-semibold text-vs-fg">Billing</h1>

      {checkout === "success" && (
        <Card className="mt-4 border-vs-success/40 bg-vs-success/10">
          <p className="text-sm text-vs-fg">
            Checkout complete — Stripe will confirm the subscription shortly and your plan will
            update here automatically.
          </p>
        </Card>
      )}
      {error && (
        <Card className="mt-4 border-vs-danger/40 bg-vs-danger/10">
          <p className="text-sm text-vs-fg">{ERROR_MESSAGE[error] ?? "Something went wrong."}</p>
        </Card>
      )}

      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">
              Current plan
            </p>
            <p className="mt-1 text-lg font-semibold text-vs-fg">
              {plan === "pro" ? "Pro" : "Free"}
            </p>
          </div>
          <span className="rounded-vs-sm bg-vs-bg-subtle px-2 py-1 text-xs uppercase tracking-wide text-vs-fg-muted">
            {status}
          </span>
        </div>

        <div className="mt-4">
          {plan === "pro" ? (
            <form action={createPortalSession}>
              <Button type="submit" variant="secondary">
                Manage billing
              </Button>
            </form>
          ) : stripeConfigured ? (
            <form action={createCheckoutSession}>
              <Button type="submit">Upgrade to Pro</Button>
            </form>
          ) : (
            <p className="text-sm text-vs-fg-muted">
              Pro checkout isn&apos;t live yet — every account stays on Free until it is. See{" "}
              <Link href="/pricing" className="text-vs-primary hover:underline">
                pricing
              </Link>{" "}
              for what Pro will include.
            </p>
          )}
        </div>
      </Card>
    </main>
  );
}
