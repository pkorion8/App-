"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createStripeClient, isStripeConfigured } from "@venture-sandbox/integrations/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getOrigin(): string {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host");
  return `${proto}://${host}`;
}

async function loadWorkspaceAndBilling() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!workspace) redirect("/billing?error=no_workspace");

  const { data: billing } = await supabase
    .from("billing_accounts")
    .select("id, plan, status, stripe_customer_id, stripe_subscription_id")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  return { supabase, user, workspace, billing };
}

export async function createCheckoutSession(): Promise<void> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const proPriceId = process.env.STRIPE_PRICE_ID_PRO;
  if (!isStripeConfigured({ secretKey, proPriceId })) {
    redirect("/billing?error=not_configured");
  }

  const { user, workspace, billing } = await loadWorkspaceAndBilling();
  const stripe = createStripeClient(secretKey as string);
  const origin = getOrigin();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: proPriceId as string, quantity: 1 }],
    customer: billing?.stripe_customer_id ?? undefined,
    customer_email: billing?.stripe_customer_id ? undefined : (user.email ?? undefined),
    client_reference_id: workspace.id,
    metadata: { workspace_id: workspace.id },
    subscription_data: { metadata: { workspace_id: workspace.id } },
    success_url: `${origin}/billing?checkout=success`,
    cancel_url: `${origin}/billing?checkout=cancel`,
  });

  if (session.url) {
    redirect(session.url);
  }
  redirect("/billing?error=checkout_failed");
}

export async function createPortalSession(): Promise<void> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    redirect("/billing?error=not_configured");
  }

  const { billing } = await loadWorkspaceAndBilling();
  if (!billing || !billing.stripe_customer_id) {
    redirect("/billing?error=no_customer");
  }

  const stripe = createStripeClient(secretKey as string);
  const origin = getOrigin();

  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripe_customer_id as string,
    return_url: `${origin}/billing`,
  });

  redirect(session.url);
}
