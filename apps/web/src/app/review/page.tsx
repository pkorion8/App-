"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Card } from "@venture-sandbox/ui";

type ModuleKey = "home" | "research" | "shape" | "money" | "simulate" | "build" | "learn" | "investor" | "evidence" | "technology";

const modules: { key: ModuleKey; icon: string; label: string; simple: string; tone: string }[] = [
  { key: "home", icon: "⌂", label: "Venture Home", simple: "Where am I?", tone: "bg-slate-950 text-white" },
  { key: "research", icon: "⌕", label: "Research", simple: "Is this problem real?", tone: "bg-blue-600 text-white" },
  { key: "shape", icon: "◇", label: "Shape", simple: "Make the idea better", tone: "bg-violet-600 text-white" },
  { key: "money", icon: "$", label: "Monetization", simple: "How could it make money?", tone: "bg-emerald-600 text-white" },
  { key: "simulate", icon: "▶", label: "Simulator", simple: "Test the idea", tone: "bg-orange-500 text-white" },
  { key: "build", icon: "▦", label: "Build", simple: "Plan what to build", tone: "bg-cyan-700 text-white" },
  { key: "learn", icon: "↺", label: "Learn", simple: "What actually happened?", tone: "bg-pink-600 text-white" },
  { key: "investor", icon: "♟", label: "Investor World", simple: "Practice an investor meeting", tone: "bg-amber-600 text-white" },
  { key: "evidence", icon: "◎", label: "Evidence", simple: "See the proof", tone: "bg-indigo-700 text-white" },
  { key: "technology", icon: "⚙", label: "Technology", simple: "How hard is this to build?", tone: "bg-slate-700 text-white" },
];

