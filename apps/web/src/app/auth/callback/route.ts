import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePublicOrigin } from "@/lib/public-origin";
import { safeInternalDestination } from "@/lib/safe-internal-destination";

export async function GET(request: NextRequest) {
  const { searchParams, origin: requestOrigin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = safeInternalDestination(searchParams.get("redirect"));
  const origin = resolvePublicOrigin({
    configuredSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
    requestOrigin,
  });

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(redirectTo, origin));
    }
  }

  const failed = new URL("/sign-in", origin);
  failed.searchParams.set("error", "auth_callback_failed");
  failed.searchParams.set("next", redirectTo);
  return NextResponse.redirect(failed);
}
