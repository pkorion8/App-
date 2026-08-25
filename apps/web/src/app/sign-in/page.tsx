import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card } from "@venture-sandbox/ui";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { safeInternalDestination } from "@/lib/safe-internal-destination";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in · Sim Venture" };
export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const configured = isSupabaseConfigured({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  if (!configured) return <SupabaseSetupNotice />;

  const destination = safeInternalDestination(next);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-5 text-center"><Link href="/" className="text-xl font-semibold text-vs-fg">Sim Venture</Link><div className="mt-3"><Badge status="primary">TEST YOUR IDEA BEFORE YOU BUILD IT</Badge></div></div>
        <Card>
          <h1 className="text-2xl font-semibold text-vs-fg">Start with your idea</h1>
          <p className="mt-2 text-sm leading-6 text-vs-fg-muted">Enter your email and we&apos;ll send you a sign-in link. No password, business plan or technical knowledge needed.</p>
          {error === "auth_callback_failed" && (
            <div className="mt-5 rounded-vs-md border border-vs-border bg-vs-bg-subtle p-3" role="alert">
              <p className="text-sm font-medium text-vs-fg">That sign-in link could not be completed.</p>
              <p className="mt-1 text-xs leading-5 text-vs-fg-muted">It may have expired or already been used. Request a fresh link below and use the newest email.</p>
            </div>
          )}
          <div className="mt-6"><SignInForm next={destination} /></div>
          <div className="mt-5 border-t border-vs-border pt-4"><p className="text-xs leading-5 text-vs-fg-muted">Not ready to create an account? <Link href="/demo" className="font-semibold text-vs-primary">See the public walkthrough first →</Link></p></div>
        </Card>
      </div>
    </main>
  );
}
