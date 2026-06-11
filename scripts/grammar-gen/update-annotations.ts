/**
 * Cập nhật annotations vào cột `grammar_lessons.examples` mà KHÔNG xóa topics/lessons/progress.
 * Surgical: match lesson qua topic.slug → update cột examples (+ sections.examples) baked annotations.
 * An toàn hơn import.ts (vốn delete-cascade wipe SRS progress).
 *
 * Chạy (web-app/): npx tsx scripts/grammar-gen/update-annotations.ts --apply
 * Mặc định dry-run; chỉ ghi khi có --apply.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');
const DRY = !process.argv.includes('--apply');

function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

type Ann = { word: string; role: string; start: number; end: number };
type Ex = { en?: string; vi?: string; note?: string; annotations?: Ann[] };

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const files = readdirSync(OUT).filter((f) => f.endsWith('.json')).sort();
  let updated = 0, missing = 0, noChange = 0;

  for (const f of files) {
    const l = JSON.parse(readFileSync(path.join(OUT, f), 'utf8'));
    const slug: string = l.slug;
    const exWithAnn = (l.sections?.examples ?? [])
      .map((e: Ex) => ({ en: e.en ?? '', vi: e.vi ?? '', note: e.note ?? '', annotations: e.annotations ?? [] }))
      .filter((e: Ex) => e.en);
    if (exWithAnn.length === 0 || exWithAnn.some((example: Ex) => !example.annotations?.length)) {
      throw new Error(`${slug}: từ chối ghi examples thiếu/rỗng annotations`);
    }

    const { data: topic, error: topicError } = await sb.from('grammar_topics').select('id').eq('slug', slug).maybeSingle();
    if (topicError) throw new Error(`${slug}: đọc topic lỗi: ${topicError.message}`);
    if (!topic) { console.log(`  ⚠ ${slug}: không thấy topic trên DB`); missing++; continue; }

    const { data: lessons, error: lessonError } = await sb.from('grammar_lessons').select('id, sections').eq('topic_id', topic.id);
    if (lessonError) throw new Error(`${slug}: đọc lesson lỗi: ${lessonError.message}`);
    if (!lessons || lessons.length === 0) { console.log(`  ⚠ ${slug}: topic chưa có lesson`); missing++; continue; }

    for (const lesson of lessons) {
      // Ghi annotations vào cả cột examples (UI đọc) và sections.examples (đồng bộ)
      const newSections = lesson.sections
        ? { ...lesson.sections, examples: l.sections?.examples ?? lesson.sections.examples }
        : l.sections;
      if (DRY) { console.log(`  · ${slug}: ${exWithAnn.length} ví dụ (dry)`); noChange++; continue; }
      const { error } = await sb.from('grammar_lessons')
        .update({ examples: exWithAnn, sections: newSections })
        .eq('id', lesson.id);
      if (error) { console.log(`  ✗ ${slug}: ${error.message}`); continue; }
      updated++;
      console.log(`  ✓ ${slug} (${exWithAnn.length} ví dụ annotated)`);
    }
  }

  console.log(`\n[update] ${updated} lesson cập nhật · ${missing} thiếu trên DB · ${noChange} dry.`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
