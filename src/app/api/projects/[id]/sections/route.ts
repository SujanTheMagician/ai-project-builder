import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, apiHandler, parseBody, requireUser } from "@/lib/api";
import { withCredits } from "@/lib/credits";
import { SECTION_KEYS, SECTIONS, type SectionKey } from "@/lib/ai/schema";
import { generationMeta, getLatestBlueprint, regenerateSection, saveBlueprintVersion, toFormData } from "@/services/blueprints";

export const maxDuration = 60;

type Context = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  section: z.custom<SectionKey>((v) => SECTION_KEYS.includes(v as SectionKey), "Unknown section"),
  instruction: z.string().trim().max(500).optional(),
});

/** Regenerates one section with AI (optionally guided by an instruction) and saves it as a new version. */
export const POST = apiHandler<Context>(async (req: NextRequest, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const { section, instruction } = await parseBody(req, bodySchema, "Invalid section request");

  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) throw new ApiError(404, "Project not found");
  const latest = await getLatestBlueprint(id);
  if (!latest?.blueprint) throw new ApiError(400, "Generate the blueprint before regenerating a section");

  const blueprint = await withCredits(user.id, "section_regeneration", id, () =>
    regenerateSection(toFormData(project), latest.blueprint!, section, instruction)
  );

  const label = SECTIONS[section].label;
  const doc = await saveBlueprintVersion(id, blueprint, {
    source: "section_regeneration",
    note: instruction ? `${label}: ${instruction}`.slice(0, 200) : `Regenerated ${label}`,
    ...generationMeta(),
  });

  return NextResponse.json({ blueprint, version: doc.version });
});
