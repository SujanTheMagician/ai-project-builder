"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Bot, Copy, GitCompare, History, Loader2, Pencil, RotateCcw, Wand2 } from "lucide-react";
import { useWorkspace } from "@/components/project/workspace/WorkspaceContext";
import { diffBlueprints, type FieldDiff } from "@/lib/blueprint-tools";
import { ensureOk } from "@/lib/stream";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { BlueprintVersionSummary, GeneratedBlueprint } from "@/types";

const SOURCE_META: Record<BlueprintVersionSummary["source"], { label: string; icon: typeof Bot }> = {
  ai_generation: { label: "AI generation", icon: Bot },
  section_regeneration: { label: "Section rewrite", icon: Wand2 },
  manual_edit: { label: "Manual edit", icon: Pencil },
  restore: { label: "Restore / copy", icon: Copy },
};

const FIELD_LABELS: Record<string, string> = {
  summary: "Summary", problem: "Problem", targetUsers: "Target users", requirements: "Requirements",
  nonFunctional: "Non-functional", userStories: "User stories", tech: "Tech stack", folderStructure: "Folder structure",
  deploymentStrategy: "Deployment", dbTables: "Database tables", apiEndpoints: "API endpoints",
  roadmap: "Roadmap", sprints: "Sprints", costRows: "Cost",
};

async function fetchVersion(projectId: string, versionId: string): Promise<GeneratedBlueprint> {
  const res = await fetch(`/api/projects/${projectId}/versions/${versionId}`);
  await ensureOk(res, "Couldn't load version");
  return (await res.json()).version.blueprint;
}

export default function HistoryTab() {
  const { projectId } = useWorkspace();
  const router = useRouter();
  const [versions, setVersions] = useState<BlueprintVersionSummary[] | null>(null);
  const [base, setBase] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [diff, setDiff] = useState<FieldDiff[] | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`);
      await ensureOk(res, "Couldn't load history");
      const list: BlueprintVersionSummary[] = (await res.json()).versions;
      setVersions(list);
      setTarget((t) => t ?? list[0]?.id ?? null);
      setBase((b) => b ?? list[1]?.id ?? null);
    } catch (err) {
      toast.error((err as Error).message);
      setVersions([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per project
  }, [projectId]);

  // Recompute the diff whenever the pair changes; both versions load in parallel.
  useEffect(() => {
    if (!base || !target || base === target) {
      setDiff(null);
      return;
    }
    let ignore = false;
    setDiffLoading(true);
    Promise.all([fetchVersion(projectId, base), fetchVersion(projectId, target)])
      .then(([a, b]) => !ignore && setDiff(diffBlueprints(a, b)))
      .catch((err) => !ignore && toast.error(err.message))
      .finally(() => !ignore && setDiffLoading(false));
    return () => {
      ignore = true;
    };
  }, [projectId, base, target]);

  const restore = async (v: BlueprintVersionSummary) => {
    if (!window.confirm(`Restore version ${v.version}? It will be copied into a new version; nothing is deleted.`)) return;
    setRestoring(v.id);
    try {
      await ensureOk(await fetch(`/api/projects/${projectId}/versions/${v.id}`, { method: "POST" }), "Couldn't restore");
      toast.success(`Restored version ${v.version}`);
      setTarget(null);
      setBase(null);
      await load();
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRestoring(null);
    }
  };

  if (!versions) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
      </div>
    );
  }

  const label = (id: string | null) => versions.find((v) => v.id === id)?.version;

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 items-start">
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">{versions.length} version{versions.length === 1 ? "" : "s"}</h3>
        </div>
        <ol className="space-y-1">
          {versions.map((v, i) => {
            const meta = SOURCE_META[v.source] ?? SOURCE_META.ai_generation;
            return (
              <li key={v.id} className={cn("rounded-lg border p-3 transition-colors", v.id === target ? "border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20" : v.id === base ? "border-gray-300 dark:border-gray-600" : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/40")}>
                <div className="flex items-start gap-3">
                  <meta.icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">v{v.version}</span>
                      {i === 0 && <span className="ml-1.5 text-[10px] uppercase tracking-wide bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 rounded px-1.5 py-0.5">current</span>}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{v.note || meta.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatRelativeTime(v.createdAt)}
                      {v.promptVersion && ` · ${v.promptVersion}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2 pl-7">
                  <button onClick={() => setBase(v.id)} disabled={v.id === base} className="text-[11px] rounded px-1.5 py-0.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-40">Compare from</button>
                  <button onClick={() => setTarget(v.id)} disabled={v.id === target} className="text-[11px] rounded px-1.5 py-0.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-40">Compare to</button>
                  {i > 0 && (
                    <button onClick={() => restore(v)} disabled={restoring !== null} className="inline-flex items-center gap-1 text-[11px] rounded px-1.5 py-0.5 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40">
                      {restoring === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />} Restore
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 lg:sticky lg:top-0">
        <div className="flex items-center gap-2 mb-4">
          <GitCompare className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {base && target && base !== target ? `Changes from v${label(base)} to v${label(target)}` : "Compare versions"}
          </h3>
          {diffLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
        </div>
        {versions.length < 2 ? (
          <p className="text-sm text-gray-400">Edit, refine or regenerate the blueprint to create more versions to compare.</p>
        ) : !diff ? (
          <p className="text-sm text-gray-400">Pick two different versions.</p>
        ) : diff.length === 0 ? (
          <p className="text-sm text-gray-400">These versions are identical.</p>
        ) : (
          <div className="space-y-4">
            {diff.map((d) => (
              <div key={d.field}>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{FIELD_LABELS[d.field] ?? d.field}</p>
                {d.before !== undefined ? (
                  <div className="space-y-1 text-xs">
                    <p className="rounded bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 px-2 py-1.5 line-through decoration-red-300 whitespace-pre-wrap">{d.before}</p>
                    <p className="rounded bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 px-2 py-1.5 whitespace-pre-wrap">{d.after}</p>
                  </div>
                ) : (
                  <ul className="space-y-1 text-xs font-mono">
                    {d.removed.map((r) => <li key={`-${r}`} className="rounded bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 px-2 py-1 break-words">− {r}</li>)}
                    {d.added.map((a) => <li key={`+${a}`} className="rounded bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 px-2 py-1 break-words">+ {a}</li>)}
                    {d.added.length === 0 && d.removed.length === 0 && <li className="text-gray-400 font-sans">Same items, reordered or edited in place.</li>}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
