"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Section } from "@/components/project/workspace/Section";
import CopyButton from "@/components/ui/CopyButton";
import { cn } from "@/lib/utils";
import type { ApiEndpoint, GeneratedBlueprint } from "@/types";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  POST: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  PUT: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  PATCH: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400",
  DELETE: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const curl = (e: ApiEndpoint) => {
  const hasBody = e.requestBody && e.requestBody !== "-" && e.method !== "GET";
  return [
    `curl -X ${e.method} "https://your-app.com${e.path}"`,
    `  -H "Authorization: Bearer $TOKEN"`,
    ...(hasBody ? [`  -H "Content-Type: application/json"`, `  -d '${e.requestBody}'`] : []),
  ].join(" \\\n");
};

export default function ApiTab({ blueprint }: { blueprint: GeneratedBlueprint }) {
  const [method, setMethod] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const methods = useMemo(() => [...new Set(blueprint.apiEndpoints.map((e) => e.method))], [blueprint.apiEndpoints]);
  const shown = blueprint.apiEndpoints
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => (!method || e.method === method) && (!query || `${e.path} ${e.desc}`.toLowerCase().includes(query.toLowerCase())));

  return (
    <Section title={`REST API · ${blueprint.apiEndpoints.length} endpoints`} section="api">
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <label className="relative flex-1">
          <span className="sr-only">Filter endpoints</span>
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by path or description"
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </label>
        <div className="flex flex-wrap gap-1">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => setMethod(method === m ? null : m)}
              aria-pressed={method === m}
              className={cn("text-xs font-mono font-medium rounded px-2 py-1 transition-all", METHOD_COLORS[m], method && method !== m && "opacity-40")}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {shown.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No endpoints match.</p>}
        {shown.map(({ e, i }) => {
          const expanded = open === i;
          return (
            <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-800">
              <button onClick={() => setOpen(expanded ? null : i)} aria-expanded={expanded} className="w-full flex items-start gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <span className={`text-xs font-medium px-2 py-1 rounded font-mono flex-shrink-0 w-16 text-center ${METHOD_COLORS[e.method] ?? "bg-gray-100 text-gray-700"}`}>{e.method}</span>
                <div className="min-w-0 flex-1">
                  <code className="text-sm text-gray-900 dark:text-white font-mono break-all">{e.path}</code>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{e.desc}</p>
                </div>
                <ChevronRight className={cn("w-4 h-4 text-gray-400 mt-1 transition-transform", expanded && "rotate-90")} />
              </button>
              {expanded && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-3 grid md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="font-medium text-gray-500 dark:text-gray-400 mb-1">Request body</p>
                    <pre className="font-mono bg-gray-50 dark:bg-gray-800 rounded-md p-2 whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">{e.requestBody || "—"}</pre>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500 dark:text-gray-400 mb-1">Response</p>
                    <pre className="font-mono bg-gray-50 dark:bg-gray-800 rounded-md p-2 whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">{e.responseBody || "—"}</pre>
                  </div>
                  {e.statusCodes && e.statusCodes.length > 0 && (
                    <div className="md:col-span-2 flex flex-wrap gap-1.5">
                      {e.statusCodes.map((sc) => (
                        <span key={sc} className={cn("font-mono rounded px-1.5 py-0.5", sc.startsWith("2") ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400")}>
                          {sc}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <CopyButton text={curl(e)} label="Copy as cURL" showLabel />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
