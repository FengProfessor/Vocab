import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getRouter } from "@/lib/ai-router";
import { getAuthUser, unauthorized, sanitizeForPrompt, checkRateLimit, safeErrorResponse } from "@/lib/api-security";

export const maxDuration = 30;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const userId = auth.userId;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rl = checkRateLimit(`ai-phrase:${ip}`, 10, 60_000); // 10 req/min per IP
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    const { phrase, context } = (await req.json()) as { phrase?: unknown; context?: unknown };

    if (!phrase || typeof phrase !== 'string') {
      return NextResponse.json({ success: false, error: "Missing phrase" }, { status: 400 });
    }
    if (phrase.length > 200) {
      return NextResponse.json({ success: false, error: "phrase too long" }, { status: 400 });
    }

    const cleanPhrase = sanitizeForPrompt(phrase, 200);
    const cleanContext = typeof context === 'string' ? sanitizeForPrompt(context, 500) : '';

    const supabase = createServiceClient();

    // ── Pro Plan Verification ──
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    const isPro = profile.plan === 'pro' || profile.plan === 'premium';
    const isExpired = profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date();

    if (!isPro || isExpired) {
      return NextResponse.json({ success: false, error: "Pro plan required" }, { status: 403 });
    }

    // ── Call AI to extract and normalize collocation ──
    const prompt = `You are a bilingual lexicographer. A user highlighted the phrase/clause: "${cleanPhrase}" within the context: "${cleanContext}".
Identify the core phrasal verb, collocation, or idiom in the highlighted phrase (reconstruct it to its dictionary base form, e.g., "take into account", "put off", "adhere to").
Return ONLY a valid JSON object matching this exact shape:
{
  "resolvedWord": "the base form of the collocation/phrasal verb/idiom (lowercase)",
  "ipa": "IPA phonetic transcription of the resolved phrase",
  "pos": "Part of speech (e.g. Cụm động từ, Cụm danh từ, Thành ngữ)",
  "definition": "Clear, concise Vietnamese translation/meaning of the resolved phrase",
  "example": "A natural English example sentence using the resolved phrase in the context",
  "collocations": ["related collocation 1", "related collocation 2"]
}
Return ONLY valid raw JSON. No markdown fences, no explanations.`;

    let text = (await getRouter().generate(prompt, 'normal', true)).trim();

    if (text.startsWith('```json')) text = text.replace(/```json/g, '');
    if (text.startsWith('```')) text = text.replace(/```/g, '');
    text = text.trim();

    const parsed = JSON.parse(text) as {
      resolvedWord?: string;
      ipa?: string;
      pos?: string;
      definition?: string;
      example?: string;
      collocations?: string[];
    };

    const data = {
      resolvedWord: parsed.resolvedWord || cleanPhrase,
      results: [
        {
          meanings: [
            {
              pos: parsed.pos || 'Cụm từ',
              definition: parsed.definition || 'Không rõ nghĩa',
              example: parsed.example || '',
              links: parsed.collocations || [],
            }
          ],
          pronunciations: parsed.ipa ? [{ ipa: parsed.ipa }] : [],
        }
      ],
      _bestIndex: 0,
    };

    return NextResponse.json({ success: true, data });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'Failed to lookup phrase');
  }
}
