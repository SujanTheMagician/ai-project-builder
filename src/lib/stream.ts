/**
 * Browser helpers for consuming streamed fetch responses.
 *
 * Each `await reader.read()` yields control back to the event loop, so React
 * can render between chunks; the UI updates while the response is still arriving.
 */

/** Throws the server's JSON error message for a non-2xx response. */
export async function ensureOk(res: Response, fallback: string) {
  if (res.ok) return;
  const data = await res.json().catch(() => null);
  throw new Error(data?.error ?? fallback);
}

/** Calls onText with each decoded text chunk; resolves with the full text. */
export async function readTextStream(res: Response, onText: (chunk: string) => void): Promise<string> {
  if (!res.body) throw new Error("No response stream");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onText(chunk);
  }
  return full;
}

/** Parses a newline-delimited JSON stream, calling onEvent for every complete line. */
export async function readNdjson<T>(res: Response, onEvent: (event: T) => void): Promise<void> {
  let buffer = "";
  await readTextStream(res, (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) if (line.trim()) onEvent(JSON.parse(line) as T);
  });
  if (buffer.trim()) onEvent(JSON.parse(buffer) as T);
}

/**
 * Batches rapid updates into at most one per animation frame. Streaming can
 * deliver dozens of chunks per frame; rendering each one would waste work.
 * The pending text lives in this closure between frames.
 */
export function frameBatcher(flush: (text: string) => void) {
  let pending = "";
  let frame: number | null = null;
  return {
    push(text: string) {
      pending += text;
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const out = pending;
        pending = "";
        flush(out);
      });
    },
    /** Flushes immediately (call when the stream ends). */
    drain() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      if (pending) flush(pending);
      pending = "";
    },
  };
}
