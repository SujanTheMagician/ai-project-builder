import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler, parseBody, requireUser } from "@/lib/api";
import { projectInputSchema } from "@/lib/validation";

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 100, 100);

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { _count: { select: { documents: true } } },
  });

  return NextResponse.json({ projects });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const data = await parseBody(req, projectInputSchema, "Invalid project details");

  const project = await prisma.project.create({
    data: { ...data, userId: user.id, status: "draft" },
  });

  return NextResponse.json({ project }, { status: 201 });
});
