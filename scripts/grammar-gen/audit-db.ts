/**
 * Audit chất lượng grammar_lessons trên PRODUCTION DB (read-only).
 * Chấm điểm 100 cho từng bài theo độ đầy sections + tính hợp lệ exercises,
 * đối chiếu drift với file local out/<slug>.json.
 *
 * Chạy:
 *   npx tsx scripts/grammar-gen/audit-db.ts                # in bảng + ghi report
 *   npx tsx scripts/grammar-gen/audit-db.ts --report <path>  # đổi chỗ ghi report md
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

type Annotation = { word?: string; role?: string; start?: number; end?: number };
type Example = { en?: string; vi?: string; note?: string; annotations?: Annotation[] };
type Exercise = {
  type?: string;
  q?: string; question?: string;
  opts?: string[]; options?: string[];
  answer?: string | string[] | boolean; correct_answer?: string;
  fb?: string; explanation?: string;
};
type Sections = {
  definition?: string;
  usage?: unknown[];
  formula?: { rows?: unknown[]; note?: string };
  rules?: unknown[];
  signals?: string[];
  examples?: Example[];
  mistakes?: unknown[];
  tips?: string;
  comparison?: string;
  timeline?: { points?: unknown[] } | null;
};

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');
const CANON_TYPES = new Set(['mcq', 'fill', 'tf', 'error']);
const LEGACY_TYPES = new Set(['multiple_choice', 'fill_blank', 'error_correction']);

/** Topic liên quan thì/thời gian — chỉ nhóm này bắt buộc có timeline. */
const TENSE_TOPICS = new Set([
  'present-simple', 'present-continuous', 'present-perfect', 'present-perfect-continuous',
  'past-simple', 'past-continuous', 'past-perfect', 'past-perfect-continuous',
  'future-will', 'be-going-to', 'future-continuous', 'future-perfect', 'future-in-the-past',
  'used-to', 'conditionals-0-1', 'second-conditional', 'third-conditional', 'mixed-conditionals',
  'wish-if-only', 'modals-perfect',
]);

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

interface Row {
  slug: string;
  level: string;
  score: number;
  flags: string[];
  exCount: number;
  xrCount: number;
  theoryLen: number;
  drift: string;
}

function auditExercise(e: Exercise): string | null {
  const q = e.question ?? e.q;
  const fb = e.explanation ?? e.fb;
  const type = e.type ?? '';
  const opts = e.options ?? e.opts;
  const ans = e.correct_answer !== undefined ? e.correct_answer : e.answer;
  if (!q || String(q).trim() === '') return 'no-question';
  if (fb === undefined || fb === null || String(fb).trim() === '') return 'no-feedback';
  if (!CANON_TYPES.has(type) && !LEGACY_TYPES.has(type)) return `bad-type:${type}`;
  if (type === 'tf') {
    if (typeof ans !== 'boolean') return 'tf-answer-not-bool';
    return null;
  }
  if (type === 'fill' || type === 'fill_blank') {
    // fill canonical: answer mảng đáp án chấp nhận; fill_blank legacy: answer ∈ options
    if (Array.isArray(ans)) return ans.length === 0 ? 'fill-empty-answers' : null;
    if (typeof ans === 'string') {
      if (opts && !opts.includes(ans)) return 'answer-not-in-options';
      return null;
    }
    return 'fill-bad-answer';
  }
  // mcq / error / multiple_choice / error_correction: answer phải nằm trong options
  if (!opts || opts.length < 2) return 'too-few-options';
  if (typeof ans !== 'string' || !opts.includes(ans)) return 'answer-not-in-options';
  return null;
}

