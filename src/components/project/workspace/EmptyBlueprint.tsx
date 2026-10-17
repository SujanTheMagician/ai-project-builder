"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Sparkles } from "lucide-react";
import GenerationProgress from "@/components/project/GenerationProgress";
import { useBlueprintGeneration } from "@/hooks/useBlueprintGeneration";
import { CREDIT_COSTS } from "@/lib/pricing";

export default function EmptyBlueprint({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { generate, isGenerating, sections, status } = useBlueprintGeneration();

  const run = async () => {
    try {
      await generate(projectId);
      toast.success("Blueprint ready!");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (isGenerating) {
    return (
      <div className="max-w-md">
        <GenerationProgress sections={sections} status={status} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4 gap-3 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
      <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white">No blueprint yet</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
        Generate architecture, database schema, API design, roadmap and costs from this project&apos;s brief. Uses {CREDIT_COSTS.blueprint_generation} credits.
      </p>
      <button onClick={run} disabled={isGenerating} className="mt-2 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-lg transition-colors">
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate blueprint
      </button>
    </div>
  );
}
