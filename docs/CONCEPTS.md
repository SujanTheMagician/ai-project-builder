# Where each concept lives in the code

A map from engineering concepts to the exact places they're used, with a short explanation of why each one is there.

## AI application engineering

| Concept | Where | What to look at |
|---|---|---|
| **LLM API integration** | `src/services/gemini.ts` | `callGemini` (REST), `streamGemini` (SSE async generator, line 95), API key sent only from the server, provider errors logged but not leaked to clients |
| **Prompt engineering** | `src/prompts/` | System instructions with principles, a few-shot specificity example, explicit quantities, delimited user data, injection guard `sanitize()` (`shared.ts:8`), and `BLUEPRINT_PROMPT_VERSION` (`blueprint.ts:9`) stored on every version |
| **Structured outputs** | `src/lib/ai/schema.ts` | One zod `blueprintSchema` (line 55) → `toGeminiSchema()` (line 122) → Gemini `responseSchema` with `propertyOrdering`; output validated with zod plus a repair turn in `generateStructured` (`gemini.ts:160`). A compile-time assertion keeps the schema equal to the `GeneratedBlueprint` type |

## Backend and system design

| Concept | Where | What to look at |
|---|---|---|
| **Middleware** | `src/middleware.ts:14` | Clerk auth with a public allow-list, per-user sliding-window rate limiting, `x-request-id` propagation |
| | `src/lib/api.ts:16` | `apiHandler`, route-level middleware: maps `ApiError` to status codes, hides unexpected errors, logs method/path/status/duration with the request id |
| **System design (frontend ↔ backend ↔ DB ↔ external)** | `docs/HLD.md` | Container diagram and sequence diagrams for streamed generation and chat |
| | `src/app/api/ai/generate/route.ts:30` | Browser → API → credits ledger (DB) → Gemini stream → DB → NDJSON back to the browser |
| **Environment variables and secrets** | `src/lib/env.ts` | zod-validated, `server-only` (a client import fails the build), cached in a closure (line 28) |
| | `src/instrumentation.ts:2` | Validates at server boot so misconfiguration fails fast |
| | `.env.example`, `.github/workflows/ci.yml` | Documented variables; CI uses placeholders and `SKIP_ENV_VALIDATION` |

## Engineering practices

| Concept | Where |
|---|---|
| **Git workflow** | `CONTRIBUTING.md` (branch prefixes, Conventional Commits, PR flow), `.github/pull_request_template.md`, CI on every PR. History: one `feat/*` or `docs/*` branch per phase, merged with `--no-ff` (`git log --graph --oneline`) |

## Frontend

| Concept | Where | What to look at |
|---|---|---|
| **Client-side routing** | `src/components/project/workspace/ProjectTabs.tsx` | Each tab is a nested route; `<Link>` prefetches; the shared layout stays mounted |
| | `src/components/project/ProjectFilters.tsx`, `src/components/chat/ChatWorkspace.tsx` | State in the URL via `useSearchParams` + `router.replace`; `useTransition` (`ProjectFilters.tsx:30`) keeps the old list visible while the next one renders |
| | `src/components/ui/CommandPalette.tsx` | Ctrl+K navigation with `router.push` |
| **async/await** | everywhere; e.g. `src/services/blueprints.ts:81` | `for await (const delta of streamGemini(...))` consumes an async generator |
| **Closures** | `src/lib/rate-limit.ts:11` | `createRateLimiter` returns a function that closes over its private `hits` map |
| | `src/lib/stream.ts:48` | `frameBatcher` keeps `pending` text and the frame id in a closure between calls |
| | `src/components/settings/CreditsCard.tsx:26` | Each effect run captures its own `ignore` flag, so stale responses are dropped |
| **Event loop** | `src/lib/stream.ts:16` | Each `await reader.read()` yields to the event loop, so React renders between chunks |
| | `src/lib/stream.ts:48` | `requestAnimationFrame` batches dozens of chunks into one render per frame |
| | `src/services/gemini.ts:37` | `setTimeout`-based `sleep` lets the retry loop wait without blocking |
| **Hoisting** | `src/components/project/workspace/Section.tsx` | `Section` (line 19) renders `<RefineButton>`, which is declared later (line 44). Function declarations are hoisted. The same applies to the tab helper components. In contrast, `const` arrow functions (e.g. `nextId` in `ChatPanel.tsx`) are in the temporal dead zone until their line runs, so they are declared before use |
| **Promises vs callbacks** | `src/services/gemini.ts:37` | `setTimeout(callback)` wrapped in `new Promise` → `await sleep(ms)` |
| | `src/app/(dashboard)/dashboard/page.tsx:28` | `Promise.all` runs 8 independent queries concurrently |
| | `src/components/project/tabs/HistoryTab.tsx` | `Promise.all` loads both versions for a diff |
| | `src/lib/stream.ts` | `readNdjson` takes an `onEvent` callback for each line but is itself awaited as a promise. Both styles, chosen for their jobs |
| **Side effects with useEffect** | `src/components/chat/ChatPanel.tsx:85` | Fetch with `AbortController` cleanup when switching conversations; abort the stream on unmount; auto-scroll; textarea auto-grow |
| | `src/hooks/useDebounce.ts:10` | Timer set in the effect and cleared in its cleanup |
| | `src/hooks/useHotkey.ts` | Window listener added and removed; latest handler kept in a ref (line 12) |
| | `src/components/project/tabs/ERDiagram.tsx:59` | `useLayoutEffect` measures DOM before paint; `ResizeObserver` disconnected on cleanup |
| | `src/app/(dashboard)/new-project/page.tsx` | Restore the draft once, then debounced autosave |

## SQL (PostgreSQL)

| Concept | Where | What to look at |
|---|---|---|
| **Relational schema design with PK/FK** | `prisma/schema.prisma`, `docs/schema.sql`, `docs/LLD.md` §1 | Composite PK on the `project_tags` junction table; `ON DELETE CASCADE` vs `SET NULL` chosen per relation (the ledger keeps rows when a project is deleted); unique `(userId, name)`; enums; indexes matched to query patterns |
| **SQL JOINs** | `src/lib/analytics.ts` | LEFT JOIN with aggregates (line 15), `generate_series` LEFT JOIN to zero-fill days (line 30), anti-join `WHERE d.id IS NULL` (line 79), `JOIN` inside scalar subqueries, all parameterised |
| | `prisma/seed.ts` | `UPDATE … FROM (subquery with ROW_NUMBER() OVER (PARTITION BY …))` |
