import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import ProjectList from "@/components/project/ProjectList";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/sign-in");

  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const projects = await prisma.project.findMany({
    where: {
      userId: dbUser.id,
      ...(query && {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { documents: true } } },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">My projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {query
              ? `${projects.length} result${projects.length === 1 ? "" : "s"} for “${query}”`
              : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
            {query && (
              <Link href="/projects" className="ml-2 text-violet-600 dark:text-violet-400 hover:underline">
                Clear search
              </Link>
            )}
          </p>
        </div>
        <Link
          href="/new-project"
          className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> New project
        </Link>
      </div>

      <ProjectList
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          createdAt: p.createdAt.toISOString(),
          documentCount: p._count.documents,
        }))}
        emptyMessage={query ? "No projects match your search." : "You haven't created any projects yet."}
      />
    </div>
  );
}
