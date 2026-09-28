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
    <main className="min-h-screen bg-vs-bg p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[36px] border border-vs-border bg-white shadow-panel lg:grid-cols-[1.05fr_.95fr]">
        <section className="grid-paper flex flex-col justify-between bg-vs-lavender-soft p-7 sm:p-10 lg:p-14">
          <div><Link href="/" className="text-lg font-semibold tracking-tight text-vs-fg">Sim Venture</Link></div>
          <div className="my-14 max-w-xl">
            <Badge status="primary">IDEA → EVIDENCE → DECISION</Badge>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.045em] text-vs-fg sm:text-6xl">Your next business deserves a better first step.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-vs-fg-muted">Research the opportunity, pressure-test the model and plan the smallest useful product—all in one venture workspace.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-medium text-vs-fg-muted">
            <span>01 Research</span><span>02 Simulate</span><span>03 Build</span>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-10 lg:p-14">
          <div className="mx-auto w-full max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-vs-fg-muted">Secure access</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-vs-fg">Start with your idea</h2>
            <p className="mt-3 text-sm leading-6 text-vs-fg-muted">Enter your email and we&apos;ll send a secure sign-in link. No password, business plan or technical knowledge needed.</p>
            {error === "auth_callback_failed" && (
              <div className="mt-5 rounded-vs-md border border-vs-border bg-vs-orange-soft p-4" role="alert">
                <p className="text-sm font-medium text-vs-fg">That sign-in link could not be completed.</p>
                <p className="mt-1 text-xs leading-5 text-vs-fg-muted">It may have expired or already been used. Request a fresh link below and use the newest email.</p>
              </div>
            )}
            <Card className="mt-6 bg-vs-mint-soft"><SignInForm next={destination} /></Card>
            <p className="mt-5 text-xs leading-5 text-vs-fg-muted">Want to look around first? <Link href="/demo" className="font-semibold text-vs-fg underline decoration-vs-primary decoration-2 underline-offset-4">Open the guided walkthrough →</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}
