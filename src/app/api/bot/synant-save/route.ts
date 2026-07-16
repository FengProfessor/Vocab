import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { safeErrorResponse, assertBotAuthorized } from '@/lib/api-security';

/**
 * POST /api/bot/synant-save
 * Body: [ { word, synonyms: string[], antonyms: string[] } ]
 *
 * CHỈ merge data.synonyms / data.antonyms vào row tồn tại. KHÔNG đụng field khác.
 * Không có synonyms → đánh dấu data.synAntChecked=true để rời pending.
 */

function authOk(req: Request): boolean {
  return assertBotAuthorized(req) === null;
}

interface InItem { word?: string; synonyms?: string[]; antonyms?: string[] }

function cleanList(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of arr) {
    const v = String(x || '').trim();
    if (v && !seen.has(v.toLowerCase())) { seen.add(v.toLowerCase()); out.push(v); }
  }
  return out.slice(0, 8);
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!authOk(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 });
    }

    const supabase = createServiceClient();
    let saved = 0;

    for (const item of body as InItem[]) {
      const cleanWord = String(item.word || '').trim().toLowerCase();
      if (!cleanWord) continue;

      const synonyms = cleanList(item.synonyms);
      const antonyms = cleanList(item.antonyms);

      const { data: row, error: selErr } = await supabase
        .from('global_dictionary')
        .select('data')
        .eq('word', cleanWord)
        .maybeSingle();
      if (selErr || !row) continue;

      const base = row.data || {};
      const newData = synonyms.length > 0 || antonyms.length > 0
        ? { ...base, ...(synonyms.length ? { synonyms } : {}), ...(antonyms.length ? { antonyms } : {}) }
        : { ...base, synAntChecked: true };

      const { error: upErr } = await supabase
        .from('global_dictionary')
        .update({ data: newData })
        .eq('word', cleanWord);
      if (!upErr) saved++;
      else console.error(`[SYNANT-SAVE] "${cleanWord}":`, upErr.message);
    }

    return NextResponse.json({ success: true, saved });
  } catch (e: unknown) {
    return safeErrorResponse(e, 'Failed to save synant batch');
  }
}
