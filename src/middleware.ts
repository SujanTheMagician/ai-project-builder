import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { createRateLimiter } from "@/lib/rate-limit";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/share/(.*)", "/api/health"]);

// AI calls cost money, so they get a tighter budget than the rest of the API.
const RATE_LIMITS = [
  { matcher: createRouteMatcher(["/api/ai/(.*)", "/api/projects/(.*)/sections"]), check: createRateLimiter({ limit: 10, windowMs: 60_000 }) },
  { matcher: createRouteMatcher(["/api/chat(.*)"]), check: createRateLimiter({ limit: 20, windowMs: 60_000 }) },
  { matcher: createRouteMatcher(["/api/(.*)"]), check: createRateLimiter({ limit: 120, windowMs: 60_000 }) },
];

export default clerkMiddleware(async (auth, req) => {
  // Reuse an upstream request id (e.g. from Vercel's proxy) or mint one, so logs can be correlated end to end.
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  const isApi = req.nextUrl.pathname.startsWith("/api/");
  if (isApi && req.method !== "GET") {
    const { userId } = await auth();
    const key = userId ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
    const rule = RATE_LIMITS.find((r) => r.matcher(req));
    const result = rule?.check(key);

    if (result && !result.ok) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${result.retryAfterSec}s and try again.` },
        { status: 429, headers: { "Retry-After": String(result.retryAfterSec), "x-request-id": requestId } }
      );
    }
  }

  // Forward the id to route handlers (request header) and back to the client (response header).
  const headers = new Headers(req.headers);
  headers.set("x-request-id", requestId);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("x-request-id", requestId);
  return res;
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
