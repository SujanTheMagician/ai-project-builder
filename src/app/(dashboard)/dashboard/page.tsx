import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getDbUser, CREDITS_PER_GENERATION } from "@/lib/auth";
import { formatRelativeTime, CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from "@/lib/utils";
import { PlusCircle, FolderOpen, FileText, Cpu, ArrowRight, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Errors here propagate to (dashboard)/error.tsx instead of being disguised as an auth failure.
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/sign-in");

  const clerkUser = await currentUser();
  const firstName = clerkUser?.firstName || dbUser.name?.split(" ")[0] || "there";

  const [projects, totalProjects, totalDocs] = await Promise.all([
    prisma.project.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { _count: { select: { documents: true } } },
    }),
    prisma.project.count({ where: { userId: dbUser.id } }),
    prisma.document.count({ where: { project: { userId: dbUser.id } } }),
  ]);

  const stats = [
    { label: "Total projects", value: totalProjects, icon: FolderOpen, delta: "All time" },
    { label: "Documents generated", value: totalDocs, icon: FileText, delta: "Blueprints" },
    { label: "AI credits", value: dbUser.credits, icon: Cpu, delta: `${CREDITS_PER_GENERATION} per blueprint` },
    { label: "Account", value: "Active", icon: Zap, delta: "Free plan" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Welcome back, {firstName}.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <s.icon className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.delta}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">Recent projects</h2>
        <Link href="/projects" className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {projects.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl mb-8">
          <FolderOpen className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">No projects yet</p>
          <p className="text-xs text-gray-400 mb-5">Create your first project and get a full AI blueprint in seconds.</p>
          <Link href="/new-project" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            <PlusCircle className="w-4 h-4" /> New project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {projects.map((p) => {
            const colors = CATEGORY_COLORS[p.category] ?? DEFAULT_CATEGORY_COLOR;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:border-violet-200 dark:hover:border-violet-800 transition-colors"
              >
                <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium mb-3 ${colors.bg} ${colors.text}`}>{p.category}</span>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 truncate">{p.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                  <span className="text-xs text-gray-400">
                    {p._count.documents > 0 ? `${p._count.documents} ${p._count.documents === 1 ? "doc" : "docs"}` : "Not generated"}
                  </span>
                  <span className="text-xs text-gray-400">{formatRelativeTime(p.createdAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-2xl border border-violet-100 dark:border-violet-900/50 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Cpu className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-white text-sm">Build something new</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Describe your idea and get a complete project blueprint in seconds.</p>
        </div>
        <Link href="/new-project" className="inline-flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition-colors flex-shrink-0">
          Start <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
