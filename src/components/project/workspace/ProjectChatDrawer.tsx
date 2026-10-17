"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, MessageSquarePlus, X } from "lucide-react";
import ChatPanel from "@/components/chat/ChatPanel";
import { useWorkspace } from "./WorkspaceContext";
import { useHotkey } from "@/hooks/useHotkey";

/** Slide-over chat grounded in this project's blueprint. Lives in the layout, so it survives tab switches. */
export default function ProjectChatDrawer() {
  const { projectId, projectName, chatOpen, setChatOpen } = useWorkspace();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useHotkey("escape", () => setChatOpen(false), { allowInInputs: true });

  // On first open, continue the most recent conversation about this project.
  useEffect(() => {
    if (!chatOpen || resolved) return;
    const controller = new AbortController();
    fetch(`/api/conversations?projectId=${projectId}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { conversations: [] }))
      .then((d) => {
        setConversationId(d.conversations[0]?.id ?? null);
        setResolved(true);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [chatOpen, resolved, projectId]);

  return (
    <AnimatePresence>
      {chatOpen && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.2 }}
          className="fixed inset-y-0 right-0 z-40 w-full sm:w-[26rem] bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col"
          aria-label={`Chat about ${projectName}`}
        >
          <div className="h-14 flex items-center gap-2 px-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Ask about {projectName}</p>
              <p className="text-[11px] text-gray-400">Grounded in the current blueprint</p>
            </div>
            <button onClick={() => setConversationId(null)} title="New conversation" aria-label="New conversation" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              <MessageSquarePlus className="w-4 h-4" />
            </button>
            {conversationId && (
              <Link href={`/chat?c=${conversationId}`} title="Open in full chat" aria-label="Open in full chat" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
            <button onClick={() => setChatOpen(false)} aria-label="Close chat" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            {resolved && <ChatPanel compact conversationId={conversationId} projectId={projectId} projectName={projectName} onConversationChange={setConversationId} />}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
