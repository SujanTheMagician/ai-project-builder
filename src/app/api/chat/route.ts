import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { chatRequestSchema } from "@/lib/validation";
import { callGemini, CHAT_MODEL, GeminiError } from "@/services/gemini";

export const maxDuration = 30;

const SYSTEM_INSTRUCTION = `You are an expert software architect and technical advisor. You help developers, founders, and product managers design better software systems.

Your expertise includes system design, database design, API design, cloud infrastructure, technology stack selection, security best practices, and scalability.

Keep responses concise (3-6 sentences or a short list), practical, and actionable. Use plain text only — no markdown symbols such as asterisks or pound signs. Use "-" for bullet points.`;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = chatRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid chat request" }, { status: 400 });

  // Gemini requires the conversation to start with a user turn.
  const messages = parsed.data.messages.slice(-20);
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length) return NextResponse.json({ error: "No user message provided" }, { status: 400 });

  try {
    const text = await callGemini({
      model: CHAT_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
    });

    const reply = text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/(^|\s)\*(\S.*?)\*/g, "$1$2").trim();
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    const status = err instanceof GeminiError ? err.status : 500;
    const message = err instanceof GeminiError ? err.message : "AI request failed. Please try again.";
    return NextResponse.json({ error: message }, { status });
  }
}
