# Product Requirements Document — ProjectAI

| | |
|---|---|
| **Product** | ProjectAI — AI-powered project blueprint generator |
| **Owner** | Sujan Anandh S I |
| **Status** | v2 (implemented) |
| **Last updated** | October 2026 |

---

## 1. Summary

ProjectAI turns a plain-English product idea into a complete, editable software blueprint: requirements, architecture, database schema, API design, roadmap, sprint plan and cost estimate. Unlike a one-shot chat answer, the blueprint is a living document. You can edit it, have the AI rewrite single sections, compare and restore versions, discuss it with a project-aware AI architect, and share it with a read-only link.

## 2. Problem

Turning an idea into a buildable plan takes days of work across product, architecture and estimation. Founders, students and small teams either:

- skip planning and pay for it later in rework, or
- ask a general chatbot, get a long unstructured answer, and then have no way to refine it, keep it consistent, or share it.

## 3. Goals and non-goals

### Goals

1. Go from an idea to a full blueprint in under 90 seconds, with visible progress.
2. Make every section refinable without regenerating everything else.
3. Keep a complete, restorable history of every change.
4. Ground follow-up questions in the user's actual blueprint.
5. Make AI cost transparent: credits per action, a ledger, refunds on failure.

### Non-goals (v2)

- Real-time multi-user co-editing.
- Generating application source code.
- Paid plans and billing (the Pro plan is marked "coming soon").

## 4. Personas

| Persona | Need | Key features |
|---|---|---|
| **Founder** (non-technical) | Understand scope and cost before hiring | Wizard, AI brief enhancement, cost tab, share link |
| **Student / indie developer** | A credible plan for a side project or capstone | Templates, ER diagram, SQL export, sprint board |
| **Tech lead / PM** | A first draft to iterate on with the team | Section refinement, version compare, Markdown/DOCX export |

## 5. User stories

| # | Story | Priority |
|---|---|---|
| US-1 | As a user, I want to start from a template or my own idea so that I don't face a blank page. | P0 |
| US-2 | As a user, I want AI to improve my rough description so that the blueprint is better. | P1 |
| US-3 | As a user, I want to see which section is being generated so that I know it's working. | P0 |
| US-4 | As a user, I want to edit any text section inline so that I can correct details. | P0 |
| US-5 | As a user, I want to tell the AI how to change one section (e.g. "use MongoDB") so that I don't lose the rest. | P0 |
| US-6 | As a user, I want to compare and restore earlier versions so that experiments are safe. | P0 |
| US-7 | As a user, I want to chat with an AI that knows my blueprint so that answers are specific. | P0 |
| US-8 | As a user, I want my conversations saved so that I can come back to them. | P1 |
| US-9 | As a user, I want an ER diagram and SQL for my schema so that I can start building. | P1 |
| US-10 | As a user, I want to tag, filter, archive and duplicate projects so that I stay organised. | P1 |
| US-11 | As a user, I want to share a read-only link and revoke it later. | P1 |
| US-12 | As a user, I want to see where my credits went so that cost is transparent. | P1 |
| US-13 | As a user, I want to export to PDF, Markdown, DOCX or JSON. | P0 |
| US-14 | As a user, I want keyboard navigation (Ctrl+K) and dark mode. | P2 |

## 6. Functional requirements

### 6.1 Project creation

- **FR-1** A 3-step wizard: Idea (name, category, description), Details (audience, features, budget, timeline), Review.
- **FR-2** Four starter templates that prefill the wizard.
- **FR-3** "Improve with AI" returns a rewritten description, audience, features and up to 3 clarifying tips. Accepting it is optional. It is free but rate-limited.
- **FR-4** The draft autosaves to the device and is restored on return.
- **FR-5** "Save draft" creates the project without generating a blueprint.

### 6.2 Blueprint generation

- **FR-6** Generation streams progress per section: Overview, Architecture, Database, API, Roadmap, Cost.
- **FR-7** Output is validated against a schema. Invalid output triggers one automatic repair attempt.
- **FR-8** A failed generation refunds its credits automatically.
- **FR-9** If the user leaves the page, generation continues and the result is still saved.

### 6.3 Blueprint workspace

