"use client";

import { useMemo, useState } from "react";
import { equityDeal } from "@venture-sandbox/domain";

export function DealCalculator() {
  const [investment, setInvestment] = useState(250000);
  const [preMoney, setPreMoney] = useState(2000000);
  const [pool, setPool] = useState(10);
  const deal = useMemo(() => equityDeal({ investment, preMoney, employeePoolPct: pool }), [investment, preMoney, pool]);
  return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-3"><label className="text-sm text-vs-fg">Investment<input className="mt-1 w-full rounded-vs-md border border-vs-border bg-vs-bg p-2" type="number" min={5000} value={investment} onChange={e=>setInvestment(Number(e.target.value))}/></label><label className="text-sm text-vs-fg">Pre-money valuation<input className="mt-1 w-full rounded-vs-md border border-vs-border bg-vs-bg p-2" type="number" min={100000} value={preMoney} onChange={e=>setPreMoney(Number(e.target.value))}/></label><label className="text-sm text-vs-fg">Employee pool %<input className="mt-1 w-full rounded-vs-md border border-vs-border bg-vs-bg p-2" type="number" min={0} max={30} value={pool} onChange={e=>setPool(Number(e.target.value))}/></label></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Post-money", `$${deal.postMoney.toLocaleString()}`],["Founder ownership", `${deal.founderPct.toFixed(1)}%`],["Investor ownership", `${deal.investorPct.toFixed(1)}%`],["Founder dilution", `${deal.founderDilutionPct.toFixed(1)}%`]].map(([k,v])=><div key={k} className="rounded-vs-md border border-vs-border bg-vs-bg-subtle p-4"><p className="text-xs uppercase tracking-wide text-vs-fg-muted">{k}</p><p className="mt-2 text-xl font-semibold text-vs-fg">{v}</p></div>)}</div></div>;
}
