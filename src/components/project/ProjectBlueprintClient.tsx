"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FileText, Server, Database, Zap, Map, DollarSign,
  Download, CheckCircle, AlertCircle, Loader2, RefreshCw, Sparkles, Trash2,
} from "lucide-react";
import { cn, CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from "@/lib/utils";
import { exportDocx, exportMarkdown, exportPdf } from "@/lib/export";
import type { GeneratedBlueprint, ApiEndpoint } from "@/types";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  POST: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  PUT: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  DELETE: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  PATCH: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400",
};

const TABS = [
  { key: "overview", label: "Overview", icon: FileText },
  { key: "architecture", label: "Architecture", icon: Server },
  { key: "database", label: "Database", icon: Database },
  { key: "api", label: "API design", icon: Zap },
  { key: "roadmap", label: "Roadmap", icon: Map },
  { key: "cost", label: "Cost", icon: DollarSign },
] as const;

type TabKey = (typeof TABS)[number]["key"];
type ExportFormat = "PDF" | "Markdown" | "DOCX";

type BlueprintProject = { id: string; name: string; category: string; description: string };

export default function ProjectBlueprintClient({
  project,
  blueprint,
}: {
  project: BlueprintProject;
  blueprint: GeneratedBlueprint | null;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const colors = CATEGORY_COLORS[project.category] ?? DEFAULT_CATEGORY_COLOR;

  const handleGenerate = async () => {
    if (blueprint && !window.confirm("Regenerate this blueprint? This uses AI credits and replaces the current version.")) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "AI generation failed");
      toast.success("Blueprint generated!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete “${project.name}”? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      toast.success("Project deleted");
      router.push("/projects");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
      setIsDeleting(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!blueprint) return;
    setExporting(format);
    try {
      if (format === "Markdown") {
        exportMarkdown(project, blueprint);
        toast.success("Exported as Markdown");
      } else if (format === "DOCX") {
        await exportDocx(project, blueprint);
        toast.success("Exported as DOCX");
      } else if (exportPdf(project, blueprint)) {
        toast.success("Choose “Save as PDF” in the print dialog");
      } else {
        toast.error("Please allow pop-ups to export as PDF");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to export ${format}`);
    } finally {
      setExporting(null);
    }
  };

  const header = (
    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium mb-2 ${colors.bg} ${colors.text}`}>{project.category}</span>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white break-words">{project.name}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{project.description}</p>
      </div>
      <div className="flex flex-wrap gap-2 flex-shrink-0">
        {blueprint && (
          <>
            {(["PDF", "Markdown", "DOCX"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                disabled={exporting !== null}
                className="inline-flex items-center gap-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400 transition-colors disabled:opacity-60"
              >
                {exporting === fmt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                {fmt}
              </button>
            ))}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 text-xs border border-violet-200 dark:border-violet-800 rounded-lg px-3 py-1.5 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={cn("w-3 h-3", isGenerating && "animate-spin")} />
              {isGenerating ? "Regenerating..." : "Regenerate"}
            </button>
          </>
        )}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label="Delete project"
          className="inline-flex items-center gap-1.5 text-xs border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-60"
        >
          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          Delete
        </button>
      </div>
    </div>
  );

  if (!blueprint) {
    return (
      <div className="max-w-4xl">
        {header}
        <div className="flex flex-col items-center justify-center text-center py-20 px-4 gap-3 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <AlertCircle className="w-10 h-10 text-gray-300 dark:text-gray-700" />
          <p className="text-sm text-gray-600 dark:text-gray-400">This project doesn&apos;t have a blueprint yet.</p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-2 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGenerating ? "Generating — this can take up to a minute..." : "Generate blueprint"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {header}

      {/* Tabs */}
      <div role="tablist" className="flex gap-1 mb-6 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 text-sm px-3 py-2 border-b-2 -mb-px transition-colors whitespace-nowrap",
              activeTab === tab.key
                ? "border-violet-500 text-violet-700 dark:text-violet-300 font-medium"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />{tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === "overview" && <OverviewTab blueprint={blueprint} />}
        {activeTab === "architecture" && <ArchitectureTab blueprint={blueprint} />}
        {activeTab === "database" && <DatabaseTab blueprint={blueprint} />}
        {activeTab === "api" && <ApiTab blueprint={blueprint} />}
        {activeTab === "roadmap" && <RoadmapTab blueprint={blueprint} />}
        {activeTab === "cost" && <CostTab blueprint={blueprint} />}
      </motion.div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 mb-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{title}</h3>
      {children}
    </div>
  );
}

function OverviewTab({ blueprint }: { blueprint: GeneratedBlueprint }) {
  return (
    <div>
      <Section title="Executive summary">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{blueprint.summary}</p>
      </Section>
      <Section title="Problem statement">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{blueprint.problem}</p>
      </Section>
      <Section title="Functional requirements">
        <ul className="space-y-2">
          {(blueprint.requirements || []).map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />{r}
            </li>
          ))}
        </ul>
      </Section>
      {blueprint.userStories?.length > 0 && (
        <Section title="User stories">
          <ul className="space-y-2">
            {blueprint.userStories.map((s, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-gray-300 pl-3 border-l-2 border-violet-200 dark:border-violet-800">{s}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function ArchitectureTab({ blueprint }: { blueprint: GeneratedBlueprint }) {
  return (
    <div>
      <Section title="Technology stack">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(blueprint.tech || []).map((t) => (
            <div key={t.layer} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t.layer}</p>
              <p className="text-sm text-gray-900 dark:text-white">{t.stack}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Folder structure">
        <pre className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto leading-6 whitespace-pre-wrap">{blueprint.folderStructure}</pre>
      </Section>
      {blueprint.deploymentStrategy && (
        <Section title="Deployment strategy">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{blueprint.deploymentStrategy}</p>
        </Section>
      )}
    </div>
  );
}

function DatabaseTab({ blueprint }: { blueprint: GeneratedBlueprint }) {
  return (
    <Section title="Database schema">
      <div className="space-y-4">
        {(blueprint.dbTables || []).map((table) => (
          <div key={table.name} className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">{table.name}</span>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">Column</th>
                  <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                  <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">Key</th>
                </tr>
              </thead>
              <tbody>
                {table.cols.map((col, ci) => (
                  <tr key={ci} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                    <td className="px-4 py-2 font-mono text-gray-900 dark:text-white">{col.n}</td>
                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400 font-mono">{col.t}</td>
                    <td className="px-4 py-2">
                      {col.k === "PK" && <span className="text-xs px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300">PK</span>}
                      {col.k === "FK" && <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300">FK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ApiTab({ blueprint }: { blueprint: GeneratedBlueprint }) {
  return (
    <Section title="REST API endpoints">
      <div className="space-y-2">
        {(blueprint.apiEndpoints || []).map((ep: ApiEndpoint, i: number) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
            <span className={`text-xs font-medium px-2 py-1 rounded font-mono flex-shrink-0 ${METHOD_COLORS[ep.method] || "bg-gray-100 text-gray-700"}`}>{ep.method}</span>
            <div className="min-w-0 flex-1">
              <code className="text-sm text-gray-900 dark:text-white font-mono">{ep.path}</code>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ep.desc}</p>
              {ep.statusCodes && (
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {ep.statusCodes.map((sc) => (
                    <span key={sc} className="text-xs text-gray-400 dark:text-gray-500 font-mono">{sc}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function RoadmapTab({ blueprint }: { blueprint: GeneratedBlueprint }) {
  return (
    <div>
      <Section title="Development phases">
        <div className="space-y-4">
          {(blueprint.roadmap || []).map((phase) => (
            <div key={phase.n} className="flex gap-4">
              <div className="w-8 h-8 bg-violet-50 dark:bg-violet-950/50 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium text-violet-700 dark:text-violet-300 mt-0.5">{phase.n}</div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{phase.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{phase.dur}</p>
                {phase.tasks?.length > 0 && (
                  <ul className="space-y-1">
                    {phase.tasks.map((task, ti) => (
                      <li key={ti} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />{task}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Sprint plan">
        <div className="space-y-3">
          {(blueprint.sprints || []).map((sprint) => (
            <div key={sprint.title} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{sprint.title}</p>
              <ul className="space-y-1.5">
                {sprint.tasks.map((task, ti) => (
                  <li key={ti} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />{task}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function CostTab({ blueprint }: { blueprint: GeneratedBlueprint }) {
  return (
    <Section title="Cost estimation">
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {(blueprint.costRows || []).map((row, i) => (
          <div key={i} className={cn("flex items-center justify-between py-3 text-sm", i === (blueprint.costRows.length - 1) && "font-medium text-gray-900 dark:text-white")}>
            <span className={i === (blueprint.costRows.length - 1) ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}>{row.label}</span>
            <span className="font-mono font-medium">{row.amount}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
