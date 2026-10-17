"use client";

import { useCallback, useRef, useState } from "react";
import { ensureOk, readNdjson } from "@/lib/stream";
import type { GenerationEvent, SectionKey } from "@/types";

export type SectionState = "pending" | "writing" | "done";

const INITIAL: Record<SectionKey, SectionState> = {
  overview: "pending",
  architecture: "pending",
  database: "pending",
  api: "pending",
  roadmap: "pending",
  cost: "pending",
};

/** Starts a streamed blueprint generation and tracks per-section progress. */
export function useBlueprintGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sections, setSections] = useState(INITIAL);
  const [status, setStatus] = useState<string | null>(null);
  const running = useRef(false);

  const generate = useCallback(async (projectId: string): Promise<{ version: number }> => {
    if (running.current) throw new Error("A generation is already running");
    running.current = true;
    setIsGenerating(true);
    setSections(INITIAL);
    setStatus("Connecting to the AI…");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      await ensureOk(res, "AI generation failed");

      let result: { version: number } | null = null;
      let failure: string | null = null;
      await readNdjson<GenerationEvent>(res, (event) => {
        if (event.type === "section") {
          setStatus(null);
          setSections((prev) => ({ ...prev, [event.section]: event.state }));
        } else if (event.type === "status") setStatus(event.message);
        else if (event.type === "done") result = { version: event.version };
        else if (event.type === "error") failure = event.message;
      });

      if (failure) throw new Error(failure);
      if (!result) throw new Error("The connection closed before the blueprint finished. Refresh to check if it was saved.");
      return result;
    } finally {
      running.current = false;
      setIsGenerating(false);
      setStatus(null);
    }
  }, []);

  return { generate, isGenerating, sections, status };
}
