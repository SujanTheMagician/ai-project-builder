import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

const SYSTEM_CONTEXT = `You are an expert software architect and technical advisor. You help developers, founders, and product managers design better software systems.

Your expertise includes system design, database design, API design, cloud infrastructure, technology stack selection, security best practices, and scalability.

Keep responses concise (3-5 sentences), practical, and actionable. Use bullet points for lists. Remove all markdown asterisks from your response — use plain text only.`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  if (!messages?.length) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });
  }

  const contents = [
    { role: "user", parts: [{ text: SYSTEM_CONTEXT }] },
    { role: "model", parts: [{ text: "Understood. Ready to help with software architecture." }] },
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  ];

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }

  const data = await response.json();
  let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Please try again.";
  
  // Remove markdown formatting
  reply = reply.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");

  return NextResponse.json({ reply });
}