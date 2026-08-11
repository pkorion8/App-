import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card } from "@venture-sandbox/ui";

export const metadata: Metadata = { title: "Pricing" };

const FREE_FEATURES = [
  "Unlimited ventures",
  "Research with live sources (App Store, World Bank) where connected",
  "Full Simulator — build, launch, decisions, checkpoints",
  "Build Studio recommendations & cost estimate",
  "Compare any two ventures",
  "Monitor: manual real-world outcome tracking",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Priority access to new research sources as they're connected",
  "Higher research refresh limits",
  "Early access to new modules",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between p-6">
        <Link href="/" className="text-lg font-semibold text-vs-fg">
          Venture Sandbox
        </Link>
        <nav className="text-sm text-vs-fg-muted">
          <Link href="/sign-in" className="hover:text-vs-fg hover:underline">
            Sign in
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-center text-2xl font-semibold text-vs-fg">Pricing</h1>
        <p className="mt-2 text-center text-sm text-vs-fg-muted">
          Every account starts on Free — no card required.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold text-vs-fg">Free</h2>
            <p className="mt-1 text-2xl font-semibold text-vs-fg">$0</p>
            <ul className="mt-4 space-y-2 text-sm text-vs-fg-muted">
              {FREE_FEATURES.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
            <Link href="/sign-in" className="mt-6 block">
              <Button className="w-full">Start for free</Button>
            </Link>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-vs-fg">Pro</h2>
            <p className="mt-1 text-2xl font-semibold text-vs-fg">Coming soon</p>
            <ul className="mt-4 space-y-2 text-sm text-vs-fg-muted">
              {PRO_FEATURES.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
            <Link href="/sign-in" className="mt-6 block">
              <Button variant="secondary" className="w-full">
                Start on Free, upgrade later
              </Button>
            </Link>
          </Card>
        </div>

        <p className="mt-8 text-center text-xs text-vs-fg-muted">
          Pro checkout isn&apos;t live yet — every new account is on Free until it is.
        </p>
      </main>
    </div>
  );
}
