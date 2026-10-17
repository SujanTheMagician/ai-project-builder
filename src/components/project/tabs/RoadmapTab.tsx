"use client";

import { Section } from "@/components/project/workspace/Section";
import { useWorkspace } from "@/components/project/workspace/WorkspaceContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { cn } from "@/lib/utils";
import type { GeneratedBlueprint } from "@/types";

export default function RoadmapTab({ blueprint }: { blueprint: GeneratedBlueprint }) {
  const { projectId, editable } = useWorkspace();
  // Task progress is a personal checklist, so it stays on this device.
  const [done, setDone] = useLocalStorage<Record<string, boolean>>(`sprint-progress:${projectId}`, {});

  const total = blueprint.sprints.reduce((n, s) => n + s.tasks.length, 0);
  const completed = blueprint.sprints.reduce((n, s, si) => n + s.tasks.filter((_, ti) => done[`${si}:${ti}`]).length, 0);
  const toggle = (key: string) => setDone((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div>
      <Section title="Development phases" section="roadmap">
        <ol className="relative border-l border-gray-200 dark:border-gray-800 ml-4 space-y-6">
          {blueprint.roadmap.map((phase) => (
            <li key={phase.n} className="pl-6 relative">
              <span className="absolute -left-4 top-0 w-8 h-8 bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800 rounded-full flex items-center justify-center text-xs font-medium text-violet-700 dark:text-violet-300">
                {phase.n}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{phase.title}</p>
                <span className="text-xs text-gray-500 dark:text-gray-400">{phase.dur}</span>
              </div>
              <ul className="mt-2 space-y-1">
                {phase.tasks.map((task, ti) => (
                  <li key={ti} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 mt-1.5" />
                    {task}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        title="Sprint board"
        actions={
          editable && total > 0 ? (
            <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums mr-1">
              {completed}/{total} tasks done
            </span>
          ) : undefined
        }
      >
        {editable && total > 0 && (
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4" aria-hidden>
            <div className="h-full bg-green-500 transition-all" style={{ width: `${(completed / total) * 100}%` }} />
          </div>
        )}
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
          {blueprint.sprints.map((sprint, si) => {
            const doneCount = sprint.tasks.filter((_, ti) => done[`${si}:${ti}`]).length;
            return (
              <div key={sprint.title} className="snap-start flex-shrink-0 w-64 bg-gray-50 dark:bg-gray-800/60 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{sprint.title}</p>
                  {editable && <span className="text-[11px] text-gray-400 tabular-nums">{doneCount}/{sprint.tasks.length}</span>}
                </div>
                <ul className="space-y-1.5">
                  {sprint.tasks.map((task, ti) => {
                    const key = `${si}:${ti}`;
                    return (
                      <li key={ti}>
                        <label className={cn("flex items-start gap-2 text-xs rounded-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-2", editable && "cursor-pointer hover:border-violet-200")}>
                          {editable && <input type="checkbox" checked={!!done[key]} onChange={() => toggle(key)} className="mt-0.5 accent-violet-600" />}
                          <span className={cn("text-gray-700 dark:text-gray-300", done[key] && "line-through text-gray-400")}>{task}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
        {editable && <p className="text-[11px] text-gray-400 mt-2">Progress is saved on this device.</p>}
      </Section>
    </div>
  );
}
