import type { Metadata } from "next";
import { Card } from "@venture-sandbox/ui";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in" };

// Without this, Next prerenders this page once at build time and bakes in
// whatever NEXT_PUBLIC_SUPABASE_* values (or lack of them) were present
// during that build — so adding real env vars in Vercel and redeploying
// doesn't change what's served until a fresh, non-cached render happens.
export const dynamic = "force-dynamic";

export default function SignInPage() {
  const configured = isSupabaseConfigured({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!configured) {
    return <SupabaseSetupNotice />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <h1 className="text-lg font-semibold text-vs-fg">Sign in</h1>
        <p className="mt-1 text-sm text-vs-fg-muted">
          We&apos;ll email you a link — no password to remember.
        </p>
        <div className="mt-6">
          <SignInForm />
        </div>
      </Card>
    </main>
  );
}
