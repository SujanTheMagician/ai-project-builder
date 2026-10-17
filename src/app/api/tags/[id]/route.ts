import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, apiHandler, parseBody, requireUser } from "@/lib/api";
import { tagInputSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export const PATCH = apiHandler<Context>(async (req: NextRequest, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const data = await parseBody(req, tagInputSchema.partial(), "Invalid tag");

  const { count } = await prisma.tag.updateMany({ where: { id, userId: user.id }, data });
  if (count === 0) throw new ApiError(404, "Tag not found");
  return NextResponse.json({ tag: await prisma.tag.findUnique({ where: { id } }) });
});

export const DELETE = apiHandler<Context>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  // project_tags rows cascade with the tag.
  const { count } = await prisma.tag.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) throw new ApiError(404, "Tag not found");
  return NextResponse.json({ success: true });
});
