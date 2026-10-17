import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeBlueprint } from "@/services/gemini";
import type { GeneratedBlueprint } from "@/types";

export type BlueprintSource = "ai_generation" | "section_regeneration" | "manual_edit" | "restore";

export type VersionMeta = {
  source: BlueprintSource;
  note?: string;
  model?: string;
  promptVersion?: string;
};

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
