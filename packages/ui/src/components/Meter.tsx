import { cn } from "../utils/cn";

export interface MeterProps {
  label: string;
  value: number;
  max: number;
  valueLabel?: string;
  className?: string;
}

/** A single ratio against a limit (e.g. "3 of 13 newcomers") -- fill + a lighter step of the same ramp as the track. */
export function Meter({ label, value, max, valueLabel, className }: MeterProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;
  return (
    <div className={cn("", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-vs-fg-muted">{label}</p>
        <p className="text-xs font-semibold text-vs-fg">{valueLabel ?? `${value} / ${max}`}</p>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-vs-primary/15">
        <div
          className="h-full rounded-full bg-vs-primary transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
