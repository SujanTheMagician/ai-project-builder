"use client";

import { Section } from "@/components/project/workspace/Section";
import BarChart from "@/components/ui/BarChart";
import { parseAmount } from "@/lib/blueprint-tools";
import { cn } from "@/lib/utils";
import type { GeneratedBlueprint } from "@/types";

export default function CostTab({ blueprint }: { blueprint: GeneratedBlueprint }) {
  const rows = blueprint.costRows;
  const total = rows[rows.length - 1];
  const items = rows.slice(0, -1);
  const chartData = items
    .map((r) => ({ label: r.label, value: parseAmount(r.amount) ?? 0, display: r.amount }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      {total && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">{total.label}</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-1 tabular-nums">{total.amount}</p>
          {total.note && <p className="text-xs text-gray-400 mt-1">{total.note}</p>}
        </div>
      )}

      {chartData.length > 1 && (
        <Section title="Where the money goes">
          <BarChart orientation="horizontal" title="Cost by line item" data={chartData} />
          <p className="text-[11px] text-gray-400 mt-3">Bars compare the amounts as written; mixed units (one-off vs monthly) are not normalised.</p>
        </Section>
      )}

      <Section title="Line items" section="cost">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row, i) => {
            const isTotal = i === rows.length - 1;
            return (
              <div key={i} className={cn("flex items-start justify-between gap-4 py-3 text-sm", isTotal && "font-medium")}>
                <div>
                  <p className={isTotal ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}>{row.label}</p>
                  {row.note && <p className="text-xs text-gray-400 mt-0.5">{row.note}</p>}
                </div>
                <span className="font-mono font-medium text-gray-900 dark:text-white whitespace-nowrap">{row.amount}</span>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
