import { NextRequest, NextResponse } from "next/server";
import { getRouter } from "@/lib/ai-router";
import { getAuthUser, unauthorized, checkRateLimit, safeErrorResponse, sanitizeForPrompt } from "@/lib/api-security";

export const maxDuration = 30;

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = checkRateLimit(`ai-speaking:${ip}`, 15, 60_000); // 15 req/min per IP
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    const body = (await req.json()) as {
      history?: ChatMessage[];
      topic?: string;
      lastTranscript?: string;
    };

    const history = body.history || [];
    const rawTopic = body.topic || "Daily Conversation";
    const rawTranscript = body.lastTranscript || "";

    if (!rawTranscript) {
      return NextResponse.json({ success: false, error: "Missing user speech input" }, { status: 400 });
    }

    const topic = sanitizeForPrompt(rawTopic, 100);
    const lastTranscript = sanitizeForPrompt(rawTranscript, 500);

    // Build the chat context for Gemini
    const historyString = history
      .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: "${m.content}"`)
      .join("\n");

    const prompt = `You are a friendly, patient English speaking tutor named Lingo.
The student is practicing their conversational English.
Current Topic/Context: "${topic}"

Conversation History:
${historyString}
Student's latest speech input: "${lastTranscript}"

Your tasks:
1. Analyze the student's latest speech input ("${lastTranscript}"). Identify any obvious grammatical errors, poor word choice, or structural mistakes.
2. Formulate your conversational response:
   - Respond naturally to their comment.
   - Keep your response very concise (1-2 sentences maximum, conversational, friendly).
   - End with a natural follow-up question related to the topic to keep the conversation going.
3. Provide a constructive alternative/better sentence ("suggestedResponse") the student could have said instead.
4. Provide a brief grammar/vocabulary feedback in Vietnamese ("feedback") if they made mistakes. Keep it simple and motivating.

Return ONLY a valid JSON object matching this exact shape:
{
  "response": "Your English conversational response (1-2 sentences)",
  "feedback": "Vietnamese feedback about their mistakes, or congratulations if perfect",
  "suggestedResponse": "Corrected/better English version of the student's latest input"
}
Return ONLY valid raw JSON. No markdown formatting, no code fences.`;

    let text = (await getRouter().generate(prompt, "normal", true)).trim();

    if (text.startsWith("```json")) text = text.replace(/```json/g, "");
    if (text.startsWith("```")) text = text.replace(/```/g, "");
    text = text.trim();

    type SpeakingReply = {
      response?: string;
      feedback?: string;
      suggestedResponse?: string;
    };
    let parsed: SpeakingReply = {};
    try {
      parsed = JSON.parse(text) as SpeakingReply;
    } catch {
      // AI trả JSON kèm rác → vớt object đầu tiên bằng regex (rule dự án)
      const m = text.match(/{[\s\S]*}/);
      if (m) {
        try { parsed = JSON.parse(m[0]) as SpeakingReply; } catch { /* giữ default */ }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        response: parsed.response || "That's interesting! Can you tell me more?",
        feedback: parsed.feedback || "Phát âm và câu nói của bạn rất tốt!",
        suggestedResponse: parsed.suggestedResponse || lastTranscript,
      },
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Failed to process speaking response');
  }
}
