import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createSupabaseServiceClient } from "@venture-sandbox/integrations";
import { createStripeClient } from "@venture-sandbox/integrations/stripe";
import { logEvent } from "@venture-sandbox/observability";

export const dynamic = "force-dynamic";

/**
 * Stripe -> billing_accounts sync. Runs unauthenticated (Stripe can't send
 * a Supabase session), so this is the one place outside the cron route
 * that uses the service-role client -- signature verification below is
 * what stands in for auth.
 */
export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = createStripeClient(secretKey);
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature verification failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServiceClient(supabaseUrl, serviceRoleKey);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspace_id ?? session.client_reference_id;
      if (workspaceId) {
        await supabase
          .from("billing_accounts")
          .update({
            plan: "pro",
            status: "active",
            stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
            stripe_subscription_id:
              typeof session.subscription === "string" ? session.subscription : null,
          })
          .eq("workspace_id", workspaceId);
        logEvent({
          event: "billing.upgraded_to_pro",
          actorId: null,
          workspaceId,
          entityType: "billing_account",
          entityId: workspaceId,
        });
      } else {
        // No workspace_id on the session means the update above never ran --
        // log loudly, since this would otherwise be a silent "customer paid,
        // nothing happened" failure with no trace anywhere.
        logEvent({
          event: "billing.checkout_completed_missing_workspace_id",
          actorId: null,
          workspaceId: null,
          metadata: { stripe_session_id: session.id },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const status: "active" | "past_due" | "canceled" =
        subscription.status === "active" || subscription.status === "trialing"
          ? "active"
          : subscription.status === "past_due" || subscription.status === "unpaid"
            ? "past_due"
            : "canceled";
      await supabase
        .from("billing_accounts")
        .update({
          status,
          plan: status === "canceled" ? "free" : "pro",
        })
        .eq("stripe_subscription_id", subscription.id);
      logEvent({
        event: "billing.subscription_updated",
        actorId: null,
        workspaceId: null,
        entityType: "stripe_subscription",
        entityId: subscription.id,
        metadata: { status },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("billing_accounts")
        .update({ plan: "free", status: "canceled" })
        .eq("stripe_subscription_id", subscription.id);
      logEvent({
        event: "billing.subscription_canceled",
        actorId: null,
        workspaceId: null,
        entityType: "stripe_subscription",
        entityId: subscription.id,
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
