import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import ProjectList from "@/components/project/ProjectList";

export const dynamic = "force-dynamic";

type Search = { q?: string; category?: string; status?: string; tag?: string; sort?: string };

const ORDER: Record<string, Prisma.ProjectOrderByWithRelationInput> = {
  updated: { updatedAt: "desc" },
  created: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  name: { name: "asc" },
};

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/sign-in");

  const { q, category, status, tag, sort } = await searchParams;
  const query = q?.trim() ?? "";

  const where: Prisma.ProjectWhereInput = {
    userId: dbUser.id,
    // Default view hides archived projects; "all" shows everything.
    ...(status === "all" ? {} : status ? { status } : { status: { not: "archived" } }),
    ...(category && { category }),
    ...(tag && { tags: { some: { tagId: tag } } }),
    ...(query && {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ],
    }),
  };

  const [projects, tags, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: ORDER[sort ?? "updated"] ?? ORDER.updated,
      include: {
        _count: { select: { documents: true } },
        tags: { include: { tag: true }, orderBy: { tag: { name: "asc" } } },
      },
    }),
    prisma.tag.findMany({ where: { userId: dbUser.id }, orderBy: { name: "asc" } }),
    prisma.project.count({ where: { userId: dbUser.id } }),
  ]);

  const filtered = !!(query || category || status || tag);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">My projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {filtered ? `${projects.length} of ${total} project${total === 1 ? "" : "s"}` : `${projects.length} active project${projects.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link href="/new-project" className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <PlusCircle className="w-4 h-4" /> New project
        </Link>
      </div>

      {/* ProjectFilters reads useSearchParams(), which needs a Suspense boundary. */}
      <Suspense>
        <ProjectList
          projects={projects.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            description: p.description,
            status: p.status,
            updatedAt: p.updatedAt.toISOString(),
            versionCount: p._count.documents,
            tags: p.tags.map(({ tag: t }) => ({ id: t.id, name: t.name, color: t.color })),
          }))}
          tags={tags.map((t) => ({ id: t.id, name: t.name, color: t.color }))}
          emptyMessage={filtered ? "No projects match these filters." : "You haven't created any projects yet."}
        />
      </Suspense>
    </div>
  );
}
