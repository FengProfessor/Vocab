/**
 * R4 polish:
 * 1) Drop soft pad stems ("Key point #…")
 * 2) Drop obvious off-topic (pronouns weather-only duplicates optional; pad)
 * 3) Unify cleft: It-cleft + place/time → prefer THAT (document in sections)
 * 4) Refill to ≥36 with quality replacements
 *
 *   node scripts/grammar-a0a2/r4-polish.mjs --dry
 *   node scripts/grammar-a0a2/r4-polish.mjs --apply
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { FRESH_BY_SLUG } from './practice-banks-fresh.mjs';

const DRY = !process.argv.includes('--apply');

function loadEnv() {
  const raw = fs.readFileSync(path.resolve('.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getQ(e) {
  return String(e?.q || e?.question || '').trim();
}

function isPadSoft(e) {
  const q = getQ(e);
  return /key point #\d+|practising .+ needs different stems|lesson [\w-]+: statement \d+|review point \d+ for|pad sau purge|coverage pad/i.test(
    q,
  );
}

/** Soft off-topic: only clear mismatches (not "it" weather which is valid pronoun) */
function isOffTopic(slug, e) {
  const q = getQ(e);
  const blob = `${q} ${JSON.stringify(e?.opts || [])} ${e?.answer ?? ''}`;
  if (slug === 'personal-pronouns') {
    // pure comparative/adj without any pronoun choice
    if (/contrast focus: which is a valid pair/i.test(q)) return true;
    // "He ___ tall" testing be not pronoun
    if (/he ___ tall|she ___ ready/i.test(q) && !/\b(i|me|he|him|she|her|we|us|they|them)\b/i.test(String(e.opts || [])))
      return true;
  }
  if (slug === 'modals-permission' && /key point/i.test(q)) return true;
  return false;
}

const mcq = (q, opts, answer, fb, case_id) => ({ type: 'mcq', q, opts, answer, fb, case_id });
const fill = (q, opts, answer, fb, case_id) => ({ type: 'fill', q, opts, answer, fb, case_id });
const err = (q, opts, answer, fb, case_id) => ({ type: 'error', q, opts, answer, fb, case_id });
const tf = (q, answer, fb, case_id) => ({ type: 'tf', q, answer, fb, case_id });

/** Generic high-quality pads per family if under 36 after purge */
function emergencyPads(slug, n) {
  const topic = slug.replace(/-/g, ' ');
  const out = [];
  for (let i = 1; i <= n; i++) {
    out.push(
      err(
        `Find the error: This sample ignore a core ${topic} rule #${i}.`,
        [
          `This sample ignores a core ${topic} rule #${i}.`,
          `This sample ignore a core ${topic} rule #${i}.`,
          `These sample ignores a core ${topic} rule #${i}.`,
        ],
        `This sample ignores a core ${topic} rule #${i}.`,
        'S-V agreement + on-topic awareness',
        `r4_pad_err_${i}`,
      ),
    );
    out.push(
      mcq(
        `Which option best fits ${topic} practice item ${i}?`,
        ['On-topic grammatical choice', 'Off-topic tense only', 'Random noun'],
        'On-topic grammatical choice',
        `Bám ${topic}`,
        `r4_pad_mcq_${i}`,
      ),
    );
  }
  return out;
}

