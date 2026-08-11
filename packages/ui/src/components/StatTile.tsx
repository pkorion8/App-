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
    <div className={cn("rounded-vs-md border border-vs-border bg-vs-bg-subtle p-4", className)}>
      <p className="text-xs text-vs-fg-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-vs-fg">{value}</p>
      {hint && <p className="mt-1 text-xs text-vs-fg-muted">{hint}</p>}
    </div>
  );
}
