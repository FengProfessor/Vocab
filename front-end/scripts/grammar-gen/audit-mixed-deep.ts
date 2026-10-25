/**
 * Deep audit: template boilerplate, options sai topic, mojibake, content lẫn.
 * npx tsx scripts/grammar-gen/audit-mixed-deep.ts
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

type Ex = {
  type?: string;
  q?: string;
  question?: string;
  opts?: string[];
  options?: string[];
  answer?: string | string[] | boolean;
  correct_answer?: string | string[] | boolean;
  fb?: string;
  explanation?: string;
};

function loadEnv(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

const getQ = (e: Ex) => String(e.question ?? e.q ?? '');
const getOpts = (e: Ex) => {
  const o = e.options ?? e.opts;
  return Array.isArray(o) ? o.map(String) : [];
};
const getAns = (e: Ex) =>
  e.correct_answer !== undefined ? e.correct_answer : e.answer;
const getFb = (e: Ex) => String(e.explanation ?? e.fb ?? '');

/** Template/boilerplate prompts xuất hiện hàng loạt khi mass-enrich. */
const TEMPLATE_PATTERNS: { id: string; re: RegExp }[] = [
  { id: 'chon-cau-dung', re: /^chọn câu dùng đúng/i },
  { id: 'chon-cau-truc', re: /^chọn cấu trúc phù hợp nhất\.?$/i },
  { id: 'dien-ten-chu-diem', re: /^điền tên cấu trúc\/chủ điểm đang luyện\.?$/i },
  { id: 'cau-tu-nhien', re: /^câu này tự nhiên và đúng ngữ pháp/i },
  { id: 'cau-sau-dung', re: /^câu sau đúng ngữ pháp/i },
  { id: 'hoan-thanh-mau', re: /^hoàn thành theo mẫu:/i },
  { id: 'hoan-thanh-cau-mojibake', re: /^ho\?n th\?nh c\?u:/i },
  { id: 'find-error', re: /^find the error:/i },
  { id: 'cau-nao-sai', re: /^câu nào sai/i },
];

