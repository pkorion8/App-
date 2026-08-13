import Link from "next/link";
import { Badge, Button, Card } from "@venture-sandbox/ui";

const SIMPLE_STEPS = [
  ["1", "Check the idea", "See whether the problem looks real, what already exists, and what is still unknown."],
  ["2", "Make it better", "Narrow the idea to the right user, the right problem, and the smallest useful first version."],
  ["3", "Simulate it", "Run the startup through time, money, decisions, users and consequences before risking real cash."],
  ["4", "Plan the build", "Turn the learning into a practical first-version plan instead of a giant feature list."],
  ["5", "Learn from reality", "After launch, compare real users, revenue and costs with what the simulation expected."],
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between p-6">
        <Link href="/" className="text-lg font-semibold text-vs-fg">Sim Venture</Link>
        <nav className="flex items-center gap-3 text-sm text-vs-fg-muted"><Link href="/demo" className="hover:text-vs-fg">Demo</Link><Link href="/pricing" className="hover:text-vs-fg">Pricing</Link><Link href="/sign-in"><Button size="sm">Sign in</Button></Link></nav>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-14 text-center sm:pt-20">
          <Badge status="primary">TEST YOUR STARTUP BEFORE YOU BUILD IT</Badge>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-vs-fg sm:text-6xl">Have an app idea? Find out what to do with it before you spend months building.</h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-vs-fg-muted sm:text-lg">Sim Venture researches the idea, helps you make it clearer, lets you simulate the journey, and turns what you learn into a practical first build plan. You can use it without knowing startup jargon or programming.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/sign-in"><Button>Try your idea</Button></Link><Link href="/demo"><Button variant="secondary">See a public demo</Button></Link></div>
          <p className="mt-4 text-xs text-vs-fg-muted">No fake “success probability.” Simulated outcomes are labeled as simulated, and unknowns stay unknown.</p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{SIMPLE_STEPS.map(([n, title, text]) => <Card key={n}><div className="grid h-8 w-8 place-items-center rounded-full bg-vs-primary text-sm font-semibold text-vs-primary-fg">{n}</div><h2 className="mt-3 font-semibold text-vs-fg">{title}</h2><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{text}</p></Card>)}</div>
        </section>

        <section className="border-y border-vs-border bg-vs-bg-subtle/50">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">The core difference</p><h2 className="mt-3 text-3xl font-semibold text-vs-fg">It is not just another AI idea validator.</h2><p className="mt-4 text-sm leading-7 text-vs-fg-muted">Most tools give you an answer and the conversation ends. Sim Venture keeps the venture alive: research, assumptions, choices, simulations, build plans and real outcomes stay connected over time.</p><p className="mt-3 text-sm leading-7 text-vs-fg-muted">That means the important question changes from “Is this a good idea?” to “What should I do next, and what did I learn from the last decision?”</p></div>
            <Card className="border-vs-primary/25"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">A simple example</p><p className="mt-3 text-xl font-semibold text-vs-fg">“I want an app that stores receipts and reminds people before warranties expire.”</p><div className="mt-5 space-y-3"><ExampleLine label="Research" text="Are people actually losing value because they miss deadlines?"/><ExampleLine label="Shape" text="What is the smallest useful first version?"/><ExampleLine label="Simulate" text="What happens if I launch small instead of building every feature?"/><ExampleLine label="Build" text="What should I actually make first?"/><ExampleLine label="Learn" text="What did real users do after launch?"/></div></Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-5 lg:grid-cols-2"><Card><Badge status="primary">SIMPLE MODE</Badge><h2 className="mt-3 text-2xl font-semibold text-vs-fg">For people who just have an idea</h2><p className="mt-3 text-sm leading-7 text-vs-fg-muted">Plain questions, normal words, one clear next action at a time. No need to understand TAM, unit economics, APIs, architecture or investment terminology.</p><ul className="mt-4 space-y-2 text-sm text-vs-fg-muted"><li>• Is this problem real?</li><li>• Who would use this?</li><li>• What should I build first?</li><li>• How could it make money?</li><li>• What should I do next?</li></ul></Card><Card><Badge status="neutral">PRO MODE</Badge><h2 className="mt-3 text-2xl font-semibold text-vs-fg">For founders and product people who want depth</h2><p className="mt-3 text-sm leading-7 text-vs-fg-muted">The same venture can open into detailed evidence, source traceability, technical analysis, monetization experiments, alternate timelines, Investor World, scorecards and system views.</p><p className="mt-4 text-sm font-medium text-vs-fg">One intelligence engine. Two levels of complexity.</p></Card></div>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-20"><Card className="bg-vs-bg-subtle text-center"><h2 className="text-3xl font-semibold text-vs-fg">You do not need a business plan to start.</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-vs-fg-muted">Start with the rough idea. Sim Venture helps turn it into questions you can actually answer and decisions you can actually make.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/sign-in"><Button>Try your idea</Button></Link><Link href="/demo"><Button variant="secondary">Walk through the demo</Button></Link></div></Card></section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 pb-10 text-xs text-vs-fg-muted"><span>Sim Venture · prototype</span><span>Complex intelligence underneath. Simple decisions on top.</span></footer>
    </div>
  );
}

function ExampleLine({ label, text }: { label: string; text: string }) { return <div className="rounded-vs-md bg-vs-bg-subtle p-3"><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">{label}</p><p className="mt-1 text-sm text-vs-fg">{text}</p></div>; }
