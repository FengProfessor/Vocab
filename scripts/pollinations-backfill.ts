/**
 * [PollBackfill] AI-gen ảnh qua Pollinations.ai cho các từ trừu tượng còn missing.
 * Pollinations free, không quota, ~2s/ảnh.
 *
 * Strategy:
 *  - Dùng image_search_query từ dictionary_data nếu có (Gemini đã sinh trước)
 *  - Fallback: build prompt từ word + first English keyword from definition
 *  - Validate ảnh ≥ 10KB, content-type image/*
 *  - Update DB với image_source='pollinations'
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const LOG = '[PollBackfill]';

interface Row {
  word: string;
  data: {
    image_search_query?: string;
    results?: Array<{ meanings?: Array<{ pos?: string; definition?: string }> }>;
  } | null;
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

function buildPrompt(row: Row): string {
  const word = row.word;
  const isq = row.data?.image_search_query?.trim();
  if (isq && isq.length > 3) return isq;

  // Fallback: extract English keywords từ definition
  const m0 = row.data?.results?.[0]?.meanings?.[0];
  const def = m0?.definition || '';
  const pos = m0?.pos || '';

  // Lấy ~6 từ đầu English (skip Vietnamese)
  const enWords = def
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => /^[a-zA-Z]+$/.test(w) && w.length > 2)
    .slice(0, 6)
    .join(' ');

  if (enWords) return `${word} - ${enWords}`;

  // Last resort
  if (pos.toLowerCase().includes('verb') || pos.toLowerCase().includes('động từ')) {
    return `person ${word} action illustration`;
  }
  if (pos.toLowerCase().includes('adjective') || pos.toLowerCase().includes('tính từ')) {
    return `concept of ${word} illustration`;
  }
  return `${word} illustration concept`;
}

function pollUrl(prompt: string, seed: number): string {
  const params = new URLSearchParams({
    width: '800',
    height: '500',
    nologo: 'true',
    seed: String(seed),
    safe: 'true',
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
}

async function fetchAndValidate(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
    if (!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.byteLength >= 10000;
  } catch {
    return false;
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  console.log(`${LOG} tải từ missing...`);
  const { data: rows } = await supabase
    .from('global_dictionary')
    .select('word, data')
    .or('image_source.eq.none,image_source.eq.placeholder')
    .is('image_url', null)
    .limit(2000);

  if (!rows || rows.length === 0) {
    console.log(`${LOG} không còn missing.`);
    return;
  }
  console.log(`${LOG} sẽ gen Pollinations cho ${rows.length} từ\n`);

  const stats = { ok: 0, fail: 0 };
  const t0 = Date.now();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] as Row;
    const prompt = buildPrompt(r);
    const baseSeed = [...r.word].reduce((s, c) => s + c.charCodeAt(0), 0);

    const t1 = Date.now();
    let imgUrl = '';
    // Thử 2 seeds nếu cần
    for (let seed = baseSeed; seed < baseSeed + 20000; seed += 7919) {
      const u = pollUrl(prompt, seed);
      if (await fetchAndValidate(u)) {
        imgUrl = u;
        break;
      }
    }

    const dt = ((Date.now() - t1) / 1000).toFixed(1);

    if (imgUrl) {
      const { error } = await supabase
        .from('global_dictionary')
        .update({
          image_url: imgUrl,
          image_source: 'pollinations',
          image_confidence: null, // CLIP sẽ verify lại
          image_query: prompt,
          image_verified_at: new Date().toISOString(),
        })
        .eq('word', r.word);
      if (error) {
        stats.fail++;
        console.error(`${LOG} [${i + 1}/${rows.length}] DB FAIL "${r.word}":`, error.message);
      } else {
        stats.ok++;
        console.log(`${LOG} [${i + 1}/${rows.length}] OK "${r.word}" (${dt}s) | "${prompt.slice(0, 50)}"`);
      }
    } else {
      stats.fail++;
      console.log(`${LOG} [${i + 1}/${rows.length}] FAIL "${r.word}" (${dt}s)`);
    }
  }

  const totalSec = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\n${LOG} ============== KẾT THÚC ==============`);
  console.log(`${LOG} Thời gian: ${totalSec}s | OK: ${stats.ok} | FAIL: ${stats.fail}`);
}

main();
