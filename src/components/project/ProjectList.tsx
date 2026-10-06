"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FolderOpen, Loader2, Trash2 } from "lucide-react";
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR, formatRelativeTime } from "@/lib/utils";

export type ProjectListItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  createdAt: string;
  documentCount: number;
};

export default function ProjectList({ projects, emptyMessage }: { projects: ProjectListItem[]; emptyMessage: string }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (project: ProjectListItem) => {
    if (!window.confirm(`Delete “${project.name}”? This permanently removes its blueprint.`)) return;
    setDeletingId(project.id);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to delete project");
      toast.success("Project deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 px-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
        <FolderOpen className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((p) => {
        const colors = CATEGORY_COLORS[p.category] ?? DEFAULT_CATEGORY_COLOR;
        return (
          <div
            key={p.id}
            className="group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-800 transition-colors"
          >
            <Link href={`/projects/${p.id}`} className="block p-4">
              <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium mb-3 ${colors.bg} ${colors.text}`}>{p.category}</span>
              <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 truncate pr-8">{p.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{p.description}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                <span className="text-xs text-gray-400">
                  {p.documentCount > 0 ? `${p.documentCount} ${p.documentCount === 1 ? "doc" : "docs"}` : "Not generated"}
                </span>
                <span className="text-xs text-gray-400">{formatRelativeTime(p.createdAt)}</span>
              </div>
            </Link>
            <button
              onClick={() => handleDelete(p)}
              disabled={deletingId === p.id}
              aria-label={`Delete ${p.name}`}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-all disabled:opacity-100"
            >
              {deletingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
