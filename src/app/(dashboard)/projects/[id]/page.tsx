import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import ProjectBlueprintClient from "@/components/project/ProjectBlueprintClient";
import { getLatestBlueprint } from "@/services/blueprints";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/sign-in");

  const { id } = await params;

  const project = await prisma.project.findFirst({ where: { id, userId: dbUser.id } });
  if (!project) notFound();

  const latest = await getLatestBlueprint(project.id);

  return (
    <ProjectBlueprintClient
      project={{ id: project.id, name: project.name, category: project.category, description: project.description }}
      blueprint={latest?.blueprint ?? null}
    />
  );
}
