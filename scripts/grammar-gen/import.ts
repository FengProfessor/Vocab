/**
 * Import 60 bài grammar (out/*.json) vào Supabase.
 * XÓA toàn bộ grammar_topics + grammar_lessons cũ (OCR rác) rồi insert mới.
 *
 * Dùng CỘT SẴN CÓ (không cần migration): theory_vi (markdown giàu, gồm cả bài tập),
 * examples (jsonb — UI render annotation + TTS), source='ai-golden'.
 * UI bỏ qua formatOcrTheory khi source='ai-golden' (markdown đã sạch, giữ bảng).
 *
 * Chạy (trong web-app/): npx tsx scripts/grammar-gen/import.ts
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (từ .env.local).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');

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

type Ex = { type: string; q: string; opts?: string[]; answer: unknown; fb?: string };
type Lesson = {
  slug: string; title: string; title_vi: string; level: string; order: number;
  sections: {
    definition?: string;
    usage?: { icon?: string; label?: string; en?: string; vi?: string }[];
    formula?: { rows?: Record<string, string>[]; note?: string };
    rules?: { case?: string; rule?: string; example?: string }[];
    signals?: string[];
    examples?: { en?: string; vi?: string; note?: string; annotations?: { word: string; role: string; start: number; end: number }[] }[];
    mistakes?: { wrong?: string; right?: string; why?: string }[];
    tips?: string;
    comparison?: string;
    timeline?: { caption?: string; points?: { label?: string; note?: string }[] } | null;
  };
  exercises?: Ex[];
};

/** Dựng markdown lý thuyết giàu từ sections (gồm cả phần bài tập đọc được). */
function buildTheory(l: Lesson): string {
  const s = l.sections || {};
  const parts: string[] = [];
  if (s.definition) parts.push(s.definition);

  if (s.usage?.length) {
    parts.push('## 📌 Khi nào dùng');
    parts.push(s.usage.map((u) => `- ${u.icon ?? ''} **${u.label ?? ''}**: ${u.en ?? ''}${u.vi ? ` — *${u.vi}*` : ''}`).join('\n'));
  }

  if (s.formula?.rows?.length) {
    parts.push('## 🧩 Công thức');
    const keys = Object.keys(s.formula.rows[0]);
    parts.push(`| ${keys.join(' | ')} |`);
    parts.push(`| ${keys.map(() => '---').join(' | ')} |`);
    for (const r of s.formula.rows) parts.push(`| ${keys.map((k) => (r[k] ?? '').replace(/\n/g, ' ')).join(' | ')} |`);
    if (s.formula.note) parts.push(`> ${s.formula.note.replace(/\n/g, ' ')}`);
  }

  if (s.rules?.length) {
    parts.push('## ✍️ Quy tắc');
    parts.push('| Trường hợp | Quy tắc | Ví dụ |');
    parts.push('| --- | --- | --- |');
    for (const r of s.rules) parts.push(`| ${(r.case ?? '').replace(/\n/g, ' ')} | ${(r.rule ?? '').replace(/\n/g, ' ')} | ${(r.example ?? '').replace(/\n/g, ' ')} |`);
  }

  if (s.signals?.length) {
    parts.push('## 🔍 Dấu hiệu nhận biết');
    parts.push(s.signals.map((x) => `\`${x}\``).join(' · '));
  }

  if (s.mistakes?.length) {
    parts.push('## ⚠️ Lỗi thường gặp');
    parts.push(s.mistakes.map((m) => `- ❌ ${m.wrong ?? ''} → ✅ **${m.right ?? ''}**${m.why ? ` — ${m.why}` : ''}`).join('\n'));
  }

  if (s.tips) { parts.push('## 🧠 Mẹo nhớ'); parts.push(s.tips); }
  if (s.comparison) { parts.push('## 🔄 So sánh'); parts.push(s.comparison); }

  if (l.exercises?.length) {
    parts.push('## 🏆 Bài tập tự kiểm tra');
    l.exercises.forEach((e, i) => {
      let block = `**${i + 1}.** ${e.q}`;
      if ((e.type === 'mcq' || e.type === 'error') && e.opts?.length) {
        block += '\n' + e.opts.map((o, j) => `   ${String.fromCharCode(65 + j)}. ${o}`).join('\n');
      }
      const ans = Array.isArray(e.answer) ? e.answer.join(' / ') : e.type === 'tf' ? (e.answer ? 'Đúng' : 'Sai') : String(e.answer);
      block += `\n> **Đáp án:** ${ans}${e.fb ? ` — ${e.fb}` : ''}`;
      parts.push(block);
    });
  }

  return parts.join('\n\n');
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const files = readdirSync(OUT).filter((f) => f.endsWith('.json')).sort();
  const lessons: Lesson[] = files.map((f) => JSON.parse(readFileSync(path.join(OUT, f), 'utf8')));
  console.log(`[import] ${lessons.length} bài. Xóa grammar cũ...`);

  // Xóa cũ (cascade lessons + progress). grammar_exercises cũ giữ nguyên (lesson_id set null).
  const del = await sb.from('grammar_topics').delete().neq('slug', '___keep_none___');
  if (del.error) throw new Error('Xóa topics lỗi: ' + del.error.message);

  let ok = 0;
  for (const l of lessons) {
    const { data: topic, error: tErr } = await sb.from('grammar_topics').insert({
      slug: l.slug, title: l.title, title_vi: l.title_vi, level: l.level, order_index: l.order,
    }).select('id').single();
    if (tErr || !topic) { console.log(`  ❌ ${l.slug} topic: ${tErr?.message}`); continue; }

    const examples = (l.sections?.examples ?? []).map((e) => ({ en: e.en ?? '', vi: e.vi ?? '', note: e.note ?? '', annotations: e.annotations ?? [] })).filter((e) => e.en);
    const { error: lErr } = await sb.from('grammar_lessons').insert({
      topic_id: topic.id,
      title: l.title_vi,
      theory_vi: buildTheory(l), // fallback nếu UI chưa render sections
      examples,
      sections: l.sections,      // render section-cards giống bài mẫu
      exercises: l.exercises,    // quiz interactive
      source: 'ai-golden',
      order_index: l.order,
    });
    if (lErr) { console.log(`  ❌ ${l.slug} lesson: ${lErr.message}`); continue; }
    ok++; console.log(`  ✅ ${l.slug}`);
  }

  console.log(`\n[import] xong: ${ok}/${lessons.length} bài vào DB.`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
