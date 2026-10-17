"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type BarDatum = { label: string; value: number; display?: string };

/**
 * Single-series bar chart. One hue (violet-600 light / violet-500 dark, both
 * validated against their surfaces), thin bars with 4px rounded data-ends,
 * 2px gaps, a hover tooltip per bar, and a visually hidden table for screen readers.
 */
export default function BarChart({
  data,
  orientation = "vertical",
  title,
  height = 120,
  formatValue = (v) => String(v),
  className,
}: {
  data: BarDatum[];
  orientation?: "vertical" | "horizontal";
  title: string;
  height?: number;
  formatValue?: (v: number) => string;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const shown = (d: BarDatum) => d.display ?? formatValue(d.value);

  const table = (
    <table className="sr-only">
      <caption>{title}</caption>
      <tbody>
        {data.map((d) => (
          <tr key={d.label}>
            <th scope="row">{d.label}</th>
            <td>{shown(d)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (orientation === "horizontal") {
    return (
      <figure className={className}>
        <div aria-hidden className="space-y-2">
          {data.map((d) => (
            <div key={d.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-xs">
              <span className="truncate text-gray-600 dark:text-gray-300" title={d.label}>{d.label}</span>
              <div className="h-2.5 rounded-[4px] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-[4px] bg-violet-600 dark:bg-violet-500" style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }} />
              </div>
              <span className="tabular-nums text-gray-900 dark:text-white font-medium">{shown(d)}</span>
            </div>
          ))}
        </div>
        {table}
      </figure>
    );
  }

  return (
    <figure className={cn("relative", className)}>
      <div aria-hidden className="flex items-end gap-[2px] border-b border-gray-200 dark:border-gray-700" style={{ height }} onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => (
          // The hit target is the full column, larger than the bar itself.
          <div key={d.label} className="relative flex-1 h-full flex items-end cursor-default" onMouseEnter={() => setHover(i)}>
            <div
              className={cn(
                "w-full rounded-t-[4px] transition-opacity",
                d.value > 0 ? "bg-violet-600 dark:bg-violet-500" : "bg-gray-200 dark:bg-gray-800",
                hover !== null && hover !== i && "opacity-50"
              )}
              style={{ height: d.value > 0 ? `${Math.max(4, (d.value / max) * 100)}%` : 2 }}
            />
            {hover === i && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 whitespace-nowrap rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] px-2 py-1 shadow pointer-events-none">
                <span className="text-gray-300 dark:text-gray-500">{d.label}</span> · <span className="font-medium tabular-nums">{shown(d)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div aria-hidden className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
      {table}
    </figure>
  );
}
