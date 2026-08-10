import Link from "next/link";
import { Button, Card } from "@venture-sandbox/ui";

const MODULES = [
  {
    name: "Research",
    description:
      "Start from two questions — who it's for, where — and get real findings where a live source exists (App Store listings, World Bank market data), clearly separated from placeholders where one doesn't yet.",
  },
  {
    name: "Simulate",
    description:
      "Run the venture forward in virtual time: build it, hit real setbacks, launch, get users, react to events. Every decision has an immediate effect and a delayed one you'll see called out later — no dice rolls, same inputs always produce the same outcome.",
  },
  {
    name: "Build Studio",
    description:
      "A recommended stack, a cost estimate, and a backlog to actually ship the idea — with an AI builder, writing the code yourself, or hiring a developer treated as equally valid paths, not steered toward one vendor.",
  },
  {
    name: "Compare",
    description:
      "Put two ventures side by side on what they've actually produced — findings, simulated outcomes, cost — not a made-up score.",
  },
  {
    name: "Monitor",
    description:
      "Once it's real, log actual users/revenue/cost/retention over time and watch the trend — kept separate from the simulation's projections, never blended with them.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between p-6">
        <span className="text-lg font-semibold text-vs-fg">Venture Sandbox</span>
        <nav className="flex items-center gap-4 text-sm text-vs-fg-muted">
          <Link href="/pricing" className="hover:text-vs-fg hover:underline">
            Pricing
          </Link>
          <Link href="/sign-in" className="hover:text-vs-fg hover:underline">
            Sign in
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold text-vs-fg sm:text-4xl">
            Decide before you spend real money.
          </h1>
          <p className="mt-4 text-base text-vs-fg-muted sm:text-lg">
            Research an app idea, simulate building and launching it in virtual time, and see
            how the decisions you&apos;d actually make play out — before you risk a single real
            dollar.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/sign-in">
              <Button>Start for free</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary">See pricing</Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <Card key={m.name}>
                <h2 className="text-base font-semibold text-vs-fg">{m.name}</h2>
                <p className="mt-2 text-sm text-vs-fg-muted">{m.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-20">
          <Card className="bg-vs-bg-subtle text-center">
            <h2 className="text-lg font-semibold text-vs-fg">Built on evidence, not guesses</h2>
            <p className="mt-2 text-sm text-vs-fg-muted">
              Every finding is labeled by how solid it actually is, and every placeholder is
              marked as one — nothing here pretends to know more than it does. If a real data
              source isn&apos;t connected for something yet, we&apos;ll tell you, not fake it.
            </p>
          </Card>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-6 pb-10 text-center text-xs text-vs-fg-muted">
        Venture Sandbox
      </footer>
    </div>
  );
}
