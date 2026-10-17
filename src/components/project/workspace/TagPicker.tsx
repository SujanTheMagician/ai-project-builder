"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import toast from "react-hot-toast";
import { Check, Plus, Tag as TagIcon } from "lucide-react";
import TagBadge from "@/components/ui/TagBadge";
import { ensureOk } from "@/lib/stream";
import type { Tag } from "@/types";

export default function TagPicker({ projectId, tags, allTags }: { projectId: string; tags: Tag[]; allTags: Tag[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => new Set(tags.map((t) => t.id)));
  const [newName, setNewName] = useState("");

  const save = async (ids: Set<string>) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: [...ids] }),
      });
      await ensureOk(res, "Couldn't update tags");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setSelected(new Set(tags.map((t) => t.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next); // optimistic
    save(next);
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      await ensureOk(res, "Couldn't create tag");
      const { tag } = await res.json();
      setNewName("");
      const next = new Set(selected).add(tag.id);
      setSelected(next);
      await save(next);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => <TagBadge key={t.id} name={t.name} color={t.color} />)}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 rounded-full border border-dashed border-gray-300 dark:border-gray-700 px-2 py-0.5 hover:border-violet-400 hover:text-violet-600">
          <TagIcon className="w-3 h-3" /> {tags.length ? "Edit" : "Add tag"}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="start" sideOffset={4} className="z-50 w-56 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-1 shadow-lg">
            {allTags.map((t) => (
              <DropdownMenu.CheckboxItem
                key={t.id}
                checked={selected.has(t.id)}
                onSelect={(e) => {
                  e.preventDefault(); // keep the menu open for multi-select
                  toggle(t.id);
                }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm outline-none cursor-pointer data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-800"
              >
                <span className="w-4">{selected.has(t.id) && <Check className="w-3.5 h-3.5 text-violet-600" />}</span>
                <TagBadge name={t.name} color={t.color} />
              </DropdownMenu.CheckboxItem>
            ))}
            {allTags.length > 0 && <DropdownMenu.Separator className="h-px bg-gray-100 dark:bg-gray-800 my-1" />}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                create();
              }}
              className="flex items-center gap-1 p-1"
            >
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()} // don't let the menu's typeahead swallow keys
                maxLength={30}
                placeholder="New tag"
                aria-label="New tag name"
                className="flex-1 min-w-0 text-sm px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <button type="submit" aria-label="Create tag" className="p-1.5 rounded-md bg-violet-600 text-white disabled:opacity-50" disabled={!newName.trim()}>
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
