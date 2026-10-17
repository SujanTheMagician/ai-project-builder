"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useState backed by localStorage, for per-device conveniences (view mode,
 * drafts). Starts with `initial` so server and client render the same HTML,
 * then reads the stored value after mount. Storage can be unavailable
 * (private mode, blocked cookies), so every access is guarded.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // ignore unreadable or unavailable storage
    }
    setLoaded(true);
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // storage full or blocked; the in-memory value still works
        }
        return resolved;
      });
    },
    [key]
  );

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key]);

  return [value, set, { loaded, remove }] as const;
}
