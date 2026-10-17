import { DATA_NOT_INSTRUCTIONS, sanitize } from "./shared";

export const ENHANCE_PROMPT_VERSION = "enhance@1";

export const ENHANCE_SYSTEM = `You are a product manager helping someone describe a software idea clearly before an architect designs it.
Keep the author's intent and facts. Do not invent business details they did not imply; where something important is missing, ask about it in "tips" instead.
${DATA_NOT_INSTRUCTIONS}`;

export function buildEnhancePrompt(draft: { name: string; category: string; description: string; audience?: string; features?: string }) {
  return `Improve this project brief so an architect can design it.

<draft>
Name: ${sanitize(draft.name)}
Category: ${sanitize(draft.category)}
Description: ${sanitize(draft.description)}
Target audience: ${sanitize(draft.audience)}
Key features: ${sanitize(draft.features)}
</draft>`;
}