function scoreLesson(slug: string, level: string, sections: Sections, exercises: Exercise[], theoryLen: number): Row {
  const flags: string[] = [];
  let score = 0;

  const def = sections.definition ?? '';
  if (def.length >= 120) score += 10; else flags.push('definition-thin');
  if ((sections.usage?.length ?? 0) >= 4) score += 10; else flags.push('usage<4');
  if ((sections.formula?.rows?.length ?? 0) >= 1) score += 5; else flags.push('no-formula');
  if ((sections.rules?.length ?? 0) >= 2) score += 5; else flags.push('rules<2');
  if ((sections.signals?.length ?? 0) >= 4) score += 5; else flags.push('signals<4');

  const examples = sections.examples ?? [];
  if (examples.length >= 6) score += 10; else flags.push('examples<6');
  const missingAnno = examples.filter((e) => !e.annotations || e.annotations.length === 0).length;
  if (examples.length > 0 && missingAnno === 0) score += 5; else if (missingAnno > 0) flags.push(`no-annotations:${missingAnno}`);
  const missingVi = examples.filter((e) => !e.vi || e.vi.trim() === '').length;
  if (missingVi > 0) flags.push(`example-no-vi:${missingVi}`);

  if ((sections.mistakes?.length ?? 0) >= 4) score += 10; else flags.push('mistakes<4');
  if ((sections.tips ?? '').length >= 40) score += 5; else flags.push('tips-thin');
  if ((sections.comparison ?? '').length >= 120) score += 10; else flags.push('comparison-thin');
  // Timeline chỉ có nghĩa sư phạm với topic THÌ/thời gian — topic khác không bị phạt
  if (TENSE_TOPICS.has(slug)) {
    if (sections.timeline?.points?.length) score += 5; else flags.push('no-timeline');
  } else {
    score += 5;
  }

  // Exercises (25đ): số lượng, hợp lệ, đa dạng
  if (exercises.length >= 12) score += 10; else flags.push(`xr<12:${exercises.length}`);
  const badReasons = new Map<string, number>();
  for (const e of exercises) {
    const bad = auditExercise(e);
    if (bad) badReasons.set(bad, (badReasons.get(bad) ?? 0) + 1);
  }
  if (badReasons.size === 0) score += 10;
  else flags.push(...[...badReasons.entries()].map(([k, v]) => `${k}×${v}`));
  const typeSet = new Set(exercises.map((e) => e.type));
  if (typeSet.size >= 3) score += 5; else flags.push(`types<3(${[...typeSet].join('+')})`);
  const legacyCount = exercises.filter((e) => LEGACY_TYPES.has(e.type ?? '')).length;
  if (legacyCount > 0 && legacyCount < exercises.length) flags.push('mixed-type-naming');

  // Câu hỏi trùng: CÙNG text VÀ cùng options mới là trùng thật (text chung kiểu "Câu nào sai?" hợp lệ)
  const qs = exercises.map((e) => [
    (e.question ?? e.q ?? '').trim().toLowerCase(),
    ...((e.options ?? e.opts ?? []).map((o) => o.trim().toLowerCase()).sort()),
  ].join('|')).filter((k) => k !== '');
  const dup = qs.length - new Set(qs).size;
  if (dup > 0) flags.push(`dup-questions:${dup}`);

  // Mojibake
  const raw = JSON.stringify(sections);
  if (/Ã¬|Ã©|â€|Ä‘|áº£/.test(raw)) flags.push('MOJIBAKE');

  // Chuẩn hóa về thang 100 (tổng điểm thô = 105: sections 80 + exercises 25)
  const normalized = Math.round((score / 105) * 100);
  return { slug, level, score: normalized, flags, exCount: examples.length, xrCount: exercises.length, theoryLen, drift: '' };
}

