import Link from "next/link";
import { Badge, Button, Card } from "@venture-sandbox/ui";

const JOURNEY = [
  ["01", "Understand", "Find the real problem, audience, alternatives and evidence gaps."],
  ["02", "Shape", "Turn a rough thought into a focused, testable first venture."],
  ["03", "Simulate", "Explore decisions, cash, users and consequences before launch."],
  ["04", "Build", "Generate a practical V1 stack, cost range and ordered backlog."],
  ["05", "Learn", "Keep real outcomes separate from projections and improve with evidence."],
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-vs-bg">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-vs-ink">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-vs-lime text-lg font-black">S</span>
          Sim Venture
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/demo" className="hidden text-sm font-medium text-vs-fg-muted hover:text-vs-fg sm:inline">Demo</Link>
          <Link href="/pricing" className="hidden text-sm font-medium text-vs-fg-muted hover:text-vs-fg sm:inline">Pricing</Link>
          <Link href="/sign-in"><Button className="min-h-10 px-4 py-2 text-xs">Start now <span className="ml-2">↗</span></Button></Link>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <section className="grid gap-4 pt-3 lg:grid-cols-12">
          <div className="vs-panel-shadow relative min-h-[520px] overflow-hidden rounded-[32px] border border-vs-ink/15 bg-vs-lavender-soft p-7 sm:p-10 lg:col-span-7 lg:p-12">
            <div className="absolute right-[-70px] top-[-90px] h-64 w-64 rounded-full bg-vs-orange/70 blur-3xl" aria-hidden />
            <div className="absolute bottom-[-90px] left-[22%] h-64 w-64 rounded-full bg-vs-lavender blur-3xl" aria-hidden />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <Badge status="primary">Venture intelligence for real decisions</Badge>
                <h1 className="mt-8 max-w-3xl text-5xl font-medium leading-[.95] tracking-[-.055em] text-vs-ink sm:text-7xl">Test your startup before you build it.</h1>
                <p className="mt-7 max-w-xl text-base leading-7 text-vs-fg-muted sm:text-lg">Research the market, sharpen the idea, simulate the journey and leave with a buildable first plan—without fake certainty.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/sign-in"><Button>Try your idea <span className="ml-2">→</span></Button></Link>
                  <Link href="/demo"><Button variant="secondary">Explore the product</Button></Link>
                </div>
              </div>
              <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-vs-fg-muted">
                <span>● Live-source research</span><span>● Deterministic simulation</span><span>● No invented success score</span>
              </div>
            </div>
          </div>

          <div className="vs-panel-shadow flex min-h-[520px] flex-col rounded-[32px] border border-vs-ink/15 bg-vs-orange p-7 sm:p-10 lg:col-span-5">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-[.15em]">Your venture path</p><h2 className="mt-2 text-4xl font-medium leading-none tracking-[-.045em]">Clear next steps,<br />not more noise.</h2></div>
              <span className="rounded-full border border-vs-ink/70 px-4 py-2 text-xs font-semibold">This week</span>
            </div>
            <div className="mt-10">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-[.12em]"><span>Progress</span><span>60%</span></div>
              <div className="mt-2 flex h-6 overflow-hidden rounded-full border border-vs-ink/10 bg-white/35"><span className="w-[29%] bg-vs-lavender" /><span className="w-[31%] border-l border-vs-ink/10 bg-vs-lavender/65" /></div>
            </div>
            <div className="mt-auto grid gap-3 pt-10 sm:grid-cols-2">
              <MiniTask icon="⌕" title="Check the market evidence" />
              <MiniTask icon="◇" title="Narrow the first version" />
              <MiniTask icon="↗" title="Run a launch scenario" className="sm:col-span-2" />
            </div>
          </div>

          <div className="vs-panel-shadow rounded-[32px] border border-vs-ink/15 bg-vs-mint p-7 sm:p-10 lg:col-span-7">
            <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr] md:items-end">
              <div><p className="text-xs font-semibold uppercase tracking-[.15em]">One connected workspace</p><h2 className="mt-3 text-4xl font-medium leading-none tracking-[-.04em]">Evidence that stays with the idea.</h2><p className="mt-4 text-sm leading-6 text-vs-fg-muted">Research, assumptions, decisions, simulated outcomes and real results remain connected instead of disappearing into separate documents.</p></div>
              <div className="rounded-[24px] border border-vs-ink/15 bg-white/45 p-6">
                <div className="flex items-center justify-between"><span className="text-sm font-semibold">Venture confidence</span><span className="text-xs text-vs-fg-muted">Evidence, not probability</span></div>
                <div className="mt-8 flex h-32 items-end gap-2 border-b border-vs-ink/20">
                  {[35, 51, 43, 68, 60, 82, 74].map((height, index) => <span key={index} className="flex-1 rounded-t-full bg-vs-lime" style={{ height: `${height}%` }} />)}
                </div>
                <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-vs-fg-muted"><span>Idea</span><span>Research</span><span>Launch</span></div>
              </div>
            </div>
          </div>

          <div className="vs-panel-shadow rounded-[32px] border border-vs-ink/15 bg-white/70 p-7 sm:p-10 lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-vs-fg-muted">Built for both starting points</p>
            <h2 className="mt-3 text-4xl font-medium leading-none tracking-[-.04em]">Simple when you need clarity. Deep when you need proof.</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <ModeCard label="Simple" text="Plain questions and one clear action at a time." tone="lavender" />
              <ModeCard label="Pro" text="Sources, evidence, economics, system views and investor tools." tone="mint" />
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[.15em] text-vs-fg-muted">The full journey</p><h2 className="mt-2 max-w-2xl text-4xl font-medium tracking-[-.045em] sm:text-5xl">From an uncertain idea to an informed first launch.</h2></div>
            <p className="max-w-sm text-sm leading-6 text-vs-fg-muted">Each stage produces something useful for the next. No disconnected reports and no unexplained scores.</p>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-5">
            {JOURNEY.map(([number, title, text], index) => <Card key={title} className={index === 2 ? "bg-vs-lavender-soft" : index === 4 ? "bg-vs-mint-soft" : "bg-white/65"}><div className="flex items-center justify-between"><span className="text-xs font-semibold text-vs-fg-muted">{number}</span><span>↗</span></div><h3 className="mt-10 text-xl font-semibold tracking-tight">{title}</h3><p className="mt-3 text-sm leading-6 text-vs-fg-muted">{text}</p></Card>)}
          </div>
        </section>

        <section className="rounded-[32px] bg-vs-ink px-7 py-12 text-white sm:px-12 sm:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"><div><Badge className="border-white/15 bg-white/10 text-white">Start with the rough version</Badge><h2 className="mt-5 max-w-3xl text-4xl font-medium leading-[1.02] tracking-[-.045em] sm:text-6xl">You do not need a business plan to begin.</h2></div><div className="max-w-md"><p className="text-sm leading-7 text-white/65">Bring the idea in normal words. Sim Venture turns it into evidence, decisions and a practical first build.</p><Link href="/sign-in" className="mt-6 inline-block"><Button className="border-white bg-white text-vs-ink hover:bg-vs-lime">Start your venture →</Button></Link></div></div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-xs text-vs-fg-muted sm:px-8"><span>© Sim Venture</span><span>Complex intelligence underneath. Clear decisions on top.</span></footer>
    </div>
  );
}

function MiniTask({ icon, title, className = "" }: { icon: string; title: string; className?: string }) {
  return <div className={`rounded-[22px] border border-vs-ink/10 bg-white/40 p-5 ${className}`}><div className="flex items-start justify-between"><span className="text-2xl">{icon}</span><span className="text-lg">•••</span></div><p className="mt-8 max-w-[13rem] text-sm font-semibold uppercase leading-5 tracking-[.06em]">{title}</p></div>;
}

function ModeCard({ label, text, tone }: { label: string; text: string; tone: "lavender" | "mint" }) {
  return <div className={`rounded-[22px] border border-vs-ink/10 p-5 ${tone === "lavender" ? "bg-vs-lavender-soft" : "bg-vs-mint-soft"}`}><div className="flex items-center justify-between"><span className="font-semibold">{label}</span><span>↗</span></div><p className="mt-8 text-sm leading-6 text-vs-fg-muted">{text}</p></div>;
}
