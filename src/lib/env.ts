import "server-only";
import { z } from "zod";

/**
 * Server-side environment, validated once and cached.
 *
 * Secrets live only here (never in NEXT_PUBLIC_* variables) and this module is
 * marked server-only, so importing it from a client component fails the build
 * instead of leaking a key into the browser bundle.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine((v) => v.startsWith("postgres://") || v.startsWith("postgresql://"), "DATABASE_URL must be a PostgreSQL connection string"),
  CLERK_SECRET_KEY: z.string().startsWith("sk_", "CLERK_SECRET_KEY must start with sk_"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with pk_"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  GEMINI_CHAT_MODEL: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

// The cached value lives in this closure; every caller after the first gets the same object.
let cached: ServerEnv | null = null;

export function env(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment variables:\n${problems}\nCopy .env.example to .env.local and fill in the values.`);
  }
  cached = parsed.data;
  return cached;
}

/** Validates the environment at server start so misconfiguration fails fast, not on the first request. */
export function validateEnv() {
  if (process.env.SKIP_ENV_VALIDATION === "1") return;
  env();
}
