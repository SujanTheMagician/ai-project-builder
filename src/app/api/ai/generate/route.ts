import { after, NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, apiHandler, parseBody, requireUser } from "@/lib/api";
import { refundCredits, spendCredits } from "@/lib/credits";
import { generateBlueprint, generationMeta, saveBlueprintVersion, toFormData } from "@/services/blueprints";
import type { GenerationEvent } from "@/types";

// Blueprint generation can take a while; allow up to 60s on Vercel.
export const maxDuration = 60;

const bodySchema = z.object({ projectId: z.string().min(1) });

/**
 * Streams newline-delimited JSON progress events (see GenerationEvent) and
 * finishes with either `done` or `error`. Errors before the stream starts
 * (auth, validation, credits) are ordinary JSON responses.
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const { projectId } = await parseBody(req, bodySchema, "Missing projectId");

  // Build the prompt from the stored project, not from client-supplied data.
  const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) throw new ApiError(404, "Project not found");

  const cost = await spendCredits(user.id, "blueprint_generation", projectId);
  const encoder = new TextEncoder();

  // If the user leaves the page, keep the function alive until the blueprint is saved (or refunded).
  // The promise is created now (not inside the callback, which only runs after the response ends).
  let markFinished!: () => void;
  const finished = new Promise<void>((resolve) => (markFinished = resolve));
  after(() => finished);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const emit = (event: GenerationEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {
          // The client went away. Keep generating so the result is still saved for them.
          open = false;
        }
      };

      try {
        const blueprint = await generateBlueprint(toFormData(project), emit);
        const doc = await saveBlueprintVersion(projectId, blueprint, { source: "ai_generation", note: "Generated blueprint", ...generationMeta() });
        emit({ type: "done", version: doc.version });
      } catch (err) {
        console.error(`[${req.headers.get("x-request-id")}] Blueprint generation failed:`, err);
        await refundCredits(user.id, cost, projectId).catch((e) => console.error("Credit refund failed:", e));
        emit({ type: "error", message: err instanceof ApiError ? err.message : "AI generation failed. Your credits were refunded." });
      } finally {
        if (open) controller.close();
        markFinished();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" },
  });
});
