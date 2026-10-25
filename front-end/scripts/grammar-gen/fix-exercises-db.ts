/**
 * Fix lỗi cứng trong grammar_lessons.exercises trên prod (surgical, idempotent):
 * 1. Chuẩn hóa type naming legacy → canonical (multiple_choice→mcq, fill_blank→fill, error_correction→error).
 *    Giữ nguyên shape field (q/opts/answer/fb vs question/options/correct_answer/explanation) — chỉ đổi type.
 * 2. Câu answer không nằm trong options: nếu match case-insensitive/trim → sửa answer về đúng option;
 *    không match → báo cáo để sửa tay (không tự đoán).
 * 3. Xóa câu hỏi trùng lặp (giữ câu đầu tiên).
 *
 * Chạy (trong web-app/):
 *   npx tsx scripts/grammar-gen/fix-exercises-db.ts --dry
 *   npx tsx scripts/grammar-gen/fix-exercises-db.ts --apply
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

type Exercise = {
  type?: string;
  q?: string; question?: string;
  opts?: string[]; options?: string[];
  answer?: string | string[] | boolean; correct_answer?: string;
  fb?: string; explanation?: string;
  [key: string]: unknown;
};

const LOG = '[GrammarFixXr]';
const DRY = !process.argv.includes('--apply');
const TYPE_MAP: Record<string, string> = {
  multiple_choice: 'mcq',
  fill_blank: 'fill',
  error_correction: 'error',
};

// Vá tay các câu audit báo answer ∉ options mà không match mềm được.
// Key = slug + đoạn đầu câu hỏi; value = answer đúng (phải nằm trong options).
const MANUAL_PATCHES: readonly { slug: string; qStart: string; answer: string }[] = [
  // "Don't give it up the smoking" — vừa có "it" vừa có object "the smoking" → token sai là "give it up" (đúng: give up smoking)
  { slug: 'phrasal-verbs', qStart: "Find the error: Don't give it up the smoking.", answer: 'give it up' },
];

function loadEnv(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

async function main(): Promise<void> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  const client = createClient(url, key, { auth: { persistSession: false } });

  const { data: topics, error: tErr } = await client.from('grammar_topics').select('id, slug');
  if (tErr) throw new Error(tErr.message);
  const slugById = new Map((topics ?? []).map((t) => [t.id, t.slug]));

  const { data: lessons, error: lErr } = await client
    .from('grammar_lessons')
    .select('id, topic_id, exercises');
  if (lErr) throw new Error(lErr.message);

  let touched = 0;
  const manual: string[] = [];

  for (const lesson of lessons ?? []) {
    const slug = slugById.get(lesson.topic_id) ?? lesson.topic_id;
    const exercises = (lesson.exercises ?? []) as Exercise[];
    if (exercises.length === 0) continue;

    let changed = false;
    const seen = new Set<string>();
    const fixed: Exercise[] = [];

    for (const e of exercises) {
      const next = { ...e };

      // 1. Chuẩn hóa type
      if (next.type && TYPE_MAP[next.type]) {
        next.type = TYPE_MAP[next.type];
        changed = true;
      }

      // 2. answer ∉ options → thử match mềm, rồi manual patch
      const opts = next.options ?? next.opts;
      const ansRaw = next.correct_answer !== undefined ? next.correct_answer : next.answer;
      const isChoice = next.type === 'mcq' || next.type === 'error';
      if (isChoice && opts && typeof ansRaw === 'string' && !opts.includes(ansRaw)) {
        const qText = String(next.question ?? next.q ?? '');
        const soft = opts.find((o) => o.trim().toLowerCase() === ansRaw.trim().toLowerCase());
        const patch = MANUAL_PATCHES.find((p) => p.slug === slug && qText.startsWith(p.qStart));
        if (soft) {
          if (next.correct_answer !== undefined) next.correct_answer = soft;
          else next.answer = soft;
          changed = true;
          console.log(`${LOG} ${slug}: soft-fix answer "${ansRaw}" → "${soft}"`);
        } else if (patch && opts.includes(patch.answer)) {
          if (next.correct_answer !== undefined) next.correct_answer = patch.answer;
          else next.answer = patch.answer;
          changed = true;
          console.log(`${LOG} ${slug}: manual-patch answer "${ansRaw}" → "${patch.answer}"`);
        } else {
          manual.push(`${slug}: q="${qText.slice(0, 70)}" answer="${ansRaw}" opts=${JSON.stringify(opts)}`);
        }
      }

      // 3. Dedupe: câu hỏi CÙNG text VÀ cùng options mới coi là trùng
      const qKey = [
        String(next.question ?? next.q ?? '').trim().toLowerCase(),
        ...(opts ?? []).map((o) => o.trim().toLowerCase()).sort(),
      ].join('|');
      if (qKey && seen.has(qKey)) {
        changed = true;
        console.log(`${LOG} ${slug}: bỏ câu trùng "${qKey.slice(0, 60)}"`);
        continue;
      }
      if (qKey) seen.add(qKey);
      fixed.push(next);
    }

    if (!changed) continue;
    touched++;
    if (DRY) {
      console.log(`${LOG} dry ${slug}: ${exercises.length} → ${fixed.length} câu (sẽ update)`);
      continue;
    }
    const { error } = await client.from('grammar_lessons').update({ exercises: fixed }).eq('id', lesson.id);
    if (error) throw new Error(`${LOG} ${slug}: ${error.message}`);
    console.log(`${LOG} updated ${slug} (${exercises.length} → ${fixed.length})`);
  }

  console.log(`${LOG} done touched=${touched} dry=${DRY}`);
  if (manual.length) {
    console.log(`${LOG} CẦN SỬA TAY (${manual.length}):`);
    manual.forEach((m) => console.log('  - ' + m));
  }
}

main().catch((error: unknown) => {
  console.error(LOG, 'FATAL:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
