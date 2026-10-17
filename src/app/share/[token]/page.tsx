import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cpu } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getLatestBlueprint } from "@/services/blueprints";
import { WorkspaceProvider } from "@/components/project/workspace/WorkspaceContext";
import OverviewTab from "@/components/project/tabs/OverviewTab";
import ArchitectureTab from "@/components/project/tabs/ArchitectureTab";
import DatabaseTab from "@/components/project/tabs/DatabaseTab";
import ApiTab from "@/components/project/tabs/ApiTab";
import RoadmapTab from "@/components/project/tabs/RoadmapTab";
import CostTab from "@/components/project/tabs/CostTab";
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Shared pages are unlisted: keep them out of search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

async function findShared(token: string) {
  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: { project: { select: { id: true, name: true, category: true, description: true } } },
  });
  if (!link || link.revokedAt) return null;
  return link;
}

const SECTIONS = [
  { id: "overview", title: "Overview", Tab: OverviewTab },
  { id: "architecture", title: "Architecture", Tab: ArchitectureTab },
  { id: "database", title: "Database", Tab: DatabaseTab },
  { id: "api", title: "API design", Tab: ApiTab },
  { id: "roadmap", title: "Roadmap", Tab: RoadmapTab },
  { id: "cost", title: "Cost", Tab: CostTab },
];

export default async function SharedBlueprintPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await findShared(token);
  if (!link) notFound();

  const [latest] = await Promise.all([
    getLatestBlueprint(link.projectId),
    prisma.shareLink.update({ where: { id: link.id }, data: { views: { increment: 1 } } }),
  ]);
  if (!latest?.blueprint) notFound();

  const { project } = link;
  const colors = CATEGORY_COLORS[project.category] ?? DEFAULT_CATEGORY_COLOR;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-30 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm text-gray-900 dark:text-white">
            <span className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </span>
            ProjectAI
          </Link>
          <nav className="hidden md:flex gap-4 text-xs text-gray-500 dark:text-gray-400">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="hover:text-gray-900 dark:hover:text-white">{s.title}</a>
            ))}
          </nav>
          <Link href="/sign-up" className="text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-3 py-1.5">Make your own</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium mb-2 ${colors.bg} ${colors.text}`}>{project.category}</span>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{project.name}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-3xl">{project.description}</p>
        <p className="text-xs text-gray-400 mt-2">Read-only blueprint · version {latest.doc.version} · {formatDate(latest.doc.createdAt)}</p>

        <WorkspaceProvider projectId={project.id} projectName={project.name} editable={false}>
          {SECTIONS.map(({ id, title, Tab }) => (
            <div key={id} id={id} className="scroll-mt-20 pt-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{title}</h2>
              <Tab blueprint={latest.blueprint!} />
            </div>
          ))}
        </WorkspaceProvider>
      </main>
    </div>
  );
}
