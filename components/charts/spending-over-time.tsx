"use client";

import { useState } from "react";

import { ChartFrame } from "./chart-frame";
import { formatMoney } from "@/lib/format";
import type { MonthPoint } from "@/lib/analytics";

/**
 * Spending by month — a single series, so an area with one hue rather than a
 * categorical palette. No legend: the title names the series.
 *
 * Hover gives a crosshair and a tooltip, which is the default for a line or
 * area chart rather than an extra.
 */
export function SpendingOverTime({
  points,
  currency,
}: {
  points: MonthPoint[];
  currency: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  if (points.length === 0) return null;

  const width = 640;
  const height = 200;
  const pad = { top: 12, right: 12, bottom: 26, left: 12 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const peak = Math.max(...points.map((p) => p.totalMinor), 1);
  const x = (i: number) =>
    pad.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (value: number) => pad.top + plotH - (value / peak) * plotH;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.totalMinor)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${pad.top + plotH} L${x(0)},${pad.top + plotH} Z`;

  return (
    <ChartFrame
      title="Spending over time"
      subtitle={`By month, in ${currency}`}
      table={
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-tertiary">
              <th scope="col" className="pb-1 text-start font-medium">Month</th>
              <th scope="col" className="pb-1 text-end font-medium">Spent</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.month} className="border-t border-border-subtle">
                <th scope="row" className="py-1.5 text-start font-normal">{p.label}</th>
                <td className="tabular py-1.5 text-end font-mono">
                  {formatMoney(p.totalMinor, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="img"
          aria-label={`Spending by month, peaking at ${formatMoney(peak, currency)}`}
          onMouseLeave={() => setActive(null)}
        >
          {/* Recessive gridlines — context, not content. */}
          {[0.25, 0.5, 0.75, 1].map((step) => (
            <line
              key={step}
              x1={pad.left}
              x2={width - pad.right}
              y1={y(peak * step)}
              y2={y(peak * step)}
              className="stroke-chart-grid"
              strokeWidth="1"
            />
          ))}

          <path d={area} className="fill-chart-1/12" />
          <path
            d={line}
            className="stroke-chart-1"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p, i) => (
            <circle
              key={p.month}
              cx={x(i)}
              cy={y(p.totalMinor)}
              r={active === i ? 5 : 3.5}
              className="fill-chart-1 stroke-surface"
              strokeWidth="2"
            />
          ))}

          {active !== null ? (
            <line
              x1={x(active)}
              x2={x(active)}
              y1={pad.top}
              y2={pad.top + plotH}
              className="stroke-chart-1/40"
              strokeWidth="1"
            />
          ) : null}

          {/* Hit targets wider than the marks, so hovering is easy. */}
          {points.map((p, i) => (
            <rect
              key={`hit-${p.month}`}
              x={x(i) - plotW / Math.max(points.length, 1) / 2}
              y={pad.top}
              width={plotW / Math.max(points.length, 1)}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
            />
          ))}

          {points.map((p, i) => (
            <text
              key={`label-${p.month}`}
              x={x(i)}
              y={height - 8}
              textAnchor="middle"
              className="fill-text-tertiary text-[10px]"
            >
              {points.length > 8 && i % 2 === 1 ? "" : p.label}
            </text>
          ))}
        </svg>

        {active !== null ? (
          <div
            role="status"
            className="pointer-events-none absolute -top-1 rounded-md border border-border bg-surface px-2.5 py-1.5 shadow-md"
            style={{
              left: `${(x(active) / width) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <p className="text-[0.625rem] text-text-secondary">{points[active].label}</p>
            <p className="tabular font-mono text-xs font-medium">
              {formatMoney(points[active].totalMinor, currency)}
            </p>
          </div>
        ) : null}
      </div>
    </ChartFrame>
  );
}
