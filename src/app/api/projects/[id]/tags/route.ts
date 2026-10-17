import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, apiHandler, parseBody, requireUser } from "@/lib/api";
import { projectTagsSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

/** Replaces the project's tag set. */
export const PUT = apiHandler<Context>(async (req: NextRequest, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const { tagIds } = await parseBody(req, projectTagsSchema, "Invalid tags");

  const [project, ownedTags] = await Promise.all([
    prisma.project.findFirst({ where: { id, userId: user.id }, select: { id: true } }),
    prisma.tag.findMany({ where: { id: { in: tagIds }, userId: user.id }, select: { id: true } }),
  ]);
  if (!project) throw new ApiError(404, "Project not found");
  if (ownedTags.length !== new Set(tagIds).size) throw new ApiError(400, "Unknown tag");

  await prisma.$transaction([
    prisma.projectTag.deleteMany({ where: { projectId: id } }),
    prisma.projectTag.createMany({ data: ownedTags.map((t) => ({ projectId: id, tagId: t.id })) }),
  ]);

  const tags = await prisma.tag.findMany({ where: { projects: { some: { projectId: id } } }, orderBy: { name: "asc" } });
  return NextResponse.json({ tags });
});
