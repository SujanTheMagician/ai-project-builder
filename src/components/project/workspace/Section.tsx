"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Wand2, X } from "lucide-react";
import { useWorkspace } from "./WorkspaceContext";
import { CREDIT_COSTS } from "@/lib/pricing";
import type { SectionKey } from "@/types";

const REFINE_IDEAS: Record<SectionKey, string[]> = {
  overview: ["Make requirements more specific", "Add accessibility requirements", "Focus on an MVP scope"],
  architecture: ["Use a fully serverless stack", "Optimise for lowest hosting cost", "Add caching and a queue"],
  database: ["Add multi-tenancy", "Add audit logging tables", "Use MongoDB instead"],
  api: ["Add pagination and filtering", "Switch to GraphQL", "Add webhook endpoints"],
  roadmap: ["Compress into 6 weeks", "Add a beta-testing phase", "Plan for a team of one"],
  cost: ["Convert to INR", "Assume a team of two", "Add a 15% contingency"],
};

/** Card wrapper for one blueprint area. `section` adds the "Refine with AI" control. */
export function Section({
  title,
  section,
  actions,
  children,
}: {
  title: string;
  section?: SectionKey;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 mb-4">
      <div className="flex items-center justify-between gap-2 mb-3 min-h-[28px]">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h3>
        <div className="flex items-center gap-1">
          {actions}
          {section && <RefineButton section={section} />}
        </div>
      </div>
      {children}
    </section>
  );
}

function RefineButton({ section }: { section: SectionKey }) {
  const { editable, refineSection, busySection } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!editable) return null;
  const busy = busySection === section;

  const run = async (text?: string) => {
    setOpen(false);
    if (await refineSection(section, text ?? instruction)) setInstruction("");
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busySection !== null}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs text-violet-700 dark:text-violet-300 rounded-md px-2 py-1 hover:bg-violet-50 dark:hover:bg-violet-950/40 disabled:opacity-50 transition-colors"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
        {busy ? "Rewriting…" : "Refine with AI"}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-900 dark:text-white">How should this section change?</p>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
          >
            <textarea
              autoFocus
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run();
              }}
              rows={2}
              maxLength={500}
              placeholder="e.g. Use PostgreSQL row-level security for tenants"
              className="w-full text-sm px-2.5 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
            <div className="flex flex-wrap gap-1 my-2">
              {REFINE_IDEAS[section].map((idea) => (
                <button key={idea} type="button" onClick={() => run(idea)} className="text-[11px] rounded-full border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-gray-600 dark:text-gray-400 hover:border-violet-300 hover:text-violet-700">
                  {idea}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">{CREDIT_COSTS.section_regeneration} credits · saved as a new version</span>
              <button type="submit" className="text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-3 py-1.5">
                {instruction.trim() ? "Rewrite" : "Just improve it"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
