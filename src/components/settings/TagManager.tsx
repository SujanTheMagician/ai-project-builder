"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import TagBadge from "@/components/ui/TagBadge";
import { ensureOk } from "@/lib/stream";
import { cn, TAG_COLOR_CLASSES } from "@/lib/utils";

type TagRow = { id: string; name: string; color: string; projects: number };
const COLORS = Object.keys(TAG_COLOR_CLASSES);

export default function TagManager() {
  const [tags, setTags] = useState<TagRow[] | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("violet");
  const [saving, setSaving] = useState(false);

  const load = () =>
    fetch("/api/tags")
      .then((r) => (r.ok ? r.json() : { tags: [] }))
      .then((d) => setTags(d.tags))
      .catch(() => setTags([]));

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      await ensureOk(res, "Couldn't create tag");
      setName("");
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const recolor = async (t: TagRow, next: string) => {
    setTags((prev) => prev?.map((x) => (x.id === t.id ? { ...x, color: next } : x)) ?? null);
    const res = await fetch(`/api/tags/${t.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ color: next }) });
    if (!res.ok) {
      toast.error("Couldn't update tag");
      load();
    }
  };

  const remove = async (t: TagRow) => {
    if (!window.confirm(`Delete tag “${t.name}”? It will be removed from ${t.projects} project${t.projects === 1 ? "" : "s"}.`)) return;
    try {
      await ensureOk(await fetch(`/api/tags/${t.id}`, { method: "DELETE" }), "Couldn't delete tag");
      setTags((prev) => prev?.filter((x) => x.id !== t.id) ?? null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TagIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">Tags</h2>
      </div>

      <form onSubmit={create} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="New tag, e.g. client-work"
          aria-label="Tag name"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Tag colour">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              onClick={() => setColor(c)}
              className={cn("w-5 h-5 rounded-full", TAG_COLOR_CLASSES[c], color === c && "ring-2 ring-offset-1 ring-gray-900 dark:ring-white dark:ring-offset-gray-900")}
            />
          ))}
        </div>
        <button type="submit" disabled={saving || !name.trim()} className="inline-flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm px-3 py-2 rounded-lg">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
        </button>
      </form>

      {tags === null ? (
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      ) : tags.length === 0 ? (
        <p className="text-xs text-gray-400">No tags yet. Tags help you group and filter projects.</p>
      ) : (
        <ul className="divide-y divide-gray-50 dark:divide-gray-800">
          {tags.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-2">
              <TagBadge name={t.name} color={t.color} />
              <span className="text-xs text-gray-400 flex-1">{t.projects} project{t.projects === 1 ? "" : "s"}</span>
              <select value={t.color} onChange={(e) => recolor(t, e.target.value)} aria-label={`Colour for ${t.name}`} className="text-xs border border-gray-200 dark:border-gray-700 rounded-md px-1.5 py-1 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300">
                {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => remove(t)} aria-label={`Delete ${t.name}`} className="p-1 text-gray-400 hover:text-red-600">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
