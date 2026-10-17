import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, apiHandler, requireUser } from "@/lib/api";
import { env } from "@/lib/env";

type Context = { params: Promise<{ id: string }> };

async function ownProject(id: string) {
  const user = await requireUser();
  const project = await prisma.project.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!project) throw new ApiError(404, "Project not found");
  return project;
}

const toResponse = (link: { token: string; views: number; createdAt: Date } | null) =>
  NextResponse.json({
    link: link && { url: `${env().NEXT_PUBLIC_APP_URL}/share/${link.token}`, views: link.views, createdAt: link.createdAt },
  });

const activeLink = (projectId: string) =>
  prisma.shareLink.findFirst({ where: { projectId, revokedAt: null }, orderBy: { createdAt: "desc" } });

export const GET = apiHandler<Context>(async (_req, { params }) => {
  const { id } = await ownProject((await params).id);
  return toResponse(await activeLink(id));
});

/** Returns the active public link, creating one if needed. */
export const POST = apiHandler<Context>(async (_req, { params }) => {
  const { id } = await ownProject((await params).id);
  const hasBlueprint = await prisma.document.count({ where: { projectId: id, type: "blueprint" } });
  if (!hasBlueprint) throw new ApiError(400, "Generate a blueprint before sharing");

  const link =
    (await activeLink(id)) ??
    (await prisma.shareLink.create({ data: { projectId: id, token: randomBytes(18).toString("base64url") } }));
  return toResponse(link);
});

/** Revokes every active link; old URLs stop working immediately. */
export const DELETE = apiHandler<Context>(async (_req, { params }) => {
  const { id } = await ownProject((await params).id);
  await prisma.shareLink.updateMany({ where: { projectId: id, revokedAt: null }, data: { revokedAt: new Date() } });
  return toResponse(null);
});
