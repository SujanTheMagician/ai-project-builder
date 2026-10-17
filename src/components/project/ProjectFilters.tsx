"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, Loader2, Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { cn, PROJECT_CATEGORIES } from "@/lib/utils";
import TagBadge from "@/components/ui/TagBadge";
import type { Tag } from "@/types";

const selectClass =
  "text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500";

/**
 * Filter state lives in the URL, not component state: results are rendered on
 * the server from searchParams, and filters survive refresh and can be shared.
 */
export default function ProjectFilters({
  tags,
  view,
  onViewChange,
}: {
  tags: Tag[];
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const debouncedQ = useDebounce(q, 300);

  const update = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    // A transition keeps the current list on screen (dimmed) while the server renders the new one.
    startTransition(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
  };

  // Push the debounced search term into the URL.
  useEffect(() => {
    if ((params.get("q") ?? "") !== debouncedQ.trim()) update({ q: debouncedQ.trim() || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced term
  }, [debouncedQ]);

  // Keep the box in sync when the URL changes elsewhere (header search, back button).
  useEffect(() => {
    const urlQ = params.get("q") ?? "";
    setQ((prev) => (prev.trim() === urlQ ? prev : urlQ));
  }, [params]);

  const activeTag = params.get("tag");
  const hasFilters = ["q", "category", "status", "tag"].some((k) => params.get(k));

  return (
    <div className="space-y-3 mb-5">
      <div className="flex flex-col lg:flex-row gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Search projects</span>
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, description or category…"
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-gray-400"
          />
          {isPending && <Loader2 className="w-4 h-4 text-violet-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
        </label>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Category" value={params.get("category") ?? ""} onChange={(e) => update({ category: e.target.value || null })} className={selectClass}>
            <option value="">All categories</option>
            {PROJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select aria-label="Status" value={params.get("status") ?? ""} onChange={(e) => update({ status: e.target.value || null })} className={selectClass}>
            <option value="">Active</option>
            <option value="draft">Drafts</option>
            <option value="generated">Generated</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
          <select aria-label="Sort" value={params.get("sort") ?? "updated"} onChange={(e) => update({ sort: e.target.value === "updated" ? null : e.target.value })} className={selectClass}>
            <option value="updated">Recently updated</option>
            <option value="created">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name A–Z</option>
          </select>
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5" role="radiogroup" aria-label="View">
            {(["grid", "list"] as const).map((v) => {
              const Icon = v === "grid" ? LayoutGrid : List;
              return (
                <button
                  key={v}
                  role="radio"
                  aria-checked={view === v}
                  aria-label={`${v} view`}
                  onClick={() => onViewChange(v)}
                  className={cn("p-1.5 rounded-md", view === v ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : "text-gray-400 hover:text-gray-700")}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {(tags.length > 0 || hasFilters) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <button key={t.id} onClick={() => update({ tag: activeTag === t.id ? null : t.id })} aria-pressed={activeTag === t.id} className={cn("rounded-full transition-all", activeTag === t.id ? "ring-2 ring-violet-500 ring-offset-1 dark:ring-offset-gray-950" : "opacity-80 hover:opacity-100")}>
              <TagBadge name={t.name} color={t.color} />
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={() => {
                setQ("");
                update({ q: null, category: null, status: null, tag: null });
              }}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white ml-1"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
