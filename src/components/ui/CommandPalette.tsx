"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { FolderOpen, LayoutDashboard, MessageCircle, Moon, PlusCircle, Search, Settings, Sun } from "lucide-react";
import { useHotkey } from "@/hooks/useHotkey";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

type Command = { id: string; label: string; hint?: string; group: string; icon: typeof Search; run: () => void };

/** ⌘K / Ctrl+K palette: jump to any page or project, or run an action, from the keyboard. */
export default function CommandPalette() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [projects, setProjects] = useState<{ id: string; name: string; category: string }[]>([]);
  const listRef = useRef<HTMLUListElement>(null);

  useHotkey("mod+k", () => setOpen((o) => !o), { allowInInputs: true });
  useHotkey("/", () => setOpen(true));

  // Load projects lazily the first time the palette opens.
  useEffect(() => {
    if (!open || projects.length) return;
    fetch("/api/projects?limit=50")
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((d) => setProjects(d.projects))
      .catch(() => {});
  }, [open, projects.length]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (href: string) => () => router.push(href);
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && document.documentElement.classList.contains("dark"));

  const commands = useMemo<Command[]>(() => {
    const base: Command[] = [
      { id: "new", label: "New project", group: "Actions", icon: PlusCircle, run: go("/new-project") },
      { id: "chat", label: "New AI chat", group: "Actions", icon: MessageCircle, run: go("/chat") },
      { id: "theme", label: isDark ? "Switch to light mode" : "Switch to dark mode", group: "Actions", icon: isDark ? Sun : Moon, run: () => setTheme(isDark ? "light" : "dark") },
      { id: "dash", label: "Dashboard", group: "Go to", icon: LayoutDashboard, run: go("/dashboard") },
      { id: "projects", label: "My projects", group: "Go to", icon: FolderOpen, run: go("/projects") },
      { id: "settings", label: "Settings", group: "Go to", icon: Settings, run: go("/settings") },
      ...projects.map((p) => ({ id: `p-${p.id}`, label: p.name, hint: p.category, group: "Projects", icon: FolderOpen, run: go(`/projects/${p.id}`) })),
    ];
    const q = query.trim().toLowerCase();
    const filtered = q ? base.filter((c) => `${c.label} ${c.hint ?? ""}`.toLowerCase().includes(q)) : base;
    if (q) filtered.push({ id: "search", label: `Search projects for “${query.trim()}”`, group: "Search", icon: Search, run: go(`/projects?q=${encodeURIComponent(query.trim())}`) });
    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `go` is stable enough; router never changes
  }, [projects, query, isDark]);

  useEffect(() => setActive(0), [query]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const runAt = (i: number) => {
    const cmd = commands[i];
    if (!cmd) return;
    setOpen(false);
    cmd.run();
  };

  let lastGroup = "";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="flex-1 max-w-xs flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:border-violet-300 transition-colors">
        <Search className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">Search or jump to…</span>
        <kbd className="hidden sm:inline text-[10px] font-sans border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5">Ctrl K</kbd>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed z-50 left-1/2 top-[15vh] -translate-x-1/2 w-[calc(100vw-2rem)] max-w-lg rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, commands.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              runAt(active);
            }
          }}
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <div className="flex items-center gap-2 px-4 border-b border-gray-100 dark:border-gray-800">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or project name…"
              aria-label="Search commands"
              role="combobox"
              aria-expanded
              aria-controls="command-list"
              aria-activedescendant={commands[active] ? `cmd-${commands[active].id}` : undefined}
              className="flex-1 py-3.5 text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
          <ul ref={listRef} id="command-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
            {commands.length === 0 && <li className="text-sm text-gray-400 text-center py-6">No matches</li>}
            {commands.map((c, i) => {
              const header = c.group !== lastGroup ? c.group : null;
              lastGroup = c.group;
              return (
                <li key={c.id} role="presentation">
                  {header && <p className="px-2 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">{header}</p>}
                  <div
                    id={`cmd-${c.id}`}
                    role="option"
                    aria-selected={i === active}
                    data-index={i}
                    onMouseMove={() => setActive(i)}
                    onClick={() => runAt(i)}
                    className={cn("flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm cursor-pointer", i === active ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300" : "text-gray-700 dark:text-gray-300")}
                  >
                    <c.icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                    <span className="flex-1 truncate">{c.label}</span>
                    {c.hint && <span className="text-xs text-gray-400">{c.hint}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-3 px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