- **FR-10** Each section is its own URL (`/projects/:id/database`, …).
- **FR-11** Text and list fields can be edited inline. Each save creates a new version.
- **FR-12** "Refine with AI" on a section accepts an instruction and rewrites only that section (3 credits).
- **FR-13** The Database tab offers an ER diagram (with FK arrows and hover highlighting), a table view and generated PostgreSQL DDL.
- **FR-14** The API tab offers method and text filters, expandable request/response payloads, and copy-as-cURL.
- **FR-15** The Roadmap tab shows a phase timeline and a sprint board with checkable tasks (progress is saved per device).
- **FR-16** The Cost tab shows the total, a breakdown chart and line items.
- **FR-17** The History tab lists every version with its source and note, compares any two versions field by field, and restores a version non-destructively.

### 6.4 AI chat

- **FR-18** Conversations persist and can be listed, resumed and deleted.
- **FR-19** A conversation can be linked to a project. The assistant then receives a compact summary of that blueprint.
- **FR-20** Replies stream token by token, can be stopped, and render Markdown (tables, code blocks with copy).
- **FR-21** A chat drawer inside a project continues that project's latest conversation.

### 6.5 Organisation and sharing

- **FR-22** Tags: create, recolour, delete, and assign many per project. Projects can be filtered by tag.
- **FR-23** The projects list filters by search, category, status and tag, and sorts. All filters live in the URL.
- **FR-24** Projects can be duplicated, archived, restored and deleted.
- **FR-25** Share links are public, read-only, count views, can be revoked, and are excluded from search engines.

### 6.6 Account and credits

- **FR-26** New accounts start with 500 credits. A blueprint costs 10 credits and a section rewrite costs 3. Chat, edits and exports are free.
- **FR-27** Every credit change is recorded in a ledger, shown paginated with a 14-day usage chart.
- **FR-28** The dashboard shows stats, an onboarding checklist, usage, a category breakdown, drafts waiting for a blueprint, and recent activity.
- **FR-29** Account deletion removes all user data.

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| **Performance** | First section visible in ≤ 10 s; full blueprint in ≤ 60 s (serverless limit). Dashboard queries run in parallel. |
| **Reliability** | Gemini 429/5xx errors are retried with exponential backoff. Credits are refunded on failure. Health endpoint at `/api/health`. |
| **Security** | Every API route requires authentication except `/share/*` and `/api/health`. Every query is scoped to the owner. Secrets are server-only and validated at boot. Per-user rate limits. Prompt-injection guards. |
| **Privacy** | Nothing is public without an explicit share link, and links are revocable. |
| **Accessibility** | Keyboard reachable (Ctrl+K, tabs, menus). ARIA roles on tabs, dialogs and comboboxes. Charts have hidden data tables. Dark mode. |
| **Maintainability** | TypeScript strict mode. One zod schema shared by the AI and validation. CI runs lint, typecheck, AI smoke tests and build. |

## 8. Success metrics

| Metric | Target |
|---|---|
| Wizard completion rate (started → generated) | ≥ 60% |
| Generation success rate (first try or after repair) | ≥ 97% |
| Projects with ≥ 2 versions | ≥ 40% (shows iteration) |
| Projects with at least one chat conversation | ≥ 30% |
| Median time to first section | ≤ 10 s |

## 9. Release plan

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundations: env validation, middleware, CI, Git workflow | ✅ |
| 2 | Relational schema: ledger, tags, versions, sharing, SQL analytics | ✅ |
| 3 | AI: structured outputs, versioned prompts, streaming, persisted chat | ✅ |
| 4 | UX: wizard, dashboard, filters, settings, theming | ✅ |
| 5 | Workspace: routed tabs, editing, ER diagram, history, sharing, Ctrl+K | ✅ |
| Next | Billing (Pro), team workspaces, Redis rate limiting, e2e tests | Planned |

## 10. Risks

| Risk | Mitigation |
|---|---|
| The LLM returns malformed or incomplete JSON | responseSchema-constrained decoding, zod validation, one repair round trip |
| Provider outage or rate limits | Retry with backoff, clear error messages, automatic refunds |
| Prompt injection via user text | Data is wrapped in tags, the tags are stripped from input, and the model is told to treat tagged content as data |
| Cost runaway | Credits charged up front, per-user rate limits on AI routes |
| In-memory rate limits don't span instances | Documented; swap for Redis/Upstash when scaling out |
