# ProjectAI — AI-Powered Project Blueprint Generator

> Built by **Sujan Anandh S I** · SDE Intern @ ATIUM Sports · AMET University '28

Transform any startup idea into a complete software project blueprint using Gemini AI — architecture, database schema, API design, roadmap, and cost estimates in seconds.

🔗 **Live demo:** [ProjectAI](https://ai-project-builder-jade.vercel.app)

---

## What it generates

| Section | Output |
|---|---|
| Executive Summary | Problem, users, market context |
| Requirements | Functional + non-functional |
| Architecture | Full-stack tech stack, folder structure |
| Database Schema | Tables, columns, PK/FK relationships |
| API Design | REST endpoints with request/response specs |
| Roadmap | 6 phases with timeline |
| Sprint Plan | 4 sprints with tasks |
| Cost Estimate | Dev, infra, API, hosting breakdown |
| Deployment | Strategy and CI/CD guide |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Clerk |
| Database | PostgreSQL + Prisma ORM |
| AI | Google Gemini 2.5 Flash |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Deployment | Vercel + Railway |

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

Fill in `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

DATABASE_URL="postgresql://user:password@host:5432/railway"

GEMINI_API_KEY=your_gemini_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database

```bash
npx prisma db push
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure
src/

├── app/

│   ├── (auth)/          Sign-in / sign-up (Clerk)

│   ├── (dashboard)/     Protected pages

│   └── api/             API routes

├── components/

│   └── project/         Blueprint viewer

├── lib/                 Prisma, utils

├── services/            Gemini AI service

├── store/               Zustand state

├── types/               TypeScript types

src/middleware.ts         Clerk auth middleware

prisma/schema.prisma      Database schema

---

## Deployment

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Deploy — done

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
