import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, apiHandler, requireUser } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

export const GET = apiHandler<Context>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;

  const project = await prisma.project.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!project) throw new ApiError(404, "Project not found");

  const versions = await prisma.document.findMany({
    where: { projectId: id, type: "blueprint" },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    select: { id: true, version: true, source: true, note: true, model: true, promptVersion: true, createdAt: true },
  });
  return NextResponse.json({ versions });
});
