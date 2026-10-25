/**
 * [GeminiCLI] Verify ảnh hàng loạt bằng Gemini CLI (Google One AI Pro).
 * Cho mỗi từ: download ảnh → spawn `gemini -p` với @image → parse JSON → update DB.
 *
 * Dùng cho RESET items sau backfill round mới — confirm chất lượng cao.
 * ETA ~18s/từ (CLI overhead) → 200 từ ~60 phút.
 *
 * Chạy: cd web-app && npx tsx scripts/gemini-cli-verify-batch.ts [--limit N]
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const LOG = '[GeminiCLI]';
const TMP_DIR = path.resolve(process.cwd(), 'tmp-gemini-verify');

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (k: string, d: string) => {
    const i = args.indexOf(k);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : d;
  };
  return {
    limit: parseInt(get('--limit', '200'), 10),
    dryRun: args.includes('--dry-run'),
  };
}

interface Row {
  word: string;
  image_url: string | null;
  image_source: string | null;
  data: { results?: Array<{ meanings?: Array<{ pos?: string; definition?: string }> }> } | null;
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

async function downloadImage(url: string, filePath: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 1000) return false;
    fs.writeFileSync(filePath, buf);
    return true;
  } catch {
    return false;
  }
}

function safeName(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
}

function callGeminiCLI(imagePath: string, word: string, pos: string, definition: string): { score: number; reason: string } {
  // @image-path syntax: Gemini CLI tự fetch local file
  const relPath = path.relative(process.cwd(), imagePath).replace(/\\/g, '/');
  const prompt = `Look at @${relPath}

Score 0-100 if this image illustrates the English word "${word}"${pos ? ` (${pos})` : ''}.
Meaning: "${definition}"

CRITICAL: If image only shows the word as text/letters/dictionary card → score 5.
If image is brand logo with the word → score 10.
If image actually depicts the concept → 70-100.

Reply ONLY ONE LINE in this exact JSON format, no markdown:
{"match_score": <int>, "reason": "<short>"}`;

  try {
    const stdout = execSync(
      `gemini -p ${JSON.stringify(prompt)} --yolo -o text`,
      {
        encoding: 'utf-8',
        timeout: 60000,
        env: {
          ...process.env,
          GEMINI_CLI_TRUST_WORKSPACE: 'true',
          PATH: process.env.PATH + ':/c/Users/tapho/AppData/Roaming/npm',
        },
        maxBuffer: 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    );

    // Tìm JSON trong stdout
    const m = stdout.match(/\{[^{}]*"match_score"[^{}]*\}/);
    if (!m) return { score: -1, reason: `no JSON in output: ${stdout.slice(0, 80)}` };

    const parsed = JSON.parse(m[0]);
    const score = Math.max(0, Math.min(100, Number(parsed.match_score) || 0));
    return { score, reason: String(parsed.reason || '').slice(0, 100) };
  } catch (e) {
    return { score: -1, reason: `CLI exc: ${(e as Error).message.slice(0, 80)}` };
  }
}

async function main() {
  const { limit, dryRun } = parseArgs();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  console.log(`${LOG} limit=${limit} dry-run=${dryRun}`);

  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

  // Query: ảnh chưa được Vision verify (confidence=null), có image_url
  // Ưu tiên ảnh mới backfill (source pexels/duckduckgo) và verify gần đây
  const { data, error } = await supabase
    .from('global_dictionary')
    .select('word, image_url, image_source, data')
    .is('image_confidence', null)
    .not('image_url', 'is', null)
    .not('image_source', 'in', '(skip-function,none,placeholder)')
    .order('word')
    .limit(limit);

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const rows = (data || []) as Row[];
  console.log(`${LOG} sẽ verify ${rows.length} từ qua Gemini CLI\n`);

  const stats = { kept: 0, downgraded: 0, reset: 0, error: 0 };
  const t0 = Date.now();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const m0 = r.data?.results?.[0]?.meanings?.[0] || {};
    const definition = m0.definition || '';
    const pos = m0.pos || '';

    const t1 = Date.now();
    const imgPath = path.join(TMP_DIR, `${safeName(r.word)}.jpg`);

    // Download ảnh
    const ok = await downloadImage(r.image_url!, imgPath);
    if (!ok) {
      stats.error++;
      console.log(`${LOG} [${i + 1}/${rows.length}] ERR  "${r.word}" — image download failed`);
      continue;
    }

    // Call Gemini CLI
    const { score, reason } = callGeminiCLI(imgPath, r.word, pos, definition);
    const dt = ((Date.now() - t1) / 1000).toFixed(1);

    if (score === -1) {
      stats.error++;
      console.log(`${LOG} [${i + 1}/${rows.length}] ERR  "${r.word}" — ${reason} (${dt}s)`);
      continue;
    }

    let action = '';
    const update: Record<string, unknown> = { image_confidence: score, image_verified_at: new Date().toISOString() };

    if (score >= 70) {
      update.image_source = r.image_source!.replace(/-low$/, '');
      stats.kept++;
      action = `KEEP ${score}`;
    } else if (score > 15) {
      if (!r.image_source!.endsWith('-low')) update.image_source = `${r.image_source}-low`;
      stats.downgraded++;
      action = `LOW  ${score}`;
    } else {
      update.image_url = null;
      update.image_source = 'none';
      update.image_confidence = null;
      stats.reset++;
      action = `RESET ${score}`;
    }

    if (!dryRun) {
      const { error: upErr } = await supabase
        .from('global_dictionary')
        .update(update)
        .eq('word', r.word);
      if (upErr) {
        stats.error++;
        console.error(`${LOG} DB FAIL "${r.word}":`, upErr.message);
        continue;
      }
    }

    console.log(`${LOG} [${i + 1}/${rows.length}] ${action} "${r.word}" (${dt}s) | ${reason.slice(0, 60)}`);

    // Cleanup temp image
    try { fs.unlinkSync(imgPath); } catch {}
  }

  const totalSec = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\n${LOG} ============== KẾT THÚC ==============`);
  console.log(`${LOG} Thời gian: ${totalSec}s`);
  console.log(`${LOG} KEEP   (≥70): ${stats.kept}`);
  console.log(`${LOG} LOW    (15-69): ${stats.downgraded}`);
  console.log(`${LOG} RESET  (≤15): ${stats.reset}`);
  console.log(`${LOG} ERROR: ${stats.error}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
