"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createStripeClient, isStripeConfigured } from "@venture-sandbox/integrations/stripe";
import { resolvePublicOrigin } from "@/lib/public-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getOrigin(): Promise<string> {
  const requestHeaders = await headers();
  return resolvePublicOrigin({
    configuredSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    forwardedHost: requestHeaders.get("x-forwarded-host"),
    forwardedProto: requestHeaders.get("x-forwarded-proto"),
    requestOrigin: requestHeaders.get("origin"),
  });
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

function hasExistingPaidSubscription(
  billing: { plan?: string | null; status?: string | null; stripe_subscription_id?: string | null } | null,
): boolean {
  if (!billing) return false;
  if (billing.plan === "pro" && billing.status !== "canceled") return true;
  if (!billing.stripe_subscription_id) return false;
  return billing.status !== "canceled" && billing.status !== "incomplete_expired";
}

export async function createCheckoutSession(): Promise<void> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const proPriceId = process.env.STRIPE_PRICE_ID_PRO;
  if (!isStripeConfigured({ secretKey, proPriceId })) {
    redirect("/billing?error=not_configured");
  }

  const { user, workspace, billing } = await loadWorkspaceAndBilling();
  if (hasExistingPaidSubscription(billing)) {
    redirect("/billing?error=already_subscribed");
  }

  const stripe = createStripeClient(secretKey as string);
  const origin = await getOrigin();

  let sessionUrl: string | null = null;
  try {
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
    sessionUrl = session.url;
  } catch (error) {
    console.error("Failed to create Stripe Checkout session", error);
    redirect("/billing?error=checkout_failed");
  }

  if (sessionUrl) {
    redirect(sessionUrl);
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
  const origin = await getOrigin();

  let sessionUrl: string | null = null;
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id as string,
      return_url: `${origin}/billing`,
    });
    sessionUrl = session.url;
  } catch (error) {
    console.error("Failed to create Stripe Billing Portal session", error);
    redirect("/billing?error=portal_failed");
  }

  if (sessionUrl) {
    redirect(sessionUrl);
  }
  redirect("/billing?error=portal_failed");
}
