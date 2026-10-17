# ProjectAI — AI-Powered Project Blueprint Generator

> Built by **Sujan Anandh S I** · SDE Intern @ ATIUM Sports · AMET University '28

Transform any startup idea into a complete software project blueprint using Gemini AI — architecture, database schema, API design, roadmap, and cost estimates in seconds.

🔗 **Live demo:** [ProjectAI](https://ai-project-builder-jade.vercel.app)

---

## What it generates

| Section | Output |
|---|---|
| Overview | Executive summary, problem, personas, functional & non-functional requirements, user stories |
| Architecture | Tech stack by layer, request flow, folder structure, deployment strategy |
| Database | Tables with PK/FK, interactive ER diagram, generated PostgreSQL DDL |
| API design | REST endpoints with payloads, status codes and copy-as-cURL |
| Roadmap | Phase timeline and a sprint board with checkable tasks |
| Cost | Total, breakdown chart and line items |

## Features

- **Guided wizard** — templates, "Improve with AI" for your brief, budget/timeline presets, draft autosave
- **Live generation** — streamed per-section progress; failed runs refund credits automatically
- **Iterate, don't regenerate** — edit any section inline, or *Refine with AI* with an instruction ("use MongoDB", "add multi-tenancy")
- **Version history** — every change is a version; compare any two field by field and restore non-destructively
- **Project-aware AI chat** — streamed, Markdown, stoppable, saved conversations grounded in your blueprint
- **Share links** — public read-only page with view count; revoke any time
- **Organise** — tags, URL-driven filters, grid/list view, duplicate, archive
- **Dashboard** — SQL-backed stats, credit usage chart, category breakdown, onboarding checklist, activity feed
- **Credits ledger** — every spend and refund recorded and paginated in Settings
- **Export** — PDF, Markdown, DOCX, JSON
- **Ctrl+K command palette** and **dark mode**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, route handlers) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS, Radix UI primitives, Framer Motion |
| Auth | Clerk |
| Database | PostgreSQL + Prisma ORM (raw SQL for analytics) |
| AI | Google Gemini 2.5 Flash — structured outputs + streaming |
| Validation | Zod (shared by forms, API and AI output) |
| Forms | React Hook Form |
| CI | GitHub Actions (lint, typecheck, AI smoke tests, build) |
| Deployment | Vercel + Railway |

## Documentation

| Doc | Contents |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Product requirements: personas, user stories, functional & non-functional requirements, metrics |
| [docs/HLD.md](docs/HLD.md) | High-level design: context & container diagrams, key flows, architecture decisions, security |
| [docs/LLD.md](docs/LLD.md) | Low-level design: ER diagram, tables, every endpoint, AI pipeline, frontend structure |
| [docs/CONCEPTS.md](docs/CONCEPTS.md) | Where each engineering concept is implemented, with file references |
| [docs/schema.sql](docs/schema.sql) | Generated PostgreSQL DDL |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branching, commit conventions, PR flow, secrets policy |

---

## Getting Started

### 1. Clone

```bash
git clone https://github.com/SujanTheMagician/ai-project-builder.git
cd ai-project-builder
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`. Every variable is validated at startup by `src/lib/env.ts`; the server refuses to start with a clear message if one is missing.

### 3. Database

```bash
npx prisma db push      # create / update tables
npm run db:seed         # backfill the credit ledger & version numbers (safe to re-run)
```

> **Upgrading an existing database?** `db push` drops the old, unused `chat_messages` table (chat now lives in `conversations` + `messages`). Run `npm run db:seed` afterwards so existing users get an opening ledger entry.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Scripts

| Script | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Prisma generate + production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run test:ai` | Offline AI pipeline tests (mocked Gemini — no key needed) |
| `npm run db:push` / `db:seed` / `db:studio` | Database helpers |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                 Sign-in / sign-up (Clerk)
│   ├── (dashboard)/            Dashboard, wizard, projects, chat, settings
│   │   └── projects/[id]/      Workspace layout + one route per tab
│   ├── share/[token]/          Public read-only blueprint
│   └── api/                    Route handlers (projects, ai, chat, tags, user, health)
├── components/
│   ├── chat/                   ChatPanel, ChatWorkspace, Markdown
│   ├── project/                Lists, filters, progress, workspace/ and tabs/
│   ├── settings/               Credits ledger, tag manager
│   └── ui/                     BarChart, CommandPalette, CopyButton, ThemeToggle…
├── hooks/                      useBlueprintGeneration, useDebounce, useLocalStorage, useHotkey, useTheme
├── lib/
│   ├── ai/                     Zod schema → Gemini schema, legacy normaliser
│   ├── analytics.ts            Raw SQL reports (JOINs)
│   ├── api.ts                  apiHandler, requireUser, parseBody
│   ├── credits.ts              Atomic spend/refund + ledger
│   ├── env.ts                  Validated server env
│   └── …
├── prompts/                    Versioned prompt templates
├── services/                   gemini.ts (client), blueprints.ts (domain)
├── instrumentation.ts          Env validation at boot
└── middleware.ts               Auth, rate limiting, request ids
prisma/schema.prisma            Database schema
scripts/ai-smoke-test.ts        Offline AI tests
```

---

## Deployment

1. Push to GitHub — CI runs on every PR
2. Import the repo on [vercel.com](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Run `npx prisma db push` against the production database
5. Deploy

---

## Author

**Sujan Anandh S I**
- 🎓 B.Tech CSE — AMET University, Chennai (2024–2028)
- 💼 SDE Intern @ ATIUM Sports
- 📚 Ex Teaching Assistant @ Kalvium (Jun–Aug 2025)
- 🔗 [LinkedIn](https://www.linkedin.com/in/sujan-anandh-227253212)
- 💻 [GitHub](https://github.com/SujanTheMagician)
- ✉️ sujananandhsi@gmail.com

---

## License

MIT