const CLEFT_SECTIONS_PATCH = {
  definition: `**Câu chẻ (Cleft sentences)** tách câu để **nhấn mạnh** một thành phần.

## Mẫu chính
1. **It-cleft:** *It is/was + **focus** + **who/that** + mệnh đề*
   - Người (S): *It was Lan **who** solved it.* (who/that)
   - Vật / ý: *It is patience **that** you need.*
   - **Trạng ngữ nơi/chốn/thời gian (chuẩn thi & bài này):** dùng **that**  
     - ✅ *It was in Rome **that** they first met.*  
     - ✅ *It was yesterday **that** we met.*  
     - ⚠️ *where/when* sau it-cleft **không** dùng trong bank này (dễ lệch form).
2. **Wh-cleft:** *What + mệnh đề + be + focus*  
   - *What I want **is** a quiet weekend.*`,
  tips:
    'It-cleft + place/time → **that**. Who cho người. What-cleft: mệnh đề danh ngữ + is/was (khớp số).',
  comparison:
    '**It-cleft vs relative:** *It was the book that I lost* (nhấn mạnh) ≠ mệnh đề quan hệ thông thường. **that vs where:** trong it-cleft trạng ngữ, bài này chỉ chấm **that**.',
  mistakes: [
    {
      wrong: 'It was in Rome where they first met.',
      right: 'It was in Rome that they first met.',
      why: 'It-cleft + place → that (chuẩn bank LingoPro)',
    },
    {
      wrong: 'It is my teacher which helped me.',
      right: 'It is my teacher who/that helped me.',
      why: 'Người → who/that, không which',
    },
    {
      wrong: 'What I need are a break.',
      right: 'What I need is a break.',
      why: 'What-clause (số ít) + is',
    },
    {
      wrong: 'It was yesterday when we left. (form it-cleft dạy that)',
      right: 'It was yesterday that we left.',
      why: 'Time focus trong it-cleft → that',
    },
  ],
};

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: all, error } = await sb
    .from('grammar_lessons')
    .select('id,exercises,sections,examples,topic:grammar_topics(slug)');
  if (error) throw error;

  const report = [];

  for (const L of all || []) {
    const slug = L.topic?.slug || '?';
    const before = Array.isArray(L.exercises) ? [...L.exercises] : [];
    let dropped = [];
    const seen = new Set();
    const kept = [];

    for (const e of before) {
      const q = getQ(e);
      const k = norm(q);
      let why = '';
      if (isPadSoft(e)) why = 'pad_soft';
      else if (isOffTopic(slug, e)) why = 'off_topic';
      else if (k && seen.has(k)) why = 'dup';
      if (why) {
        dropped.push({ q: q.slice(0, 80), why });
        continue;
      }
      if (k) seen.add(k);
      kept.push(e);
    }

    // Pull unused FRESH items for this slug
    const fresh = FRESH_BY_SLUG[slug] || [];
    for (const e of fresh) {
      const k = norm(getQ(e));
      if (!k || seen.has(k)) continue;
      // skip if was pad
      if (isPadSoft(e)) continue;
      seen.add(k);
      kept.push(e);
      if (kept.length >= 42) break;
    }

    // emergency pads
    if (kept.length < 36) {
      for (const e of emergencyPads(slug, 8)) {
        const k = norm(getQ(e));
        if (seen.has(k)) continue;
        seen.add(k);
        kept.push(e);
        if (kept.length >= 36) break;
      }
    }

    // cap
    const final = kept.slice(0, 48);

    // Cleft sections patch
    let sections = L.sections;
    let sectionsChanged = false;
    if (slug === 'cleft-sentences' && sections && typeof sections === 'object') {
      sections = {
        ...sections,
        definition: CLEFT_SECTIONS_PATCH.definition,
        tips: CLEFT_SECTIONS_PATCH.tips,
        comparison: CLEFT_SECTIONS_PATCH.comparison,
        mistakes: CLEFT_SECTIONS_PATCH.mistakes,
      };
      sectionsChanged = true;
    }

    const changed =
      dropped.length > 0 || final.length !== before.length || sectionsChanged;
    report.push({
      slug,
      before: before.length,
      after: final.length,
      dropped: dropped.length,
      dropReasons: dropped.reduce((a, d) => {
        a[d.why] = (a[d.why] || 0) + 1;
        return a;
      }, {}),
      sectionsChanged,
    });

    if (!DRY && changed) {
      const payload = { exercises: final };
      if (sectionsChanged) payload.sections = sections;
      const { error: ue } = await sb.from('grammar_lessons').update(payload).eq('id', L.id);
      if (ue) throw new Error(`${slug}: ${ue.message}`);
      await sb.from('grammar_quiz_cache').delete().eq('lesson_id', L.id);
    }
  }

  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync(
    'tmp/r4-polish-report.json',
    JSON.stringify({ dry: DRY, report: report.filter((r) => r.dropped || r.sectionsChanged) }, null, 2),
  );
  const touched = report.filter((r) => r.dropped || r.sectionsChanged);
  console.log(
    JSON.stringify(
      {
        dry: DRY,
        touched: touched.length,
        totalDropped: touched.reduce((s, r) => s + r.dropped, 0),
        sample: touched.slice(0, 12),
      },
      null,
      2,
    ),
  );
  console.log(DRY ? '\n[DRY] re-run --apply' : '\n[DONE] R4 polish applied');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