/** Topic title keywords expected in options/answers for template "Chọn câu dùng đúng X" */
const TOPIC_LABEL: Record<string, string[]> = {
  'present-simple': ['present simple', 'hiện tại đơn'],
  'present-continuous': ['present continuous', 'hiện tại tiếp diễn'],
  'present-perfect': ['present perfect', 'hiện tại hoàn thành'],
  'past-simple': ['past simple', 'quá khứ đơn'],
  'past-continuous': ['past continuous', 'quá khứ tiếp diễn'],
  'past-perfect': ['past perfect', 'quá khứ hoàn thành'],
  'future-will': ['will', 'future', 'tương lai'],
  'be-going-to': ['going to'],
  'passive-voice': ['passive', 'bị động'],
  'reported-speech': ['reported', 'tường thuật'],
  'relative-clauses': ['relative', 'mệnh đề quan hệ'],
  'conditionals-0-1': ['conditional', 'điều kiện'],
  'second-conditional': ['second conditional', 'điều kiện loại 2'],
  'third-conditional': ['third conditional', 'điều kiện loại 3'],
  'articles': ['article', 'a/an/the', 'mạo từ'],
  'modals-ability': ['can', 'could', 'ability'],
  'modals-obligation': ['must', 'have to', 'obligation'],
  'phrasal-verbs': ['phrasal'],
  'question-tags': ['tag'],
  'gerunds-infinitives': ['gerund', 'infinitive'],
  'comparatives-superlatives': ['comparative', 'superlative', 'hơn', 'nhất'],
  'used-to': ['used to'],
  'wish-if-only': ['wish', 'if only'],
  'verb-to-be': ['to be', 'am', 'is', 'are'],
  'there-is-there-are': ['there is', 'there are'],
  'prepositions-time': ['preposition', 'giới từ'],
  'prepositions-place': ['preposition', 'giới từ'],
  'quantifiers': ['quantifier', 'some', 'any', 'much', 'many'],
  'countable-uncountable': ['countable', 'uncountable', 'đếm được'],
  'personal-pronouns': ['pronoun', 'đại từ'],
  'possessives': ['possessive', 'sở hữu'],
  'plural-nouns': ['plural', 'số nhiều'],
  'wh-questions': ['wh-', 'question'],
  'imperatives': ['imperative', 'mệnh lệnh'],
  'adverbs-frequency': ['frequency', 'always', 'usually'],
  'adjectives-basic': ['adjective', 'tính từ'],
  'subjunctive': ['subjunctive'],
  'causative': ['causative', 'have', 'get'],
  'inversion': ['inversion'],
  'cleft-sentences': ['cleft'],
  'participle-clauses': ['participle'],
  'mixed-conditionals': ['mixed conditional'],
  'modals-perfect': ['must have', 'should have', 'could have'],
  'modals-advice': ['should', 'advice', 'ought'],
  'modals-permission': ['permission', 'may', 'can'],
  'modals-deduction': ['must be', 'deduction'],
  'future-continuous': ['future continuous', 'will be'],
  'future-perfect': ['future perfect', 'will have'],
  'future-in-the-past': ['would', 'was going to', 'future in the past'],
  'present-perfect-continuous': ['have been', 'has been'],
  'past-perfect-continuous': ['had been'],
  'advanced-passive': ['passive'],
  'advanced-relative-clauses': ['relative'],
  'have-got': ['have got', 'has got'],
  'demonstratives': ['this', 'that', 'these', 'those'],
  'conjunctions-linking': ['because', 'although', 'however'],
  'discourse-markers': ['however', 'moreover', 'discourse'],
  'ellipsis-substitution': ['ellipsis', 'so', 'one'],
  'emphasis-structures': ['emphasis', 'do', 'indeed'],
  'hedging-language': ['hedging', 'likely', 'appear'],
  'nominalisation': ['nominalisation', 'nominalization'],
  'grammatical-collocations': ['collocation'],
};

function isMostlyVietnamese(s: string): boolean {
  const vi = (s.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi) || [])
    .length;
  const letters = (s.match(/[a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g) || [])
    .length;
  return letters > 10 && vi / letters > 0.15;
}

function hasMojibake(s: string): boolean {
  return /Ã.|â€|á»|áº|Ho\?n th\?nh|c\?u|Ä|Æ|�/.test(s) || /\?[a-z]/.test(s) && /th\?nh|c\?u|Ä‘/.test(s);
}

