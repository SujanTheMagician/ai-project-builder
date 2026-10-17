import type { ApiEndpoint, GeneratedBlueprint } from "@/types";

/**
 * Lenient reader for stored blueprints. New versions are validated against the
 * strict zod schema before they are saved, but older rows predate that, so the
 * UI reads everything through this coercion and never crashes on a missing field.
 */
export class BlueprintFormatError extends Error {}

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : v == null ? fallback : String(v));
const strArr = (v: unknown) => (Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : []);
const objArr = (v: unknown) =>
  (Array.isArray(v) ? v : []).filter((x): x is Record<string, unknown> => !!x && typeof x === "object");

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

/** Coerce model output into the shape the UI expects so a partial response never crashes rendering. */
export function normalizeBlueprint(raw: unknown): GeneratedBlueprint {
  if (!raw || typeof raw !== "object") throw new BlueprintFormatError("The AI response was not a valid blueprint.");
  const b = raw as Record<string, unknown>;

  const blueprint: GeneratedBlueprint = {
    summary: str(b.summary),
    problem: str(b.problem),
    targetUsers: str(b.targetUsers),
    requirements: strArr(b.requirements),
    nonFunctional: strArr(b.nonFunctional),
    tech: objArr(b.tech).map((t) => ({ layer: str(t.layer), stack: str(t.stack) })),
    apiEndpoints: objArr(b.apiEndpoints).map((e) => {
      const method = str(e.method).toUpperCase();
      return {
        method: (METHODS as readonly string[]).includes(method) ? (method as ApiEndpoint["method"]) : "GET",
        path: str(e.path),
        desc: str(e.desc),
        requestBody: str(e.requestBody) || undefined,
        responseBody: str(e.responseBody) || undefined,
        statusCodes: strArr(e.statusCodes),
      };
    }),
    roadmap: objArr(b.roadmap).map((p, i) => ({
      n: Number(p.n) || i + 1,
      title: str(p.title),
      dur: str(p.dur),
      tasks: strArr(p.tasks),
    })),
    sprints: objArr(b.sprints).map((s) => ({ title: str(s.title), tasks: strArr(s.tasks) })),
    costRows: objArr(b.costRows).map((r) => ({
      label: str(r.label),
      amount: str(r.amount),
      note: str(r.note) || undefined,
    })),
    dbTables: objArr(b.dbTables).map((t) => ({
      name: str(t.name),
      cols: objArr(t.cols).map((c) => {
        const k = str(c.k).toUpperCase();
        return { n: str(c.n), t: str(c.t), k: k === "PK" || k === "FK" ? k : "" };
      }),
    })),
    folderStructure: str(b.folderStructure).replace(/\\n/g, "\n"),
    userStories: strArr(b.userStories),
    deploymentStrategy: str(b.deploymentStrategy),
  };

  if (!blueprint.summary && blueprint.requirements.length === 0) {
    throw new BlueprintFormatError("The AI response was missing the blueprint content. Please try again.");
  }
  return blueprint;
}

