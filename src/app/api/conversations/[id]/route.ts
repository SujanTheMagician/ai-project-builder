import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, apiHandler, parseBody, requireUser } from "@/lib/api";
import { conversationUpdateSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export const GET = apiHandler<Context>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" }, select: { id: true, role: true, content: true, createdAt: true } },
      project: { select: { id: true, name: true } },
    },
  });
  if (!conversation) throw new ApiError(404, "Conversation not found");
  return NextResponse.json({ conversation });
});

export const PATCH = apiHandler<Context>(async (req: NextRequest, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const { title } = await parseBody(req, conversationUpdateSchema, "Invalid title");

  const { count } = await prisma.conversation.updateMany({ where: { id, userId: user.id }, data: { title } });
  if (count === 0) throw new ApiError(404, "Conversation not found");
  return NextResponse.json({ success: true });
});

export const DELETE = apiHandler<Context>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const { count } = await prisma.conversation.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) throw new ApiError(404, "Conversation not found");
  return NextResponse.json({ success: true });
});
