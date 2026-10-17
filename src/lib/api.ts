import "server-only";
import { NextRequest, NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import { getDbUser } from "@/lib/auth";

/** An error whose message is safe to show to the client. */
export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

/**
 * Route-handler middleware: turns thrown ApiErrors into JSON responses, hides
 * unexpected errors behind a generic message, and logs every request with its
 * id (set by src/middleware.ts) and duration.
 */
export function apiHandler<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    const started = Date.now();
    const requestId = req.headers.get("x-request-id") ?? "-";
    let status = 500;
    try {
      const res = await handler(req, ctx);
      status = res.status;
      return res;
    } catch (err) {
      if (err instanceof ApiError) {
        status = err.status;
        return NextResponse.json({ error: err.message, ...(err.details ? { issues: err.details } : {}) }, { status });
      }
      console.error(`[${requestId}] Unhandled error in ${req.method} ${req.nextUrl.pathname}:`, err);
      return NextResponse.json({ error: "Something went wrong. Please try again.", requestId }, { status });
    } finally {
      console.info(`[${requestId}] ${req.method} ${req.nextUrl.pathname} → ${status} (${Date.now() - started}ms)`);
    }
  };
}

export async function requireUser() {
  const user = await getDbUser();
  if (!user) throw new ApiError(401, "Unauthorized");
  return user;
}

export async function parseBody<T>(req: NextRequest, schema: ZodSchema<T>, message = "Invalid request"): Promise<T> {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new ApiError(400, message, parsed.error.flatten());
  return parsed.data;
}
