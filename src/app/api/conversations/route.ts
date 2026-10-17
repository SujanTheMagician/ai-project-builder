import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, apiHandler, parseBody, requireUser } from "@/lib/api";
import { conversationCreateSchema } from "@/lib/validation";
import type { ConversationSummary } from "@/types";

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const projectId = req.nextUrl.searchParams.get("projectId");

  const rows = await prisma.conversation.findMany({
    where: { userId: user.id, ...(projectId && { projectId }) },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { project: { select: { name: true } } },
  });

  const conversations: ConversationSummary[] = rows.map((c) => ({
    id: c.id,
    title: c.title,
    projectId: c.projectId,
    projectName: c.project?.name ?? null,
    updatedAt: c.updatedAt.toISOString(),
  }));
  return NextResponse.json({ conversations });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const { projectId, title } = await parseBody(req, conversationCreateSchema, "Invalid conversation");

  if (projectId) {
    const owned = await prisma.project.count({ where: { id: projectId, userId: user.id } });
    if (!owned) throw new ApiError(404, "Project not found");
  }

  const conversation = await prisma.conversation.create({
    data: { userId: user.id, projectId: projectId ?? null, ...(title && { title }) },
  });
  return NextResponse.json({ conversation }, { status: 201 });
});
