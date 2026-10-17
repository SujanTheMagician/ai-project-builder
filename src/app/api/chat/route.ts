import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, apiHandler, parseBody, requireUser } from "@/lib/api";
import { chatRequestSchema } from "@/lib/validation";
import { models, streamGemini, type GeminiContent } from "@/services/gemini";
import { getLatestBlueprint } from "@/services/blueprints";
import { buildChatSystem } from "@/prompts/chat";

export const maxDuration = 60;

const HISTORY_LIMIT = 20;

async function resolveConversation(userId: string, conversationId: string | undefined, projectId: string | undefined, firstMessage: string) {
  if (conversationId) {
    const existing = await prisma.conversation.findFirst({ where: { id: conversationId, userId } });
    if (!existing) throw new ApiError(404, "Conversation not found");
    return existing;
  }
  if (projectId && !(await prisma.project.count({ where: { id: projectId, userId } }))) {
    throw new ApiError(404, "Project not found");
  }
  const title = firstMessage.length > 60 ? firstMessage.slice(0, 57).trimEnd() + "…" : firstMessage;
  return prisma.conversation.create({ data: { userId, projectId: projectId ?? null, title } });
}

/**
 * Streams the assistant's reply as plain UTF-8 text. History comes from the
 * database (the client can't rewrite it), and both turns are persisted.
 * The conversation id is returned in the x-conversation-id header.
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const { conversationId, projectId, message } = await parseBody(req, chatRequestSchema, "Invalid chat request");

  const conversation = await resolveConversation(user.id, conversationId, projectId, message);

  const [history, project] = await Promise.all([
    prisma.message.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "desc" }, take: HISTORY_LIMIT }),
    conversation.projectId ? prisma.project.findUnique({ where: { id: conversation.projectId }, select: { id: true, name: true } }) : null,
  ]);
  const blueprint = project ? (await getLatestBlueprint(project.id))?.blueprint ?? null : null;


  // Gemini requires the conversation to start with a user turn.
  const turns = history.reverse();
  while (turns.length && turns[0].role !== "user") turns.shift();
  const contents: GeminiContent[] = [
    ...turns.map((m) => ({ role: m.role === "assistant" ? ("model" as const) : ("user" as const), parts: [{ text: m.content }] })),
    { role: "user", parts: [{ text: message }] },
  ];

  const iterator = streamGemini({
    model: models.chat,
    systemInstruction: buildChatSystem(project ? { name: project.name, blueprint } : undefined),
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
      // Gemini 2.5 "thinks" before answering, which delayed the first token by ~11s in production.
      // Chat favours responsiveness, so disable it on Flash models (Pro models can't disable thinking).
      ...(models.chat.includes("flash") && { thinkingConfig: { thinkingBudget: 0 } }),
    },
    signal: req.signal,
  });

  // Wait for the first token before committing to a 200 stream, so early failures
  // (rate limits, bad config) still reach the client as proper JSON errors.
  let first: IteratorResult<string>;
  try {
    first = await iterator.next();
  } catch (err) {
    // Don't leave an empty conversation behind when its very first message failed.
    if (!conversationId) await prisma.conversation.delete({ where: { id: conversation.id } }).catch(() => {});
    throw err;
  }
  let reply = first.done ? "" : first.value;
  await prisma.message.create({ data: { conversationId: conversation.id, role: "user", content: message } });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (reply) controller.enqueue(encoder.encode(reply));
        for await (const delta of { [Symbol.asyncIterator]: () => iterator }) {
          reply += delta;
          controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        // An abort means the user pressed Stop; anything else is a provider failure mid-stream.
        if (!req.signal.aborted) {
          console.error("Chat stream failed:", err);
          controller.error(err);
        }
      } finally {
        if (reply.trim()) {
          const content = req.signal.aborted ? `${reply.trimEnd()}\n\n_(stopped)_` : reply;
          await prisma.$transaction([
            prisma.message.create({ data: { conversationId: conversation.id, role: "assistant", content } }),
            prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } }),
          ]).catch((e) => console.error("Failed to save assistant message:", e));
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "x-conversation-id": conversation.id,
    },
  });
});
