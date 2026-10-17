import { z, type ZodTypeAny } from "zod";
import type { GeneratedBlueprint, SectionKey as SharedSectionKey } from "@/types";

/**
 * Single source of truth for the blueprint shape. The same zod schema is
 *  1. converted to Gemini's responseSchema, so decoding is constrained to valid JSON of this shape, and
 *  2. used to validate what comes back, with one repair attempt if validation fails.
 */

const text = (description: string) => z.string().min(1).describe(description);
const list = (description: string, min = 1) => z.array(z.string().min(1)).min(min).describe(description);

export const techItemSchema = z.object({
  layer: text("Layer name, e.g. Frontend, Backend, Database, Auth, Infra"),
  stack: text("Concrete technologies with a short reason"),
});

export const apiEndpointSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: text("Route path starting with /api/"),
  desc: text("What the endpoint does"),
  requestBody: z.string().optional().describe("Compact JSON-like request shape, or - when there is no body"),
  responseBody: z.string().optional().describe("Compact JSON-like response shape"),
  statusCodes: z.array(z.string()).optional().describe("e.g. 200 OK, 400 Bad Request"),
});

export const dbTableSchema = z.object({
  name: text("snake_case table name"),
  cols: z
    .array(
      z.object({
        n: text("Column name"),
        t: text("SQL type, e.g. uuid, varchar(255), timestamptz"),
        k: z.enum(["PK", "FK", ""]).describe("PK for primary key, FK for foreign key, empty otherwise"),
      })
    )
    .min(2),
});

export const roadmapPhaseSchema = z.object({
  n: z.number().int().describe("Phase number starting at 1"),
  title: text("Phase name"),
  dur: text("Duration, e.g. Week 1–2"),
  tasks: list("3–5 concrete tasks"),
});

export const sprintSchema = z.object({ title: text("e.g. Sprint 1 — Foundation"), tasks: list("4–6 tasks") });

export const costRowSchema = z.object({
  label: text("Line item"),
  amount: text("Amount with currency symbol"),
  note: z.string().optional(),
});

export const blueprintSchema = z.object({
  summary: text("3–4 sentence executive summary"),
  problem: text("2–3 sentences on the problem being solved"),
  targetUsers: text("Primary user personas"),
  requirements: list("8–12 functional requirements", 5),
  nonFunctional: list("Performance, scalability, security, accessibility, reliability requirements", 3),
  userStories: list("5 stories: As a <role>, I want <goal> so that <benefit>", 3),
  tech: z.array(techItemSchema).min(3).describe("Technology stack by layer"),
  folderStructure: text("Folder tree using ├── └── │ characters and real newlines"),
  deploymentStrategy: text("Hosting, CI/CD, environments and monitoring in one paragraph"),
  dbTables: z.array(dbTableSchema).min(2).describe("4–8 tables with PK and FK columns"),
  apiEndpoints: z.array(apiEndpointSchema).min(4).describe("8–14 endpoints covering the core domain"),
  roadmap: z.array(roadmapPhaseSchema).min(3).describe("6 phases that fit the timeline"),
  sprints: z.array(sprintSchema).min(2).describe("4 sprints"),
  costRows: z.array(costRowSchema).min(2).describe("Line items that fit the budget; the LAST row is the total"),
});

// Compile-time guarantee that the schema and the shared TypeScript type never drift apart.
type Inferred = z.infer<typeof blueprintSchema>;
type Assert<T extends true> = T;
export type SchemaMatchesType = Assert<
  [Inferred] extends [GeneratedBlueprint] ? ([GeneratedBlueprint] extends [Inferred] ? true : false) : false
>;

export type BlueprintKey = keyof GeneratedBlueprint;
export const BLUEPRINT_KEYS = Object.keys(blueprintSchema.shape) as BlueprintKey[];

/** UI sections and the blueprint fields each one owns (used for streaming progress and section regeneration). */
export const SECTIONS = {
  overview: { label: "Overview", keys: ["summary", "problem", "targetUsers", "requirements", "nonFunctional", "userStories"] },
  architecture: { label: "Architecture", keys: ["tech", "folderStructure", "deploymentStrategy"] },
  database: { label: "Database", keys: ["dbTables"] },
  api: { label: "API design", keys: ["apiEndpoints"] },
  roadmap: { label: "Roadmap", keys: ["roadmap", "sprints"] },
  cost: { label: "Cost", keys: ["costRows"] },
} as const satisfies Record<string, { label: string; keys: readonly BlueprintKey[] }>;

export type SectionKey = keyof typeof SECTIONS;
// Keep the hand-written union in @/types (used by client code) in sync with SECTIONS.
export type SectionKeysMatch = Assert<[SectionKey] extends [SharedSectionKey] ? ([SharedSectionKey] extends [SectionKey] ? true : false) : false>;
export const SECTION_KEYS = Object.keys(SECTIONS) as SectionKey[];

export function sectionSchema(section: SectionKey) {
  const keys = SECTIONS[section].keys;
  return blueprintSchema.pick(Object.fromEntries(keys.map((k) => [k, true])) as { [K in BlueprintKey]?: true });
}

export const enhanceSchema = z.object({
  description: text("Improved project description: 3–5 sentences covering what, who, why and the core workflow"),
  audience: text("Specific target audience"),
  features: text("Comma-separated list of 4–7 key features"),
  tips: z.array(z.string()).max(3).describe("Up to 3 short questions the author should think about"),
});

// ─── zod → Gemini responseSchema ─────────────────────────────────────────────

type GeminiSchema = {
  type: "STRING" | "NUMBER" | "INTEGER" | "BOOLEAN" | "ARRAY" | "OBJECT";
  description?: string;
  enum?: string[];
  items?: GeminiSchema;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  propertyOrdering?: string[];
};

/** Converts the zod subset used above into the OpenAPI-style schema Gemini expects. */
export function toGeminiSchema(schema: ZodTypeAny): GeminiSchema {
  const description = schema.description;
  const def = schema._def;

  switch (def.typeName) {
    case "ZodOptional":
    case "ZodDefault":
    case "ZodNullable":
      return { ...toGeminiSchema(def.innerType), ...(description && { description }) };
    case "ZodString":
      return { type: "STRING", ...(description && { description }) };
    case "ZodNumber":
      return { type: def.checks?.some((c: { kind: string }) => c.kind === "int") ? "INTEGER" : "NUMBER", ...(description && { description }) };
    case "ZodBoolean":
      return { type: "BOOLEAN", ...(description && { description }) };
    case "ZodEnum":
      // Gemini rejects empty enum members, so "" (no key) is expressed as an optional free string instead.
      return (def.values as string[]).includes("")
        ? { type: "STRING", description: `${description ?? ""} One of: ${(def.values as string[]).map((v) => JSON.stringify(v)).join(", ")}`.trim() }
        : { type: "STRING", enum: def.values, ...(description && { description }) };
    case "ZodArray":
      return { type: "ARRAY", items: toGeminiSchema(def.type), ...(description && { description }) };
    case "ZodObject": {
      const shape = (schema as z.AnyZodObject).shape as Record<string, ZodTypeAny>;
      const keys = Object.keys(shape);
      return {
        type: "OBJECT",
        properties: Object.fromEntries(keys.map((k) => [k, toGeminiSchema(shape[k])])),
        required: keys.filter((k) => !shape[k].isOptional()),
        propertyOrdering: keys,
        ...(description && { description }),
      };
    }
    default:
      throw new Error(`toGeminiSchema: unsupported zod type ${def.typeName}`);
  }
}
