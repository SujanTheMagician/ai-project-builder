"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FileText, Server, Database, Zap, Map, DollarSign,
  Download, CheckCircle, AlertCircle
} from "lucide-react";
import { cn, CATEGORY_COLORS } from "@/lib/utils";
import type { Project, GeneratedBlueprint, ApiEndpoint } from "@/types";

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
];

export default function ProjectBlueprintClient({
  project,
  blueprint,
}: {
  project: Project;
  blueprint: GeneratedBlueprint | null;
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const colors = CATEGORY_COLORS[project.category] ?? { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-300" };

const handleExport = async (format: string) => {
  if (format === "Markdown") {
    const content = `# ${project.name}

## Executive Summary
${blueprint.summary}

## Problem Statement
${blueprint.problem}

## Target Users
${blueprint.targetUsers}

## Functional Requirements
${blueprint.requirements.map((r) => `- ${r}`).join("\n")}

## Non-Functional Requirements
${blueprint.nonFunctional.map((r) => `- ${r}`).join("\n")}

## Technology Stack
${blueprint.tech.map((t) => `- **${t.layer}**: ${t.stack}`).join("\n")}

## API Endpoints
${blueprint.apiEndpoints.map((e) => `- ${e.method} ${e.path} — ${e.desc}`).join("\n")}

## Roadmap
${blueprint.roadmap.map((p) => `### Phase ${p.n}: ${p.title} (${p.dur})\n${p.tasks.map((t) => `- ${t}`).join("\n")}`).join("\n\n")}

## Cost Estimate
${blueprint.costRows.map((r) => `- ${r.label}: ${r.amount}`).join("\n")}

## Deployment Strategy
${blueprint.deploymentStrategy}
`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Markdown ✓");

  } else if (format === "PDF") {
    const content = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${project.name}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #111; }
  h1 { color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; }
  h2 { color: #374151; margin-top: 32px; border-left: 4px solid #7c3aed; padding-left: 12px; }
  h3 { color: #4b5563; }
  .badge { background: #ede9fe; color: #6d28d9; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
  .meta { color: #6b7280; font-size: 14px; margin-bottom: 32px; }
  ul { padding-left: 20px; line-height: 1.8; }
  .tech-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .tech-item { background: #f9fafb; padding: 10px 14px; border-radius: 8px; border: 1px solid #e5e7eb; }
  .tech-layer { font-size: 11px; text-transform: uppercase; color: #9ca3af; font-weight: 600; }
  .api-row { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f3f4f6; align-items: center; }
  .method { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; min-width: 52px; text-align: center; }
  .GET { background: #dcfce7; color: #166534; }
  .POST { background: #dbeafe; color: #1e40af; }
  .PUT { background: #fef9c3; color: #854d0e; }
  .DELETE { background: #fee2e2; color: #991b1b; }
  .path { font-family: monospace; font-size: 13px; }
  .cost-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
  .cost-total { font-weight: 700; color: #7c3aed; }
  .phase { margin-bottom: 16px; }
  .phase-num { display: inline-block; background: #ede9fe; color: #6d28d9; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-size: 12px; font-weight: 700; margin-right: 8px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<span class="badge">${project.category}</span>
<h1>${project.name}</h1>
<p class="meta">${project.description}</p>

<h2>Executive Summary</h2>
<p>${blueprint.summary}</p>

<h2>Problem Statement</h2>
<p>${blueprint.problem}</p>

<h2>Target Users</h2>
<p>${blueprint.targetUsers}</p>

<h2>Functional Requirements</h2>
<ul>${blueprint.requirements.map((r) => `<li>${r}</li>`).join("")}</ul>

<h2>Non-Functional Requirements</h2>
<ul>${blueprint.nonFunctional.map((r) => `<li>${r}</li>`).join("")}</ul>

<h2>Technology Stack</h2>
<div class="tech-grid">
${blueprint.tech.map((t) => `<div class="tech-item"><div class="tech-layer">${t.layer}</div><div>${t.stack}</div></div>`).join("")}
</div>

<h2>API Endpoints</h2>
${blueprint.apiEndpoints.map((e) => `<div class="api-row"><span class="method ${e.method}">${e.method}</span><span class="path">${e.path}</span><span style="color:#6b7280;font-size:13px">${e.desc}</span></div>`).join("")}

<h2>Development Roadmap</h2>
${blueprint.roadmap.map((p) => `<div class="phase"><span class="phase-num">${p.n}</span><strong>${p.title}</strong> — <em>${p.dur}</em><ul>${p.tasks.map((t) => `<li>${t}</li>`).join("")}</ul></div>`).join("")}

<h2>Sprint Plan</h2>
${blueprint.sprints.map((s) => `<h3>${s.title}</h3><ul>${s.tasks.map((t) => `<li>${t}</li>`).join("")}</ul>`).join("")}

<h2>Cost Estimate</h2>
${blueprint.costRows.map((r, i) => `<div class="cost-row ${i === blueprint.costRows.length - 1 ? "cost-total" : ""}"><span>${r.label}</span><span>${r.amount}</span></div>`).join("")}

<h2>Deployment Strategy</h2>
<p>${blueprint.deploymentStrategy}</p>

<p style="margin-top:48px;color:#9ca3af;font-size:12px;text-align:center">Generated by ProjectAI · Sujan Anandh · ${new Date().toLocaleDateString()}</p>
</body>
</html>`;

    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        URL.revokeObjectURL(url);
      };
    }
    toast.success("PDF ready — click Save as PDF in print dialog ✓");

  } else if (format === "DOCX") {
    const content = `${project.name}\n${"=".repeat(project.name.length)}\n\nCategory: ${project.category}\n${project.description}\n\nEXECUTIVE SUMMARY\n${"-".repeat(20)}\n${blueprint.summary}\n\nPROBLEM STATEMENT\n${"-".repeat(20)}\n${blueprint.problem}\n\nFUNCTIONAL REQUIREMENTS\n${"-".repeat(25)}\n${blueprint.requirements.map((r) => `• ${r}`).join("\n")}\n\nTECHNOLOGY STACK\n${"-".repeat(18)}\n${blueprint.tech.map((t) => `${t.layer}: ${t.stack}`).join("\n")}\n\nCOST ESTIMATE\n${"-".repeat(15)}\n${blueprint.costRows.map((r) => `${r.label}: ${r.amount}`).join("\n")}\n\nDEPLOYMENT STRATEGY\n${"-".repeat(22)}\n${blueprint.deploymentStrategy}\n\nGenerated by ProjectAI · Sujan Anandh`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as DOCX ✓");
  }
};

  if (!blueprint) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="w-10 h-10 text-gray-300 dark:text-gray-700" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Blueprint not generated yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium mb-2 ${colors.bg} ${colors.text}`}>{project.category}</span>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{project.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{project.description}</p>
        </div>
        <div className="flex gap-2">
          {["PDF", "Markdown", "DOCX"].map((fmt) => (
            <button key={fmt} onClick={() => handleExport(fmt)} className="inline-flex items-center gap-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400 transition-colors">
              <Download className="w-3 h-3" />{fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
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
        <div className="grid grid-cols-2 gap-3">
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
            <table className="w-full text-xs">
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
            </table>
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
