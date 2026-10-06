import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDbUser, CREDITS_PER_GENERATION } from "@/lib/auth";
import { generateProjectBlueprint, GeminiError } from "@/services/gemini";

// Blueprint generation can take a while; allow up to 60s on Vercel.
export const maxDuration = 60;

const bodySchema = z.object({ projectId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  const { projectId } = parsed.data;

  // Build the prompt from the stored project, not from client-supplied data.
  const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Reserve credits atomically so parallel requests can't overspend.
  const { count } = await prisma.user.updateMany({
    where: { id: user.id, credits: { gte: CREDITS_PER_GENERATION } },
    data: { credits: { decrement: CREDITS_PER_GENERATION } },
  });
  if (count === 0) {
    return NextResponse.json(
      { error: `Not enough AI credits. Each blueprint costs ${CREDITS_PER_GENERATION} credits.` },
      { status: 402 }
    );
  }

  try {
    const blueprint = await generateProjectBlueprint({
      name: project.name,
      category: project.category,
      description: project.description,
      audience: project.audience ?? "",
      features: project.features ?? "",
      budget: project.budget ?? "",
      timeline: project.timeline ?? "",
    });

    await prisma.$transaction([
      prisma.document.create({ data: { projectId, type: "blueprint", content: blueprint as unknown as Prisma.InputJsonValue } }),
      prisma.project.update({ where: { id: projectId }, data: { status: "generated" } }),
    ]);

    return NextResponse.json({ blueprint });
  } catch (err) {
    // Refund the reserved credits when generation fails.
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { increment: CREDITS_PER_GENERATION } },
    });
    console.error("Blueprint generation error:", err);
    if (err instanceof GeminiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
