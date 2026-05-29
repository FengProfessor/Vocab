import { NextResponse } from "next/server";
import { getRouter } from "@/lib/ai-router";

/**
 * POST /api/dictionary/smart-lookup
 * Body: { word: string, context: string, meanings: Array<{definition: string, pos: string}> }
 * Returns: { bestIndex: number } — index of the most context-appropriate meaning
 */
type MeaningInput = { definition?: string; pos?: string };

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { word, context, meanings } = (await req.json()) as {
      word?: string;
      context?: string;
      meanings?: MeaningInput[];
    };

    if (!word || !context || !meanings?.length) {
      return NextResponse.json({ bestIndex: 0 });
    }

    // Build numbered list of meanings for the prompt
    const meaningList = meanings
      .slice(0, 6) // Cap at 6 to keep prompt small & fast
      .map((m, i) => `${i + 1}. [${m.pos || "?"}] ${m.definition}`)
      .join("\n");

    const prompt = `You are an expert linguist. A user selected the word "${word}" in this exact context:

"${context}"

Available definitions:
${meaningList}

Task:
1. Analyze the grammatical role (Part of Speech) of "${word}" in the context (noun, verb, etc.).
2. Select the ONE definition that makes the most logical sense in this specific context.
3. Reply with ONLY the NUMBER (1, 2, 3...) of the correct definition. No explanations, no text, just the number.`;

    try {
      // Task nhẹ nhất: chỉ pick index → dùng tier 'fast'
      const text = (await getRouter().generate(prompt, 'fast')).trim();
      const picked = parseInt(text, 10);

      if (!isNaN(picked) && picked >= 1 && picked <= meanings.length) {
        return NextResponse.json({ bestIndex: picked - 1 }); // Convert to 0-based
      }
    } catch (apiErr: unknown) {
      const apiMsg = apiErr instanceof Error ? apiErr.message : 'Unknown error';
      console.warn("[smart-lookup] Gemini error, defaulting to 0:", apiMsg);
    }

    return NextResponse.json({ bestIndex: 0 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error("[smart-lookup] Error:", msg);
    return NextResponse.json({ bestIndex: 0 });
  }
}
