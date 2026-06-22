import { GeneratedBlueprint, ProjectFormData } from "@/types";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function generateProjectBlueprint(
  data: ProjectFormData
): Promise<GeneratedBlueprint> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const prompt = buildPrompt(data);

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/({[\s\S]*})/);
  if (!jsonMatch) throw new Error("Failed to parse AI response as JSON");

  return JSON.parse(jsonMatch[1]);
}

function buildPrompt(data: ProjectFormData): string {
  return `You are a senior software architect. Generate a comprehensive project blueprint for:

Project: "${data.name}"
Category: ${data.category}
Description: ${data.description}
Target Audience: ${data.audience || "General users"}
Expected Features: ${data.features || "Standard features"}
Budget: ${data.budget || "Not specified"}
Timeline: ${data.timeline || "Not specified"}

Return a JSON object with EXACTLY this structure (no markdown prose outside JSON):

\`\`\`json
{
  "summary": "3-4 sentence executive summary of the project",
  "problem": "2-3 sentences describing the problem being solved",
  "targetUsers": "Description of the primary user personas",
  "requirements": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5", "feature 6", "feature 7", "feature 8"],
  "nonFunctional": ["Performance: ...", "Scalability: ...", "Security: ...", "Accessibility: ...", "Reliability: ..."],
  "tech": [
    {"layer": "Frontend", "stack": "Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion"},
    {"layer": "Backend", "stack": "Next.js API Routes, Server Actions, Zod validation"},
    {"layer": "Database", "stack": "PostgreSQL, Prisma ORM, Redis caching"},
    {"layer": "AI / ML", "stack": "Gemini Pro API, LangChain"},
    {"layer": "Auth", "stack": "Clerk — OAuth 2.0, MFA, RBAC"},
    {"layer": "Infra", "stack": "Vercel, Railway, Cloudflare CDN"}
  ],
  "apiEndpoints": [
    {"method": "POST", "path": "/api/auth/register", "desc": "Register new user", "requestBody": "{ email, password, name }", "responseBody": "{ user, token }", "statusCodes": ["201 Created", "400 Bad Request", "409 Conflict"]},
    {"method": "POST", "path": "/api/auth/login", "desc": "User sign in", "requestBody": "{ email, password }", "responseBody": "{ user, token }", "statusCodes": ["200 OK", "401 Unauthorized"]},
    {"method": "GET", "path": "/api/projects", "desc": "List all projects for user", "requestBody": "-", "responseBody": "{ projects[] }", "statusCodes": ["200 OK", "401 Unauthorized"]},
    {"method": "POST", "path": "/api/projects", "desc": "Create new project", "requestBody": "{ name, category, description }", "responseBody": "{ project }", "statusCodes": ["201 Created", "400 Bad Request"]},
    {"method": "GET", "path": "/api/projects/:id", "desc": "Get project details", "requestBody": "-", "responseBody": "{ project, documents }", "statusCodes": ["200 OK", "404 Not Found"]},
    {"method": "PUT", "path": "/api/projects/:id", "desc": "Update project", "requestBody": "{ name?, status? }", "responseBody": "{ project }", "statusCodes": ["200 OK", "404 Not Found"]},
    {"method": "DELETE", "path": "/api/projects/:id", "desc": "Delete project", "requestBody": "-", "responseBody": "{ success }", "statusCodes": ["200 OK", "404 Not Found"]},
    {"method": "POST", "path": "/api/ai/generate", "desc": "Generate AI blueprint", "requestBody": "{ projectId, formData }", "responseBody": "{ blueprint }", "statusCodes": ["200 OK", "429 Rate Limited"]}
  ],
  "roadmap": [
    {"n": 1, "title": "Discovery & Planning", "dur": "Week 1–2", "tasks": ["Stakeholder interviews", "Technical feasibility study", "Architecture decision records"]},
    {"n": 2, "title": "Design & Prototyping", "dur": "Week 3–4", "tasks": ["Wireframes & user flows", "Design system setup", "Clickable prototype"]},
    {"n": 3, "title": "Core Backend", "dur": "Week 5–7", "tasks": ["Database schema & migrations", "Auth integration", "Core API endpoints"]},
    {"n": 4, "title": "Frontend Development", "dur": "Week 8–10", "tasks": ["Dashboard & navigation", "Feature pages", "Component library"]},
    {"n": 5, "title": "AI & Integrations", "dur": "Week 11–12", "tasks": ["AI API integration", "Third-party services", "Webhooks"]},
    {"n": 6, "title": "QA & Deployment", "dur": "Week 13–14", "tasks": ["E2E testing", "Performance optimisation", "Production deployment"]}
  ],
  "sprints": [
    {"title": "Sprint 1 — Foundation", "tasks": ["Project setup & CI/CD", "Database schema", "Clerk auth integration", "Base UI components"]},
    {"title": "Sprint 2 — Core Features", "tasks": ["User dashboard", "Project CRUD", "File uploads", "Email notifications"]},
    {"title": "Sprint 3 — AI Engine", "tasks": ["Gemini API integration", "Blueprint generation", "Export functionality", "Chat assistant"]},
    {"title": "Sprint 4 — Polish & Deploy", "tasks": ["Performance optimisation", "Mobile responsiveness", "E2E tests", "Production launch"]}
  ],
  "costRows": [
    {"label": "Development (2 engineers × 3 months)", "amount": "$15,000", "note": "Based on market rates"},
    {"label": "UI/UX Design", "amount": "$3,000"},
    {"label": "Vercel Pro (annual)", "amount": "$240"},
    {"label": "Database — Railway Pro", "amount": "$240/yr"},
    {"label": "Gemini API (estimated monthly)", "amount": "$80/mo"},
    {"label": "Clerk Auth (Growth plan)", "amount": "$25/mo"},
    {"label": "Miscellaneous (domains, tools)", "amount": "$500"},
    {"label": "Total one-time development cost", "amount": "$18,500"},
    {"label": "Estimated monthly operating cost", "amount": "$150/mo"}
  ],
  "dbTables": [
    {"name": "users", "cols": [{"n": "id", "t": "uuid", "k": "PK"}, {"n": "email", "t": "varchar(255)", "k": ""}, {"n": "name", "t": "varchar(100)", "k": ""}, {"n": "role", "t": "enum", "k": ""}, {"n": "created_at", "t": "timestamp", "k": ""}]},
    {"name": "projects", "cols": [{"n": "id", "t": "uuid", "k": "PK"}, {"n": "user_id", "t": "uuid", "k": "FK"}, {"n": "name", "t": "varchar(255)", "k": ""}, {"n": "category", "t": "varchar(50)", "k": ""}, {"n": "status", "t": "enum", "k": ""}]},
    {"name": "documents", "cols": [{"n": "id", "t": "uuid", "k": "PK"}, {"n": "project_id", "t": "uuid", "k": "FK"}, {"n": "type", "t": "varchar(50)", "k": ""}, {"n": "content", "t": "jsonb", "k": ""}]},
    {"name": "chat_messages", "cols": [{"n": "id", "t": "uuid", "k": "PK"}, {"n": "user_id", "t": "uuid", "k": "FK"}, {"n": "project_id", "t": "uuid", "k": "FK"}, {"n": "role", "t": "enum", "k": ""}, {"n": "content", "t": "text", "k": ""}]}
  ],
  "folderStructure": "src/\\n├── app/\\n│   ├── (auth)/          Auth pages\\n│   ├── (dashboard)/     Protected pages\\n│   └── api/             API routes\\n├── components/\\n│   ├── ui/              shadcn/ui primitives\\n│   ├── shared/          Layout, nav\\n│   ├── dashboard/       Dashboard widgets\\n│   └── project/         Project components\\n├── hooks/               Custom React hooks\\n├── lib/                 Prisma, utils\\n├── services/            AI & business logic\\n├── store/               Zustand state\\n├── types/               TypeScript types\\n└── prisma/              Schema & migrations",
  "userStories": [
    "As a developer, I want to input my project idea so I can get a complete technical blueprint instantly",
    "As a product manager, I want to export the roadmap as PDF so I can share it with stakeholders",
    "As a startup founder, I want cost estimations so I can plan my funding requirements",
    "As a developer, I want database schema generation so I can start coding immediately",
    "As a user, I want an AI chat assistant so I can refine my project architecture interactively"
  ],
  "deploymentStrategy": "Deploy frontend and API to Vercel with automatic previews on PR. Use Railway for managed PostgreSQL with daily backups. Cloudflare CDN for static assets. GitHub Actions for CI/CD pipeline with automated testing, linting, and type checks before merge. Environment-based configuration for dev, staging, and production. Zero-downtime deployments via Vercel's edge network."
}
\`\`\``;
}
