"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, Check, Loader2, Pencil, Save, Sparkles, Wand2, X } from "lucide-react";
import { PROJECT_CATEGORIES, PROJECT_TEMPLATES, cn } from "@/lib/utils";
import { projectInputSchema, type ProjectInput as FormData } from "@/lib/validation";
import { useBlueprintGeneration } from "@/hooks/useBlueprintGeneration";
import { useDebounce } from "@/hooks/useDebounce";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ensureOk } from "@/lib/stream";
import { CREDIT_COSTS } from "@/lib/pricing";
import GenerationProgress from "@/components/project/GenerationProgress";

const STEPS = [
  { title: "Idea", fields: ["name", "category", "description"] },
  { title: "Details", fields: ["audience", "features", "budget", "timeline"] },
  { title: "Review", fields: [] },
] as const;

const BUDGETS = ["Under $5k", "$5k – $20k", "$20k – $100k", "$100k+"];
const TIMELINES = ["1 month", "3 months", "6 months", "12 months"];
const DRAFT_KEY = "new-project-draft";
const BLUEPRINT_COST = CREDIT_COSTS.blueprint_generation;

type Suggestion = { description: string; audience: string; features: string; tips: string[] };

const inputClass =
  "w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-400";

function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error ? <p className="text-xs text-red-500 mt-1">{error}</p> : hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Chips({ options, value, onPick }: { options: string[]; value?: string; onPick: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onPick(o)}
          className={cn(
            "text-xs rounded-full px-2.5 py-1 border transition-colors",
            value === o
              ? "border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300"
              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"form" | "creating" | "generating">("form");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const { generate, sections, status } = useBlueprintGeneration();
  const [draft, setDraft, { loaded: draftLoaded, remove: clearDraft }] = useLocalStorage<Partial<FormData> | null>(DRAFT_KEY, null);
  const restored = useRef(false);

  const { register, handleSubmit, setValue, watch, trigger, reset, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(projectInputSchema),
    defaultValues: { name: "", category: "", description: "", audience: "", features: "", budget: "", timeline: "" },
  });

  const values = watch();
  const debouncedValues = useDebounce(values, 600);

  // Restore a saved draft once, after localStorage has been read.
  useEffect(() => {
    if (!draftLoaded || restored.current) return;
    restored.current = true;
    if (draft && Object.values(draft).some((v) => v)) {
      reset({ ...getValues(), ...draft });
      toast("Restored your unsaved draft", { icon: "📝" });
    }
  }, [draftLoaded, draft, reset, getValues]);

  // Autosave (debounced so we write at most a couple of times per second of typing).
  useEffect(() => {
    if (!restored.current || phase !== "form") return;
    const hasContent = Object.values(debouncedValues).some((v) => v);
    if (hasContent) setDraft(debouncedValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serialise to compare by value, not identity
  }, [JSON.stringify(debouncedValues), phase]);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCredits(d.user.credits))
      .catch(() => {});
  }, []);

  const next = async () => {
    const ok = await trigger(STEPS[step].fields as unknown as (keyof FormData)[]);
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const applyTemplate = (t: (typeof PROJECT_TEMPLATES)[number]) => {
    reset({ ...getValues(), ...t });
    toast.success(`Loaded “${t.name}” — edit anything you like`);
  };

  const enhance = async () => {
    const ok = await trigger(["name", "category"]);
    if (!ok) return;
    setEnhancing(true);
    try {
      const { name, category, description, audience, features } = getValues();
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, description, audience, features }),
      });
      await ensureOk(res, "Couldn't improve the description");
      setSuggestion((await res.json()).suggestion);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEnhancing(false);
    }
  };

  const acceptSuggestion = () => {
    if (!suggestion) return;
    setValue("description", suggestion.description, { shouldValidate: true });
    if (suggestion.audience) setValue("audience", suggestion.audience);
    if (suggestion.features) setValue("features", suggestion.features);
    setSuggestion(null);
    toast.success("Brief updated");
  };

  const create = async (data: FormData) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await ensureOk(res, "Failed to create project");
    clearDraft();
    return (await res.json()).project.id as string;
  };

  const onGenerate = async (data: FormData) => {
    setPhase("creating");
    let projectId: string | null = null;
    try {
      projectId = await create(data);
      setPhase("generating");
      await generate(projectId);
      toast.success("Blueprint ready!");
      router.push(`/projects/${projectId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      // The project was saved; open it so the user can retry generation without re-entering details.
      if (projectId) router.push(`/projects/${projectId}`);
      else setPhase("form");
    }
  };

  const onSaveDraft = async () => {
    const ok = await trigger(["name", "category", "description"]);
    if (!ok) return setStep(0);
    setPhase("creating");
    try {
      const id = await create(getValues());
      toast.success("Saved as draft");
      router.push(`/projects/${id}`);
    } catch (err) {
      toast.error((err as Error).message);
      setPhase("form");
    }
  };

  if (phase === "generating") {
    return (
      <div className="w-full max-w-lg mx-auto pt-4">
        <GenerationProgress sections={sections} status={status} />
      </div>
    );
  }

  const busy = phase !== "form";

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">New project</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Describe your idea and get a complete, editable blueprint.</p>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-2 mb-6" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex items-center gap-2 flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              aria-current={i === step ? "step" : undefined}
              className="flex items-center gap-2 disabled:cursor-default"
            >
              <span
                className={cn(
                  "w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center",
                  i < step ? "bg-violet-600 text-white" : i === step ? "border-2 border-violet-600 text-violet-700 dark:text-violet-300" : "border border-gray-300 dark:border-gray-700 text-gray-400"
                )}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className={cn("text-sm", i === step ? "font-medium text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400")}>{s.title}</span>
            </button>
            {i < STEPS.length - 1 && <span className={cn("flex-1 h-px", i < step ? "bg-violet-400" : "bg-gray-200 dark:bg-gray-800")} />}
          </li>
        ))}
      </ol>

      <form
        // Enter on an earlier step advances instead of submitting the whole wizard.
        onSubmit={(e) => {
          if (step < STEPS.length - 1) {
            e.preventDefault();
            next();
          } else handleSubmit(onGenerate)(e);
        }}
        className="space-y-5"
      >
        {step === 0 && (
          <>
            {!values.description && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Start from a template</p>
                <div className="grid grid-cols-2 gap-2">
                  {PROJECT_TEMPLATES.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className="text-left rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.category}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Field label="Project name" required error={errors.name?.message}>
              <input {...register("name")} placeholder="e.g. MediTrack Pro" className={inputClass} autoFocus />
            </Field>

            <Field label="Category" required error={errors.category?.message}>
              <input type="hidden" {...register("category")} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PROJECT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue("category", cat, { shouldValidate: true })}
                    aria-pressed={values.category === cat}
                    className={cn(
                      "py-2.5 px-2 text-xs rounded-lg border transition-all text-center leading-tight",
                      values.category === cat
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-medium"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Describe your idea" required error={errors.description?.message} hint={`${values.description?.length ?? 0}/5000 · what it does, who it's for, the problem it solves`}>
              <textarea {...register("description")} rows={5} placeholder="What does your product do? What problem does it solve? Who is it for?" className={cn(inputClass, "resize-y")} />
              <button
                type="button"
                onClick={enhance}
                disabled={enhancing || (values.description?.length ?? 0) < 10}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-lg px-2.5 py-1.5 hover:bg-violet-50 dark:hover:bg-violet-950/40 disabled:opacity-50 transition-colors"
              >
                {enhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {enhancing ? "Improving…" : "Improve with AI (free)"}
              </button>
            </Field>

            {suggestion && (
              <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-violet-600" /> Suggested brief
                  </p>
                  <button type="button" onClick={() => setSuggestion(null)} aria-label="Dismiss suggestion" className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{suggestion.description}</p>
                <dl className="grid sm:grid-cols-2 gap-2 mt-3 text-xs">
                  <div><dt className="text-gray-500">Audience</dt><dd className="text-gray-800 dark:text-gray-200">{suggestion.audience}</dd></div>
                  <div><dt className="text-gray-500">Features</dt><dd className="text-gray-800 dark:text-gray-200">{suggestion.features}</dd></div>
                </dl>
                {suggestion.tips.length > 0 && (
                  <ul className="mt-3 text-xs text-gray-600 dark:text-gray-400 list-disc pl-4 space-y-0.5">
                    {suggestion.tips.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                )}
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={acceptSuggestion} className="text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-3 py-1.5">Use this</button>
                  <button type="button" onClick={() => setSuggestion(null)} className="text-xs text-gray-600 dark:text-gray-400 rounded-lg px-3 py-1.5 hover:bg-white/60 dark:hover:bg-gray-900/40">Keep mine</button>
                </div>
              </div>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Target audience" hint="Who will use it day to day?">
              <input {...register("audience")} placeholder="e.g. Clinic admins and their patients" className={inputClass} autoFocus />
            </Field>
            <Field label="Key features" hint="Comma-separated. Leave blank and the AI will infer them.">
              <input {...register("features")} placeholder="e.g. Auth, payments, notifications" className={inputClass} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Budget" error={errors.budget?.message}>
                <Chips options={BUDGETS} value={values.budget} onPick={(v) => setValue("budget", v)} />
                <input {...register("budget")} placeholder="or type, e.g. $15,000" className={inputClass} />
              </Field>
              <Field label="Timeline" error={errors.timeline?.message}>
                <Chips options={TIMELINES} value={values.timeline} onPick={(v) => setValue("timeline", v)} />
                <input {...register("timeline")} placeholder="or type, e.g. 10 weeks" className={inputClass} />
              </Field>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
            {[
              { label: "Name", value: values.name, step: 0 },
              { label: "Category", value: values.category, step: 0 },
              { label: "Description", value: values.description, step: 0 },
              { label: "Audience", value: values.audience, step: 1 },
              { label: "Features", value: values.features, step: 1 },
              { label: "Budget", value: values.budget, step: 1 },
              { label: "Timeline", value: values.timeline, step: 1 },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-3 px-4 py-3">
                <dt className="w-24 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 pt-0.5">{row.label}</dt>
                <dd className={cn("flex-1 text-sm whitespace-pre-wrap break-words", row.value ? "text-gray-900 dark:text-white" : "text-gray-400 italic")}>
                  {row.value || "Not specified — AI will infer"}
                </dd>
                <button type="button" onClick={() => setStep(row.step)} aria-label={`Edit ${row.label}`} className="text-gray-400 hover:text-violet-600 p-1">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Generating uses <strong>{BLUEPRINT_COST} credits</strong>
            {credits !== null && <> · you have <strong>{credits}</strong></>}. Failed generations are refunded automatically.
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between pt-2">
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} disabled={busy} className="inline-flex items-center justify-center gap-1.5 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-lg hover:border-gray-400 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button type="button" onClick={onSaveDraft} disabled={busy} className="inline-flex items-center justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Save className="w-4 h-4" /> Save draft
            </button>
          </div>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="inline-flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={busy || (credits !== null && credits < BLUEPRINT_COST)}
              className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {busy ? "Creating project…" : "Generate blueprint"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
