import type { GeneratedBlueprint, ProjectFormData } from "@/types";
import { SECTIONS, type SectionKey } from "@/lib/ai/schema";
import { DATA_NOT_INSTRUCTIONS, projectBlock, sanitize } from "./shared";

/**
 * Bump this whenever the prompt text changes. It is stored on every blueprint
 * version, so output quality can be traced back to the exact prompt that made it.
 */
export const BLUEPRINT_PROMPT_VERSION = "blueprint@3";

export const BLUEPRINT_SYSTEM = `You are a principal software architect who writes project blueprints for startups and product teams.

Principles:
- Tailor every section to THIS project. Generic, copy-paste answers are a failure.
- Respect the budget and timeline: a $5k / 1-month MVP gets a lean managed stack; a large budget can justify more.
- Be concrete: name real technologies, real table and column names, real endpoint paths.
- Keep the sections consistent with each other: every API resource is backed by a table, every table appears in the roadmap.
- Prefer boring, proven technology unless the project clearly needs something else.

${DATA_NOT_INSTRUCTIONS}`;

// A short worked example of the level of specificity expected (few-shot), kept small to save tokens.
const EXAMPLE = `Example of the expected specificity (for a different project — do not reuse it):
- requirement: "Clinic staff can book, reschedule and cancel appointments; patients get an SMS reminder 24h before"
- table: appointments(id uuid PK, clinic_id uuid FK, patient_id uuid FK, starts_at timestamptz, status varchar(20))
- endpoint: POST /api/appointments — creates a booking after checking the slot is free → 201 Created, 409 Conflict
- cost row: "Twilio SMS (≈2,000 reminders/month)" — "$16/month"`;

export function buildBlueprintPrompt(project: ProjectFormData) {
  return `Write the complete blueprint for this project.

${projectBlock(project)}

${EXAMPLE}

Quantities:
- 8–12 functional requirements and 5 user stories
- 4–8 database tables, each with an id PK and FK columns for every relationship
- 8–14 API endpoints covering the core domain (not only auth and generic CRUD)
- 6 roadmap phases and 4 sprints whose durations add up to the timeline
- cost rows that fit the budget; the LAST row must be the total`;
}

export function buildSectionPrompt(project: ProjectFormData, current: GeneratedBlueprint, section: SectionKey, instruction?: string) {
  const { label, keys } = SECTIONS[section];
  return `Rewrite only the "${label}" section (fields: ${keys.join(", ")}) of the blueprint below. Keep it consistent with the rest of the blueprint unless the instruction says otherwise.

${projectBlock(project)}

<blueprint>
${JSON.stringify(current)}
</blueprint>

<instruction>
${sanitize(instruction, "Improve the quality, specificity and consistency of this section.")}
</instruction>

The <instruction> block is a request from the project owner about how to change the section; follow it as long as it is about this project.`;
}
