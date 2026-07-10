import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getRouter } from "@/lib/ai-router";
import { sanitizeForPrompt, checkRateLimitAsync, safeErrorResponse, getAuthUser, unauthorized } from "@/lib/api-security";

// Gọi AI sinh từ điển khi cache miss. Hobby mặc định 10s có thể kill sớm.
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // Route đốt Gemini → bắt buộc JWT, rate limit theo user (chống đốt quota ẩn danh)
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const rl = await checkRateLimitAsync(`ai:${auth.userId}`, 10, 60_000); // 10 req/min per user
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    const { word } = await req.json() as { word?: unknown };

    if (!word || typeof word !== 'string') {
      return NextResponse.json({ success: false, error: "Missing word" }, { status: 400 });
    }
    if (word.length > 50) {
      return NextResponse.json({ success: false, error: "word must not exceed 50 characters" }, { status: 400 });
    }

    const cleanWord = sanitizeForPrompt(word, 50).toLowerCase();
    const supabase = createServiceClient();

    // 1. Kiểm tra Cache trong global_dictionary trước
    const { data: cachedData } = await supabase
      .from('global_dictionary')
      .select('data')
      .eq('word', cleanWord)
      .maybeSingle();

    if (cachedData) {
      return NextResponse.json({ success: true, data: cachedData.data, cached: true });
    }

    // 2. Gọi AI với router — tier 'normal' (short generation, definition lookup)
    const prompt = `You are an English-Vietnamese dictionary. Your task is to look up the English word or phrase "${cleanWord}".

IMPORTANT: If the input is NOT a real English word or phrase (e.g. random characters, gibberish, typos, or non-English text), you MUST return ONLY this exact JSON and nothing else:
{"exists": false}

If it IS a real English word or phrase, return ONLY a valid JSON object with this exact structure:
{
  "exists": true,
  "pronunciations": [
    { "ipa": "/British IPA/", "region": "UK" },
    { "ipa": "/American IPA/", "region": "US" }
  ],
  "results": [
    {
      "meanings": [
        {
          "pos": "Từ loại (e.g. Danh từ, Động từ, Tính từ)",
          "definition": "Vietnamese meaning",
          "example": "An English example sentence",
          "collocations": ["collocation 1", "collocation 2"]
        }
      ]
    }
  ]
}
Include the 3 most common meanings. Always include both UK and US pronunciation entries in "pronunciations" — even if the IPA is identical, still return two separate objects with "region": "UK" and "region": "US". Do not include markdown tags like \`\`\`json. Just the raw JSON.`;

    let text = (await getRouter().generate(prompt, 'normal', true)).trim();

    if (text.startsWith('```json')) text = text.replace(/```json/g, '');
    if (text.startsWith('```')) text = text.replace(/```/g, '');
    text = text.trim();

    const parsed = JSON.parse(text) as Record<string, unknown>;

    // Kiểm tra AI báo từ không tồn tại
    if (parsed.exists === false) {
      console.log(`[ai-lookup] Word not found (AI): "${cleanWord}"`);
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    // Kiểm tra kết quả rác: IPA chứa ký tự "[" (dạng placeholder) hoặc không có nghĩa nào
    const firstIpa = (parsed.pronunciations as Array<{ ipa?: string }> | undefined)?.[0]?.ipa ?? '';
    const hasMeanings = ((parsed.results as Array<{ meanings?: unknown[] }> | undefined)?.[0]?.meanings?.length ?? 0) > 0;
    if (firstIpa.includes('[') || !hasMeanings) {
      console.log(`[ai-lookup] Garbage result for "${cleanWord}" — skipping cache`);
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const data = parsed;

    // 3. Lưu vào Cache (fire-and-forget) — chỉ khi kết quả hợp lệ
    supabase.from('global_dictionary').insert({
      word: cleanWord,
      data: data,
      tags: ['ai-generated'],
    }).then(({ error }) => {
      if (error) console.error('[ai-lookup] Cache save error:', error.message);
    });

    return NextResponse.json({ success: true, data, cached: false });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'Failed to lookup word');
  }
}
