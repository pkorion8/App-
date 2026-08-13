import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Button, Card } from "@venture-sandbox/ui";

export const metadata: Metadata = { title: "Access · Sim Venture" };

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between p-6">
        <Link href="/" className="text-lg font-semibold text-vs-fg">Sim Venture</Link>
        <nav className="flex items-center gap-4 text-sm text-vs-fg-muted"><Link href="/demo" className="hover:text-vs-fg">Demo</Link><Link href="/sign-in" className="hover:text-vs-fg">Sign in</Link></nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="text-center"><Badge status="warning">PROTOTYPE</Badge><h1 className="mt-4 text-3xl font-semibold text-vs-fg">Pricing is not final yet.</h1><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-vs-fg-muted">We are still testing the product and how Simple and Pro experiences should work. The prototype does not lock us into a permanent free/pro structure or final subscription price.</p></div>

        <Card className="mt-8 border-vs-primary/25 bg-vs-primary/5">
          <h2 className="text-xl font-semibold text-vs-fg">Prototype access</h2>
          <p className="mt-2 text-sm leading-6 text-vs-fg-muted">You can currently sign in and test the prototype. The purpose right now is to validate whether the workflow is useful—not to pretend the final commercial model is settled.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-vs-md bg-vs-bg p-4"><p className="font-semibold text-vs-fg">Simple mode</p><p className="mt-1 text-sm leading-6 text-vs-fg-muted">Guided, plain-language idea research, simulation and build planning.</p></div><div className="rounded-vs-md bg-vs-bg p-4"><p className="font-semibold text-vs-fg">Pro mode</p><p className="mt-1 text-sm leading-6 text-vs-fg-muted">Detailed evidence, technical analysis, Investor World and deeper venture tools.</p></div></div>
          <Link href="/sign-in" className="mt-6 block"><Button className="w-full">Try the prototype</Button></Link>
        </Card>

        <p className="mt-6 text-center text-xs leading-5 text-vs-fg-muted">Any future paid plan, limits, public/private project model or professional tier will be decided after product validation.</p>
      </main>
    </div>
  );
}
