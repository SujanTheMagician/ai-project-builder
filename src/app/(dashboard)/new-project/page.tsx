"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Sparkles, Loader2 } from "lucide-react";
import { PROJECT_CATEGORIES, cn } from "@/lib/utils";
import { projectInputSchema, type ProjectInput as FormData } from "@/lib/validation";

export default function NewProjectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(projectInputSchema),
  });

  const selectedCategory = watch("category");

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    let projectId: string | null = null;
    try {
      setLoadingStep("Creating project...");
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!createRes.ok) throw new Error((await createRes.json().catch(() => null))?.error ?? "Failed to create project");
      projectId = (await createRes.json()).project.id as string;

      setLoadingStep("Generating blueprint — this can take up to a minute...");
      const genRes = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!genRes.ok) throw new Error((await genRes.json().catch(() => null))?.error ?? "AI generation failed");

      toast.success("Blueprint generated successfully!");
      router.push(`/projects/${projectId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      if (projectId) {
        // The project was saved; open it so the user can retry generation without re-entering details.
        router.push(`/projects/${projectId}`);
      } else {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">New project</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Describe your idea and let AI generate the complete blueprint.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Project name <span className="text-red-500">*</span>
          </label>
          <input
            {...register("name")}
            placeholder="e.g. MediTrack Pro"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-400"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Category <span className="text-red-500">*</span>
          </label>
          <input type="hidden" {...register("category")} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PROJECT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setValue("category", cat, { shouldValidate: true })}
                className={cn(
                  "py-2.5 px-2 text-xs rounded-lg border transition-all text-center leading-tight",
                  selectedCategory === cat
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-medium"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Describe your idea <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="What does your product do? What problem does it solve? Who is it for?"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-400 resize-none"
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
        </div>

        {/* Two-col fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Target audience</label>
            <input
              {...register("audience")}
              placeholder="e.g. Clinic admins"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Key features</label>
            <input
              {...register("features")}
              placeholder="e.g. Auth, Payments"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Budget</label>
            <input
              {...register("budget")}
              placeholder="e.g. $15,000"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Timeline</label>
            <input
              {...register("timeline")}
              placeholder="e.g. 3 months"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium text-sm transition-colors"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{loadingStep}</>
          ) : (
            <><Sparkles className="w-4 h-4" />Generate blueprint</>
          )}
        </button>
      </form>
    </div>
  );
}
