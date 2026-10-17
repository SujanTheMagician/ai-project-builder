"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Cpu, Loader2, Square, User } from "lucide-react";
import toast from "react-hot-toast";
import Markdown from "@/components/chat/Markdown";
import CopyButton from "@/components/ui/CopyButton";
import { ensureOk, frameBatcher, readTextStream } from "@/lib/stream";
import { cn } from "@/lib/utils";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const GENERAL_SUGGESTIONS = [
  "What's a good architecture for a multi-tenant SaaS?",
  "How do I design a database for 1M users?",
  "Suggest a tech stack for a real-time mobile app",
  "How should I version a public REST API?",
];

const projectSuggestions = (name: string) => [
  `What are the biggest technical risks in ${name}?`,
  "Which indexes should I add to this schema?",
  "How would this architecture handle 10x traffic?",
  "Write the SQL for the two most important tables",
];

let localId = 0;
const nextId = () => `local-${++localId}`;

export default function ChatPanel({
  conversationId,
  projectId,
  projectName,
  onConversationChange,
  compact = false,
}: {
  conversationId: string | null;
  projectId?: string | null;
  projectName?: string;
  /** Called with the id the server assigns when the first message creates a conversation. */
  onConversationChange?: (id: string) => void;
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);
  // Set when this panel created the conversation itself, so the load effect doesn't clobber the live stream.
  const createdHere = useRef<string | null>(null);

  // Load history whenever the selected conversation changes.
  useEffect(() => {
    if (conversationId && conversationId === createdHere.current) {
      createdHere.current = null; // skip once; later selections of this id load normally
      return;
    }
    // A different conversation was selected: stop any reply still streaming into the old one.
    abortRef.current?.abort();
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const controller = new AbortController();
    setLoadingHistory(true);
    fetch(`/api/conversations/${conversationId}`, { signal: controller.signal })
      .then(async (res) => {
        await ensureOk(res, "Couldn't load this conversation");
        const { conversation } = await res.json();
        setMessages(conversation.messages);
      })
      .catch((err) => {
        if (err.name !== "AbortError") toast.error(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingHistory(false);
      });

    // Switching conversations quickly cancels the stale request instead of racing it.
    return () => controller.abort();
  }, [conversationId]);

  // Stop any in-flight reply when the panel unmounts (e.g. navigating away).
  useEffect(() => () => abortRef.current?.abort(), []);

  // Follow new tokens only while the user is already at the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Grow the textarea with its content, up to a limit.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput("");
    stickToBottom.current = true;

    const userMsg: Msg = { id: nextId(), role: "user", content };
    const replyId = nextId();
    setMessages((prev) => [...prev, userMsg, { id: replyId, role: "assistant", content: "" }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const appendToReply = (chunk: string) =>
      setMessages((prev) => prev.map((m) => (m.id === replyId ? { ...m, content: m.content + chunk } : m)));
    const batcher = frameBatcher(appendToReply);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversationId ?? undefined, projectId: projectId ?? undefined, message: content }),
        signal: controller.signal,
      });
      await ensureOk(res, "The AI assistant is unavailable. Please try again.");

      const newId = res.headers.get("x-conversation-id");
      if (newId && newId !== conversationId) {
        createdHere.current = newId;
        onConversationChange?.(newId);
      }

      await readTextStream(res, batcher.push);
      batcher.drain();
    } catch (err) {
      batcher.drain();
      if ((err as Error).name === "AbortError") {
        appendToReply("\n\n_(stopped)_");
      } else {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
        // Let the user retry without retyping.
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id && m.id !== replyId));
        setInput(content);
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const suggestions = projectName ? projectSuggestions(projectName) : GENERAL_SUGGESTIONS;
  const last = messages[messages.length - 1];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className={cn("flex-1 overflow-y-auto min-h-0 space-y-5", compact ? "px-3 py-3" : "px-1 pr-2 py-2")}
      >
        {loadingHistory ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className={cn("text-center", compact ? "py-6" : "py-12")}>
            <div className="w-10 h-10 mx-auto rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center mb-3">
              <Cpu className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {projectName ? `Ask about ${projectName}` : "Ask your AI architect"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-5 max-w-xs mx-auto">
              {projectName
                ? "Answers are grounded in this project's blueprint — tables, endpoints and stack."
                : "System design, databases, APIs, infrastructure and tech stacks."}
            </p>
            <div className={cn("grid gap-2 max-w-lg mx-auto", !compact && "sm:grid-cols-2")}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                  msg.role === "assistant" ? "bg-violet-100 dark:bg-violet-950/50" : "bg-gray-100 dark:bg-gray-800"
                )}
              >
                {msg.role === "assistant" ? (
                  <Cpu className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                ) : (
                  <User className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              <div className={cn("group min-w-0", compact ? "max-w-[88%]" : "max-w-[85%]")}>
                <div
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm leading-relaxed break-words",
                    msg.role === "assistant"
                      ? "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                      : "bg-violet-600 text-white whitespace-pre-wrap"
                  )}
                >
                  {msg.role === "assistant" ? (
                    msg.content ? (
                      <Markdown content={msg.content} />
                    ) : (
                      <span className="inline-flex gap-1" aria-label="Thinking">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:120ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:240ms]" />
                      </span>
                    )
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "assistant" && msg.content && !(streaming && msg === last) && (
                  <CopyButton text={msg.content} label="Copy reply" className="mt-1 opacity-0 group-hover:opacity-100 focus:opacity-100" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className={cn("flex items-end gap-2 pt-3", compact && "px-3 pb-3 border-t border-gray-100 dark:border-gray-800")}
      >
        <textarea
          ref={inputRef}
          value={input}
          rows={1}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={projectName ? `Ask about ${projectName}…` : "Ask about architecture, databases, APIs…"}
          aria-label="Message"
          maxLength={4000}
          className="flex-1 resize-none px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-400"
        />
        {streaming ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            aria-label="Stop generating"
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Send message"
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </form>
      {!compact && <p className="text-[11px] text-gray-400 mt-1.5 text-center">Enter to send · Shift+Enter for a new line · AI can make mistakes</p>}
    </div>
  );
}
