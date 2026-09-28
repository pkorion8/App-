import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Button, Card } from "@venture-sandbox/ui";

export const metadata: Metadata = { title: "Methodology" };

const steps = [
  ["01", "Understand", "Connected sources stay traceable. Missing evidence stays missing."],
  ["02", "Shape", "Define the person, problem, promise, first scope, difference and revenue model."],
  ["03", "Simulate", "Expose trade-offs and delayed consequences through a deterministic model—not a forecast."],
  ["04", "Build", "Turn the chosen direction into an architecture, backlog and explicit cost assumptions."],
  ["05", "Learn", "Record real observations separately and use them to improve the next decision."],
] as const;

const states = [
  ["LIVE", "A connected source returned a usable result.", "bg-vs-mint-soft"],
  ["PARTIAL", "The signal is useful but has meaningful gaps.", "bg-vs-lavender-soft"],
  ["DEMO", "An example demonstrates the workflow and is excluded from live coverage.", "bg-vs-orange-soft"],
  ["UNAVAILABLE", "No responsible source is connected, so the value remains unknown.", "bg-white"],
] as const;

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-vs-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-vs-fg">Sim Venture</Link>
        <Link href="/sign-in" className="rounded-full border border-vs-border bg-white px-4 py-2 text-sm font-semibold text-vs-fg">Start a venture</Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-8">
        <section className="grid-paper rounded-[36px] border border-vs-border bg-vs-lavender-soft p-7 shadow-panel sm:p-12">
          <Badge status="primary">HOW DECISIONS ARE BUILT</Badge>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.045em] text-vs-fg sm:text-6xl">From assumption to evidence, without pretending certainty.</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-vs-fg-muted">Sim Venture is decision support. It does not predict success, replace customer conversations or turn unavailable information into confident-looking estimates.</p>
        </section>

        <section className="mt-6 grid gap-3 lg:grid-cols-5">
          {steps.map(([number, title, description], index) => (
            <Card key={number} className={index === 1 || index === 4 ? "bg-vs-mint-soft" : index === 2 ? "bg-vs-orange-soft" : "bg-white"}>
              <span className="text-xs font-semibold tracking-[.16em] text-vs-fg-muted">{number}</span>
              <h2 className="mt-6 text-xl font-semibold text-vs-fg">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-vs-fg-muted">{description}</p>
            </Card>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
          <Card className="bg-vs-orange">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-vs-fg-muted">The rule</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-vs-fg">Know what is observed, inferred and still unknown.</h2>
            <p className="mt-4 text-sm leading-6 text-vs-fg-muted">A useful decision does not require perfect information. It does require a clear boundary between evidence and assumption.</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-vs-fg-muted">Evidence states</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {states.map(([label, description, color]) => <div key={label} className={`rounded-2xl border border-vs-border p-4 ${color}`}><p className="text-xs font-semibold tracking-[.14em] text-vs-fg">{label}</p><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{description}</p></div>)}
            </div>
          </Card>
        </section>

        <div className="mt-8 flex flex-wrap gap-3"><Link href="/explore"><Button>Explore real sources</Button></Link><Link href="/sign-in"><Button variant="secondary">Create your venture</Button></Link></div>
      </main>
    </div>
  );
}
