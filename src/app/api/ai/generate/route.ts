import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, apiHandler, parseBody, requireUser } from "@/lib/api";
import { withCredits } from "@/lib/credits";
import { generateProjectBlueprint } from "@/services/gemini";
import { saveBlueprintVersion } from "@/services/blueprints";

// Blueprint generation can take a while; allow up to 60s on Vercel.
export const maxDuration = 60;

const bodySchema = z.object({ projectId: z.string().min(1) });

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const { projectId } = await parseBody(req, bodySchema, "Missing projectId");

  // Build the prompt from the stored project, not from client-supplied data.
  const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) throw new ApiError(404, "Project not found");

  const blueprint = await withCredits(user.id, "blueprint_generation", projectId, () =>
    generateProjectBlueprint({
      name: project.name,
      category: project.category,
      description: project.description,
      audience: project.audience ?? "",
      features: project.features ?? "",
      budget: project.budget ?? "",
      timeline: project.timeline ?? "",
    })
  );

  await saveBlueprintVersion(projectId, blueprint, { source: "ai_generation", note: "Generated blueprint" });
  return NextResponse.json({ blueprint });
});
