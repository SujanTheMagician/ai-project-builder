"use client";

import { useEffect, useRef } from "react";

/**
 * Binds a keyboard shortcut such as "mod+k" (⌘ on macOS, Ctrl elsewhere) or "/".
 * The latest handler is kept in a ref, so the listener is attached once and
 * never sees a stale closure.
 */
export function useHotkey(combo: string, handler: (e: KeyboardEvent) => void, { allowInInputs = false } = {}) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const parts = combo.toLowerCase().split("+");
    const key = parts.pop()!;
    const needsMod = parts.includes("mod");
    const needsShift = parts.includes("shift");

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (typing && !allowInInputs) return;
      if (needsMod !== (e.metaKey || e.ctrlKey)) return;
      if (needsShift !== e.shiftKey) return;
      if (e.key.toLowerCase() !== key) return;
      e.preventDefault();
      handlerRef.current(e);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [combo, allowInInputs]);
}
