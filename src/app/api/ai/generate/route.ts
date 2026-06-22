import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateProjectBlueprint } from "@/services/gemini";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, formData } = await req.json();
  if (!projectId || !formData) {
    return NextResponse.json({ error: "Missing projectId or formData" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check credits
  if (user.credits <= 0) {
    return NextResponse.json({ error: "Insufficient AI credits" }, { status: 429 });
  }

  // Verify project belongs to user
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  try {
    // Generate with Gemini
    const blueprint = await generateProjectBlueprint(formData);

    // Save document
    await prisma.document.create({
      data: {
        projectId,
        type: "blueprint",
        content: blueprint as any,
      },
    });

    // Deduct 10 credits per generation
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: 10 } },
    });

    return NextResponse.json({ blueprint }, { status: 200 });
  } catch (err) {
    console.error("Gemini generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI generation failed" },
      { status: 500 }
    );
  }
}
