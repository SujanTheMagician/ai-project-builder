"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import toast from "react-hot-toast";
import { Archive, ArchiveRestore, ChevronDown, ChevronRight, Copy, Download, Loader2, MessageCircle, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { useWorkspace } from "./WorkspaceContext";
import TagPicker from "./TagPicker";
import ShareDialog from "./ShareDialog";
import GenerationProgress from "@/components/project/GenerationProgress";
import { useBlueprintGeneration } from "@/hooks/useBlueprintGeneration";
import { exportDocx, exportJson, exportMarkdown, exportPdf } from "@/lib/export";
import { ensureOk } from "@/lib/stream";
import { CREDIT_COSTS } from "@/lib/pricing";
import { cn, CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR, formatRelativeTime } from "@/lib/utils";
import type { GeneratedBlueprint, Tag } from "@/types";

type HeaderProject = { id: string; name: string; category: string; description: string; status: string };

const itemClass =
  "flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-md outline-none cursor-pointer text-gray-700 dark:text-gray-300 data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-800";

export default function ProjectHeader({
  project,
  blueprint,
  version,
  versionDate,
  tags,
  allTags,
}: {
  project: HeaderProject;
  blueprint: GeneratedBlueprint | null;
  version: number | null;
  versionDate: string | null;
  tags: Tag[];
  allTags: Tag[];
}) {
  const router = useRouter();
  const { chatOpen, setChatOpen } = useWorkspace();
  const { generate, isGenerating, sections, status } = useBlueprintGeneration();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const colors = CATEGORY_COLORS[project.category] ?? DEFAULT_CATEGORY_COLOR;

  const regenerate = async () => {
    if (!window.confirm(`Regenerate the whole blueprint? This uses ${CREDIT_COSTS.blueprint_generation} credits and saves a new version — the current one stays in History.`)) return;
    try {
      const { version: v } = await generate(project.id);
      toast.success(`Blueprint regenerated — version ${v}`);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const doExport = async (format: "PDF" | "Markdown" | "DOCX" | "JSON") => {
    if (!blueprint) return;
    try {
      if (format === "Markdown") exportMarkdown(project, blueprint);
      else if (format === "JSON") exportJson(project, blueprint);
      else if (format === "DOCX") await exportDocx(project, blueprint);
      else if (!exportPdf(project, blueprint)) return toast.error("Please allow pop-ups to export as PDF");
      toast.success(format === "PDF" ? "Choose “Save as PDF” in the print dialog" : `Exported as ${format}`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to export ${format}`);
    }
  };

  const mutate = async (action: "duplicate" | "archive" | "restore" | "delete") => {
    if (action === "delete" && !window.confirm(`Delete “${project.name}”? Every version is removed permanently.`)) return;
    setBusy(true);
    try {
      if (action === "duplicate") {
        const res = await fetch(`/api/projects/${project.id}/duplicate`, { method: "POST" });
        await ensureOk(res, "Failed to duplicate");
        const { project: copy } = await res.json();
        toast.success("Duplicated — opening the copy");
        router.push(`/projects/${copy.id}`);
      } else if (action === "delete") {
        await ensureOk(await fetch(`/api/projects/${project.id}`, { method: "DELETE" }), "Failed to delete");
        toast.success("Project deleted");
        router.push("/projects");
        router.refresh();
      } else {
        const status = action === "archive" ? "archived" : blueprint ? "generated" : "draft";
        const res = await fetch(`/api/projects/${project.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
        await ensureOk(res, "Failed to update project");
        toast.success(action === "archive" ? "Project archived" : "Project restored");
        router.refresh();
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
        <Link href="/projects" className="hover:text-gray-900 dark:hover:text-white">Projects</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 dark:text-white truncate max-w-[16rem]" aria-current="page">{project.name}</span>
      </nav>

      {project.status === "archived" && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
          This project is archived and hidden from your project list.
          <button onClick={() => mutate("restore")} className="text-xs font-medium underline underline-offset-2">Restore</button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>{project.category}</span>
            <TagPicker projectId={project.id} tags={tags} allTags={allTags} />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white break-words">{project.name}</h1>
          <p className={cn("text-sm text-gray-500 dark:text-gray-400 mt-0.5 max-w-3xl", !expanded && "line-clamp-2")}>{project.description}</p>
          {project.description.length > 180 && (
            <button onClick={() => setExpanded((e) => !e)} className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">{expanded ? "Show less" : "Show more"}</button>
          )}
          {version && versionDate && (
            <p className="text-[11px] text-gray-400 mt-1.5">
              Version {version} · updated {formatRelativeTime(versionDate)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {blueprint && (
            <>
              <button
                onClick={() => setChatOpen(!chatOpen)}
                aria-pressed={chatOpen}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 transition-colors",
                  chatOpen ? "border-violet-400 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400"
                )}
              >
                <MessageCircle className="w-3.5 h-3.5" /> Ask AI
              </button>
              <ShareDialog projectId={project.id} />
              <DropdownMenu.Root>
                <DropdownMenu.Trigger className="inline-flex items-center gap-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:border-gray-400 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Export <ChevronDown className="w-3 h-3" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" sideOffset={4} className="z-50 min-w-[9rem] rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-1 shadow-lg">
                    {(["PDF", "Markdown", "DOCX", "JSON"] as const).map((f) => (
                      <DropdownMenu.Item key={f} className={itemClass} onSelect={() => doExport(f)}>{f}</DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
              <button onClick={regenerate} disabled={isGenerating} className="inline-flex items-center gap-1.5 text-xs border border-violet-200 dark:border-violet-800 rounded-lg px-3 py-1.5 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors disabled:opacity-60">
                <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} /> Regenerate
              </button>
            </>
          )}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger aria-label="More actions" disabled={busy} className="inline-flex items-center text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-gray-600 dark:text-gray-400 hover:border-gray-400">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={4} className="z-50 min-w-[10rem] rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-1 shadow-lg">
                <DropdownMenu.Item className={itemClass} onSelect={() => mutate("duplicate")}>
                  <Copy className="w-3.5 h-3.5" /> Duplicate
                </DropdownMenu.Item>
                {project.status === "archived" ? (
                  <DropdownMenu.Item className={itemClass} onSelect={() => mutate("restore")}>
                    <ArchiveRestore className="w-3.5 h-3.5" /> Restore
                  </DropdownMenu.Item>
                ) : (
                  <DropdownMenu.Item className={itemClass} onSelect={() => mutate("archive")}>
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </DropdownMenu.Item>
                )}
                <DropdownMenu.Separator className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
                <DropdownMenu.Item className={cn(itemClass, "text-red-600 dark:text-red-400")} onSelect={() => mutate("delete")}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <GenerationProgress sections={sections} status={status} />
          </div>
        </div>
      )}
    </>
  );
}
