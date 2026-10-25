/**
 * Adapter cào Quizlet set.
 * CẢNH BÁO: Quizlet chống scraping mạnh + cấu trúc HTML/JSON thay đổi thường xuyên.
 * Adapter parse JSON nhúng trong trang set — cần verify lại khi chạy thật.
 */
import { fetchUrl } from '../core/http-client';
import type { RawEntry } from '../core/normalizer';

interface Term {
  word: string;
  definition: string;
}

/** Lấy các khối JSON nhúng (script __NEXT_DATA__ hoặc window.Quizlet). */
function extractJsonBlobs(html: string): unknown[] {
  const blobs: unknown[] = [];

  const nextData = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (nextData?.[1]) {
    try {
      blobs.push(JSON.parse(nextData[1]));
    } catch {
      /* ignore */
    }
  }

  const setData = html.match(/window\.Quizlet\["[^"]+"\]\s*=\s*(\{[\s\S]*?\});/g);
  if (setData) {
    for (const m of setData) {
      const json = m.replace(/^window\.Quizlet\["[^"]+"\]\s*=\s*/, '').replace(/;$/, '');
      try {
        blobs.push(JSON.parse(json));
      } catch {
        /* ignore */
      }
    }
  }
  return blobs;
}

/** Traverse đệ quy tìm các object có cặp word + definition. */
function findTerms(node: unknown, found: Term[] = []): Term[] {
  if (!node || typeof node !== 'object') return found;

  if (Array.isArray(node)) {
    for (const item of node) findTerms(item, found);
    return found;
  }

  const obj = node as Record<string, unknown>;
  const word = obj.word ?? obj.term;
  const definition = obj.definition ?? obj.def;
  if (typeof word === 'string' && typeof definition === 'string' && word.trim()) {
    found.push({ word: word.trim(), definition: definition.trim() });
  }
  for (const v of Object.values(obj)) findTerms(v, found);
  return found;
}

export async function scrapeSet(setUrl: string): Promise<RawEntry[]> {
  const html = await fetchUrl(setUrl);
  if (!html || typeof html !== 'string') return [];

  for (const blob of extractJsonBlobs(html)) {
    const terms = findTerms(blob);
    if (terms.length) {
      // dedup theo word
      const seen = new Set<string>();
      const out: RawEntry[] = [];
      for (const t of terms) {
        const key = t.word.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ word: t.word, meanings: t.definition ? [{ definition: t.definition }] : [] });
      }
      return out;
    }
  }

  console.warn('[Quizlet] Không trích được terms từ:', setUrl);
  return [];
}
