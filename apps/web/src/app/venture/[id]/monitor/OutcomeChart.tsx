"use client";

import { useRef, useState } from "react";

interface Point {
  reportedAt: string;
  value: number;
}

const WIDTH = 320;
const HEIGHT = 120;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 10;
const PAD_BOTTOM = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatValue(value: number, format: "currency" | "number"): string {
  if (format === "currency") return `$${Math.round(value).toLocaleString()}`;
  return Math.round(value).toLocaleString();
}

/** Same single-series small-multiple line chart as Simulate's HistoryChart, keyed by real timestamp instead of virtual day. */
export function OutcomeChart({
  title,
  points,
  format,
}: {
  title: string;
  points: Point[];
  format: "currency" | "number";
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-vs-fg-muted">{title}</p>
        <p className="text-xs text-vs-fg-muted">Add at least 2 entries to chart a trend.</p>
      </div>
    );
  }

  const times = points.map((p) => new Date(p.reportedAt).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const values = points.map((p) => p.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 1);

  const xFor = (t: number) => {
    const ratio = maxTime === minTime ? 0 : (t - minTime) / (maxTime - minTime);
    return PAD_LEFT + ratio * (WIDTH - PAD_LEFT - PAD_RIGHT);
  };
  const yFor = (value: number) => {
    const ratio = maxValue === minValue ? 0 : (value - minValue) / (maxValue - minValue);
    return HEIGHT - PAD_BOTTOM - ratio * (HEIGHT - PAD_TOP - PAD_BOTTOM);
  };

  const first = points[0]!;
  const last = points[points.length - 1]!;
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(new Date(p.reportedAt).getTime())} ${yFor(p.value)}`)
    .join(" ");

  const handleMove: React.PointerEventHandler<SVGSVGElement> = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(xFor(new Date(p.reportedAt).getTime()) - relX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  };

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-vs-fg-muted">{title}</p>
        <p className="text-sm font-medium text-vs-fg">{formatValue(last.value, format)}</p>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <line
          x1={PAD_LEFT}
          y1={HEIGHT - PAD_BOTTOM}
          x2={WIDTH - PAD_RIGHT}
          y2={HEIGHT - PAD_BOTTOM}
          stroke="rgb(var(--vs-color-border))"
          strokeWidth={1}
        />
        <path d={linePath} fill="none" stroke="rgb(var(--vs-color-primary))" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle
          cx={xFor(new Date(last.reportedAt).getTime())}
          cy={yFor(last.value)}
          r={4}
          fill="rgb(var(--vs-color-primary))"
          stroke="rgb(var(--vs-color-bg))"
          strokeWidth={2}
        />

        {hovered && (
          <g>
            <line
              x1={xFor(new Date(hovered.reportedAt).getTime())}
              y1={PAD_TOP}
              x2={xFor(new Date(hovered.reportedAt).getTime())}
              y2={HEIGHT - PAD_BOTTOM}
              stroke="rgb(var(--vs-color-border))"
              strokeWidth={1}
            />
            <circle
              cx={xFor(new Date(hovered.reportedAt).getTime())}
              cy={yFor(hovered.value)}
              r={4}
              fill="rgb(var(--vs-color-primary))"
              stroke="rgb(var(--vs-color-bg))"
              strokeWidth={2}
            />
          </g>
        )}

        <text x={PAD_LEFT} y={HEIGHT - 4} fontSize={9} fill="rgb(var(--vs-color-fg-muted))">
          {formatDate(first.reportedAt)}
        </text>
        <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 4} fontSize={9} fill="rgb(var(--vs-color-fg-muted))" textAnchor="end">
          {formatDate(last.reportedAt)}
        </text>
      </svg>
      {hovered && (
        <p className="text-xs text-vs-fg-muted">
          {formatDate(hovered.reportedAt)}: <span className="font-medium text-vs-fg">{formatValue(hovered.value, format)}</span>
        </p>
      )}
    </div>
  );
}
