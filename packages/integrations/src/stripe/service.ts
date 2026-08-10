import Stripe from "stripe";

export interface StripeEnvInput {
  secretKey: string | undefined;
  webhookSecret: string | undefined;
  proPriceId: string | undefined;
}

/** Checkout-session creation only needs the secret key + price id; the webhook secret is checked separately at the webhook route. */
export function isStripeConfigured(env: Pick<StripeEnvInput, "secretKey" | "proPriceId">): boolean {
  return Boolean(env.secretKey && env.proPriceId);
}

/** Server-only. Never import this from a client component. */
export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
}
