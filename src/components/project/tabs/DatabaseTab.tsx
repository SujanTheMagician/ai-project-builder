"use client";

import { useMemo, useState } from "react";
import { Database } from "lucide-react";
import { Section } from "@/components/project/workspace/Section";
import CopyButton from "@/components/ui/CopyButton";
import ERDiagram from "./ERDiagram";
import { relations, toSqlDdl } from "@/lib/blueprint-tools";
import { cn } from "@/lib/utils";
import type { GeneratedBlueprint } from "@/types";

const VIEWS = [
  { key: "diagram", label: "Diagram" },
  { key: "tables", label: "Tables" },
  { key: "sql", label: "SQL" },
] as const;

export default function DatabaseTab({ blueprint }: { blueprint: GeneratedBlueprint }) {
  const [view, setView] = useState<(typeof VIEWS)[number]["key"]>("diagram");
  const tables = blueprint.dbTables;
  const sql = useMemo(() => toSqlDdl(tables), [tables]);
  const relCount = useMemo(() => relations(tables).length, [tables]);

  const switcher = (
    <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 mr-1" role="tablist" aria-label="Schema view">
      {VIEWS.map((v) => (
        <button
          key={v.key}
          role="tab"
          aria-selected={view === v.key}
          onClick={() => setView(v.key)}
          className={cn("text-xs rounded-md px-2.5 py-1", view === v.key ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400")}
        >
          {v.label}
        </button>
      ))}
    </div>
  );

  return (
    <Section title={`Database schema · ${tables.length} tables · ${relCount} relationships`} section="database" actions={switcher}>
      {view === "diagram" && (
        <>
          <p className="text-xs text-gray-400 mb-3">Hover a table to highlight its relationships. Arrows point from a foreign key to the table it references.</p>
          <div className="overflow-x-auto">
            <ERDiagram tables={tables} />
          </div>
        </>
      )}

      {view === "tables" && (
        <div className="space-y-4">
          {tables.map((table) => (
            <div key={table.name} className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">{table.name}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">Column</th>
                      <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                      <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">Key</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.cols.map((col) => (
                      <tr key={col.n} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                        <td className="px-4 py-2 font-mono text-gray-900 dark:text-white">{col.n}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400 font-mono">{col.t}</td>
                        <td className="px-4 py-2">
                          {col.k === "PK" && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">PK</span>}
                          {col.k === "FK" && <span className="text-xs px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300">FK</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "sql" && (
        <div className="relative">
          <CopyButton text={sql} label="Copy SQL" showLabel className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90" />
          <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto leading-5">{sql}</pre>
          <p className="text-xs text-gray-400 mt-2">PostgreSQL DDL generated from the schema. Foreign keys are inferred from column names — review before running.</p>
        </div>
      )}
    </Section>
  );
}
