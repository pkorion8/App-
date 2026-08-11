import { cn } from "../utils/cn";

export interface BarListItem {
  label: string;
  sublabel?: string;
  value: number;
  valueLabel: string;
  tag?: string;
}

export interface BarListProps {
  items: BarListItem[];
  className?: string;
}

/**
 * Ranked horizontal bars, one hue (magnitude is the job; identity/rank
 * comes from position and the direct value label, never a second hue) --
 * a per-item `tag` (e.g. "NEW") is a secondary text encoding, not a
 * color swap, so it never competes with the magnitude channel.
 */
export function BarList({ items, className }: BarListProps) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, i) => {
        const pct = Math.max(3, Math.round((item.value / max) * 100));
        return (
          <div key={`${item.label}-${i}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 text-sm text-vs-fg">
                <span className="truncate">{item.label}</span>
                {item.tag && (
                  <span className="shrink-0 rounded-vs-sm bg-vs-success/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-vs-success">
                    {item.tag}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-sm font-semibold text-vs-fg">{item.valueLabel}</span>
            </div>
            {item.sublabel && <p className="truncate text-xs text-vs-fg-muted">{item.sublabel}</p>}
            <div className="mt-1 h-2 w-full rounded-full bg-vs-bg-subtle">
              <div className="h-2 rounded-full bg-vs-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