async function main(): Promise<void> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const client = createClient(url, key, { auth: { persistSession: false } });

  const { data: topics, error: te } = await client
    .from('grammar_topics')
    .select('id, slug, title, level');
  if (te) throw te;
  const { data: lessons, error: le } = await client
    .from('grammar_lessons')
    .select('id, topic_id, title, exercises');
  if (le) throw le;

  const topicById = new Map((topics ?? []).map((t) => [t.id, t]));
  const lines: string[] = [];
  const log = (s = '') => {
    console.log(s);
    lines.push(s);
  };

  type LessonStat = {
    slug: string;
    n: number;
    template: number;
    uniqueContent: number;
    mojibake: number;
    viPrompt: number;
    genericFillTopicName: number;
    wrongTopicOpts: number;
    samples: string[];
  };

  const stats: LessonStat[] = [];
  const allTemplateQs = new Map<string, number>(); // normalized q → count of lessons
  const suspectItems: string[] = [];

  // First pass: collect template question fingerprints
  const fingerprintToLessons = new Map<string, Set<string>>();

  for (const lesson of lessons ?? []) {
    const topic = topicById.get(lesson.topic_id);
    const slug = topic?.slug ?? '?';
    const xr = (Array.isArray(lesson.exercises) ? lesson.exercises : []) as Ex[];

    let template = 0;
    let uniqueContent = 0;
    let mojibake = 0;
    let viPrompt = 0;
    let genericFillTopicName = 0;
    let wrongTopicOpts = 0;
    const samples: string[] = [];

    for (let i = 0; i < xr.length; i++) {
      const e = xr[i];
      const q = getQ(e);
      const opts = getOpts(e);
      const ans = getAns(e);
      const fb = getFb(e);
      const blob = `${q} | ${opts.join(' / ')} | ans=${JSON.stringify(ans)} | ${fb}`;

      const tpl = TEMPLATE_PATTERNS.find((p) => p.re.test(q.trim()));
      if (tpl) {
        template++;
        allTemplateQs.set(tpl.id, (allTemplateQs.get(tpl.id) || 0) + 1);

        // Fingerprint: type of template (not full q if it embeds topic name)
        const fp =
          tpl.id === 'chon-cau-dung'
            ? `chon-cau-dung::${q.trim().toLowerCase()}`
            : tpl.id === 'cau-tu-nhien' || tpl.id === 'cau-sau-dung'
              ? `${tpl.id}::${q.trim().toLowerCase()}`
              : tpl.id === 'hoan-thanh-mau'
                ? `hoan-thanh::${q.trim().toLowerCase()}`
                : tpl.id;
        if (!fingerprintToLessons.has(fp)) fingerprintToLessons.set(fp, new Set());
        fingerprintToLessons.get(fp)!.add(slug);

        if (tpl.id === 'dien-ten-chu-diem') {
          genericFillTopicName++;
          // answer should relate to topic
          const ansStr = Array.isArray(ans) ? ans.join(' ') : String(ans ?? '');
          const labels = TOPIC_LABEL[slug] ?? [slug.replace(/-/g, ' ')];
          const ok = labels.some((l) => ansStr.toLowerCase().includes(l.toLowerCase()));
          // also accept title words
          const titleWords = (topic?.title ?? '').toLowerCase().split(/\s+/).filter((w) => w.length > 3);
          const ok2 = titleWords.some((w) => ansStr.toLowerCase().includes(w));
          if (!ok && !ok2 && ansStr.length > 0) {
            wrongTopicOpts++;
            if (samples.length < 8) {
              samples.push(
                `#${i} FILL-TOPIC-NAME ans="${ansStr.slice(0, 60)}" expected~${labels.join('|')}`,
              );
            }
            suspectItems.push(
              `${slug} #${i} [dien-ten] ans="${ansStr}" opts=${JSON.stringify(opts).slice(0, 120)}`,
            );
          }
        }

        if (tpl.id === 'chon-cau-truc') {
          // options should include something related to this topic
          const labels = TOPIC_LABEL[slug] ?? [slug.replace(/-/g, ' ')];
          const optBlob = opts.join(' ').toLowerCase();
          const ansStr = String(Array.isArray(ans) ? ans[0] : ans ?? '').toLowerCase();
          const hit =
            labels.some((l) => optBlob.includes(l.toLowerCase()) || ansStr.includes(l.toLowerCase())) ||
            optBlob.includes(slug.replace(/-/g, ' '));
          if (!hit && opts.length > 0) {
            wrongTopicOpts++;
            if (samples.length < 8) {
              samples.push(
                `#${i} CHON-CAU-TRUC opts=${opts.map((o) => o.slice(0, 40)).join(' || ')}`,
              );
            }
            suspectItems.push(
              `${slug} #${i} [chon-cau-truc] opts=${JSON.stringify(opts)} ans=${JSON.stringify(ans)}`,
            );
          }
        }
      } else {
        uniqueContent++;
      }

      if (hasMojibake(q) || hasMojibake(fb) || opts.some(hasMojibake)) {
        mojibake++;
        if (samples.length < 8) samples.push(`#${i} MOJIBAKE ${q.slice(0, 80)}`);
      }

      // Vietnamese-heavy English grammar prompts (excluding intentional vi instruction)
      if (
        isMostlyVietnamese(q) &&
        !/^chọn |^điền |^câu |^hoàn thành|^tìm /i.test(q) &&
        !q.includes('___')
      ) {
        // e.g. countable "Tôi có _______ cuốn sách"
        viPrompt++;
        if (samples.length < 8) samples.push(`#${i} VI-PROMPT ${q.slice(0, 80)}`);
      }

      // Detect cross-topic pollution in non-template: e.g. "Past Perfect" in present-simple lesson
      if (!tpl) {
        const otherTopicMentions: string[] = [];
        for (const [otherSlug, labels] of Object.entries(TOPIC_LABEL)) {
          if (otherSlug === slug) continue;
          // only strong labels (multi-word or specific)
          for (const lab of labels) {
            if (lab.length < 5) continue;
            const re = new RegExp(`\\b${lab.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (re.test(q) || re.test(fb)) {
              // skip if self also matches overlapping
              otherTopicMentions.push(`${otherSlug}:${lab}`);
            }
          }
        }
        // filter false positives for tense family
        const selfLabels = TOPIC_LABEL[slug] ?? [];
        const filtered = otherTopicMentions.filter((m) => {
          const lab = m.split(':')[1] ?? '';
          return !selfLabels.some((s) => s.toLowerCase() === lab.toLowerCase());
        });
        if (filtered.length >= 1 && /chọn câu|đúng|sai|structure|tense|form/i.test(q + fb)) {
          // only if explicitly teaching another named structure
        }
      }
    }

    stats.push({
      slug,
      n: xr.length,
      template,
      uniqueContent,
      mojibake,
      viPrompt,
      genericFillTopicName,
      wrongTopicOpts,
      samples,
    });
  }

  // Template fingerprints shared across many lessons
  const sharedTemplates = [...fingerprintToLessons.entries()]
    .map(([fp, set]) => ({ fp, n: set.size, lessons: [...set].sort() }))
    .filter((x) => x.n >= 3)
    .sort((a, b) => b.n - a.n);

  log('=== DEEP AUDIT: template / mixed content ===');
  log(`lessons=${lessons?.length}`);
  log('');
  log('=== TEMPLATE PATTERN COUNTS (across all exercises) ===');
  for (const [id, n] of [...allTemplateQs.entries()].sort((a, b) => b[1] - a[1])) {
    log(`  ${n}\t${id}`);
  }

  log('');
  log('=== PER LESSON (template vs unique) ===');
  log(
    'slug'.padEnd(34) +
      'n'.padStart(4) +
      ' tpl'.padStart(5) +
      ' uniq'.padStart(5) +
      ' moj'.padStart(5) +
      ' viQ'.padStart(5) +
      ' badTpl'.padStart(7) +
      '  %tpl',
  );
  for (const s of stats.sort((a, b) => b.template / Math.max(1, b.n) - a.template / Math.max(1, a.n))) {
    const pct = s.n ? Math.round((100 * s.template) / s.n) : 0;
    log(
      `${s.slug.padEnd(34)}${String(s.n).padStart(4)}${String(s.template).padStart(5)}${String(s.uniqueContent).padStart(5)}${String(s.mojibake).padStart(5)}${String(s.viPrompt).padStart(5)}${String(s.wrongTopicOpts).padStart(7)}  ${pct}%`,
    );
  }

  log('');
  log(`=== SHARED TEMPLATE FINGERPRINTS (≥3 lessons): ${sharedTemplates.length} ===`);
  for (const t of sharedTemplates.slice(0, 40)) {
    log(`\n[${t.n} lessons] ${t.fp.slice(0, 120)}`);
    if (t.n <= 12) log(`  → ${t.lessons.join(', ')}`);
    else log(`  → ${t.lessons.slice(0, 8).join(', ')} ... +${t.n - 8}`);
  }

  log('');
  log(`=== SUSPECT TEMPLATE ANSWERS/OPTS (${suspectItems.length}) ===`);
  // group by pattern
  const bySlug = new Map<string, string[]>();
  for (const s of suspectItems) {
    const slug = s.split(' ')[0] ?? s;
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug)!.push(s);
  }
  for (const [slug, arr] of [...bySlug.entries()].sort((a, b) => b[1].length - a[1].length)) {
    log(`\n## ${slug} (${arr.length})`);
    arr.slice(0, 10).forEach((x) => log(' - ' + x.slice(0, 200)));
    if (arr.length > 10) log(` ... +${arr.length - 10}`);
  }

  // Dump full detail of first 8 exercises for worst template-heavy lessons
  log('');
  log('=== FULL DUMP: top 5 template-heavy lessons (first 12 Qs) ===');
  const worst = [...stats].sort((a, b) => b.template - a.template).slice(0, 5);
  for (const w of worst) {
    const lesson = (lessons ?? []).find((l) => topicById.get(l.topic_id)?.slug === w.slug);
    if (!lesson) continue;
    const xr = (Array.isArray(lesson.exercises) ? lesson.exercises : []) as Ex[];
    log(`\n######## ${w.slug} n=${xr.length} template=${w.template} ########`);
    for (let i = 0; i < Math.min(12, xr.length); i++) {
      const e = xr[i];
      log(
        `  #${i} [${e.type}] Q: ${getQ(e).slice(0, 100)}\n      opts: ${JSON.stringify(getOpts(e)).slice(0, 160)}\n      ans: ${JSON.stringify(getAns(e))}\n      fb: ${getFb(e).slice(0, 80)}`,
      );
    }
  }

  // Also dump countable-uncountable and present-simple fully short
  log('');
  log('=== SPOT CHECK: countable-uncountable + present-simple + mixed-conditionals ===');
  for (const target of ['countable-uncountable', 'present-simple', 'mixed-conditionals', 'future-will']) {
    const lesson = (lessons ?? []).find((l) => topicById.get(l.topic_id)?.slug === target);
    if (!lesson) continue;
    const xr = (Array.isArray(lesson.exercises) ? lesson.exercises : []) as Ex[];
    log(`\n######## ${target} n=${xr.length} ########`);
    for (let i = 0; i < Math.min(15, xr.length); i++) {
      const e = xr[i];
      log(
        `  #${i} [${e.type}] ${getQ(e).slice(0, 110)}\n      opts=${JSON.stringify(getOpts(e)).slice(0, 140)} ans=${JSON.stringify(getAns(e))}`,
      );
    }
  }

  // Summary numbers
  const total = stats.reduce((a, s) => a + s.n, 0);
  const totalTpl = stats.reduce((a, s) => a + s.template, 0);
  const totalMoj = stats.reduce((a, s) => a + s.mojibake, 0);
  const totalBad = stats.reduce((a, s) => a + s.wrongTopicOpts, 0);
  const totalVi = stats.reduce((a, s) => a + s.viPrompt, 0);
  log('');
  log('=== SUMMARY ===');
  log(`total exercises: ${total}`);
  log(`template-like: ${totalTpl} (${Math.round((100 * totalTpl) / total)}%)`);
  log(`mojibake qs: ${totalMoj}`);
  log(`vi-heavy non-instruction prompts: ${totalVi}`);
  log(`suspect template opts/ans: ${totalBad}`);
  log(`shared fingerprints (≥3 lessons): ${sharedTemplates.length}`);

  const outDir = path.join(process.cwd(), 'tmp');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'grammar-mixed-deep.md');
  writeFileSync(outPath, lines.join('\n'), 'utf8');
  // also JSON for machine
  writeFileSync(
    path.join(outDir, 'grammar-mixed-deep.json'),
    JSON.stringify(
      {
        summary: {
          total,
          totalTpl,
          totalMoj,
          totalBad,
          totalVi,
          sharedTemplates: sharedTemplates.length,
        },
        stats,
        sharedTemplates: sharedTemplates.slice(0, 100),
        suspectItems: suspectItems.slice(0, 500),
      },
      null,
      2,
    ),
    'utf8',
  );
  console.log(`\n[audit] wrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
