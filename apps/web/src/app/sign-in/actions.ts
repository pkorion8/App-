"use server";

import { headers } from "next/headers";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePublicOrigin } from "@/lib/public-origin";
import { safeInternalDestination } from "@/lib/safe-internal-destination";

export interface SignInState {
  status: "idle" | "sent" | "error";
  message?: string;
  retryAfterSeconds?: number;
}

export async function sendSignInLink(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const next = safeInternalDestination(String(formData.get("next") ?? ""));

  if (!email || !email.includes("@")) {
    return { status: "error", message: "Enter a valid email address." };
  }

  if (
    !isSupabaseConfigured({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    })
  ) {
    return {
      status: "error",
      message: "Supabase isn't connected yet. See .env.example.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const requestHeaders = await headers();
  const origin = resolvePublicOrigin({
    configuredSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    forwardedHost: requestHeaders.get("x-forwarded-host"),
    forwardedProto: requestHeaders.get("x-forwarded-proto"),
    requestOrigin: requestHeaders.get("origin"),
  });
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("redirect", next);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl.toString() },
  });

  if (error) {
    const cooldown = error.message.match(/after\s+(\d+)\s+seconds?/i);
    if (cooldown) {
      const retryAfterSeconds = Number(cooldown[1]);
      return {
        status: "error",
        retryAfterSeconds,
        message: "A sign-in email was requested recently. Please wait for the timer below, then try once more. The earlier email may already be in your inbox or spam folder.",
      };
    }
    return {
      status: "error",
      message: "We could not send the sign-in link right now. Please try again shortly.",
    };
  }

  return {
    status: "sent",
    message: `Sign-in link sent to ${email}. Check your inbox and spam folder.`,
  };
}
