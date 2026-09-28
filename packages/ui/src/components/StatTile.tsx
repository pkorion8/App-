import { cn } from "../utils/cn";

export interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}

/** Contract: label (sentence case, no trailing colon) + value (semibold, auto-compact) + optional hint. */
export function StatTile({ label, value, hint, className }: StatTileProps) {
  return (
    <div className={cn("rounded-vs-lg border border-vs-border bg-white/55 p-5", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-vs-fg-muted">{label}</p>
      <p className="mt-2 text-3xl font-medium tracking-tight text-vs-fg">{value}</p>
      {hint && <p className="mt-1 text-xs text-vs-fg-muted">{hint}</p>}
    </div>
  );
}
