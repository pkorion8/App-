"use client";

import { useMemo, useState } from "react";
import { equityDeal } from "@venture-sandbox/domain";
import { saveSimulatedOffer } from "./actions";

export function DealCalculator({ ventureId, sessionId, initialInvestment = 250000, initialPreMoney = 2000000, initialPool = 10 }: { ventureId: string; sessionId: string; initialInvestment?: number; initialPreMoney?: number; initialPool?: number }) {
  const [investment, setInvestment] = useState(initialInvestment);
  const [preMoney, setPreMoney] = useState(initialPreMoney);
  const [pool, setPool] = useState(initialPool);
  const deal = useMemo(() => equityDeal({ investment, preMoney, employeePoolPct: pool }), [investment, preMoney, pool]);
  return <form action={saveSimulatedOffer} className="space-y-5">
    <input type="hidden" name="ventureId" value={ventureId}/><input type="hidden" name="sessionId" value={sessionId}/>
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-sm text-vs-fg">Investment<input name="investment" className="mt-1 w-full rounded-vs-md border border-vs-border bg-vs-bg p-2" type="number" min={5000} max={5000000} value={investment} onChange={e=>setInvestment(Number(e.target.value))}/></label>
      <label className="text-sm text-vs-fg">Pre-money valuation<input name="preMoney" className="mt-1 w-full rounded-vs-md border border-vs-border bg-vs-bg p-2" type="number" min={100000} max={50000000} value={preMoney} onChange={e=>setPreMoney(Number(e.target.value))}/></label>
      <label className="text-sm text-vs-fg">Employee pool %<input name="employeePoolPct" className="mt-1 w-full rounded-vs-md border border-vs-border bg-vs-bg p-2" type="number" min={0} max={30} value={pool} onChange={e=>setPool(Number(e.target.value))}/></label>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Post-money", `$${deal.postMoney.toLocaleString()}`],["Founder ownership", `${deal.founderPct.toFixed(1)}%`],["Investor ownership", `${deal.investorPct.toFixed(1)}%`],["Founder dilution", `${deal.founderDilutionPct.toFixed(1)}%`]].map(([k,v])=><div key={k} className="rounded-vs-md border border-vs-border bg-vs-bg-subtle p-4"><p className="text-xs uppercase tracking-wide text-vs-fg-muted">{k}</p><p className="mt-2 text-xl font-semibold text-vs-fg">{v}</p></div>)}</div>
    <div className="flex flex-wrap gap-2"><button name="intent" value="offer" className="rounded-vs-sm bg-vs-primary px-4 py-2 text-sm font-semibold text-vs-primary-fg">Save simulated offer</button><button name="intent" value="counter" className="rounded-vs-sm border border-vs-primary/30 px-4 py-2 text-sm font-semibold text-vs-primary">Save founder counter</button></div>
    <p className="text-xs text-vs-fg-muted">Inputs are bounded by deterministic rules. Saving creates a persisted simulated offer; it is not legal or valuation advice.</p>
  </form>;
}
