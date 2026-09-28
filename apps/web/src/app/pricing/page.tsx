import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Button, Card } from "@venture-sandbox/ui";

export const metadata: Metadata = { title: "Access · Sim Venture" };

const included = [
  "Evidence-backed market and problem research",
  "Venture shaping and monetization experiments",
  "Time-based business simulation",
  "Build planning, architecture and cost assumptions",
  "Investor rehearsal and real-outcome tracking",
  "Simple and Pro workspaces on the same venture data",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-vs-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-vs-fg">Sim Venture</Link>
        <nav className="flex items-center gap-5 text-sm text-vs-fg-muted">
          <Link href="/demo" className="transition hover:text-vs-fg">Demo</Link>
          <Link href="/sign-in" className="rounded-full border border-vs-border bg-white px-4 py-2 font-semibold text-vs-fg transition hover:-translate-y-0.5">Sign in</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-8 sm:pt-14">
        <section className="grid-paper overflow-hidden rounded-[36px] border border-vs-border bg-vs-lavender-soft p-6 shadow-panel sm:p-10 lg:grid lg:grid-cols-[1.15fr_.85fr] lg:gap-8 lg:p-14">
          <div className="max-w-2xl">
            <Badge status="primary">COMPLETE LAUNCH ACCESS</Badge>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.045em] text-vs-fg sm:text-6xl">Test the business before you fund the build.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-vs-fg-muted sm:text-lg">Create a venture, research the market, test assumptions, simulate decisions and leave with an evidence-backed build plan.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/sign-in"><Button className="px-6 py-3">Create your venture →</Button></Link>
              <span className="text-sm text-vs-fg-muted">No card required</span>
            </div>
          </div>

          <Card className="mt-8 border-vs-border bg-vs-orange-soft lg:mt-0">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-vs-fg-muted">Current access</p>
            <div className="mt-3 flex items-end gap-2"><span className="text-5xl font-semibold tracking-tight text-vs-fg">$0</span><span className="pb-1 text-sm text-vs-fg-muted">to start</span></div>
            <p className="mt-4 text-sm leading-6 text-vs-fg-muted">The complete product is open during launch. Your ventures and evidence stay together as commercial plans are introduced.</p>
            <Link href="/sign-in" className="mt-6 block"><Button variant="secondary" className="w-full bg-white">Start now</Button></Link>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <Card className="bg-vs-mint-soft">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-vs-fg-muted">One workspace</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-vs-fg">From raw idea to a decision you can defend.</h2>
            <p className="mt-4 text-sm leading-6 text-vs-fg-muted">No disconnected spreadsheets, mystery scores or invented certainty. Evidence, assumptions, simulations and real outcomes remain clearly separated.</p>
          </Card>
          <Card className="bg-white">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-vs-fg-muted">Included today</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {included.map((item) => <div key={item} className="flex gap-3 rounded-2xl border border-vs-border bg-vs-bg p-4"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-vs-lime text-xs font-bold text-vs-fg">✓</span><p className="text-sm leading-6 text-vs-fg">{item}</p></div>)}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
