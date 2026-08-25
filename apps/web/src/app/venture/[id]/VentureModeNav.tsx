"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type RouteKey = "research" | "shape" | "monetization" | "simulate" | "build" | "monitor";

type JourneyItem = {
  route: RouteKey;
  simple: string;
  pro: string;
  icon: string;
  active: string;
  dot: string;
};

const journey: JourneyItem[] = [
  { route: "research", simple: "Check the problem", pro: "Research", icon: "⌕", active: "border-indigo-300 bg-indigo-50 text-indigo-800", dot: "bg-indigo-500" },
  { route: "shape", simple: "Make it better", pro: "Shape", icon: "◇", active: "border-emerald-300 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
  { route: "monetization", simple: "How it can make money", pro: "Monetization", icon: "$", active: "border-violet-300 bg-violet-50 text-violet-800", dot: "bg-violet-500" },
  { route: "simulate", simple: "Simulate it", pro: "Simulator", icon: "▶", active: "border-amber-300 bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  { route: "build", simple: "Plan the build", pro: "Build", icon: "▦", active: "border-sky-300 bg-sky-50 text-sky-800", dot: "bg-sky-500" },
  { route: "monitor", simple: "Learn from reality", pro: "Learn", icon: "↗", active: "border-rose-300 bg-rose-50 text-rose-800", dot: "bg-rose-500" },
];

const intelligence = [
  ["Evidence", "evidence", "≡"],
  ["Technology", "technology", "⌘"],
  ["Feed", "feed", "◌"],
  ["Investor World", "investor", "◎"],
  ["Scorecard", "scorecard", "▤"],
  ["System", "system", "⚙"],
] as const;

export function VentureModeNav({ ventureId }: { ventureId: string }) {
  const pathname = usePathname();
  const [mode, setMode] = useState<"simple" | "pro">("simple");

  useEffect(() => {
    const saved = window.localStorage.getItem("venture-ui-mode");
    if (saved === "pro") setMode("pro");
  }, []);

  function choose(next: "simple" | "pro") {
    setMode(next);
    window.localStorage.setItem("venture-ui-mode", next);
    window.dispatchEvent(new CustomEvent("venture-mode-change", { detail: next }));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-vs-fg-muted">
          {mode === "simple" ? "Simple mode · one clear job at each stage" : "Pro mode · full venture intelligence and advanced tools"}
        </p>
        <div className="inline-flex rounded-full border border-vs-border bg-vs-bg-subtle p-1" aria-label="Experience mode">
          <button type="button" onClick={() => choose("simple")} className={`rounded-full px-3 py-1 text-xs font-semibold ${mode === "simple" ? "bg-vs-primary text-vs-primary-fg shadow-sm" : "text-vs-fg-muted"}`}>Simple</button>
          <button type="button" onClick={() => choose("pro")} className={`rounded-full px-3 py-1 text-xs font-semibold ${mode === "pro" ? "bg-vs-primary text-vs-primary-fg shadow-sm" : "text-vs-fg-muted"}`}>Pro</button>
        </div>
      </div>

      <nav aria-label="Venture journey" className="flex gap-2 overflow-x-auto pb-1">
        {journey.map((item, index) => {
          const active = pathname.includes(`/venture/${ventureId}/${item.route}`);
          return (
            <Link key={item.route} href={`/venture/${ventureId}/${item.route}`} className={`group flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${active ? item.active : "border-transparent bg-vs-bg text-vs-fg-muted hover:border-vs-border hover:bg-vs-bg-subtle hover:text-vs-fg"}`}>
              <span className={`grid h-7 w-7 place-items-center rounded-lg text-sm ${active ? "bg-white/75 shadow-sm" : "bg-vs-bg-subtle"}`}>{item.icon}</span>
              <span className="flex flex-col leading-tight"><span>{mode === "simple" ? item.simple : item.pro}</span><span className="mt-0.5 text-[10px] font-medium opacity-60">Stage {index + 1}</span></span>
              {active && <span className={`ml-1 h-2 w-2 rounded-full ${item.dot}`} aria-hidden />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-vs-border/70 pt-2">
        <Link href={`/venture/${ventureId}/compare`} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${pathname.includes(`/venture/${ventureId}/compare`) ? "bg-slate-900 text-white" : "border border-vs-border bg-vs-bg text-vs-fg hover:bg-vs-bg-subtle"}`}><span>⇄</span>Compare with another idea</Link>
        <Link href="/explore" className="flex items-center gap-1.5 rounded-lg border border-vs-border bg-vs-bg px-3 py-2 text-xs font-semibold text-vs-fg hover:bg-vs-bg-subtle"><span>⌕</span>Explore more ideas</Link>
        {mode === "simple" && <Link href={`/venture/${ventureId}/investor`} className="flex items-center gap-1.5 rounded-lg border border-vs-border bg-vs-bg px-3 py-2 text-xs font-semibold text-vs-fg hover:bg-vs-bg-subtle"><span>◎</span>Practice investor meeting</Link>}
      </div>

      {mode === "pro" ? (
        <nav aria-label="Venture intelligence" className="mt-2 flex gap-1 overflow-x-auto border-t border-vs-border/70 pt-2">
          <span className="shrink-0 px-2 py-2 text-[10px] font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Deep tools</span>
          {intelligence.map(([label, route, icon]) => {
            const active = pathname.includes(`/venture/${ventureId}/${route}`);
            return <Link key={route} href={`/venture/${ventureId}/${route}`} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${active ? "bg-slate-900 text-white" : "text-vs-fg-muted hover:bg-vs-bg-subtle hover:text-vs-fg"}`}><span>{icon}</span>{label}</Link>;
          })}
        </nav>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-vs-border/70 pt-2 text-xs text-vs-fg-muted">
          <span>Need evidence sources, technology details or scorecards?</span>
          <button type="button" onClick={() => choose("pro")} className="shrink-0 rounded-full bg-vs-bg-subtle px-3 py-1.5 font-semibold text-vs-primary">Open Pro tools</button>
        </div>
      )}
    </div>
  );
}
