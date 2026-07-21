import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { safeErrorResponse, assertBotAuthorized } from '@/lib/api-security';

/**
 * POST /api/bot/example-vi-save
 *
 * Body (một trong các dạng):
 *   [ { "ids": ["uuid",...], "example_vi": "..." } ]
 *   [ { "i": 0, "ids": [...], "vi": "..." } ]
 *   [ { "id": "uuid", "example_vi": "..." } ]
 *   { "items": [ ... ] }
 *
 * Chỉ update words.example_vi — không đụng translation/example/IPA.
 */

interface InItem {
  id?: string;
  ids?: string[];
  i?: number;
  example?: string;
  example_vi?: string;
  vi?: string;
}

const VN = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

function cleanVi(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .replace(/^["“]|["”]$/g, '')
    .slice(0, 280);
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const denied = assertBotAuthorized(req);
    if (denied) return denied;

    const body: unknown = await req.json();
    let list: InItem[] = [];
    if (Array.isArray(body)) {
      list = body as InItem[];
    } else if (body && typeof body === 'object' && Array.isArray((body as { items?: unknown }).items)) {
      list = (body as { items: InItem[] }).items;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 });
    }

    const supabase = createServiceClient();
    let saved = 0;
    let skipped = 0;

    for (const item of list) {
      const vi = cleanVi(item.example_vi ?? item.vi);
      if (vi.length < 2) {
        skipped++;
        continue;
      }
      // Cảnh báo nhẹ nếu không có dấu VN (có thể vẫn đúng với câu ngắn)
      if (!VN.test(vi) && vi.split(/\s+/).length >= 4) {
        console.warn(`[example-vi-save] sub có vẻ thiếu dấu VN: "${vi.slice(0, 60)}"`);
      }

      const ids = new Set<string>();
      if (Array.isArray(item.ids)) {
        for (const id of item.ids) {
          if (typeof id === 'string' && id.length > 10) ids.add(id);
        }
      }
      if (typeof item.id === 'string' && item.id.length > 10) ids.add(item.id);

      if (ids.size === 0 && item.example) {
        // Fallback: match theo example text (chỉ row còn thiếu example_vi)
        const ex = String(item.example).trim();
        if (ex) {
          const { data: matches } = await supabase
            .from('words')
            .select('id, example_vi')
            .eq('example', ex)
            .limit(50);
          for (const m of matches || []) {
            if (!(m.example_vi || '').trim()) ids.add(m.id as string);
          }
        }
      }

      if (ids.size === 0) {
        skipped++;
        continue;
      }

      // Nếu có example: chỉ update row khớp đúng câu EN (chống gán nhầm sub)
      const exFilter = item.example ? String(item.example).trim() : '';

      const idList = [...ids];
      for (let i = 0; i < idList.length; i += 80) {
        const chunk = idList.slice(i, i + 80);
        let q = supabase
          .from('words')
          .update({ example_vi: vi }, { count: 'exact' })
          .in('id', chunk);
        if (exFilter) {
          q = q.eq('example', exFilter);
        }

        const { error, count } = await q;
        if (error) {
          console.error('[example-vi-save]', error.message);
          skipped += chunk.length;
          continue;
        }
        saved += count ?? chunk.length;
      }
    }

    console.log(`[example-vi-save] saved=${saved} skipped=${skipped} items=${list.length}`);
    return NextResponse.json({ success: true, saved, skipped });
  } catch (e: unknown) {
    return safeErrorResponse(e, 'Failed to save example-vi batch');
  }
}
