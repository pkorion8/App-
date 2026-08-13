import Link from "next/link";
import { Button, Card } from "@venture-sandbox/ui";

const MODULES = [
  ["Research", "Find real signals before committing."],
  ["Simulate", "Pressure-test decisions in virtual time."],
  ["Build Studio", "Turn evidence into a practical build plan."],
  ["Compare", "Put competing ideas side by side."],
  ["Monitor", "Track reality separately from projections."],
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen pb-10">
      <header className="vs-shell pt-5 sm:pt-7">
        <div className="vs-panel flex items-center justify-between px-5 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-vs-fg"><span className="grid h-8 w-8 place-items-center rounded-full bg-vs-primary text-sm font-bold text-white">V</span>Venture Lab</Link>
          <nav className="flex items-center gap-2 text-sm"><Link href="/pricing" className="rounded-full px-3 py-2 text-vs-fg-muted hover:bg-vs-bg-subtle hover:text-vs-fg">Pricing</Link><Link href="/sign-in" className="rounded-full bg-vs-fg px-4 py-2 font-semibold text-white">Sign in</Link></nav>
        </div>
      </header>

      <main className="vs-shell mt-5">
        <section className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
          <div className="vs-brand-panel vs-dot-pattern relative min-h-[520px] overflow-hidden p-8 sm:p-12">
            <div className="relative z-10 max-w-3xl">
              <p className="text-sm font-semibold text-white/70">AI-powered venture intelligence for people with an app idea.</p>
              <h1 className="vs-display mt-5 max-w-3xl text-6xl font-semibold sm:text-7xl lg:text-8xl">Test your startup before building it.</h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-white/80">Research the market, shape the opportunity, simulate what could happen and decide what deserves your time and money.</p>
              <div className="mt-8 flex flex-wrap gap-3"><Link href="/sign-in"><Button className="bg-white text-vs-fg hover:bg-white">Start testing an idea</Button></Link><Link href="/methodology"><Button variant="ghost" className="border border-white/25 text-white hover:bg-white/10 hover:text-white">See how it works</Button></Link></div>
            </div>
            <div className="absolute -bottom-28 -right-20 h-96 w-96 rounded-full border-[58px] border-white/14" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Card className="flex min-h-[170px] flex-col justify-between"><span className="vs-kicker">Evidence first</span><div><p className="text-3xl font-semibold tracking-[-.04em]">Research</p><p className="mt-2 text-sm leading-6 text-vs-fg-muted">Separate real findings from assumptions and placeholders.</p></div></Card>
            <Card className="flex min-h-[170px] flex-col justify-between bg-vs-fg text-white"><span className="text-[11px] font-bold uppercase tracking-[.16em] text-white/55">Virtual pressure</span><div><p className="text-3xl font-semibold tracking-[-.04em]">Simulate</p><p className="mt-2 text-sm leading-6 text-white/60">See how choices, costs and market conditions interact.</p></div></Card>
            <Card className="flex min-h-[170px] flex-col justify-between"><span className="vs-kicker">Decision support</span><div><p className="text-3xl font-semibold tracking-[-.04em]">Decide</p><p className="mt-2 text-sm leading-6 text-vs-fg-muted">Move forward, reshape the idea, or stop before wasting resources.</p></div></Card>
          </div>
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {MODULES.map(([name, description], index) => <Card key={name} className="min-h-[190px] p-5"><span className="text-xs font-bold text-vs-primary">0{index + 1}</span><h2 className="mt-10 text-xl font-semibold tracking-tight">{name}</h2><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{description}</p></Card>)}
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[.65fr_1.35fr]">
          <Card className="bg-vs-fg p-7 text-white sm:p-9"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/55">No fake certainty</p><p className="mt-12 text-3xl font-semibold tracking-[-.04em]">Evidence, confidence and gaps stay visible.</p></Card>
          <Card className="p-7 sm:p-9"><p className="vs-kicker">Built for the new app economy</p><h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-.04em]">You do not need to be a professional founder to test an idea seriously.</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-vs-fg-muted">Use Venture Lab whether you are a creator, student, designer, product person, freelancer, no-code builder or simply someone considering an app.</p></Card>
        </section>
      </main>
    </div>
  );
}
