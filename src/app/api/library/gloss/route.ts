import { sessionErrorResponse } from '@/lib/session-response';
/**
 * POST /api/library/gloss
 * Body: { words: string[] }
 * Trả map lemma → { pos, definition, example, ipa } từ global_dictionary + fallback tĩnh + peer words (batch).
 * Dùng cho PDF chủ đề / unit — đủ nghĩa + dạng từ + phiên âm, không gọi AI.
 */
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorized, getClientIp } from '@/lib/api-security';
import { assertScrapeQuota, QUOTA } from '@/lib/anti-scrape';
import {
  cleanBareIpaString,
  cleanViDefinition,
  getLookupCandidateKeys,
  resolveVocabPartialFromSources,
  type GlobalDictRowInput,
} from '@/lib/vocab-entry-resolver';

export interface WordGloss {
  pos: string;
  definition: string;
  example: string;
  /** IPA đã clean, không slash bọc ngoài (PDF tự thêm /…/) */
  ipa: string;
}

export async function POST(req: Request) {
  try {
    // Bắt buộc đăng nhập — chống dump global_dictionary ẩn danh
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const ip = getClientIp(req);
    // PDF/export: siết riêng — học tải vài file OK, cào hàng loạt bị chặn
    const denied = await assertScrapeQuota(
      `library-gloss:${auth.userId}:${ip}`,
      QUOTA.pdfGloss,
    );
    if (denied) return denied;

    const body = (await req.json()) as { words?: unknown };
    if (!Array.isArray(body.words)) {
      return NextResponse.json({ success: false, error: 'words[] required' }, { status: 400 });
    }

    const words = [
      ...new Set(
        body.words
          .filter((w): w is string => typeof w === 'string')
          .map((w) => w.trim().toLowerCase())
          .filter((w) => w.length > 0 && w.length < 80),
      ),
    ];

    if (words.length === 0) {
      return NextResponse.json({ success: true, glosses: {} as Record<string, WordGloss> });
    }
    // Cap 100 — đủ 1 unit/PDF; chặn dump bulk
    if (words.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Tối đa 100 từ / lần (chống cào dữ liệu)' },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const allCandidateKeys = [...new Set(words.flatMap((w) => getLookupCandidateKeys(w)))];
    const gdMap = new Map<string, GlobalDictRowInput>();
    const CHUNK = 200;

    for (let i = 0; i < allCandidateKeys.length; i += CHUNK) {
      const slice = allCandidateKeys.slice(i, i + CHUNK);
      const { data, error } = await supabase
        .from('global_dictionary')
        .select('word, data')
        .in('word', slice);
      if (error) throw error;
      for (const row of (data ?? []) as Array<{ word: string; data: unknown }>) {
        gdMap.set(String(row.word).toLowerCase(), row);
      }
    }

    const glosses: Record<string, WordGloss> = {};
    for (const w of words) {
      const resolved = resolveVocabPartialFromSources(w, gdMap);
      glosses[w] = {
        pos: resolved.pos || '',
        definition: resolved.translation || '',
        example: resolved.example || '',
        ipa: resolved.ipa || '',
      };
    }

    // Fallback peer words cho từ vẫn còn thiếu nghĩa hoặc IPA (không gọi AI)
    const stillMissing = words.filter((w) => !glosses[w].definition || !glosses[w].ipa);
    if (stillMissing.length > 0) {
      const peerKeys = [...new Set(stillMissing.flatMap((w) => getLookupCandidateKeys(w)))];
      const peerMap = new Map<
        string,
        { definition: string; ipa: string; pos: string; example: string }
      >();

      for (let i = 0; i < peerKeys.length; i += CHUNK) {
        const slice = peerKeys.slice(i, i + CHUNK);
        const { data: peerRows } = await supabase
          .from('words')
          .select('word, translation, ipa, pos, example')
          .in('word', slice)
          .not('translation', 'is', null)
          .neq('translation', '')
          .not('translation', 'ilike', '%Analyzing%')
          .not('translation', 'ilike', '%failed%')
          .limit(400);

        for (const r of (peerRows ?? []) as Array<{
          word?: string | null;
          translation?: string | null;
          ipa?: string | null;
          pos?: string | null;
          example?: string | null;
        }>) {
          const key = r.word?.trim().toLowerCase();
          if (!key) continue;
          const def = cleanViDefinition(r.translation);
          const ipa = cleanBareIpaString(r.ipa, key);
          if (!def && !ipa) continue;
          const prev = peerMap.get(key);
          if (!prev || (!prev.definition && def) || (!prev.ipa && ipa)) {
            peerMap.set(key, {
              definition: prev?.definition || def,
              ipa: prev?.ipa || ipa,
              pos: prev?.pos || (r.pos?.trim() ?? ''),
              example: prev?.example || (r.example?.trim() ?? ''),
            });
          }
        }
      }

      for (const w of stillMissing) {
        for (const key of getLookupCandidateKeys(w)) {
          const peer = peerMap.get(key);
          if (!peer) continue;
          if (!glosses[w].definition && peer.definition) glosses[w].definition = peer.definition;
          if (!glosses[w].ipa && peer.ipa) glosses[w].ipa = peer.ipa;
          if (!glosses[w].pos && peer.pos) glosses[w].pos = peer.pos;
          if (!glosses[w].example && peer.example) glosses[w].example = peer.example;
          if (glosses[w].definition && glosses[w].ipa) break;
        }
      }
    }

    const withDef = Object.values(glosses).filter((g) => g.definition).length;
    const withIpa = Object.values(glosses).filter((g) => g.ipa).length;
    return NextResponse.json({
      success: true,
      glosses,
      stats: { requested: words.length, withDefinition: withDef, withIpa },
    });
  } catch (err: unknown) {
    const sessionFailure = sessionErrorResponse(err);
    if (sessionFailure) return sessionFailure;
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[library/gloss]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
