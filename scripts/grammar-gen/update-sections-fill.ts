/**
 * Áp data/sections-fill.json (nguồn NLM, adapt VN) vào grammar_lessons.sections trên prod.
 *
 * Surgical + idempotent:
 * - signals: chỉ ghi khi hiện có <4 mục (merge unique, giữ cái cũ trước).
 * - comparison: chỉ thay khi hiện tại <120 chars (ngưỡng "thin" của audit).
 * - mistakes: append các mục chưa có (dedupe theo cặp wrong/right, so sánh không phân hoa thường).
 * - timeline: chỉ ghi khi lesson chưa có timeline points.
 * - KHÔNG đụng examples/exercises/definition/progress.
 * - Đồng thời cập nhật file local out/<slug>.json cho đồng bộ.
 *
 * Chạy (trong web-app/):
 *   npx tsx scripts/grammar-gen/update-sections-fill.ts --dry
 *   npx tsx scripts/grammar-gen/update-sections-fill.ts --apply
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

interface FillMistake { wrong: string; right: string; why: string }
interface FillTimeline { caption: string; points: { label: string; note: string }[] }
interface FillEntry {
  signals?: string[];
  comparison?: string;
  mistakes?: FillMistake[];
  timeline?: FillTimeline;
}
interface Sections {
  signals?: string[];
  comparison?: string;
  mistakes?: { wrong?: string; right?: string; why?: string }[];
  timeline?: { caption?: string; points?: unknown[] } | null;
  [key: string]: unknown;
}

const LOG = '[GrammarFill]';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');
const DATA = path.join(DIR, 'data', 'sections-fill.json');
const DRY = !process.argv.includes('--apply');

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

/** Trả về sections mới + danh sách thay đổi; null nếu không đổi gì. */
function applyFill(sections: Sections, fill: FillEntry): { next: Sections; changes: string[] } | null {
  const changes: string[] = [];
  const next: Sections = { ...sections };

  if (fill.signals && (sections.signals?.length ?? 0) < 4) {
    const existing = sections.signals ?? [];
    const existingLower = new Set(existing.map((s) => s.toLowerCase()));
    const merged = [...existing, ...fill.signals.filter((s) => !existingLower.has(s.toLowerCase()))];
    if (merged.length !== existing.length) {
      next.signals = merged;
      changes.push(`signals ${existing.length}→${merged.length}`);
    }
  }

  if (fill.comparison && (sections.comparison ?? '').length < 120) {
    next.comparison = fill.comparison;
    changes.push(`comparison ${(sections.comparison ?? '').length}→${fill.comparison.length} chars`);
  }

  if (fill.mistakes?.length) {
    const existing = (sections.mistakes ?? []) as { wrong?: string; right?: string; why?: string }[];
    const keyOf = (m: { wrong?: string; right?: string }) =>
      `${(m.wrong ?? '').trim().toLowerCase()}|${(m.right ?? '').trim().toLowerCase()}`;
    const seen = new Set(existing.map(keyOf));
    const added = fill.mistakes.filter((m) => !seen.has(keyOf(m)));
    if (added.length) {
      next.mistakes = [...existing, ...added];
      changes.push(`mistakes ${existing.length}→${existing.length + added.length}`);
    }
  }

  if (fill.timeline && !(sections.timeline?.points?.length)) {
    next.timeline = fill.timeline;
    changes.push('timeline +');
  }

  return changes.length ? { next, changes } : null;
}

async function main(): Promise<void> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  const client = createClient(url, key, { auth: { persistSession: false } });

  const raw = JSON.parse(readFileSync(DATA, 'utf8')) as Record<string, FillEntry>;
  const fills = Object.entries(raw).filter(([slug]) => slug !== '_meta');

  const { data: topics, error: tErr } = await client.from('grammar_topics').select('id, slug');
  if (tErr) throw new Error(tErr.message);
  const topicBySlug = new Map((topics ?? []).map((t) => [t.slug, t.id]));

  let updated = 0;
  let skipped = 0;

  for (const [slug, fill] of fills) {
    const topicId = topicBySlug.get(slug);
    if (!topicId) {
      console.log(`${LOG} ⚠ ${slug}: không có topic trên prod — bỏ qua`);
      continue;
    }
    const { data: lessons, error: lErr } = await client
      .from('grammar_lessons')
      .select('id, sections')
      .eq('topic_id', topicId);
    if (lErr) throw new Error(`${slug}: ${lErr.message}`);
    if (!lessons || lessons.length !== 1) {
      console.log(`${LOG} ⚠ ${slug}: ${lessons?.length ?? 0} lesson — bỏ qua (cần đúng 1)`);
      continue;
    }

    const lesson = lessons[0];
    const result = applyFill((lesson.sections ?? {}) as Sections, fill);
    if (!result) {
      skipped++;
      continue;
    }

    console.log(`${LOG} ${DRY ? 'dry' : 'apply'} ${slug}: ${result.changes.join(' · ')}`);
    if (!DRY) {
      const { error } = await client.from('grammar_lessons').update({ sections: result.next }).eq('id', lesson.id);
      if (error) throw new Error(`${slug} update: ${error.message}`);

      // Đồng bộ file local nếu tồn tại
      const filePath = path.join(OUT, `${slug}.json`);
      if (existsSync(filePath)) {
        const local = JSON.parse(readFileSync(filePath, 'utf8'));
        const localResult = applyFill((local.sections ?? {}) as Sections, fill);
        if (localResult) {
          local.sections = localResult.next;
          writeFileSync(filePath, JSON.stringify(local, null, 2) + '\n', 'utf8');
        }
      }
    }
    updated++;
  }

  console.log(`${LOG} done: ${updated} bài có thay đổi, ${skipped} bài đã đủ (skip), dry=${DRY}`);
}

main().catch((error: unknown) => {
  console.error(LOG, 'FATAL:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
