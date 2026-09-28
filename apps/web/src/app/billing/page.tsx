import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { isStripeConfigured } from "@venture-sandbox/integrations/stripe";
import { Badge, Button, Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCheckoutSession, createPortalSession } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Billing" };

const ERROR_MESSAGE: Record<string, string> = {
  not_configured: "Paid checkout has not been connected to this deployment.",
  no_workspace: "We couldn't find a workspace for your account.",
  no_customer: "There is no billing history on this account yet.",
  checkout_failed: "We couldn't start checkout. Please try again in a moment.",
  portal_failed: "We couldn't open the billing portal. Please try again in a moment.",
  already_subscribed: "This workspace already has a subscription. Use Manage billing instead.",
};

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string; error?: string }> }) {
  const { checkout, error } = await searchParams;
  const configured = isSupabaseConfigured({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  if (!configured) return <SupabaseSetupNotice />;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: workspace } = await supabase.from("workspaces").select("id, name").eq("owner_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  const billing = workspace ? (await supabase.from("billing_accounts").select("plan, status, stripe_customer_id").eq("workspace_id", workspace.id).maybeSingle()).data : null;
  const stripeConfigured = isStripeConfigured({ secretKey: process.env.STRIPE_SECRET_KEY, proPriceId: process.env.STRIPE_PRICE_ID_PRO });
  const plan = billing?.plan ?? "free";
  const status = billing?.status ?? "active";
  const isPro = plan === "pro";

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <Link href="/dashboard" className="text-sm font-medium text-vs-fg-muted hover:text-vs-fg">← Your ventures</Link>

      <section className="grid-paper mt-5 rounded-[32px] border border-vs-border bg-vs-lavender-soft p-6 shadow-panel sm:p-9">
        <Badge status={isPro ? "success" : "primary"}>{isPro ? "PRO WORKSPACE" : "LAUNCH ACCESS"}</Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-vs-fg">Plan and billing</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-vs-fg-muted">Review the plan attached to {workspace?.name || "your workspace"}, upgrade securely or manage an existing subscription.</p>
      </section>

      {checkout === "success" ? <Card className="mt-5 bg-vs-mint-soft"><p className="font-semibold text-vs-fg">Checkout completed</p><p className="mt-1 text-sm text-vs-fg-muted">Stripe is confirming the subscription. This page will reflect the Pro plan after the webhook is processed.</p></Card> : null}
      {error ? <Card className="mt-5 bg-vs-orange-soft" role="alert"><p className="font-semibold text-vs-fg">Billing action needs attention</p><p className="mt-1 text-sm text-vs-fg-muted">{ERROR_MESSAGE[error] ?? "Something went wrong. Please try again."}</p></Card> : null}

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <Card className={isPro ? "bg-vs-mint-soft" : "bg-vs-orange-soft"}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-vs-fg-muted">Current plan</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-vs-fg">{isPro ? "Pro" : "Launch access"}</h2></div>
            <Badge status={status === "active" ? "success" : "warning"}>{status.toUpperCase()}</Badge>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-6 text-vs-fg-muted">{isPro ? "Your workspace has an active commercial subscription and access to the complete venture toolset." : "Your workspace can use the complete launch product without entering payment details."}</p>
          <div className="mt-6">
            {isPro ? <form action={createPortalSession}><Button type="submit" variant="secondary">Manage billing</Button></form> : stripeConfigured ? <form action={createCheckoutSession}><Button type="submit">Upgrade to Pro</Button></form> : <p className="rounded-2xl border border-vs-border bg-white/60 p-4 text-sm leading-6 text-vs-fg-muted">Paid checkout is not connected on this deployment. Your current product access remains active.</p>}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-vs-fg-muted">Billing principles</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-vs-fg">
            <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-vs-lime text-xs font-bold">✓</span>Secure checkout and subscription management through Stripe.</li>
            <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-vs-lime text-xs font-bold">✓</span>No duplicate subscription when a workspace is already subscribed.</li>
            <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-vs-lime text-xs font-bold">✓</span>Your venture data remains attached to the workspace.</li>
          </ul>
          <Link href="/pricing" className="mt-6 inline-block text-sm font-semibold text-vs-fg underline decoration-vs-primary decoration-2 underline-offset-4">View access details →</Link>
        </Card>
      </section>
    </main>
  );
}
