import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, apiHandler, requireUser } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/** Copies a project, its tags and its latest blueprint. Costs no credits. */
export const POST = apiHandler<Context>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;

  const source = await prisma.project.findFirst({
    where: { id, userId: user.id },
    include: {
      tags: true,
      documents: { where: { type: "blueprint" }, orderBy: [{ version: "desc" }, { createdAt: "desc" }], take: 1 },
    },
  });
  if (!source) throw new ApiError(404, "Project not found");

  const latest = source.documents[0];
  const copy = await prisma.project.create({
    data: {
      userId: user.id,
      name: `${source.name} (copy)`.slice(0, 100),
      category: source.category,
      description: source.description,
      audience: source.audience,
      features: source.features,
      budget: source.budget,
      timeline: source.timeline,
      status: latest ? "generated" : "draft",
      tags: { create: source.tags.map((t) => ({ tagId: t.tagId })) },
      ...(latest && {
        documents: {
          create: {
            type: "blueprint",
            content: latest.content as Prisma.InputJsonValue,
            version: 1,
            source: "restore",
            note: `Copied from “${source.name}” v${latest.version}`,
            model: latest.model,
            promptVersion: latest.promptVersion,
          },
        },
      }),
    },
  });

  return NextResponse.json({ project: copy }, { status: 201 });
});
