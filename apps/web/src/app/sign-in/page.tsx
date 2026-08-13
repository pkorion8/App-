import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card } from "@venture-sandbox/ui";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in · Sim Venture" };
export const dynamic = "force-dynamic";

export default function SignInPage() {
  const configured = isSupabaseConfigured({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  if (!configured) return <SupabaseSetupNotice />;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-5 text-center"><Link href="/" className="text-xl font-semibold text-vs-fg">Sim Venture</Link><div className="mt-3"><Badge status="primary">TEST YOUR IDEA BEFORE YOU BUILD IT</Badge></div></div>
        <Card>
          <h1 className="text-2xl font-semibold text-vs-fg">Start with your idea</h1>
          <p className="mt-2 text-sm leading-6 text-vs-fg-muted">Enter your email and we&apos;ll send you a sign-in link. No password, business plan or technical knowledge needed.</p>
          <div className="mt-6"><SignInForm /></div>
          <div className="mt-5 border-t border-vs-border pt-4"><p className="text-xs leading-5 text-vs-fg-muted">Not ready to create an account? <Link href="/demo" className="font-semibold text-vs-primary">See the public walkthrough first →</Link></p></div>
        </Card>
      </div>
    </main>
  );
}
