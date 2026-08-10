import { Card } from "@venture-sandbox/ui";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { SignInForm } from "./SignInForm";

export default function SignInPage() {
  const configured = isSupabaseConfigured({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