export default function ReviewPage() {
  const [active, setActive] = useState<ModuleKey>("home");
  const [mode, setMode] = useState<"simple" | "pro">("simple");
  const current = useMemo(() => modules.find((m) => m.key === active)!, [active]);

  return (
    <div className="min-h-screen bg-vs-bg">
      <header className="sticky top-0 z-40 border-b border-vs-border bg-vs-bg/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="font-semibold text-vs-fg">Sim Venture</Link>
          <Badge status="warning">FULL REVIEW MODE · FICTIONAL DATA</Badge>
          <div className="ml-auto inline-flex rounded-full border border-vs-border bg-vs-bg-subtle p-1">
            {(["simple", "pro"] as const).map((item) => <button key={item} onClick={() => setMode(item)} className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${mode === item ? "bg-vs-primary text-vs-primary-fg" : "text-vs-fg-muted"}`}>{item}</button>)}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-vs-border p-4 lg:min-h-[calc(100vh-61px)] lg:border-b-0 lg:border-r lg:p-5">
          <div className="mb-4 rounded-2xl border border-vs-border bg-vs-bg-subtle p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Demo venture</p>
            <h2 className="mt-2 font-semibold text-vs-fg">ClaimKeeper</h2>
            <p className="mt-1 text-xs leading-5 text-vs-fg-muted">A receipt assistant that warns households before returns, rebates and warranties expire.</p>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {modules.filter((m) => mode === "pro" || !["evidence","technology"].includes(m.key)).map((m) => (
              <button key={m.key} onClick={() => setActive(m.key)} className={`group flex min-w-[170px] items-center gap-3 rounded-xl border px-3 py-3 text-left transition lg:min-w-0 ${active === m.key ? "border-transparent bg-vs-bg-subtle shadow-sm" : "border-transparent hover:border-vs-border"}`}>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${m.tone}`}>{m.icon}</span>
                <span><span className="block text-sm font-semibold text-vs-fg">{mode === "simple" ? m.simple : m.label}</span><span className="mt-0.5 block text-[10px] uppercase tracking-wide text-vs-fg-muted">{m.label}</span></span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mb-7 flex flex-col gap-4 border-b border-vs-border pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-3"><span className={`grid h-12 w-12 place-items-center rounded-2xl text-xl font-bold ${current.tone}`}>{current.icon}</span><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-vs-fg-muted">{current.label}</p><h1 className="text-3xl font-semibold tracking-tight text-vs-fg">{mode === "simple" ? current.simple : current.label}</h1></div></div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-vs-fg-muted">{purpose(active)}</p>
            </div>
            <div className="rounded-xl border border-vs-border bg-vs-bg-subtle px-4 py-3 text-xs text-vs-fg-muted"><strong className="text-vs-fg">Review question:</strong> Does this screen clearly give you something new?</div>
          </div>

          {active === "home" && <HomeView onGo={setActive} />}
          {active === "research" && <ResearchView pro={mode === "pro"} />}
          {active === "shape" && <ShapeView />}
          {active === "money" && <MoneyView />}
          {active === "simulate" && <SimulatorView />}
          {active === "build" && <BuildView />}
          {active === "learn" && <LearnView />}
          {active === "investor" && <InvestorView />}
          {active === "evidence" && <EvidenceView />}
          {active === "technology" && <TechnologyView />}
        </main>
      </div>
    </div>
  );
}

function purpose(key: ModuleKey) {
  const map: Record<ModuleKey,string> = {
    home:"See the venture's current state, what changed, and the single most useful next action.",
    research:"Find out whether the problem appears real, what people use today, and what remains unknown.",
    shape:"Turn research into a sharper customer, problem, promise and first product version.",
    money:"Compare realistic ways the product could make money and identify what must be tested before assuming revenue.",
    simulate:"Move the venture through time, make decisions, and see consequences without pretending they are predictions.",
    build:"Convert the chosen venture into a practical version-one scope, roadmap and implementation path.",
    learn:"Keep real outcomes separate from simulations, then update the venture based on what actually happened.",
    investor:"Practice a live investor conversation where weak answers can be challenged and the meeting can end early.",
    evidence:"Inspect the sources behind conclusions and see which claims are strong, mixed, assumed or unknown.",
    technology:"Understand technical difficulty, dependencies, ownership risk and the easiest viable build route."
  }; return map[key];
}

function HomeView({ onGo }: { onGo: (k: ModuleKey) => void }) {
  return <div className="space-y-6">
    <section className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
      <div className="rounded-3xl bg-slate-950 p-7 text-white"><p className="text-xs font-semibold uppercase tracking-[.2em] text-white/60">Current venture</p><h2 className="mt-3 text-3xl font-semibold">A deadline-first receipt assistant</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Research suggests the problem is understandable, but willingness to pay is still unproven. The current first version focuses on reminders before value expires.</p><button onClick={() => onGo("simulate")} className="mt-6 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950">Continue with the simulator →</button></div>
      <Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">What changed recently</p><div className="mt-4 space-y-4"><Change icon="⌕" title="Research" text="Existing receipt tools make generic storage less differentiated."/><Change icon="◇" title="Shape" text="Focus changed from receipt archive to deadline action."/><Change icon="$" title="Money" text="Free + paid upgrade is the first model to test."/></div></Card>
    </section>
    <section className="grid gap-3 md:grid-cols-4"><Status label="Problem" value="Understandable" state="good"/><Status label="Competition" value="Crowded" state="warn"/><Status label="Payment" value="Unproven" state="warn"/><Status label="Build" value="Feasible MVP" state="good"/></section>
  </div>;
}

function ResearchView({ pro }: { pro: boolean }) { return <div className="space-y-5">
  <div className="grid gap-4 md:grid-cols-2"><Insight icon="✓" title="Strong signal" text="The user pain is easy to understand: receipts and deadlines become scattered, and missing them can cost money." tone="good"/><Insight icon="?" title="Biggest unknown" text="We still do not know whether people care enough to maintain the app or pay for premium reminders." tone="warn"/><Insight icon="◫" title="Existing alternatives" text="Receipt storage, retailer accounts and warranty tools already solve parts of the job."/><Insight icon="→" title="Opportunity to test" text="A deadline-first workflow may be more useful than another generic receipt archive."/></div>
  {pro && <Card><div className="flex items-center justify-between"><h3 className="font-semibold text-vs-fg">Evidence coverage</h3><Badge status="warning">MIXED</Badge></div><div className="mt-5 grid gap-4 md:grid-cols-3"><Metric name="Traceable findings" value="7 / 9"/><Metric name="Unresolved questions" value="2"/><Metric name="Live sources" value="6"/></div><p className="mt-4 text-xs text-vs-fg-muted">These are research-completeness measures, not a success probability.</p></Card>}
</div>; }

function ShapeView() { return <div className="grid gap-5 xl:grid-cols-[1fr_1fr]"><Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Before</p><h3 className="mt-3 text-xl font-semibold text-vs-fg">“An app that stores receipts and tracks warranties.”</h3><p className="mt-3 text-sm text-vs-fg-muted">Too broad. It describes storage, not the outcome people care about.</p></Card><div className="rounded-3xl bg-violet-600 p-6 text-white"><p className="text-xs font-semibold uppercase tracking-wide text-white/70">Current shape</p><h3 className="mt-3 text-2xl font-semibold">Help busy households act before money or purchase value expires.</h3><div className="mt-6 grid gap-3 sm:grid-cols-2"><Mini label="Who" value="Busy households"/><Mini label="First problem" value="Missed return / rebate / warranty deadlines"/><Mini label="Promise" value="Know what expires next and what to do"/><Mini label="MVP" value="Receipt → deadline → reminder → next action"/></div></div></div>; }

function MoneyView() { return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-3"><Money title="Free + paid upgrade" note="Best first hypothesis" strong/><Money title="Subscription" note="Works only if recurring value is strong"/><Money title="One-time purchase" note="Simpler, but may cap ongoing revenue"/></div><Card><h3 className="font-semibold text-vs-fg">Before assuming revenue, test these</h3><div className="mt-4 grid gap-3 md:grid-cols-3"><Test n="1" text="Will users keep adding purchases?"/><Test n="2" text="Which reminder features feel worth paying for?"/><Test n="3" text="What price causes drop-off?"/></div></Card></div>; }

function SimulatorView() {
  const [choice,setChoice]=useState<"cut"|"delay"|"spend"|null>(null);
  return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-4"><Status label="Virtual day" value="30" state="neutral"/><Status label="Money left" value="$8,968" state="good"/><Status label="Users" value="259" state="neutral"/><Status label="Rewinds" value="3 left" state="neutral"/></div><div className="rounded-3xl border-2 border-orange-400/40 bg-orange-50/40 p-6 dark:bg-orange-950/10"><div className="flex flex-wrap items-center gap-2"><Badge status="warning">SIMULATED EVENT</Badge><span className="text-xs text-vs-fg-muted">Month 2</span></div><h3 className="mt-4 text-2xl font-semibold text-vs-fg">The first version is taking longer than expected.</h3><p className="mt-2 text-sm text-vs-fg-muted">You planned 14 features. Cash is falling before real user feedback arrives.</p><div className="mt-5 grid gap-3 md:grid-cols-3">{[["cut","Cut features and launch smaller"],["delay","Keep everything and delay"],["spend","Spend more to speed up"]].map(([id,label])=><button key={id} onClick={()=>setChoice(id as any)} className={`rounded-2xl border p-4 text-left text-sm font-semibold ${choice===id?"border-orange-500 bg-orange-100/60 dark:bg-orange-950/20":"border-vs-border bg-vs-bg"}`}>{label}</button>)}</div></div>{choice&&<Card><p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Consequence</p><p className="mt-2 text-lg font-semibold text-vs-fg">{choice==="cut"?"You preserve more cash and reach feedback earlier, but postpone nice-to-have features.":choice==="delay"?"You launch a fuller product, but consume more runway before learning from users.":"You move faster, but reduce the cash available for marketing and later experiments."}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-vs-bg-subtle"><div className={`h-full bg-orange-500 ${choice==="cut"?"w-2/3":choice==="delay"?"w-1/3":"w-1/2"}`}/></div><p className="mt-2 text-xs text-vs-fg-muted">The full simulator should connect this decision to later events and allow branch comparison.</p></Card>}</div>;
}

function BuildView(){return <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><Card><h3 className="text-lg font-semibold text-vs-fg">Version 1 roadmap</h3><div className="mt-5 space-y-4">{["Capture or upload receipt","Save purchase + important deadline","Upcoming-deadline home screen","Reminder notification","Simple claim / action history"].map((x,i)=><div key={x} className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cyan-700 text-xs font-bold text-white">{i+1}</span><div><p className="font-medium text-vs-fg">{x}</p><p className="text-xs text-vs-fg-muted">Included because it directly supports the first problem.</p></div></div>)}</div></Card><div className="space-y-4"><Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Do not build yet</p><ul className="mt-3 space-y-2 text-sm text-vs-fg-muted"><li>• Retailer integrations</li><li>• Automatic claim submission</li><li>• Community rewards</li><li>• Advanced AI categorization</li></ul></Card><Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Easiest path</p><p className="mt-2 text-lg font-semibold text-vs-fg">Web app first</p><p className="mt-2 text-sm text-vs-fg-muted">Validate the reminder workflow before spending on a more complex native build.</p></Card></div></div>}

function LearnView(){return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><div className="rounded-3xl bg-pink-600 p-6 text-white"><p className="text-xs font-semibold uppercase tracking-wide text-white/70">Simulation expected</p><div className="mt-5 grid grid-cols-2 gap-4"><Mini label="Users" value="540"/><Mini label="Revenue" value="$620/mo"/><Mini label="Runway" value="5.2 months"/><Mini label="Key risk" value="Weak retention"/></div></div><Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Real outcome</p><div className="mt-5 grid grid-cols-2 gap-4"><Metric name="Users" value="Not added"/><Metric name="Revenue" value="Not added"/><Metric name="Retention" value="Not added"/><Metric name="Costs" value="Not added"/></div><p className="mt-4 text-sm text-vs-fg-muted">Nothing is treated as real until the founder records a real outcome.</p></Card></div><Card><h3 className="font-semibold text-vs-fg">What this page should eventually do</h3><p className="mt-2 text-sm leading-6 text-vs-fg-muted">Compare assumptions and simulated expectations with real outcomes, show which beliefs changed, and recommend the next experiment or product decision.</p></Card></div>}

function InvestorView(){const [reply,setReply]=useState(""); const [sent,setSent]=useState(false); return <div className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]"><div className="rounded-3xl bg-slate-950 p-6 text-white"><div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-full bg-amber-500 text-2xl">♟</div><div><p className="text-xs uppercase tracking-wide text-white/50">Operator Angel</p><h3 className="text-xl font-semibold">Maya Chen</h3><p className="text-xs text-white/60">Customer pain · founder judgment · execution</p></div></div><div className="mt-6 grid grid-cols-2 gap-3"><Mini label="Meeting" value="06:42"/><Mini label="Stage" value={sent&&reply.toLowerCase().includes("stupid")?"Ended":"Screening"}/><Mini label="Trust" value={sent&&reply.toLowerCase().includes("stupid")?"Broken":"Uncertain"}/><Mini label="Clarity" value={reply.length>80?"Improving":"Uncertain"}/></div><p className="mt-6 text-xs leading-5 text-white/60">SIMULATED REHEARSAL · not a prediction of real investor interest.</p></div><div className="space-y-4"><Card><p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Investor asks</p><h3 className="mt-2 text-xl font-semibold text-vs-fg">Why would someone use this instead of leaving receipts in email or a retailer account?</h3><textarea value={reply} onChange={e=>{setReply(e.target.value);setSent(false)}} rows={5} placeholder="Answer naturally, or use the microphone in the signed-in experience." className="mt-4 w-full rounded-xl border border-vs-border bg-vs-bg p-3 text-sm text-vs-fg"/><div className="mt-3 flex gap-2"><Button onClick={()=>setSent(true)} disabled={!reply.trim()}>Send answer</Button><Button variant="secondary">🎙 Speak</Button></div></Card>{sent&&<Card className={reply.toLowerCase().includes("stupid")?"border-vs-danger/40":"border-vs-warning/30"}><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Investor reaction</p><p className="mt-2 text-base font-semibold text-vs-fg">{reply.toLowerCase().includes("stupid")?"I don't think this conversation is productive. I'm ending the meeting here.":reply.length<35?"That does not answer the question clearly enough. Give me a specific customer reason, not a general statement.":/\b\d{3,}\b/.test(reply)?"You just introduced a numerical claim. What evidence supports that number?":"That is clearer. Now tell me what evidence would prove this behavior actually exists."}</p></Card>}</div></div>}

function EvidenceView(){return <div className="space-y-4">{[["SUPPORTED","People can lose value when return or warranty deadlines are missed.","Source-backed finding"],["PARTIAL","Existing receipt tools cover storage, but deadline-first positioning may differ.","Mixed competitive evidence"],["ASSUMPTION","Users will pay for premium reminders.","No willingness-to-pay test yet"],["UNKNOWN","How often users will keep adding purchases after month one.","Needs retention test"]].map(([state,text,note])=><Card key={state}><div className="flex flex-col gap-3 sm:flex-row sm:items-start"><Badge status={state==="SUPPORTED"?"success":state==="ASSUMPTION"?"warning":"primary"}>{state}</Badge><div><p className="font-medium text-vs-fg">{text}</p><p className="mt-1 text-xs text-vs-fg-muted">{note}</p></div></div></Card>)}</div>}
function TechnologyView(){return <div className="grid gap-4 md:grid-cols-2"><Insight icon="✓" title="MVP feasibility" text="Receipt upload, deadline storage and notifications are standard application capabilities." tone="good"/><Insight icon="⚠" title="Harder later" text="Automatic retailer integrations and claim submission create dependency, security and maintenance complexity." tone="warn"/><Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Lowest-risk first architecture</p><p className="mt-2 text-lg font-semibold text-vs-fg">Web app + managed database + notification service</p><p className="mt-2 text-sm text-vs-fg-muted">Enough to test the core behavior before investing in deeper integrations.</p></Card><Card><p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Technical unknown</p><p className="mt-2 text-lg font-semibold text-vs-fg">How reliably can dates be extracted from messy receipts?</p><p className="mt-2 text-sm text-vs-fg-muted">Prototype extraction quality before making AI automation central to the promise.</p></Card></div>}

function Change({icon,title,text}:{icon:string;title:string;text:string}){return <div className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-vs-bg text-sm font-bold text-vs-primary">{icon}</span><div><p className="text-sm font-semibold text-vs-fg">{title}</p><p className="text-xs leading-5 text-vs-fg-muted">{text}</p></div></div>}
function Status({label,value,state}:{label:string;value:string;state:"good"|"warn"|"neutral"}){return <Card className={state==="good"?"border-vs-success/30":state==="warn"?"border-vs-warning/30":""}><p className="text-[10px] font-semibold uppercase tracking-wide text-vs-fg-muted">{label}</p><p className="mt-2 text-xl font-semibold text-vs-fg">{value}</p></Card>}
function Insight({icon,title,text,tone}:{icon:string;title:string;text:string;tone?:"good"|"warn"}){return <Card className={tone==="good"?"border-vs-success/30":tone==="warn"?"border-vs-warning/30":""}><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-vs-bg-subtle font-bold text-vs-primary">{icon}</span><div><h3 className="font-semibold text-vs-fg">{title}</h3><p className="mt-2 text-sm leading-6 text-vs-fg-muted">{text}</p></div></div></Card>}
function Metric({name,value}:{name:string;value:string}){return <div><p className="text-[10px] font-semibold uppercase tracking-wide text-vs-fg-muted">{name}</p><p className="mt-1 text-2xl font-semibold text-vs-fg">{value}</p></div>}
function Mini({label,value}:{label:string;value:string}){return <div><p className="text-[10px] font-semibold uppercase tracking-wide opacity-60">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>}
function Money({title,note,strong=false}:{title:string;note:string;strong?:boolean}){return <Card className={strong?"border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/10":""}><div className="flex items-center justify-between"><h3 className="font-semibold text-vs-fg">{title}</h3>{strong&&<Badge status="success">TEST FIRST</Badge>}</div><p className="mt-3 text-sm leading-6 text-vs-fg-muted">{note}</p></Card>}
function Test({n,text}:{n:string;text:string}){return <div className="flex gap-3 rounded-xl bg-vs-bg-subtle p-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">{n}</span><p className="text-sm text-vs-fg">{text}</p></div>}
