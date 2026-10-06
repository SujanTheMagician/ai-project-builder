"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Cpu, User } from "lucide-react";
import toast from "react-hot-toast";
import type { ChatMessage } from "@/types";

const QUICK_PROMPTS = [
  "What's the best architecture for a healthcare SaaS?",
  "How do I design a scalable database for 1M users?",
  "Suggest a tech stack for a real-time mobile app",
  "How should I structure my REST API endpoints?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI software architect. Ask me anything about system design, tech stacks, database schemas, or API design. What are you building?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || isLoading) return;
    setInput("");

    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.reply) throw new Error(data?.error ?? "The AI assistant is unavailable. Please try again.");

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      // Let the user retry without retyping.
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(content);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100dvh-9rem)]">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">AI chat assistant</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Ask anything about software architecture, databases, APIs, and tech stacks.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.map((msg) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "assistant" ? "bg-violet-100 dark:bg-violet-950/50" : "bg-gray-100 dark:bg-gray-800"}`}>
              {msg.role === "assistant"
                ? <Cpu className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                : <User className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />}
            </div>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${msg.role === "assistant" ? "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300" : "bg-violet-600 text-white"}`}>
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-violet-100 dark:bg-violet-950/50">
              <Cpu className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_PROMPTS.map((p) => (
            <button key={p} onClick={() => sendMessage(p)} className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Ask about architecture, databases, APIs..."
          aria-label="Message"
          maxLength={4000}
          className="flex-1 px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-400"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
