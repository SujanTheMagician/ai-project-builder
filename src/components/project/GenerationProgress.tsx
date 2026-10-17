"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SectionState } from "@/hooks/useBlueprintGeneration";
import type { SectionKey } from "@/types";

const LABELS: Record<SectionKey, { title: string; detail: string }> = {
  overview: { title: "Overview", detail: "Summary, requirements and user stories" },
  architecture: { title: "Architecture", detail: "Tech stack, folder structure, deployment" },
  database: { title: "Database", detail: "Tables, columns and relationships" },
  api: { title: "API design", detail: "Endpoints, payloads and status codes" },
  roadmap: { title: "Roadmap", detail: "Phases and sprint plan" },
  cost: { title: "Cost", detail: "Budget breakdown" },
};

export default function GenerationProgress({ sections, status }: { sections: Record<SectionKey, SectionState>; status: string | null }) {
  const entries = Object.entries(sections) as [SectionKey, SectionState][];
  const done = entries.filter(([, s]) => s === "done").length;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5" role="status" aria-live="polite">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">Generating your blueprint</p>
        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{done}/{entries.length}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        {status ?? "Usually 30–60 seconds. You can leave this page — the result is saved when it finishes."}
      </p>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-violet-600 transition-all duration-500" style={{ width: `${Math.max(4, (done / entries.length) * 100)}%` }} />
      </div>
      <ul className="space-y-2.5">
        {entries.map(([key, state]) => (
          <li key={key} className="flex items-start gap-3">
            {state === "done" ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            ) : state === "writing" ? (
              <Loader2 className="w-4 h-4 text-violet-500 animate-spin mt-0.5 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-gray-300 dark:text-gray-700 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className={cn("text-sm", state === "pending" ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white")}>{LABELS[key].title}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{LABELS[key].detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
