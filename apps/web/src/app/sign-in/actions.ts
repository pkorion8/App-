"use server";

import { headers } from "next/headers";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SignInState {
  status: "idle" | "sent" | "error";
  message?: string;
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
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })
  ) {
    return {
      status: "error",
      message: "Supabase isn't connected yet. See .env.example.",
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
    return { status: "error", message: error.message };
  }

  return { status: "sent", message: `Check ${email} for a sign-in link.` };
}
