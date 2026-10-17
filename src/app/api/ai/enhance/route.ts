import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler, parseBody, requireUser } from "@/lib/api";
import { projectInputSchema } from "@/lib/validation";
import { enhanceBrief } from "@/services/blueprints";

export const maxDuration = 30;

const bodySchema = projectInputSchema
  .pick({ name: true, category: true, audience: true, features: true })
  .extend({ description: z.string().trim().min(10, "Write at least a sentence first").max(5000) });

/** Rewrites a rough project brief into a clearer one. Free, but rate-limited by middleware. */
export const POST = apiHandler(async (req: NextRequest) => {
  await requireUser();
  const draft = await parseBody(req, bodySchema, "Add a name, category and a short description first");
  return NextResponse.json({ suggestion: await enhanceBrief(draft) });
});
