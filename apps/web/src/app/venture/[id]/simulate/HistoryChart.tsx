"use client";

import { useRef, useState } from "react";

interface Point {
  day: number;
  value: number;
}

const WIDTH = 320;
const HEIGHT = 120;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 10;
const PAD_BOTTOM = 20;

function formatValue(value: number, format: "currency" | "number"): string {
  if (format === "currency") {
    return `$${Math.round(value).toLocaleString()}`;
  }
  return Math.round(value).toLocaleString();
}

/**
 * A single-series line chart (small multiple) with a hover crosshair +
 * tooltip. One measure per chart, never dual-axis -- Cash/Users/Revenue
 * live in three of these side by side rather than one chart with three
 * scales fighting each other.
 */
export function HistoryChart({
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
        <p className="text-xs text-vs-fg-muted">Not enough days yet to chart.</p>
      </div>
    );
  }

  const first = points[0]!;
  const last = points[points.length - 1]!;
  const minDay = first.day;
  const maxDay = last.day;
  const values = points.map((p) => p.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 1);

  const xFor = (day: number) => {
    const t = maxDay === minDay ? 0 : (day - minDay) / (maxDay - minDay);
    return PAD_LEFT + t * (WIDTH - PAD_LEFT - PAD_RIGHT);
  };
  const yFor = (value: number) => {
    const t = maxValue === minValue ? 0 : (value - minValue) / (maxValue - minValue);
    return HEIGHT - PAD_BOTTOM - t * (HEIGHT - PAD_TOP - PAD_BOTTOM);
  };

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.day)} ${yFor(p.value)}`).join(" ");

  const handleMove: React.PointerEventHandler<SVGSVGElement> = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(xFor(p.day) - relX);
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
        <circle cx={xFor(last.day)} cy={yFor(last.value)} r={4} fill="rgb(var(--vs-color-primary))" stroke="rgb(var(--vs-color-bg))" strokeWidth={2} />

        {hovered && (
          <g>
            <line
              x1={xFor(hovered.day)}
              y1={PAD_TOP}
              x2={xFor(hovered.day)}
              y2={HEIGHT - PAD_BOTTOM}
              stroke="rgb(var(--vs-color-border))"
              strokeWidth={1}
            />
            <circle
              cx={xFor(hovered.day)}
              cy={yFor(hovered.value)}
              r={4}
              fill="rgb(var(--vs-color-primary))"
              stroke="rgb(var(--vs-color-bg))"
              strokeWidth={2}
            />
          </g>
        )}

        <text x={PAD_LEFT} y={HEIGHT - 4} fontSize={9} fill="rgb(var(--vs-color-fg-muted))">
          Day {minDay}
        </text>
        <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 4} fontSize={9} fill="rgb(var(--vs-color-fg-muted))" textAnchor="end">
          Day {maxDay}
        </text>
      </svg>
      {hovered && (
        <p className="text-xs text-vs-fg-muted">
          Day {hovered.day}: <span className="font-medium text-vs-fg">{formatValue(hovered.value, format)}</span>
        </p>
      )}
    </div>
  );
}
