import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import { getLatestBlueprint } from "@/services/blueprints";

/**
 * Loads a project for the signed-in owner. Wrapped in React's cache() so the
 * project layout and the active tab page share one set of queries per request.
 */
export const loadProject = cache(async (id: string) => {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
    include: { tags: { include: { tag: true }, orderBy: { tag: { name: "asc" } } } },
  });
  if (!project) notFound();

  const [latest, allTags] = await Promise.all([
    getLatestBlueprint(project.id),
    prisma.tag.findMany({ where: { userId: user.id }, orderBy: { name: "asc" }, select: { id: true, name: true, color: true } }),
  ]);

  return {
    user,
    project,
    tags: project.tags.map(({ tag }) => ({ id: tag.id, name: tag.name, color: tag.color })),
    allTags,
    blueprint: latest?.blueprint ?? null,
    version: latest?.doc.version ?? null,
    versionDate: latest?.doc.createdAt ?? null,
  };
});
