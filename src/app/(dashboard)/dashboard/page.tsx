import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { ArrowRight, CheckCircle2, Circle, Cpu, FileText, FolderOpen, Layers, MessageCircle, PlusCircle, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import { CREDIT_COSTS } from "@/lib/credits";
import {
  getCategoryBreakdown,
  getCreditActivity,
  getDailyCreditUsage,
  getOverview,
  getProjectsWithoutBlueprint,
} from "@/lib/analytics";
import { formatRelativeTime, CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR, CREDIT_REASON_LABELS } from "@/lib/utils";
import BarChart from "@/components/ui/BarChart";

export const dynamic = "force-dynamic";

const card = "bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800";

export default async function DashboardPage() {
  // Errors here propagate to (dashboard)/error.tsx instead of being disguised as an auth failure.
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/sign-in");

  // Independent queries run concurrently; total latency ≈ the slowest one, not the sum.
  const [clerkUser, overview, recent, categories, daily, pending, activity, tagCount] = await Promise.all([
    currentUser(),
    getOverview(dbUser.id),
    prisma.project.findMany({
      where: { userId: dbUser.id, status: { not: "archived" } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { _count: { select: { documents: true } } },
    }),
    getCategoryBreakdown(dbUser.id),
    getDailyCreditUsage(dbUser.id, 14),
    getProjectsWithoutBlueprint(dbUser.id),
    getCreditActivity(dbUser.id, { limit: 6 }),
    prisma.tag.count({ where: { userId: dbUser.id } }),
  ]);

  const firstName = clerkUser?.firstName || dbUser.name?.split(" ")[0] || "there";
  const blueprintsLeft = Math.floor(dbUser.credits / CREDIT_COSTS.blueprint_generation);

  const checklist = [
    { done: overview.projects > 0, label: "Create your first project", href: "/new-project" },
    { done: overview.blueprints > 0, label: "Generate a blueprint", href: "/projects" },
    { done: overview.conversations > 0, label: "Ask the AI architect a question", href: "/chat" },
    { done: tagCount > 0, label: "Organise projects with a tag", href: "/projects" },
  ];
  const checklistDone = checklist.filter((c) => c.done).length;

  const stats = [
    { label: "Active projects", value: overview.projects, icon: FolderOpen, hint: `${overview.blueprints} with a blueprint` },
    { label: "Blueprint versions", value: overview.versions, icon: Layers, hint: "Every edit is kept" },
    { label: "AI credits", value: dbUser.credits, icon: Cpu, hint: `≈ ${blueprintsLeft} blueprint${blueprintsLeft === 1 ? "" : "s"} left` },
    { label: "Conversations", value: overview.conversations, icon: MessageCircle, hint: `${overview.creditsSpent} credits spent so far` },
  ];

  const dailyData = daily.map((d) => ({
    label: new Date(d.day + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    value: d.spent,
    display: `${d.spent} credit${d.spent === 1 ? "" : "s"}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Welcome back, {firstName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Here&apos;s what&apos;s happening across your projects.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/chat" className="inline-flex items-center gap-1.5 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:border-gray-400 transition-colors">
            <MessageCircle className="w-4 h-4" /> Ask AI
          </Link>
          <Link href="/new-project" className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm px-3 py-2 rounded-lg transition-colors">
            <PlusCircle className="w-4 h-4" /> New project
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`${card} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <s.icon className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">{s.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.hint}</p>
          </div>
        ))}
      </div>

      {checklistDone < checklist.length && (
        <div className="rounded-xl border border-violet-100 dark:border-violet-900/50 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Get started</p>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{checklistDone} of {checklist.length} done</span>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="flex items-center gap-2 text-sm rounded-lg px-2 py-1.5 hover:bg-white/60 dark:hover:bg-gray-900/40 transition-colors">
                  {c.done ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
                  <span className={c.done ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-300"}>{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`${card} p-5 lg:col-span-2`}>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">Credits used · last 14 days</h2>
            <Link href="/settings#credits" className="text-xs text-violet-600 dark:text-violet-400 hover:underline">History</Link>
          </div>
          <BarChart title="Credits used per day, last 14 days" data={dailyData} height={120} />
        </div>

        <div className={`${card} p-5`}>
          <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Projects by category</h2>
          {categories.length === 0 ? (
            <p className="text-xs text-gray-400">No projects yet.</p>
          ) : (
            <BarChart orientation="horizontal" title="Projects by category" data={categories.map((c) => ({ label: c.category, value: c.projects }))} />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">Recently updated</h2>
            <Link href="/projects" className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-14 px-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              <FolderOpen className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">No projects yet</p>
              <p className="text-xs text-gray-400 mb-5">Describe an idea and get architecture, schema, APIs and a roadmap in about a minute.</p>
              <Link href="/new-project" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                <PlusCircle className="w-4 h-4" /> New project
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {recent.map((p) => {
                const colors = CATEGORY_COLORS[p.category] ?? DEFAULT_CATEGORY_COLOR;
                return (
                  <Link key={p.id} href={`/projects/${p.id}`} className={`${card} block p-4 hover:border-violet-200 dark:hover:border-violet-800 transition-colors`}>
                    <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium mb-2 ${colors.bg} ${colors.text}`}>{p.category}</span>
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 truncate">{p.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{p.description}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 text-xs text-gray-400">
                      <span>{p._count.documents > 0 ? `v${p._count.documents}` : "Not generated"}</span>
                      <span>{formatRelativeTime(p.updatedAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {pending.length > 0 && (
            <div className={`${card} p-5`}>
              <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Waiting for a blueprint</h2>
              <p className="text-xs text-gray-400 mb-3">Drafts you saved but haven&apos;t generated yet.</p>
              <ul className="space-y-1">
                {pending.map((p) => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.id}`} className="flex items-center justify-between gap-2 text-sm rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <span className="truncate text-gray-700 dark:text-gray-300">{p.name}</span>
                      <span className="text-xs text-violet-600 dark:text-violet-400 flex-shrink-0">Generate →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={`${card} p-5`}>
            <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recent activity</h2>
            {activity.length === 0 ? (
              <p className="text-xs text-gray-400">Nothing yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5 text-xs">
                    <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-700 dark:text-gray-300 truncate">
                        {CREDIT_REASON_LABELS[a.reason] ?? a.reason}
                        {a.projectName && <span className="text-gray-400"> · {a.projectName}</span>}
                      </p>
                      <p className="text-gray-400">{formatRelativeTime(a.createdAt)}</p>
                    </div>
                    <span className={`tabular-nums font-medium ${a.amount < 0 ? "text-gray-900 dark:text-white" : "text-green-600 dark:text-green-400"}`}>
                      {a.amount > 0 ? "+" : ""}
                      {a.amount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