async function main(): Promise<void> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  const client = createClient(url, key, { auth: { persistSession: false } });

  const { data: topics, error: tErr } = await client
    .from('grammar_topics')
    .select('id, slug, level, order_index')
    .order('order_index');
  if (tErr) throw new Error(`topics: ${tErr.message}`);

  const { data: lessons, error: lErr } = await client
    .from('grammar_lessons')
    .select('id, topic_id, sections, exercises, examples, theory_vi');
  if (lErr) throw new Error(`lessons: ${lErr.message}`);

  const byTopic = new Map<string, (typeof lessons)[number][]>();
  for (const lesson of lessons ?? []) {
    const list = byTopic.get(lesson.topic_id) ?? [];
    list.push(lesson);
    byTopic.set(lesson.topic_id, list);
  }

  const rows: Row[] = [];
  for (const topic of topics ?? []) {
    const list = byTopic.get(topic.id) ?? [];
    if (list.length === 0) {
      rows.push({ slug: topic.slug, level: topic.level, score: 0, flags: ['NO-LESSON'], exCount: 0, xrCount: 0, theoryLen: 0, drift: '-' });
      continue;
    }
    if (list.length > 1) {
      rows.push({ slug: topic.slug, level: topic.level, score: 0, flags: [`MULTI-LESSON:${list.length}`], exCount: 0, xrCount: 0, theoryLen: 0, drift: '-' });
      continue;
    }
    const lesson = list[0];
    const sections = (lesson.sections ?? {}) as Sections;
    // examples có thể nằm cột riêng (render chính) — ưu tiên cột examples nếu sections.examples rỗng
    if ((!sections.examples || sections.examples.length === 0) && Array.isArray(lesson.examples)) {
      sections.examples = lesson.examples as Example[];
    }
    const exercises = (lesson.exercises ?? []) as Exercise[];
    const row = scoreLesson(topic.slug, topic.level, sections, exercises, JSON.stringify(sections).length);

    // Drift vs local out/<slug>.json
    const filePath = path.join(OUT, `${topic.slug}.json`);
    if (!existsSync(filePath)) {
      row.drift = 'no-local';
    } else {
      const local = JSON.parse(readFileSync(filePath, 'utf8'));
      const localXr = (local.exercises ?? []).length;
      const localLen = JSON.stringify(local.sections ?? {}).length;
      const parts: string[] = [];
      if (localXr !== row.xrCount) parts.push(`xr:${row.xrCount}(db)≠${localXr}(local)`);
      const delta = Math.abs(localLen - row.theoryLen);
      if (delta > Math.max(200, row.theoryLen * 0.05)) parts.push(`sections:${row.theoryLen}(db)≠${localLen}(local)`);
      row.drift = parts.length ? parts.join(' ') : 'ok';
    }
    rows.push(row);
  }

  rows.sort((a, b) => a.score - b.score);
  const avg = rows.reduce((sum, r) => sum + r.score, 0) / Math.max(rows.length, 1);
  const perfect = rows.filter((r) => r.score === 100).length;

  console.log(`[GrammarAudit] ${rows.length} topic | điểm TB ${avg.toFixed(1)} | ${perfect} bài đạt 100`);
  console.log('\n=== 15 bài điểm THẤP nhất ===');
  for (const r of rows.slice(0, 15)) {
    console.log(`  ${String(r.score).padStart(3)}  ${r.slug} [${r.level[0]}] xr=${r.xrCount} ex=${r.exCount} — ${r.flags.join(', ')}`);
  }
  const driftRows = rows.filter((r) => r.drift !== 'ok' && r.drift !== '-');
  console.log(`\n=== Drift DB↔local (${driftRows.length} bài) ===`);
  for (const r of driftRows) console.log(`  ${r.slug}: ${r.drift}`);

  // Report markdown
  const reportIdx = process.argv.indexOf('--report');
  const reportPath = reportIdx >= 0 && process.argv[reportIdx + 1]
    ? process.argv[reportIdx + 1]
    : path.join(process.cwd(), '..', 'docs', 'roadmap-research', '05-grammar-audit.md');
  const md = [
    `# Grammar DB Audit — ${new Date().toISOString().slice(0, 10)}`,
    '',
    `> Sinh bởi \`scripts/grammar-gen/audit-db.ts\` (read-only prod). ${rows.length} topic, điểm TB **${avg.toFixed(1)}/100**, ${perfect} bài đạt 100.`,
    '',
    '| Score | Slug | Level | Exercises | Examples | Flags | Drift |',
    '|---|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.score} | ${r.slug} | ${r.level} | ${r.xrCount} | ${r.exCount} | ${r.flags.join(', ') || '—'} | ${r.drift} |`),
  ].join('\n');
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, md, 'utf8');
  console.log(`\n[GrammarAudit] report → ${reportPath}`);
}

main().catch((error: unknown) => {
  console.error('[GrammarAudit] FATAL:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
