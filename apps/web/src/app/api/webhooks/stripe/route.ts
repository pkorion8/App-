import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createSupabaseServiceClient } from "@venture-sandbox/integrations";
import { createStripeClient } from "@venture-sandbox/integrations/stripe";
import { logEvent } from "@venture-sandbox/observability";

export const dynamic = "force-dynamic";

function billingSyncFailure({
  eventName,
  entityId,
  workspaceId = null,
  reason,
}: {
  eventName: string;
  entityId: string;
  workspaceId?: string | null;
  reason: string;
}) {
  logEvent({
    event: "billing.webhook_sync_failed",
    actorId: null,
    workspaceId,
    entityType: "stripe_event",
    entityId,
    metadata: { stripe_event_type: eventName, reason },
  });

  // Stripe retries non-2xx webhook deliveries. Never acknowledge an event when
  // the verified payload could not be persisted, otherwise paid access can
  // silently drift from Stripe's source of truth.
  return NextResponse.json({ error: "Billing sync failed; retry required" }, { status: 500 });
}

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
        const { data, error } = await supabase
          .from("billing_accounts")
          .update({
            plan: "pro",
            status: "active",
            stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
            stripe_subscription_id:
              typeof session.subscription === "string" ? session.subscription : null,
          })
          .eq("workspace_id", workspaceId)
          .select("workspace_id");

        if (error || !data?.length) {
          return billingSyncFailure({
            eventName: event.type,
            entityId: event.id,
            workspaceId,
            reason: error?.message ?? "No billing account matched the checkout workspace",
          });
        }

        logEvent({
          event: "billing.upgraded_to_pro",
          actorId: null,
          workspaceId,
          entityType: "billing_account",
          entityId: workspaceId,
        });
      } else {
        // A retry cannot repair missing checkout metadata, so record this as a
        // configuration/data-contract error rather than creating an endless
        // webhook retry loop.
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
      const { data, error } = await supabase
        .from("billing_accounts")
        .update({
          status,
          plan: status === "canceled" ? "free" : "pro",
        })
        .eq("stripe_subscription_id", subscription.id)
        .select("workspace_id");

      if (error || !data?.length) {
        return billingSyncFailure({
          eventName: event.type,
          entityId: event.id,
          reason: error?.message ?? "No billing account matched the Stripe subscription",
        });
      }

      logEvent({
        event: "billing.subscription_updated",
        actorId: null,
        workspaceId: data[0]?.workspace_id ?? null,
        entityType: "stripe_subscription",
        entityId: subscription.id,
        metadata: { status },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const { data, error } = await supabase
        .from("billing_accounts")
        .update({ plan: "free", status: "canceled" })
        .eq("stripe_subscription_id", subscription.id)
        .select("workspace_id");

      if (error || !data?.length) {
        return billingSyncFailure({
          eventName: event.type,
          entityId: event.id,
          reason: error?.message ?? "No billing account matched the canceled Stripe subscription",
        });
      }

      logEvent({
        event: "billing.subscription_canceled",
        actorId: null,
        workspaceId: data[0]?.workspace_id ?? null,
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
