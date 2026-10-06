import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import ProjectBlueprintClient from "@/components/project/ProjectBlueprintClient";
import { normalizeBlueprint } from "@/services/gemini";
import type { GeneratedBlueprint } from "@/types";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/sign-in");

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: dbUser.id },
    include: { documents: { where: { type: "blueprint" }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!project) notFound();

  let blueprint: GeneratedBlueprint | null = null;
  if (project.documents[0]) {
    try {
      blueprint = normalizeBlueprint(project.documents[0].content);
    } catch {
      // Treat an unreadable stored blueprint as missing so the user can regenerate it.
    }
  }

  return (
    <ProjectBlueprintClient
      project={{ id: project.id, name: project.name, category: project.category, description: project.description }}
      blueprint={blueprint}
    />
  );
}
