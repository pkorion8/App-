"use server";

import { headers } from "next/headers";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SignInState {
  status: "idle" | "sent" | "error";
  message?: string;
  retryAfterSeconds?: number;
  rateLimited?: boolean;
}

export async function sendSignInLink(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();

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
      message: "Sign-in is temporarily unavailable because the authentication service is not configured.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    const cooldown = error.message.match(/after\s+(\d+)\s+seconds?/i);
    if (cooldown) {
      const retryAfterSeconds = Number(cooldown[1]);
      return {
        status: "error",
        retryAfterSeconds,
        rateLimited: true,
        message: "A sign-in email was requested recently. Please wait for the timer below, then try once more. The earlier email may already be in your inbox or spam folder.",
      };
    }
    if (/rate limit|too many requests|email.*limit/i.test(error.message)) {
      return {
        status: "error",
        rateLimited: true,
        message: "The temporary email service has reached its sending limit. You can still review the complete product without signing in.",
      };
    }
    return { status: "error", message: "We could not send the sign-in email right now. Please try again later." };
  }

  return {
    status: "sent",
    message: `Sign-in link sent to ${email}. Check your inbox and spam folder.`,
  };
}
