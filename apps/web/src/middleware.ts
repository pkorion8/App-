import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isSupabaseConfigured,
  resolveSupabaseEnv,
  type Database,
} from "@venture-sandbox/integrations";
import { safeInternalDestination } from "@/lib/safe-internal-destination";

const PROTECTED_PREFIXES = ["/dashboard", "/venture", "/billing", "/channels"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const envInput = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };

  // No Supabase project connected yet: let requests through unauthenticated
  // rather than hard-failing every route. Pages that need a session render
  // their own "connect Supabase" state (see lib/supabase/server.ts callers).
  if (!isSupabaseConfigured(envInput)) {
    return response;
  }

  const env = resolveSupabaseEnv(envInput);

  const supabase = createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const redirectUrl = new URL("/sign-in", request.url);
    // Preserve the exact internal destination, including query state such as
    // ?run=... or ?session=..., and use the same `next` parameter consumed
    // by the sign-in page. Previously middleware sent `redirect`, so users
    // were silently dropped on /dashboard after authenticating.
    const destination = `${pathname}${request.nextUrl.search}`;
    redirectUrl.searchParams.set("next", destination);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname === "/sign-in" && user) {
    const destination = safeInternalDestination(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
