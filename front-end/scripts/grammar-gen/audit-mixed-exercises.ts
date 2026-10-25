/**
 * Audit: bài tập grammar lẫn type / lẫn topic / trùng chéo lesson.
 * Read-only. Chạy: npx tsx scripts/grammar-gen/audit-mixed-exercises.ts
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
  correct_answer?: string;
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

function getQ(e: Ex): string {
  return String(e.question ?? e.q ?? '');
}
function getOpts(e: Ex): string[] | undefined {
  const o = e.options ?? e.opts;
  return Array.isArray(o) ? o.map(String) : undefined;
}
function getAns(e: Ex): string | string[] | boolean | undefined {
  return e.correct_answer !== undefined ? e.correct_answer : e.answer;
}
function getFb(e: Ex): string {
  return String(e.explanation ?? e.fb ?? '');
}

/** Gợi ý keyword theo topic — heuristic thô. */
const KEYWORD_HINTS: Record<string, RegExp[]> = {
  'present-simple': [/\bevery day\b/i, /\busually\b/i, /\bhabits?\b/i, /\bdo(es)? not\b/i, /\bdoes he\b/i],
  'present-continuous': [/\bright now\b/i, /\bat the moment\b/i, /\bcurrently\b/i, /\bis \w+ing\b/i, /\bare \w+ing\b/i],
  'present-perfect': [/\bhave\b|\bhas\b/i, /\balready\b/i, /\byet\b/i, /\bsince\b/i, /\bfor \d/i, /\bever\b/i, /\bnever\b/i],
  'present-perfect-continuous': [/\bhave been \w+ing\b/i, /\bhas been \w+ing\b/i],
  'past-simple': [/\byesterday\b/i, /\blast (week|year|month|night)\b/i, /\bago\b/i, /\bdid not\b/i, /\bdid you\b/i],
  'past-continuous': [/\bwhile\b/i, /\bwas \w+ing\b/i, /\bwere \w+ing\b/i],
  'past-perfect': [/\bhad \w+(ed|en)\b/i, /\bhad already\b/i, /\bbefore .+ had\b/i],
  'past-perfect-continuous': [/\bhad been \w+ing\b/i],
  'future-will': [/\bwill\b/i, /\bwon't\b/i],
  'be-going-to': [/\bgoing to\b/i],
  'future-continuous': [/\bwill be \w+ing\b/i],
  'future-perfect': [/\bwill have\b/i],
  'passive-voice': [/\bis (made|written|built|spoken|used|done)\b/i, /\bwas (made|written|built|done)\b/i, /\bby the\b/i, /\bpassive\b/i],
  'conditionals-0-1': [/\bif you heat\b/i, /\bif .+ will\b/i, /\bzero conditional\b/i, /\bfirst conditional\b/i],
  'second-conditional': [/\bif I were\b/i, /\bsecond conditional\b/i, /\bif .+ would\b/i],
  'third-conditional': [/\bif .+ had .+ would have\b/i, /\bthird conditional\b/i, /\bwould have\b/i],
  'mixed-conditionals': [/\bmixed conditional\b/i],
  'reported-speech': [/\bsaid that\b/i, /\btold me\b/i, /\breported speech\b/i, /\bhe said\b/i],
  'relative-clauses': [/\bwho\b|\bwhich\b|\bwhose\b|\bwhom\b/i, /\brelative clause\b/i],
  'modals-ability': [/\bcan\b|\bcould\b|\bable to\b/i],
  'modals-obligation': [/\bmust\b|\bhave to\b|\bshould\b|\bought to\b/i],
  'modals-permission': [/\bmay I\b|\bcan I\b|\ballowed to\b/i],
  'modals-advice': [/\bshould\b|\bought to\b|\bhad better\b/i],
  'modals-deduction': [/\bmust be\b|\bcan'?t be\b|\bmight be\b/i],
  'modals-perfect': [/\bmust have\b|\bshould have\b|\bcould have\b|\bmight have\b/i],
  'articles': [/\ba\/an\b|\barticle\b/i, /\bchoose.*(a|an|the)\b/i],
  'comparatives-superlatives': [/\bbetter\b|\bworse\b|\bmore\b|\bmost\b|\bthan\b|\best\b/i, /\bcomparative\b|\bsuperlative\b/i],
  'gerunds-infinitives': [/\bgerund\b|\binfinitive\b/i, /\benjoy \w+ing\b/i, /\bwant to\b/i],
  'question-tags': [/\bisn'?t it\b|\baren'?t you\b|\bdon'?t you\b|\bdidn'?t he\b/i, /\btag question\b/i],
  'phrasal-verbs': [/\bphrasal\b/i, /\bgive up\b|\blook after\b|\bput off\b|\bturn on\b|\bturn off\b/i],
  'wish-if-only': [/\bwish\b|\bif only\b/i],
  'used-to': [/\bused to\b|\bget used to\b|\bbe used to\b/i],
  'there-is-there-are': [/\bthere is\b|\bthere are\b|\bthere was\b|\bthere were\b/i],
  'verb-to-be': [/\bam\b|\bis\b|\bare\b|\bwas\b|\bwere\b/i],
  'wh-questions': [/\bwhat\b|\bwhere\b|\bwhen\b|\bwhy\b|\bhow\b|\bwho\b/i],
  'prepositions-time': [/\bat \d|\bon Monday\b|\bin 20\d\d\b|\bin the morning\b/i],
  'prepositions-place': [/\bin the\b|\bon the\b|\bat the\b|\bunder\b|\bbetween\b|\bnext to\b/i],
  'quantifiers': [/\bmuch\b|\bmany\b|\ba few\b|\ba little\b|\bsome\b|\bany\b|\ba lot of\b/i],
  'countable-uncountable': [/\bcountable\b|\buncountable\b|\bmuch water\b|\bmany apples\b/i],
  'possessives': [/\bmine\b|\byours\b|\bhis\b|\bhers\b|\bours\b|\btheirs\b|\b's\b/i],
  'personal-pronouns': [/\bhe\b|\bshe\b|\bthey\b|\bhim\b|\bher\b|\bthem\b|\bpronoun\b/i],
  'demonstratives': [/\bthis\b|\bthat\b|\bthese\b|\bthose\b/i],
  'imperatives': [/\bdon'?t\b|\bplease\b|\bimperative\b/i],
  'inversion': [/\bnever have I\b|\brarely\b|\bnot only\b|\binversion\b/i],
  'causative': [/\bhave .+ done\b|\bget .+ to\b|\bcausative\b/i],
  'participle-clauses': [/\bparticiple\b|\bhaving \w+ed\b/i],
  'cleft-sentences': [/\bit is .+ that\b|\bwhat .+ is\b|\bcleft\b/i],
  'subjunctive': [/\bsuggest that .+ be\b|\bit is essential that\b|\bsubjunctive\b/i],
  'adverbs-frequency': [/\balways\b|\busually\b|\boften\b|\bsometimes\b|\brarely\b|\bnever\b/i],
  'adjectives-basic': [/\badjective\b/i],
  'conjunctions-linking': [/\bbecause\b|\balthough\b|\bhowever\b|\btherefore\b|\bwhile\b/i],
  'plural-nouns': [/\bplural\b|\bchildren\b|\bmice\b|\bfeet\b/i],
  'have-got': [/\bhave got\b|\bhas got\b|\bhaven'?t got\b/i],
};

const CANON = new Set(['mcq', 'fill', 'tf', 'error', 'multiple_choice', 'fill_blank', 'error_correction']);

async function main(): Promise<void> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu env Supabase');

  const client = createClient(url, key, { auth: { persistSession: false } });

  const { data: topics, error: te } = await client
    .from('grammar_topics')
    .select('id, slug, title, title_vi, level');
  if (te) throw te;

  const { data: lessons, error: le } = await client
    .from('grammar_lessons')
    .select('id, topic_id, title, exercises, order_index');
  if (le) throw le;

  // grammar_exercises table (legacy separate table?)
  const { data: tableXr, error: xe } = await client
    .from('grammar_exercises')
    .select('id, type, question, options, correct_answer, topic, lesson_id, difficulty')
    .limit(5000);
  if (xe) {
    console.log('[audit] grammar_exercises table:', xe.message);
  }

  const topicById = new Map((topics ?? []).map((t) => [t.id, t]));
  console.log(`topics=${topics?.length ?? 0} lessons=${lessons?.length ?? 0} grammar_exercises_rows=${tableXr?.length ?? 0}`);

  const typeGlobal: Record<string, number> = {};
  const typeMismatch: string[] = [];
  const structural: string[] = [];
  const topicMismatch: string[] = [];
  const perLesson: {
    slug: string;
    title: string;
    level: string;
    n: number;
    types: Record<string, number>;
    bad: number;
  }[] = [];

  let totalEx = 0;

  for (const lesson of lessons ?? []) {
    const topic = topicById.get(lesson.topic_id);
    const slug = topic?.slug ?? String(lesson.topic_id);
    const level = topic?.level ?? '?';
    const xr = (Array.isArray(lesson.exercises) ? lesson.exercises : []) as Ex[];
    totalEx += xr.length;
    const typeCount: Record<string, number> = {};
    let bad = 0;

    for (let i = 0; i < xr.length; i++) {
      const e = xr[i];
      const t = String(e.type ?? 'MISSING');
      typeCount[t] = (typeCount[t] || 0) + 1;
      typeGlobal[t] = (typeGlobal[t] || 0) + 1;

      const q = getQ(e);
      const opts = getOpts(e);
      const ans = getAns(e);
      const fb = getFb(e);

      if (!q.trim()) {
        bad++;
        structural.push(`${slug} #${i}: no-question`);
        continue;
      }
      if (!fb.trim()) {
        bad++;
        structural.push(`${slug} #${i}: no-feedback | ${q.slice(0, 50)}`);
      }
      if (!CANON.has(t)) {
        bad++;
        typeMismatch.push(`${slug} #${i}: unknown type="${t}" | ${q.slice(0, 60)}`);
      }

      // Shape vs declared type
      if (t === 'fill' || t === 'fill_blank') {
        const hasOpts = !!opts && opts.length >= 2;
        const ansStr = typeof ans === 'string' ? ans : '';
        // fill nhưng options dài như câu MCQ
        if (
          hasOpts &&
          typeof ans === 'string' &&
          opts!.includes(ansStr) &&
          opts!.every((o) => o.length > 20)
        ) {
          typeMismatch.push(
            `${slug} #${i}: type=${t} nhưng giống MCQ (opts dài) | ${q.slice(0, 60)}`,
          );
        }
        // fill nhưng không blank trong câu
        if (!/_+|\.{3}|\[.?\]|___|…/.test(q) && !/\(\s*\)/.test(q) && t === 'fill') {
          // không flag cứng — nhiều fill dùng "Choose the correct form"
        }
        if (t === 'fill' && !Array.isArray(ans) && typeof ans !== 'string') {
          typeMismatch.push(`${slug} #${i}: fill answer không phải array/string | ${q.slice(0, 50)}`);
          bad++;
        }
      }

      if (t === 'mcq' || t === 'multiple_choice' || t === 'error' || t === 'error_correction') {
        if (!opts || opts.length < 2) {
          typeMismatch.push(`${slug} #${i}: type=${t} thiếu options | ${q.slice(0, 60)}`);
          bad++;
        } else if (typeof ans === 'string' && !opts.includes(ans)) {
          const soft = opts.find((o) => o.trim().toLowerCase() === ans.trim().toLowerCase());
          if (!soft) {
            typeMismatch.push(
              `${slug} #${i}: type=${t} answer∉opts ans="${ans.slice(0, 40)}" | ${q.slice(0, 50)}`,
            );
            bad++;
          }
        }
        // mcq tagged but looks like fill (blank + short answer)
        if (
          opts &&
          opts.length >= 2 &&
          /_{2,}|\.{3}|___/.test(q) &&
          opts.every((o) => o.split(/\s+/).length <= 3)
        ) {
          // still valid mcq fill-style — OK
        }
      }

      if (t === 'tf') {
        const ok =
          typeof ans === 'boolean' ||
          ['true', 'false', 'đúng', 'sai', 'yes', 'no'].includes(String(ans).toLowerCase());
        if (!ok) {
          typeMismatch.push(`${slug} #${i}: tf answer bad=${JSON.stringify(ans)} | ${q.slice(0, 50)}`);
          bad++;
        }
      }

      // Per-question topic keyword: score against OTHER topics more than self
      const text = `${q} ${fb}`;
      let selfScore = 0;
      let bestOther = { slug: '', score: 0 };
      for (const [hintSlug, regs] of Object.entries(KEYWORD_HINTS)) {
        let sc = 0;
        for (const r of regs) {
          if (r.test(text)) sc += 1;
        }
        if (hintSlug === slug) selfScore = sc;
        else if (sc > bestOther.score) bestOther = { slug: hintSlug, score: sc };
      }
      // Chỉ flag khi other mạnh rõ và self = 0, và có signal rõ (≥2)
      if (bestOther.score >= 3 && selfScore === 0 && bestOther.score >= 3) {
        topicMismatch.push(
          `${slug} #${i} → giống ${bestOther.slug}(score=${bestOther.score}) | ${q.slice(0, 80)}`,
        );
      }
    }

    // Lesson-level: sample text vs hints
    const sampleText = xr
      .slice(0, 40)
      .map((e) => getQ(e))
      .join(' | ');
    let selfScore = 0;
    const otherScores: { slug: string; score: number }[] = [];
    for (const [hintSlug, regs] of Object.entries(KEYWORD_HINTS)) {
      let sc = 0;
      for (const r of regs) {
        const m = sampleText.match(new RegExp(r.source, 'gi'));
        if (m) sc += m.length;
      }
      if (hintSlug === slug) selfScore = sc;
      else if (sc > 0) otherScores.push({ slug: hintSlug, score: sc });
    }
    otherScores.sort((a, b) => b.score - a.score);
    if (
      otherScores[0] &&
      otherScores[0].score >= 8 &&
      otherScores[0].score > selfScore * 2 + 4
    ) {
      topicMismatch.push(
        `LESSON ${slug}: self=${selfScore} dominant=${otherScores[0].slug}(${otherScores[0].score})`,
      );
    }

    perLesson.push({ slug, title: lesson.title, level, n: xr.length, types: typeCount, bad });
  }

  // Cross-lesson duplicate questions
  const qToLessons = new Map<string, Set<string>>();
  for (const lesson of lessons ?? []) {
    const topic = topicById.get(lesson.topic_id);
    const slug = topic?.slug ?? '?';
    const xr = (Array.isArray(lesson.exercises) ? lesson.exercises : []) as Ex[];
    for (const e of xr) {
      const q = getQ(e).trim().toLowerCase().replace(/\s+/g, ' ');
      if (q.length < 12) continue;
      if (!qToLessons.has(q)) qToLessons.set(q, new Set());
      qToLessons.get(q)!.add(slug);
    }
  }
  const crossDups = [...qToLessons.entries()]
    .filter(([, slugs]) => slugs.size > 1)
    .map(([q, slugs]) => ({ q, slugs: [...slugs].sort() }));

  // grammar_exercises table audit
  const tableType: Record<string, number> = {};
  const tableByTopic: Record<string, number> = {};
  for (const row of tableXr ?? []) {
    const t = String(row.type ?? 'MISSING');
    tableType[t] = (tableType[t] || 0) + 1;
    const top = String(row.topic ?? 'null');
    tableByTopic[top] = (tableByTopic[top] || 0) + 1;
  }

  // Report
  const lines: string[] = [];
  const log = (s: string) => {
    console.log(s);
    lines.push(s);
  };

  log('=== GRAMMAR EXERCISES AUDIT (prod DB) ===');
  log(`lessons=${lessons?.length} total_exercises_in_lessons=${totalEx}`);
  log(`grammar_exercises table rows=${tableXr?.length ?? 0}`);
  log('');
  log('=== TYPE GLOBAL (grammar_lessons.exercises) ===');
  log(JSON.stringify(typeGlobal, null, 2));
  log('');
  log('=== TYPE (grammar_exercises table) ===');
  log(JSON.stringify(tableType, null, 2));
  log('topics in table (top 20):');
  Object.entries(tableByTopic)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([k, v]) => log(`  ${v}\t${k}`));

  log('');
  log('=== PER LESSON ===');
  for (const r of perLesson.sort((a, b) => a.slug.localeCompare(b.slug))) {
    log(
      `${r.slug.padEnd(34)} [${r.level}] n=${String(r.n).padStart(3)} bad=${String(r.bad).padStart(3)} ${JSON.stringify(r.types)}`,
    );
  }

  log('');
  log(`=== TYPE / STRUCTURAL MISMATCH (${typeMismatch.length}) ===`);
  typeMismatch.slice(0, 100).forEach((x) => log(' - ' + x));
  if (typeMismatch.length > 100) log(` ... +${typeMismatch.length - 100} more`);

  log('');
  log(`=== STRUCTURAL EMPTY (${structural.length}) ===`);
  structural.slice(0, 40).forEach((x) => log(' - ' + x));
  if (structural.length > 40) log(` ... +${structural.length - 40} more`);

  log('');
  log(`=== TOPIC MISMATCH HEURISTIC (${topicMismatch.length}) ===`);
  // group by target
  const byTarget = new Map<string, string[]>();
  for (const m of topicMismatch) {
    const key = m.split(' ')[0] ?? m;
    if (!byTarget.has(key)) byTarget.set(key, []);
    byTarget.get(key)!.push(m);
  }
  for (const [k, arr] of [...byTarget.entries()].sort((a, b) => b[1].length - a[1].length)) {
    log(`\n## ${k} (${arr.length})`);
    arr.slice(0, 15).forEach((x) => log(' - ' + x));
    if (arr.length > 15) log(` ... +${arr.length - 15}`);
  }

  log('');
  log(`=== CROSS-LESSON DUPLICATE Q (${crossDups.length}) ===`);
  crossDups.slice(0, 50).forEach(({ q, slugs }) => {
    log(` - [${slugs.join(' | ')}] ${q.slice(0, 100)}`);
  });
  if (crossDups.length > 50) log(` ... +${crossDups.length - 50} more`);

  // Summary counts per lesson of cross-dups
  const crossCount = new Map<string, number>();
  for (const { slugs } of crossDups) {
    for (const s of slugs) crossCount.set(s, (crossCount.get(s) || 0) + 1);
  }
  log('');
  log('=== LESSONS WITH MOST CROSS-DUP QUESTIONS ===');
  [...crossCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([s, n]) => log(`  ${n}\t${s}`));

  // Sample questions that look wrong for top mismatch lessons
  log('');
  log('=== SAMPLE: first 5 Qs of each lesson with bad>0 or cross-dups ===');
  const interesting = new Set(
    perLesson.filter((r) => r.bad > 0 || (crossCount.get(r.slug) || 0) > 3).map((r) => r.slug),
  );
  for (const lesson of lessons ?? []) {
    const topic = topicById.get(lesson.topic_id);
    const slug = topic?.slug ?? '?';
    if (!interesting.has(slug) && !topicMismatch.some((m) => m.startsWith(slug) || m.includes(`LESSON ${slug}`)))
      continue;
    const xr = (Array.isArray(lesson.exercises) ? lesson.exercises : []) as Ex[];
    log(`\n--- ${slug} (n=${xr.length}) ---`);
    for (let i = 0; i < Math.min(5, xr.length); i++) {
      const e = xr[i];
      log(`  [${e.type}] ${getQ(e).slice(0, 120)}`);
    }
  }

  const outDir = path.join(process.cwd(), 'tmp');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'grammar-mixed-audit.md');
  writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`\n[audit] wrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
