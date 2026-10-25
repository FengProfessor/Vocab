/**
 * [ChatGPTPhraseImg] Pilot tạo lại ảnh cho idiom/cụm từ bằng chatgpt-imagegen.
 *
 * Chỉ cập nhật global_dictionary khi ảnh mới đạt >= 70 và tốt hơn ảnh cũ.
 *
 * Chạy:
 *   $env:CHATGPT_IMAGEGEN_CLI='C:\path\to\chatgpt-imagegen'
 *   npx tsx scripts/chatgpt-imagegen-phrases.ts
 *   npx tsx scripts/chatgpt-imagegen-phrases.ts --verify-existing
 */
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const execFileAsync = promisify(execFile);
const LOG = '[ChatGPTPhraseImg]';
const BUCKET = 'vocab-images';
const MIN_SCORE = 70;
const PILOT_WORDS = [
  'game is not worth the candle',
  'different kettle of fish',
  'cook the books',
  'other fish to fry',
  'have butterflies in your stomach',
  'blue eyed boy',
  'cost a pretty penny',
  'mean the world to someone',
  'play gooseberry',
  'paddle your own canoe',
] as const;

interface DictionaryRow {
  word: string;
  data: {
    results?: Array<{
      meanings?: Array<{ pos?: string; definition?: string; example?: string }>;
    }>;
  } | null;
  image_url: string | null;
  image_source: string | null;
  image_confidence: number | null;
}

function safeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function buildPrompt(row: DictionaryRow): string {
  const meaning = row.data?.results?.[0]?.meanings?.[0];
  return [
    'Create a clear cinematic illustration for an English vocabulary flashcard.',
    `Idiom or phrase: "${row.word}".`,
    `Intended meaning: "${meaning?.definition || ''}".`,
    `Example context: "${meaning?.example || ''}".`,
    'Depict the intended figurative meaning through a natural human scene.',
    'Do not depict a misleading literal interpretation.',
    'No text, letters, captions, logos, watermarks, or split panels.',
    'One centered visual idea, clean background, vibrant colors, landscape composition.',
  ].join(' ');
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cli = process.env.CHATGPT_IMAGEGEN_CLI;
  if (!url || !key || !cli) {
    throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY hoặc CHATGPT_IMAGEGEN_CLI');
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { verifyImageMulti } = await import('../src/lib/vision-providers/orchestrator');
  const { verifyImageMeaningGroq } = await import('../src/lib/groq-vision');
  const verifyExisting = process.argv.includes('--verify-existing');
  const { data, error } = await supabase
    .from('global_dictionary')
    .select('word, data, image_url, image_source, image_confidence')
    .in('word', [...PILOT_WORDS]);
  if (error) throw error;

  const rows = new Map((data as DictionaryRow[]).map((row) => [row.word, row]));
  const outDir = path.resolve(process.cwd(), 'tmp', 'chatgpt-phrase-images');
  await fs.mkdir(outDir, { recursive: true });

  let updated = 0;
  let rejected = 0;
  let failed = 0;

  for (const [index, word] of PILOT_WORDS.entries()) {
    const row = rows.get(word);
    if (!row) {
      failed++;
      console.error(`${LOG} [${index + 1}/${PILOT_WORDS.length}] Không tìm thấy "${word}"`);
      continue;
    }

    const meaning = row.data?.results?.[0]?.meanings?.[0];
    const localPath = path.join(outDir, `${safeName(word)}.png`);
    console.log(`${LOG} [${index + 1}/${PILOT_WORDS.length}] ${verifyExisting ? 'Đang chấm lại' : 'Đang tạo'} "${word}"`);

    try {
      const storagePath = `chatgpt-phrases/${safeName(word)}.png`;
      if (!verifyExisting) {
        await execFileAsync('python', [
          cli,
          buildPrompt(row),
          '--backend',
          'codex',
          '--size',
          '1536x1024',
          '--format',
          'png',
          '--timeout',
          '300',
          '--quiet',
          '--no-progress',
          '-o',
          localPath,
        ], { timeout: 360_000, maxBuffer: 1024 * 1024 });

        const image = await fs.readFile(localPath);
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, image, { contentType: 'image/png', upsert: true });
        if (uploadError) throw uploadError;
      }

      const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
      const context = {
        word,
        pos: meaning?.pos,
        definition: meaning?.definition,
      };
      const primary = await verifyImageMulti(publicUrl, context);
      const groq = primary.provider === 'groq' && primary.score >= MIN_SCORE
        ? primary
        : { ...(await verifyImageMeaningGroq(publicUrl, context)), provider: 'groq-direct' };
      const verified = groq.score > primary.score ? groq : primary;
      const oldScore = row.image_confidence ?? -1;

      if (verified.score < MIN_SCORE || verified.score <= oldScore) {
        rejected++;
        console.log(`${LOG} REJECT "${word}": mới=${verified.score}, cũ=${oldScore}, ${verified.reason}`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('global_dictionary')
        .update({
          image_url: publicUrl,
          image_source: 'chatgpt-imagegen',
          image_confidence: verified.score,
          image_query: buildPrompt(row),
          image_verified_at: new Date().toISOString(),
        })
        .eq('word', word);
      if (updateError) throw updateError;

      updated++;
      console.log(`${LOG} UPDATE "${word}": ${oldScore} -> ${verified.score} (${verified.provider})`);
    } catch (error: unknown) {
      failed++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${LOG} FAIL "${word}": ${message}`);
    }
  }

  console.log(`${LOG} Xong: updated=${updated}, rejected=${rejected}, failed=${failed}`);
}

main().catch((error: unknown) => {
  console.error(`${LOG} Fatal:`, error);
  process.exit(1);
});
