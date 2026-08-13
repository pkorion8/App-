"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@venture-sandbox/ui";

const STEP_LABELS = [
  "Idea",
  "Research",
  "Improve",
  "Simulate",
  "Build",
  "Investor",
] as const;

const CHOICES = [
  {
    id: "smaller",
    label: "Cut features and launch a smaller version",
    consequence:
      "You preserve more cash and reach users earlier, but some nice-to-have features move to later.",
  },
  {
    id: "delay",
    label: "Keep every feature and delay launch",
    consequence:
      "The product is more complete at launch, but you spend longer without real user feedback and use more of the budget first.",
  },
  {
    id: "spend",
    label: "Spend more to speed development",
    consequence:
      "You move faster, but the extra cost reduces the amount of cash available for later testing and marketing.",
  },
] as const;

export default function DemoPage() {
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const selected = useMemo(() => CHOICES.find((item) => item.id === choice), [choice]);

  const go = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-vs-bg">
      <header className="border-b border-vs-border bg-vs-bg/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold text-vs-fg">Sim Venture</Link>
          <div className="flex items-center gap-3">
            <Badge status="warning">GUIDED DEMO</Badge>
            <Link href="/sign-in"><Button className="px-3 py-1.5 text-xs">Try your own idea</Button></Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20 pt-6 sm:px-6 sm:pt-10">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-vs-primary">ClaimKeeper · fictional example</p>
            <p className="text-xs text-vs-fg-muted">Step {step + 1} of {STEP_LABELS.length}</p>
          </div>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {STEP_LABELS.map((label, index) => (
              <div key={label}>
                <div className={`h-1.5 rounded-full ${index <= step ? "bg-vs-primary" : "bg-vs-border"}`} />
                <p className={`mt-2 hidden text-[10px] sm:block ${index === step ? "font-semibold text-vs-fg" : "text-vs-fg-muted"}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {step === 0 && (
          <StageShell eyebrow="START HERE" title="What are you thinking of building?" description="In the real product, you would type your own idea here. For this demo, we will use one simple example.">
            <Card className="border-vs-primary/25 bg-vs-primary/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Demo idea</p>
              <p className="mt-3 text-2xl font-semibold leading-9 text-vs-fg">“I want an app that stores receipts and reminds people before warranties, returns or rebates expire.”</p>
              <p className="mt-4 text-sm leading-6 text-vs-fg-muted">Sim Venture would now research the idea and separate what looks promising from what still needs proof.</p>
            </Card>
            <PrimaryAction onClick={() => go(1)}>Check this idea →</PrimaryAction>
          </StageShell>
        )}

        {step === 1 && (
          <StageShell eyebrow="STEP 1 · RESEARCH" title="Here’s what we found" description="The normal user sees the answer first. Detailed sources and evidence can stay inside Pro Mode.">
            <div className="grid gap-4 sm:grid-cols-2">
              <ResultCard icon="✓" title="The problem makes sense" text="People can lose money or value when receipts and important deadlines are scattered." />
              <ResultCard icon="?" title="One important thing is still unknown" text="We still need to know whether people care enough to keep using the app or pay for it." warning />
              <ResultCard icon="◫" title="Other solutions already exist" text="Receipt storage and warranty tools already exist, so simply storing receipts is probably not enough." />
              <ResultCard icon="→" title="A stronger direction" text="Focus on helping people act before they lose money, not just keeping a receipt archive." />
            </div>
            <div className="mt-5 rounded-vs-md border border-vs-border bg-vs-bg-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">What this means</p>
              <p className="mt-2 text-base leading-7 text-vs-fg">The idea is not “approved” or “rejected.” It has a clear problem, existing competition, and one possible direction worth testing next.</p>
            </div>
            <PrimaryAction onClick={() => go(2)}>Help me improve the idea →</PrimaryAction>
          </StageShell>
        )}

        {step === 2 && (
          <StageShell eyebrow="STEP 2 · IMPROVE" title="Let’s make the idea smaller and clearer" description="Instead of writing a business plan, the product helps turn the rough idea into a focused first version.">
            <div className="space-y-4">
              <PlainField question="Who should we focus on first?" answer="Busy households that often lose track of receipts and claim deadlines." />
              <PlainField question="What exact problem should version 1 solve?" answer="Missing return, warranty and rebate deadlines because dates and proof are scattered." />
              <PlainField question="What is the smallest useful first version?" answer="Upload a receipt → save the important deadline → remind the user → show what to do next." />
            </div>
            <Card className="mt-5 bg-vs-bg-subtle">
              <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Current version of the idea</p>
              <p className="mt-2 text-lg font-semibold leading-7 text-vs-fg">A deadline-first receipt assistant that helps households act before returns, rebates and warranty opportunities expire.</p>
            </Card>
            <PrimaryAction onClick={() => go(3)}>Test this version in the simulator →</PrimaryAction>
          </StageShell>
        )}

        {step === 3 && (
          <StageShell eyebrow="STEP 3 · SIMULATE" title="Now make a real decision" description="This is the core experience: the venture moves through time and your decisions change what happens next.">
            <div className="grid gap-3 sm:grid-cols-4">
              <Metric label="Starting budget" value="$12,000" />
              <Metric label="Virtual day" value="30" />
              <Metric label="Users" value="259" />
              <Metric label="Money left" value="$8,968" />
            </div>

            <Card className="mt-5 border-vs-primary/25">
              <Badge status="warning">SIMULATED SCENARIO</Badge>
              <h3 className="mt-3 text-2xl font-semibold text-vs-fg">The first version is taking longer than expected.</h3>
              <p className="mt-2 text-sm text-vs-fg-muted">What would you do?</p>
              <div className="mt-5 space-y-3">
                {CHOICES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setChoice(item.id)}
                    className={`w-full rounded-vs-md border p-4 text-left text-sm transition ${choice === item.id ? "border-vs-primary bg-vs-primary/5 font-semibold text-vs-fg" : "border-vs-border text-vs-fg hover:border-vs-primary/50"}`}
                  >
                    {choice === item.id ? "✓ " : ""}{item.label}
                  </button>
                ))}
              </div>
            </Card>

            {selected && (
              <Card className="mt-4 bg-vs-bg-subtle">
                <p className="text-xs font-semibold uppercase tracking-wide text-vs-primary">Consequence</p>
                <p className="mt-2 text-lg font-semibold leading-7 text-vs-fg">{selected.consequence}</p>
                <p className="mt-3 text-sm leading-6 text-vs-fg-muted">In the full product this decision stays in the venture timeline, and Standard Mode can create alternate timelines to compare another choice.</p>
              </Card>
            )}

            <PrimaryAction onClick={() => go(4)} disabled={!selected}>Turn the learning into a build plan →</PrimaryAction>
          </StageShell>
        )}

        {step === 4 && (
          <StageShell eyebrow="STEP 4 · BUILD + MONEY" title="Here is the first version to build" description="The product turns what was learned into a practical scope instead of giving the founder a giant feature list.">
            <div className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
              <Card>
                <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Build these first</p>
                <ol className="mt-4 space-y-3 text-sm text-vs-fg">
                  <li>1. Create an account</li>
                  <li>2. Take or upload a receipt</li>
                  <li>3. Save purchase details and deadline</li>
                  <li>4. Show approaching deadlines</li>
                  <li>5. Send reminders</li>
                  <li>6. Keep a basic claim/history record</li>
                </ol>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Leave for later</p>
                <ul className="mt-4 space-y-3 text-sm text-vs-fg-muted">
                  <li>• Retailer integrations</li>
                  <li>• Automatic claim submission</li>
                  <li>• Advanced AI classification</li>
                  <li>• Community/rewards</li>
                </ul>
              </Card>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-vs-primary">How could it make money?</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <MoneyCard title="Free + paid upgrade" text="Let people experience reminders first, then pay for advanced tracking or higher limits." recommended />
                <MoneyCard title="Monthly / yearly plan" text="Makes more sense if the app keeps creating value over many purchases." />
                <MoneyCard title="Pay once" text="Worth testing if people see it as a utility they buy rather than a continuing service." />
              </div>
              <p className="mt-3 text-xs text-vs-fg-muted">These are hypotheses to test, not proven prices or revenue forecasts.</p>
            </div>

            <PrimaryAction onClick={() => go(5)}>Practice the investor side →</PrimaryAction>
          </StageShell>
        )}

        {step === 5 && (
          <StageShell eyebrow="STEP 5 · INVESTOR + REALITY" title="Challenge the idea — then come back with real results" description="Investor World is practice. After launch, the real-world numbers remain separate from anything the simulator predicted.">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-vs-warning/30">
                <Badge status="warning">SIMULATED INVESTOR</Badge>
                <h3 className="mt-3 text-xl font-semibold text-vs-fg">Investor asks:</h3>
                <p className="mt-3 text-base leading-7 text-vs-fg">“Why would someone use this instead of leaving receipts in email or a retailer account?”</p>
                <div className="mt-4 rounded-vs-md bg-vs-bg-subtle p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Claim check</p>
                  <p className="mt-2 text-sm text-vs-fg"><strong>ASSUMPTION:</strong> Customers will pay for premium reminders.</p>
                  <p className="mt-1 text-xs text-vs-fg-muted">No willingness-to-pay evidence has been attached yet.</p>
                </div>
              </Card>

              <Card className="border-vs-primary/25">
                <Badge status="success">AFTER LAUNCH</Badge>
                <h3 className="mt-3 text-xl font-semibold text-vs-fg">Bring reality back into the venture</h3>
                <p className="mt-3 text-sm leading-6 text-vs-fg-muted">You can later enter real users, revenue, costs, retention and milestones. The product compares them with the simulation without pretending the simulation was reality.</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Metric label="Simulated users" value="540" />
                  <Metric label="Real users" value="Not added" />
                  <Metric label="Simulated revenue" value="$620/mo" />
                  <Metric label="Real revenue" value="Not added" />
                </div>
              </Card>
            </div>

            <Card className="mt-5 bg-vs-primary/5 text-center">
              <h3 className="text-2xl font-semibold text-vs-fg">That is the Sim Venture journey.</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-vs-fg-muted">Start with a rough idea. Understand it. Improve it. Simulate difficult choices. Decide what to build. Then bring back what really happened.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/sign-in"><Button>Try your own idea</Button></Link>
                <Button variant="secondary" onClick={() => { setChoice(null); go(0); }}>Restart demo</Button>
              </div>
            </Card>
          </StageShell>
        )}

        {step > 0 && step < 5 && (
          <button type="button" onClick={() => go(step - 1)} className="mt-6 text-sm text-vs-fg-muted hover:text-vs-fg hover:underline">← Back one step</button>
        )}
      </main>
    </div>
  );
}

function StageShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-vs-primary">{eyebrow}</p>
      <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-tight text-vs-fg sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-vs-fg-muted sm:text-base">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function PrimaryAction({ children, onClick, disabled = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <Button className="mt-6 min-w-[240px]" onClick={onClick} disabled={disabled}>{children}</Button>;
}

function ResultCard({ icon, title, text, warning = false }: { icon: string; title: string; text: string; warning?: boolean }) {
  return (
    <Card className={warning ? "border-vs-warning/30" : ""}>
      <div className="flex items-start gap-3">
        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${warning ? "bg-vs-warning/10 text-vs-warning" : "bg-vs-primary/10 text-vs-primary"}`}>{icon}</div>
        <div><h3 className="font-semibold text-vs-fg">{title}</h3><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{text}</p></div>
      </div>
    </Card>
  );
}

function PlainField({ question, answer }: { question: string; answer: string }) {
  return <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">{question}</p><p className="mt-2 text-lg font-semibold leading-7 text-vs-fg">{answer}</p></Card>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-vs-md border border-vs-border bg-vs-bg p-4"><p className="text-xs text-vs-fg-muted">{label}</p><p className="mt-1 text-xl font-semibold text-vs-fg">{value}</p></div>;
}

function MoneyCard({ title, text, recommended = false }: { title: string; text: string; recommended?: boolean }) {
  return <Card className={recommended ? "border-vs-primary/40 bg-vs-primary/5" : ""}>{recommended && <Badge status="primary">TEST FIRST</Badge>}<h3 className="mt-2 font-semibold text-vs-fg">{title}</h3><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{text}</p></Card>;
}
