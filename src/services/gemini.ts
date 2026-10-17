import "server-only";
import type { ZodType } from "zod";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/errors";
import { toGeminiSchema } from "@/lib/ai/schema";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export const models = {
  get blueprint() {
    return env().GEMINI_MODEL;
  },
  get chat() {
    return env().GEMINI_CHAT_MODEL ?? env().GEMINI_MODEL;
  },
};

/** AI failures carry a user-safe message, so they extend ApiError and apiHandler returns them as-is. */
export class GeminiError extends ApiError {
  constructor(message: string, status = 500, public retryable = false) {
    super(status, message);
    this.name = "GeminiError";
  }
}

export type GeminiContent = { role: "user" | "model"; parts: { text: string }[] };

type GeminiRequest = {
  model: string;
  contents: GeminiContent[];
  systemInstruction?: string;
  generationConfig?: Record<string, unknown>;
  signal?: AbortSignal;
};

// setTimeout takes a callback; wrapping it in a Promise lets retry loops simply `await sleep(ms)`.
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Retries transient failures (429 / 5xx) with exponential backoff plus jitter. */
export async function withRetry<T>(fn: () => Promise<T>, { retries = 2, baseMs = 800 } = {}): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retryable = err instanceof GeminiError && err.retryable;
      if (!retryable || attempt >= retries) throw err;
      await sleep(baseMs * 2 ** attempt + Math.random() * 250);
    }
  }
}

async function post(url: string, { contents, systemInstruction, generationConfig, signal }: GeminiRequest) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env().GEMINI_API_KEY },
    body: JSON.stringify({
      contents,
      ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
      generationConfig,
    }),
    signal,
  });

  if (!response.ok) {
    // Log the provider's details server-side, but never leak them to the client.
    console.error(`Gemini API error (${response.status}):`, await response.text());
    if (response.status === 429) throw new GeminiError("The AI service is busy. Please try again in a minute.", 429, true);
    throw new GeminiError("The AI service returned an error. Please try again.", 502, response.status >= 500);
  }
  return response;
}

type Candidate = { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string };

const candidateText = (json: { candidates?: Candidate[] }) =>
  json.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text ?? "").join("") ?? "";

/** One request, one complete text response. */
export async function callGemini(req: GeminiRequest): Promise<string> {
  return withRetry(async () => {
    const res = await post(`${GEMINI_BASE_URL}/${req.model}:generateContent`, req);
    const json = await res.json();
    const text = candidateText(json);
    if (!text) throw new GeminiError("The AI returned an empty response. Please try again.", 502, true);
    if (json.candidates?.[0]?.finishReason === "MAX_TOKENS") console.warn("Gemini response hit MAX_TOKENS");
    return text;
  });
}

/**
 * Streams text deltas as they arrive, using the server-sent-events endpoint.
 * Network chunks don't line up with SSE events, so incomplete lines are kept in
 * `buffer` until the next chunk completes them.
 */
export async function* streamGemini(req: GeminiRequest): AsyncGenerator<string> {
  const res = await withRetry(() => post(`${GEMINI_BASE_URL}/${req.model}:streamGenerateContent?alt=sse`, req));
  if (!res.body) throw new GeminiError("The AI service returned no stream.", 502);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const data = line.trim();
        if (!data.startsWith("data:")) continue;
        const text = candidateText(JSON.parse(data.slice(5)));
        if (text) yield text;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ─── Structured output ───────────────────────────────────────────────────────

/** Parses JSON, tolerating stray code fences around it. */
export function parseJson(text: string): unknown {
  const candidates = [text, text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1], text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // try the next strategy
    }
  }
  return undefined;
}

export function structuredConfig(schema: ZodType, temperature = 0.7, maxOutputTokens = 16384) {
  return { temperature, maxOutputTokens, responseMimeType: "application/json", responseSchema: toGeminiSchema(schema) };
}

/** Validates model output; returns a readable list of problems for the repair prompt when it fails. */
export function validateOutput<T>(schema: ZodType<T>, text: string): { ok: true; data: T } | { ok: false; problems: string } {
  const json = parseJson(text);
  if (json === undefined) return { ok: false, problems: "The output was not valid JSON." };
  const parsed = schema.safeParse(json);
  if (parsed.success) return { ok: true, data: parsed.data };
  const problems = parsed.error.issues
    .slice(0, 15)
    .map((i) => `- ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  return { ok: false, problems };
}

/**
 * Asks for JSON matching `schema`. Decoding is constrained by responseSchema;
 * the zod check catches what that can't express (minimum counts, non-empty
 * strings), and one repair turn feeds the problems back to the model.
 */
export async function generateStructured<T>({
  schema,
  prompt,
  system,
  model = models.blueprint,
  temperature,
  maxOutputTokens,
  previousOutput,
}: {
  schema: ZodType<T>;
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  /** Text of an earlier attempt that failed validation (skips straight to repair). */
  previousOutput?: string;
}): Promise<T> {
  const generationConfig = structuredConfig(schema, temperature, maxOutputTokens);
  const contents: GeminiContent[] = [{ role: "user", parts: [{ text: prompt }] }];

  let output = previousOutput ?? (await callGemini({ model, contents, systemInstruction: system, generationConfig }));
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = validateOutput(schema, output);
    if (result.ok) return result.data;
    if (attempt === 1) break;

    console.warn("Structured output failed validation; asking the model to repair it:\n" + result.problems);
    contents.push(
      { role: "model", parts: [{ text: output }] },
      { role: "user", parts: [{ text: `Your JSON failed validation:\n${result.problems}\nReturn the complete corrected JSON object.` }] }
    );
    output = await callGemini({ model, contents, systemInstruction: system, generationConfig });
  }
  throw new GeminiError("The AI returned an incomplete result. Please try again.", 502);
}
