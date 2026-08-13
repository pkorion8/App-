"use client";

import { useState } from "react";

export function ScorecardActions({ summary }: { summary: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="flex flex-wrap gap-2 print:hidden">
    <button onClick={async () => { await navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="rounded-vs-sm bg-vs-primary px-4 py-2 text-sm font-semibold text-vs-primary-fg">{copied ? "Copied" : "Copy scorecard summary"}</button>
    <button onClick={() => window.print()} className="rounded-vs-sm border border-vs-border px-4 py-2 text-sm font-semibold text-vs-fg">Print / save PDF</button>
  </div>;
}
