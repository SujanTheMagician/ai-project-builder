"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import toast from "react-hot-toast";
import { Archive, ArchiveRestore, Copy, ExternalLink, FolderOpen, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { cn, CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR, formatRelativeTime } from "@/lib/utils";
import { ensureOk } from "@/lib/stream";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import TagBadge from "@/components/ui/TagBadge";
import ProjectFilters from "@/components/project/ProjectFilters";
import type { Tag } from "@/types";

export type ProjectListItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  status: string;
  updatedAt: string;
  versionCount: number;
  tags: Tag[];
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  archived: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const itemClass =
  "flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-md outline-none cursor-pointer text-gray-700 dark:text-gray-300 data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-800";

export default function ProjectList({ projects, tags, emptyMessage }: { projects: ProjectListItem[]; tags: Tag[]; emptyMessage: string }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [view, setView] = useLocalStorage<"grid" | "list">("projects-view", "grid");

  const act = async (p: ProjectListItem, action: "duplicate" | "archive" | "restore" | "delete") => {
    if (action === "delete" && !window.confirm(`Delete “${p.name}”? This permanently removes every blueprint version.`)) return;
    setBusyId(p.id);
    try {
      if (action === "duplicate") {
        const res = await fetch(`/api/projects/${p.id}/duplicate`, { method: "POST" });
        await ensureOk(res, "Failed to duplicate");
        toast.success("Project duplicated");
      } else if (action === "delete") {
        await ensureOk(await fetch(`/api/projects/${p.id}`, { method: "DELETE" }), "Failed to delete project");
        toast.success("Project deleted");
      } else {
        const status = action === "archive" ? "archived" : p.versionCount > 0 ? "generated" : "draft";
        const res = await fetch(`/api/projects/${p.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        await ensureOk(res, "Failed to update project");
        toast.success(action === "archive" ? "Archived — find it under Status › Archived" : "Restored");
      }
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const menu = (p: ProjectListItem) => (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Actions for ${p.name}`}
        disabled={busyId === p.id}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {busyId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} className="z-50 min-w-[10rem] rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-1 shadow-lg">
          <DropdownMenu.Item className={itemClass} onSelect={() => router.push(`/projects/${p.id}`)}>
            <ExternalLink className="w-3.5 h-3.5" /> Open
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemClass} onSelect={() => act(p, "duplicate")}>
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </DropdownMenu.Item>
          {p.status === "archived" ? (
            <DropdownMenu.Item className={itemClass} onSelect={() => act(p, "restore")}>
              <ArchiveRestore className="w-3.5 h-3.5" /> Restore
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item className={itemClass} onSelect={() => act(p, "archive")}>
              <Archive className="w-3.5 h-3.5" /> Archive
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
          <DropdownMenu.Item className={cn(itemClass, "text-red-600 dark:text-red-400")} onSelect={() => act(p, "delete")}>
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );

  const meta = (p: ProjectListItem) => (
    <>
      {p.status !== "generated" && <span className={cn("text-[11px] rounded-full px-2 py-0.5 capitalize", STATUS_STYLES[p.status])}>{p.status}</span>}
      <span>{p.versionCount > 0 ? `v${p.versionCount}` : "No blueprint"}</span>
      <span>·</span>
      <span>{formatRelativeTime(p.updatedAt)}</span>
    </>
  );

  return (
    <>
      <ProjectFilters tags={tags} view={view} onViewChange={setView} />

      {projects.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <FolderOpen className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const colors = CATEGORY_COLORS[p.category] ?? DEFAULT_CATEGORY_COLOR;
            return (
              <div key={p.id} className="relative bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
                <Link href={`/projects/${p.id}`} className="block p-4">
                  <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium mb-3 ${colors.bg} ${colors.text}`}>{p.category}</span>
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 truncate pr-8">{p.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{p.description}</p>
                  {p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {p.tags.map((t) => <TagBadge key={t.id} name={t.name} color={t.color} />)}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 text-xs text-gray-400">{meta(p)}</div>
                </Link>
                <div className="absolute top-3 right-3">{menu(p)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/projects/${p.id}`} className="min-w-0 flex-1 group">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 truncate">{p.name}</span>
                  {p.tags.map((t) => <TagBadge key={t.id} name={t.name} color={t.color} />)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                  <span>{p.category}</span>
                  <span>·</span>
                  {meta(p)}
                </div>
              </Link>
              {menu(p)}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
