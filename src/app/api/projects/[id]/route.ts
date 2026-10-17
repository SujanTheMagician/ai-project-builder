import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, apiHandler, parseBody, requireUser } from "@/lib/api";
import { projectUpdateSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export const GET = apiHandler<Context>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
    include: { documents: { orderBy: { createdAt: "desc" } } },
  });

  if (!project) throw new ApiError(404, "Not found");
  return NextResponse.json({ project });
});

export const PUT = apiHandler<Context>(async (req: NextRequest, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const data = await parseBody(req, projectUpdateSchema, "Invalid update");

  const { count } = await prisma.project.updateMany({
    where: { id, userId: user.id },
    data,
  });
  if (count === 0) throw new ApiError(404, "Not found");

  const project = await prisma.project.findUnique({ where: { id } });
  return NextResponse.json({ project });
});

export const DELETE = apiHandler<Context>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;

  const { count } = await prisma.project.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) throw new ApiError(404, "Not found");
  return NextResponse.json({ success: true });
});
