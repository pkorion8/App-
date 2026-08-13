import Link from "next/link";
import { Badge, Button, Card } from "@venture-sandbox/ui";

const steps = [
  { n: "1", title: "Is the problem real?", text: "Look for signs that people have the problem, what they use today, and what is still unknown." },
  { n: "2", title: "Make the idea better", text: "Choose who needs it most and define the smallest useful first version." },
  { n: "3", title: "Test the idea", text: "Run the venture through time, money, product choices, users and consequences." },
  { n: "4", title: "Plan what to build", text: "Turn the learning into a practical first-version build plan instead of a huge feature list." },
  { n: "5", title: "See what really happened", text: "After launch, bring back real users, revenue, costs and learning so the venture improves." },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-vs-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-semibold text-vs-fg">Sim Venture</Link>
        <div className="flex items-center gap-3"><Badge status="warning">PUBLIC DEMO</Badge><Link href="/sign-in"><Button size="sm">Try your own idea</Button></Link></div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <section className="rounded-[32px] border border-vs-border bg-vs-bg-subtle/60 px-6 py-10 sm:px-10">
          <Badge status="warning">DEMO IDEA · NOT LIVE MARKET EVIDENCE</Badge>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-vs-fg sm:text-5xl">See how one rough app idea becomes a venture you can actually reason about.</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-vs-fg-muted">This public walkthrough uses a fictional example called <strong>ClaimKeeper</strong>: an app that stores receipts and reminds people before returns, warranties and rebates expire. Everything below is clearly demo/simulated.</p>
          <div className="mt-7 flex flex-wrap gap-3"><a href="#research"><Button>Start the demo</Button></a><Link href="/sign-in"><Button variant="secondary">Use my own idea</Button></Link></div>
        </section>

        <section className="mt-8 grid gap-3 md:grid-cols-5">{steps.map((step) => <Card key={step.n}><div className="grid h-8 w-8 place-items-center rounded-full bg-vs-primary text-sm font-semibold text-vs-primary-fg">{step.n}</div><h2 className="mt-3 font-semibold text-vs-fg">{step.title}</h2><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{step.text}</p></Card>)}</section>

        <section id="research" className="mt-12 scroll-mt-8">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">1 · Research</p>
          <h2 className="mt-2 text-3xl font-semibold text-vs-fg">Is this problem real?</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-vs-fg-muted">The beginner view answers normal questions first. The detailed source/evidence layer still exists underneath in Pro mode.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2"><Answer title="What looks promising" text="The problem is easy to understand: people can lose money or value when purchase proof and deadlines are scattered." /><Answer title="What still needs checking" text="We do not yet know whether enough people care strongly enough to keep the app updated or pay for it." careful /><Answer title="What already exists" text="Receipt storage and warranty tools exist, so the opportunity would need to be more specific than simply storing receipts." /><Answer title="Possible difference" text="A deadline-first workflow could focus on helping people act before value expires, rather than acting as a generic receipt archive." /></div>
        </section>

        <section className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">2 · Shape</p>
          <h2 className="mt-2 text-3xl font-semibold text-vs-fg">Make the idea smaller and clearer</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3"><DemoField label="Who is it for?" value="Busy households who lose track of receipts and claim deadlines" /><DemoField label="Problem to solve first" value="People miss returns, warranty claims and rebates because dates and proof are scattered" /><DemoField label="Smallest useful first version" value="Capture receipt → save deadline → remind user → show the next claim step" /></div>
        </section>

        <section className="mt-12 rounded-[28px] border border-vs-primary/25 bg-vs-primary/5 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">3 · Startup flight simulator</p><h2 className="mt-2 text-3xl font-semibold text-vs-fg">Now test the venture through time</h2></div><Badge status="warning">SIMULATED</Badge></div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-vs-fg-muted">The simulator does not say “73% chance of success.” It creates a consistent virtual timeline where your decisions change the state and can create consequences later.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-4"><Metric label="Starting budget" value="$12,000" /><Metric label="Day" value="30" /><Metric label="Simulated users" value="259" /><Metric label="Money left" value="$8,968" /></div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2"><Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Decision</p><h3 className="mt-2 text-xl font-semibold text-vs-fg">The first version is taking longer than expected.</h3><p className="mt-2 text-sm text-vs-fg-muted">What would you do?</p><div className="mt-4 space-y-2"><Choice text="Cut features and launch a smaller version" selected /><Choice text="Keep everything and delay launch" /><Choice text="Spend more to speed development" /></div></Card><Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Later consequence</p><h3 className="mt-2 text-xl font-semibold text-vs-fg">The smaller scope preserved cash and got the product in front of users sooner.</h3><p className="mt-3 text-sm leading-6 text-vs-fg-muted">The original decision remains in the timeline. In Standard mode, a founder can create up to three alternate timelines to see what another decision would have changed.</p></Card></div>
        </section>

        <section className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">Money</p>
          <h2 className="mt-2 text-3xl font-semibold text-vs-fg">How could it make money?</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3"><Model title="Monthly or yearly plan" text="Makes sense if the app keeps creating value as people add more purchases." /><Model title="Free basics + paid upgrade" text="Let users experience reminders first, then charge for advanced tracking or higher limits." /><Model title="Pay once" text="Worth testing if users see the product as a tool they buy rather than an ongoing service." /></div><p className="mt-4 text-sm text-vs-fg-muted">None of these are presented as proven. The real question is which model is worth testing first.</p>
        </section>

        <section className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">4 · Build</p>
          <h2 className="mt-2 text-3xl font-semibold text-vs-fg">Turn the learning into version 1</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_.8fr]"><Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Build these first</p><ol className="mt-4 space-y-3 text-sm text-vs-fg"><li>1. Create an account</li><li>2. Take or upload a receipt</li><li>3. Save purchase details and deadline</li><li>4. Show approaching deadlines</li><li>5. Send reminders</li><li>6. Keep a simple claim/history record</li></ol></Card><Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Leave for later</p><ul className="mt-4 space-y-3 text-sm text-vs-fg-muted"><li>• Retailer integrations</li><li>• Automatic claim submission</li><li>• Advanced AI classification</li><li>• Complex rewards/community features</li></ul></Card></div>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-2"><Card><Badge status="warning">SIMULATED INVESTOR</Badge><h2 className="mt-3 text-2xl font-semibold text-vs-fg">Investor World</h2><p className="mt-3 text-sm leading-6 text-vs-fg-muted">Practice difficult questions before speaking to a real investor. The system separates claims you can support from assumptions you still need to prove.</p><div className="mt-4 rounded-vs-md bg-vs-bg-subtle p-4"><p className="text-sm font-semibold text-vs-fg">Investor asks:</p><p className="mt-2 text-sm text-vs-fg-muted">“Why would someone use this instead of leaving receipts in email or a retailer account?”</p></div><div className="mt-3 rounded-vs-md border border-vs-warning/30 p-4"><p className="text-xs font-semibold text-vs-fg">Claim status: ASSUMPTION</p><p className="mt-1 text-sm text-vs-fg-muted">“Customers will pay the modeled subscription price.” No willingness-to-pay evidence is attached yet.</p></div></Card><Card><Badge status="success">REALITY LOOP</Badge><h2 className="mt-3 text-2xl font-semibold text-vs-fg">Then bring back real results</h2><p className="mt-3 text-sm leading-6 text-vs-fg-muted">After launch, enter what actually happened: users, revenue, cost, retention or milestones. Simulated expectations stay separate from real observations so the venture can learn without rewriting history.</p><div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Simulated users" value="540" /><Metric label="Real users" value="Not added yet" /><Metric label="Simulated revenue" value="$620/mo" /><Metric label="Real revenue" value="Not added yet" /></div></Card></section>

        <section className="mt-12 rounded-[28px] border border-vs-border bg-vs-bg-subtle p-8 text-center"><h2 className="text-3xl font-semibold text-vs-fg">That is Sim Venture.</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-vs-fg-muted">A serious intelligence system underneath, but a simple guided experience on top: test your startup before you build it.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/sign-in"><Button>Try your own idea</Button></Link><Link href="/"><Button variant="secondary">Back to overview</Button></Link></div></section>
      </main>
    </div>
  );
}

function Answer({ title, text, careful = false }: { title: string; text: string; careful?: boolean }) { return <Card className={careful ? "border-vs-warning/30" : ""}><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">{title}</p><p className="mt-2 text-base leading-7 text-vs-fg">{text}</p></Card>; }
function DemoField({ label, value }: { label: string; value: string }) { return <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">{label}</p><p className="mt-2 text-base leading-7 text-vs-fg">{value}</p></Card>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-vs-md border border-vs-border bg-vs-bg p-4"><p className="text-xs text-vs-fg-muted">{label}</p><p className="mt-1 text-xl font-semibold text-vs-fg">{value}</p></div>; }
function Choice({ text, selected = false }: { text: string; selected?: boolean }) { return <div className={`rounded-vs-md border p-3 text-sm ${selected ? "border-vs-primary bg-vs-primary/5 font-semibold text-vs-fg" : "border-vs-border text-vs-fg-muted"}`}>{selected ? "✓ " : ""}{text}</div>; }
function Model({ title, text }: { title: string; text: string }) { return <Card><h3 className="font-semibold text-vs-fg">{title}</h3><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{text}</p></Card>; }
