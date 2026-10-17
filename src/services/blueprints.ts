import "server-only";
import type { Prisma, Project } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeBlueprint } from "@/lib/ai/normalize";
import { blueprintSchema, enhanceSchema, SECTION_KEYS, SECTIONS, sectionSchema, type SectionKey } from "@/lib/ai/schema";
import { generateStructured, models, streamGemini, structuredConfig, validateOutput } from "@/services/gemini";
import { BLUEPRINT_PROMPT_VERSION, BLUEPRINT_SYSTEM, buildBlueprintPrompt, buildSectionPrompt } from "@/prompts/blueprint";
import { buildEnhancePrompt, ENHANCE_SYSTEM } from "@/prompts/enhance";
import type { GeneratedBlueprint, GenerationEvent, ProjectFormData } from "@/types";

export type BlueprintSource = "ai_generation" | "section_regeneration" | "manual_edit" | "restore";

export type VersionMeta = {
  source: BlueprintSource;
  note?: string;
  model?: string;
  promptVersion?: string;
};

// ─── Persistence ─────────────────────────────────────────────────────────────

/** Saves a new blueprint version (version = previous max + 1) and marks the project generated. */
export async function saveBlueprintVersion(projectId: string, blueprint: GeneratedBlueprint, meta: VersionMeta) {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.document.aggregate({
      where: { projectId, type: "blueprint" },
      _max: { version: true },
    });
    const doc = await tx.document.create({
      data: {
        projectId,
        type: "blueprint",
        content: blueprint as unknown as Prisma.InputJsonValue,
        version: (latest._max.version ?? 0) + 1,
        ...meta,
      },
    });
    await tx.project.update({ where: { id: projectId }, data: { status: "generated" } });
    return doc;
  });
}

/** Parses stored JSON; returns null for an unreadable row so the UI can offer to regenerate. */
export function readBlueprint(content: Prisma.JsonValue | undefined): GeneratedBlueprint | null {
  if (!content) return null;
  try {
    return normalizeBlueprint(content);
  } catch {
    return null;
  }
}

export async function getLatestBlueprint(projectId: string) {
  const doc = await prisma.document.findFirst({
    where: { projectId, type: "blueprint" },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
  });
  return doc ? { doc, blueprint: readBlueprint(doc.content) } : null;
}

export const toFormData = (p: Pick<Project, "name" | "category" | "description" | "audience" | "features" | "budget" | "timeline">): ProjectFormData => ({
  name: p.name,
  category: p.category,
  description: p.description,
  audience: p.audience ?? "",
  features: p.features ?? "",
  budget: p.budget ?? "",
  timeline: p.timeline ?? "",
});

// ─── Generation ──────────────────────────────────────────────────────────────

/** Fixes literal "\n" sequences some models emit inside the folder tree. */
const finalize = (b: GeneratedBlueprint): GeneratedBlueprint => ({ ...b, folderStructure: b.folderStructure.replace(/\\n/g, "\n") });

/**
 * Streams a full blueprint and reports progress as each section starts and
 * finishes. Because responseSchema fixes the property order, the first key of
 * each section appearing in the partial JSON means the previous section is done.
 */
export async function generateBlueprint(project: ProjectFormData, emit: (e: GenerationEvent) => void) {
  const prompt = buildBlueprintPrompt(project);
  const markers = SECTION_KEYS.map((section) => ({
    section,
    // (?<!\\) skips matches inside string values, where quotes are escaped.
    pattern: new RegExp(`(?<!\\\\)"${SECTIONS[section].keys[0]}"\\s*:`),
  }));

  let text = "";
  let current = -1;
  for await (const delta of streamGemini({
    model: models.blueprint,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: BLUEPRINT_SYSTEM,
    generationConfig: structuredConfig(blueprintSchema),
  })) {
    text += delta;
    while (current + 1 < markers.length && markers[current + 1].pattern.test(text)) {
      if (current >= 0) emit({ type: "section", section: markers[current].section, state: "done" });
      current++;
      emit({ type: "section", section: markers[current].section, state: "writing" });
    }
  }
  if (current >= 0) emit({ type: "section", section: markers[current].section, state: "done" });

  const result = validateOutput(blueprintSchema, text);
  if (result.ok) return finalize(result.data);

  emit({ type: "status", message: "Checking and completing a few sections…" });
  const repaired = await generateStructured({ schema: blueprintSchema, prompt, system: BLUEPRINT_SYSTEM, previousOutput: text });
  return finalize(repaired);
}

export const generationMeta = (): Pick<VersionMeta, "model" | "promptVersion"> => ({
  model: models.blueprint,
  promptVersion: BLUEPRINT_PROMPT_VERSION,
});

/** Rewrites one section, optionally following an instruction, and returns the merged blueprint. */
export async function regenerateSection(project: ProjectFormData, current: GeneratedBlueprint, section: SectionKey, instruction?: string) {
  const patch = await generateStructured({
    schema: sectionSchema(section),
    prompt: buildSectionPrompt(project, current, section, instruction),
    system: BLUEPRINT_SYSTEM,
    maxOutputTokens: 8192,
  });
  return finalize({ ...current, ...patch });
}

export function enhanceBrief(draft: Parameters<typeof buildEnhancePrompt>[0]) {
  return generateStructured({
    schema: enhanceSchema,
    prompt: buildEnhancePrompt(draft),
    system: ENHANCE_SYSTEM,
    temperature: 0.5,
    maxOutputTokens: 2048,
  });
}
