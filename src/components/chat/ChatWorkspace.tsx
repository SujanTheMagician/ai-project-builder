"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FolderOpen, MessageSquarePlus, MessagesSquare, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import ChatPanel from "@/components/chat/ChatPanel";
import { ensureOk } from "@/lib/stream";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ConversationSummary } from "@/types";

type ProjectOption = { id: string; name: string };

/**
 * Conversation list + chat. The selected conversation and project live in the
 * URL (?c=…&project=…), so refresh, back/forward and shared links all work.
 */
export default function ChatWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const conversationId = params.get("c");
  const projectParam = params.get("project");

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [listOpen, setListOpen] = useState(false);

  const setQuery = useCallback(
    (next: Record<string, string | null>) => {
      const q = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v) q.set(k, v);
        else q.delete(k);
      }
      router.replace(`${pathname}${q.size ? `?${q}` : ""}`, { scroll: false });
    },
    [params, pathname, router]
  );

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      await ensureOk(res, "Couldn't load conversations");
      setConversations((await res.json()).conversations);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, []);

  // Both lists are independent, so fetch them in parallel.
  useEffect(() => {
    loadConversations();
    fetch("/api/projects?limit=50")
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((d) => setProjects(d.projects.map((p: ProjectOption) => ({ id: p.id, name: p.name }))))
      .catch(() => {});
  }, [loadConversations]);

  const active = conversations.find((c) => c.id === conversationId);
  const projectId = active ? active.projectId : projectParam;
  const projectName = active?.projectName ?? projects.find((p) => p.id === projectId)?.name;

  const remove = async (id: string) => {
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await ensureOk(await fetch(`/api/conversations/${id}`, { method: "DELETE" }), "Couldn't delete conversation");
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === conversationId) setQuery({ c: null });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const list = (
    <div className="flex flex-col h-full min-h-0">
      <button
        onClick={() => {
          setQuery({ c: null });
          setListOpen(false);
        }}
        className="flex items-center justify-center gap-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-3 py-2 mb-3 transition-colors"
      >
        <MessageSquarePlus className="w-4 h-4" /> New chat
      </button>
      <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1 space-y-0.5">
        {conversations.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No conversations yet</p>}
        {conversations.map((c) => (
          <div
            key={c.id}
            className={cn(
              "group flex items-start gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-colors",
              c.id === conversationId ? "bg-violet-50 dark:bg-violet-950/40" : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
            )}
            onClick={() => {
              setQuery({ c: c.id, project: null });
              setListOpen(false);
            }}
          >
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm truncate", c.id === conversationId ? "text-violet-700 dark:text-violet-300 font-medium" : "text-gray-700 dark:text-gray-300")}>
                {c.title}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {c.projectName ? `${c.projectName} · ` : ""}
                {formatRelativeTime(c.updatedAt)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                remove(c.id);
              }}
              aria-label={`Delete ${c.title}`}
              className="p-1 rounded text-gray-400 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex gap-5 h-[calc(100dvh-8rem)] md:h-[calc(100dvh-9rem)]">
      <aside className="hidden md:block w-60 flex-shrink-0">{list}</aside>

      {listOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-label="Conversations">
          <div className="absolute inset-0 bg-black/40" onClick={() => setListOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 p-4">
            <button onClick={() => setListOpen(false)} aria-label="Close" className="absolute top-3 right-3 p-1 text-gray-500">
              <X className="w-4 h-4" />
            </button>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Conversations</p>
            <div className="h-[calc(100%-2rem)]">{list}</div>
          </div>
        </div>
      )}

      <section className="flex-1 min-w-0 flex flex-col">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            onClick={() => setListOpen(true)}
            className="md:hidden inline-flex items-center gap-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-600 dark:text-gray-400"
          >
            <MessagesSquare className="w-3.5 h-3.5" /> History
          </button>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate mr-auto">{active?.title ?? "New conversation"}</h1>
          {!active ? (
            <label className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="sr-only">Project context</span>
              <select
                value={projectParam ?? ""}
                onChange={(e) => setQuery({ project: e.target.value || null })}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 max-w-[12rem]"
              >
                <option value="">General (no project)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            projectName && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 rounded-full px-2.5 py-1">
                <FolderOpen className="w-3 h-3" /> {projectName}
              </span>
            )
          )}
        </div>
        <div className="flex-1 min-h-0">
          <ChatPanel
            conversationId={conversationId}
            projectId={projectId}
            projectName={projectName}
            onConversationChange={(id) => {
              setQuery({ c: id, project: null });
              loadConversations();
            }}
          />
        </div>
      </section>
    </div>
  );
}
