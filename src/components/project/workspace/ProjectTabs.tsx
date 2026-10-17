"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, DollarSign, FileText, History, Map, Server, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const PROJECT_TABS = [
  { slug: "", label: "Overview", icon: FileText },
  { slug: "architecture", label: "Architecture", icon: Server },
  { slug: "database", label: "Database", icon: Database },
  { slug: "api", label: "API design", icon: Zap },
  { slug: "roadmap", label: "Roadmap", icon: Map },
  { slug: "cost", label: "Cost", icon: DollarSign },
  { slug: "history", label: "History", icon: History },
] as const;

/**
 * Each tab is a real route (/projects/[id]/database …), so tabs are linkable,
 * the back button works, and <Link> prefetches the next tab's server payload.
 * Navigation between them is client-side: the shared layout (header, chat
 * drawer) stays mounted and only the tab content is swapped.
 */
export default function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav aria-label="Blueprint sections" className="flex gap-1 mb-6 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
      {PROJECT_TABS.map((tab) => {
        const href = tab.slug ? `${base}/${tab.slug}` : base;
        const active = pathname === href;
        return (
          <Link
            key={tab.slug}
            href={href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 text-sm px-3 py-2 border-b-2 -mb-px transition-colors whitespace-nowrap",
              active
                ? "border-violet-500 text-violet-700 dark:text-violet-300 font-medium"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
