import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, apiHandler, requireUser } from "@/lib/api";
import { readBlueprint, saveBlueprintVersion } from "@/services/blueprints";

type Context = { params: Promise<{ id: string; versionId: string }> };

async function findVersion({ params }: Context) {
  const user = await requireUser();
  const { id, versionId } = await params;
  // Filtering through project.userId means a version id from someone else's project is a 404.
  const doc = await prisma.document.findFirst({ where: { id: versionId, projectId: id, project: { userId: user.id } } });
  if (!doc) throw new ApiError(404, "Version not found");
  return doc;
}

export const GET = apiHandler<Context>(async (_req, ctx) => {
  const doc = await findVersion(ctx);
  return NextResponse.json({
    version: { id: doc.id, version: doc.version, createdAt: doc.createdAt, blueprint: readBlueprint(doc.content) },
  });
});

/** Restoring copies the old content into a brand-new version, so history is never rewritten. */
export const POST = apiHandler<Context>(async (_req, ctx) => {
  const doc = await findVersion(ctx);
  const blueprint = readBlueprint(doc.content);
  if (!blueprint) throw new ApiError(422, "That version is unreadable and cannot be restored");

  const restored = await saveBlueprintVersion(doc.projectId, blueprint, { source: "restore", note: `Restored version ${doc.version}` });
  return NextResponse.json({ version: { id: restored.id, version: restored.version } }, { status: 201 });
});
