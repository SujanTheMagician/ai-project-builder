import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProjectBlueprintClient from "@/components/project/ProjectBlueprintClient";
import type { GeneratedBlueprint } from "@/types";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) redirect("/dashboard");

  const project = await prisma.project.findFirst({
    where: { id, userId: dbUser.id },
    include: { documents: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!project) notFound();

  const blueprint = project.documents[0]?.content as unknown as GeneratedBlueprint | null;

  return (
    <ProjectBlueprintClient
      project={project as any}
      blueprint={blueprint}
    />
  );
}
