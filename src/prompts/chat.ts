import type { GeneratedBlueprint } from "@/types";
import { DATA_NOT_INSTRUCTIONS, sanitize } from "./shared";

export const CHAT_PROMPT_VERSION = "chat@2";

const BASE = `You are an expert software architect and technical advisor helping developers, founders and product managers design better systems: architecture, databases, APIs, cloud infrastructure, stack selection, security and scalability.

Style:
- Be practical and specific. Lead with the answer, then the reasoning.
- Keep answers short (under ~200 words) unless the user asks for depth.
- Use Markdown: short paragraphs, "-" bullet lists, and fenced code blocks with a language tag for code, SQL or schemas.
- If the question is ambiguous, state your assumption in one line and answer it.`;

/** Compact projection of a blueprint: enough for grounded answers without spending tokens on the whole document. */
function blueprintContext(name: string, b: GeneratedBlueprint) {
  return [
    `Project: ${sanitize(name)}`,
    `Summary: ${sanitize(b.summary)}`,
    `Stack: ${b.tech.map((t) => `${t.layer}: ${t.stack}`).join("; ")}`,
    `Tables: ${b.dbTables.map((t) => `${t.name}(${t.cols.map((c) => c.n + (c.k ? ` ${c.k}` : "")).join(", ")})`).join("; ")}`,
    `Endpoints: ${b.apiEndpoints.map((e) => `${e.method} ${e.path}`).join("; ")}`,
    `Roadmap: ${b.roadmap.map((p) => `${p.n}. ${p.title} (${p.dur})`).join("; ")}`,
    `Total cost: ${b.costRows.at(-1)?.amount ?? "unknown"}`,
  ].join("\n");
}

export function buildChatSystem(project?: { name: string; blueprint: GeneratedBlueprint | null }) {
  if (!project) return BASE;
  const context = project.blueprint ? blueprintContext(project.name, project.blueprint) : `Project: ${sanitize(project.name)} (no blueprint generated yet)`;
  return `${BASE}

This conversation is about the user's project. Ground your answers in its blueprint, refer to its real table and endpoint names, and point out when a suggestion would change the blueprint.

<context>
${context}
</context>

${DATA_NOT_INSTRUCTIONS}`;
}
