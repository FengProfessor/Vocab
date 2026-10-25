/**
 * Detect exercises whose CONTENT clearly belongs to another grammar topic.
 * npx tsx scripts/grammar-gen/audit-topic-pollution.ts
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
  answer?: unknown;
  correct_answer?: unknown;
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

/**
 * Strong signatures: if match, exercise likely about that topic.
 * Ordered: more specific first when scoring.
 */
const SIGNATURES: { slug: string; weight: number; re: RegExp }[] = [
  // Explicit "Choose the correct X" / structure names
  { slug: 'there-is-there-are', weight: 5, re: /\bthere\s+(is|are|was|were|isn'?t|aren'?t)\b/i },
  { slug: 'there-is-there-are', weight: 6, re: /correct form:\s*there\s+___/i },
  { slug: 'verb-to-be', weight: 4, re: /correct to be form|choose the correct to be/i },
  { slug: 'articles', weight: 5, re: /correct \*\*article\*\*|choose the correct article|a\/an\/the/i },
  { slug: 'plural-nouns', weight: 5, re: /correct \*\*plural|plural of|plural noun/i },
  { slug: 'quantifiers', weight: 4, re: /correct \*\*quantifier\*\*|much\/many|some\/any/i },
  { slug: 'countable-uncountable', weight: 4, re: /countable|uncountable|đếm được|không đếm/i },
  { slug: 'present-simple', weight: 3, re: /every day|habits?|present simple|hiện tại đơn/i },
  { slug: 'present-continuous', weight: 4, re: /right now|at the moment|present continuous|hiện tại tiếp diễn/i },
  { slug: 'present-perfect', weight: 4, re: /present perfect|hiện tại hoàn thành|have\/has \+ (v3|pp)/i },
  { slug: 'present-perfect-continuous', weight: 5, re: /have been \w+ing|has been \w+ing|present perfect continuous/i },
  { slug: 'past-simple', weight: 3, re: /yesterday|last (week|year|night)|past simple|quá khứ đơn/i },
  { slug: 'past-continuous', weight: 4, re: /past continuous|quá khứ tiếp diễn|was \w+ing|were \w+ing/i },
  { slug: 'past-perfect', weight: 4, re: /past perfect|quá khứ hoàn thành|had \+ v3/i },
  { slug: 'past-perfect-continuous', weight: 5, re: /had been \w+ing|past perfect continuous/i },
  { slug: 'future-will', weight: 3, re: /\bwill\b|\bwon't\b|future simple|tương lai đơn/i },
  { slug: 'be-going-to', weight: 4, re: /going to|be going to/i },
  { slug: 'future-continuous', weight: 5, re: /will be \w+ing|future continuous/i },
  { slug: 'future-perfect', weight: 5, re: /will have \+? ?v3|future perfect|will have \w/i },
  { slug: 'future-in-the-past', weight: 5, re: /future in the past|was going to|would \+ v\b/i },
  { slug: 'mixed-conditionals', weight: 6, re: /mixed conditional|if .+ had .+ would \w|would be .+ if .+ had/i },
  { slug: 'third-conditional', weight: 5, re: /third conditional|if .+ had .+ would have|would have \w+ if/i },
  { slug: 'second-conditional', weight: 5, re: /second conditional|if I were|if .+ would \w/i },
  { slug: 'conditionals-0-1', weight: 4, re: /zero conditional|first conditional|if .+ will|điều kiện loại [01]/i },
  { slug: 'passive-voice', weight: 4, re: /passive voice|bị động|be \+ v3|is (made|written|built)/i },
  { slug: 'advanced-passive', weight: 5, re: /it is said that|is said to|advanced passive/i },
  { slug: 'reported-speech', weight: 5, re: /reported speech|tường thuật|said that|told me that/i },
  { slug: 'relative-clauses', weight: 4, re: /relative clause|mệnh đề quan hệ|\bwho\/which\b/i },
  { slug: 'advanced-relative-clauses', weight: 5, re: /of whom|of which|preposition \+ whom/i },
  { slug: 'modals-perfect', weight: 5, re: /must have|should have|could have|might have|modal perfect/i },
  { slug: 'modals-ability', weight: 3, re: /\bcan\b|\bcould\b|able to|modals?: ability/i },
  { slug: 'modals-obligation', weight: 4, re: /\bmust\b|\bhave to\b|obligation|modals?: obligation/i },
  { slug: 'modals-advice', weight: 4, re: /should|ought to|had better|modals?: advice/i },
  { slug: 'modals-permission', weight: 4, re: /permission|may I|allowed to|modals?: permission/i },
  { slug: 'modals-deduction', weight: 5, re: /must be|can'?t be|deduction|modals?: deduction/i },
  { slug: 'gerunds-infinitives', weight: 5, re: /gerund|infinitive|enjoy \w+ing|want to \w/i },
  { slug: 'question-tags', weight: 5, re: /question tag|isn'?t it|aren'?t you|tag question/i },
  { slug: 'phrasal-verbs', weight: 4, re: /phrasal verb|give up|look after|put off|turn (on|off)/i },
  { slug: 'wish-if-only', weight: 5, re: /\bwish\b|if only/i },
  { slug: 'used-to', weight: 5, re: /used to|get used to|be used to/i },
  { slug: 'comparatives-superlatives', weight: 4, re: /comparative|superlative|more .+ than|the most/i },
  { slug: 'prepositions-time', weight: 4, re: /preposition.*(time|thời gian)|in 19|on monday|at \d/i },
  { slug: 'prepositions-place', weight: 4, re: /preposition.*(place|nơi)|next to|under the|between/i },
  { slug: 'personal-pronouns', weight: 4, re: /personal pronoun|đại từ nhân xưng|\bhe\/she\b/i },
  { slug: 'possessives', weight: 4, re: /possessive|sở hữu|mine|yours|hers|theirs/i },
  { slug: 'demonstratives', weight: 4, re: /demonstrative|this\/that|these\/those/i },
  { slug: 'imperatives', weight: 4, re: /imperative|mệnh lệnh|don'?t \+ v/i },
  { slug: 'adverbs-frequency', weight: 4, re: /frequency|always|usually|often|rarely|never.*adverb/i },
  { slug: 'adjectives-basic', weight: 3, re: /adjective|tính từ/i },
  { slug: 'subjunctive', weight: 5, re: /subjunctive|insist that|essential that/i },
  { slug: 'causative', weight: 5, re: /causative|have .+ done|get .+ to/i },
  { slug: 'inversion', weight: 5, re: /inversion|never have i|not only|hardly had/i },
  { slug: 'cleft-sentences', weight: 5, re: /cleft|it is .+ that|what .+ is/i },
  { slug: 'participle-clauses', weight: 5, re: /participle clause|having \w+ed/i },
  { slug: 'conjunctions-linking', weight: 4, re: /conjunction|linking word|although|however|therefore/i },
  { slug: 'discourse-markers', weight: 4, re: /discourse marker|moreover|furthermore|on the other hand/i },
  { slug: 'ellipsis-substitution', weight: 5, re: /ellipsis|substitution|think so|do so/i },
  { slug: 'emphasis-structures', weight: 4, re: /emphasis|cleft|do \+ v.*emphas/i },
  { slug: 'hedging-language', weight: 5, re: /hedging|it is likely|appear to|tend to/i },
  { slug: 'nominalisation', weight: 5, re: /nominalisation|nominalization|noun form of/i },
  { slug: 'grammatical-collocations', weight: 5, re: /collocation|adjective \+ preposition/i },
  { slug: 'have-got', weight: 5, re: /have got|has got|haven'?t got/i },
  { slug: 'wh-questions', weight: 4, re: /wh- ?question|what\/where\/when|who\/which/i },
  { slug: 'articles', weight: 3, re: /\b(a|an|the)\b.*article|mạo từ/i },
];

/** Topics that naturally share signals (don't flag cross within family as hard). */
const FAMILY: Record<string, string> = {
  'present-simple': 'tense-present',
  'present-continuous': 'tense-present',
  'present-perfect': 'tense-present',
  'present-perfect-continuous': 'tense-present',
  'past-simple': 'tense-past',
  'past-continuous': 'tense-past',
  'past-perfect': 'tense-past',
  'past-perfect-continuous': 'tense-past',
  'future-will': 'tense-future',
  'be-going-to': 'tense-future',
  'future-continuous': 'tense-future',
  'future-perfect': 'tense-future',
  'future-in-the-past': 'tense-future',
  'conditionals-0-1': 'conditional',
  'second-conditional': 'conditional',
  'third-conditional': 'conditional',
  'mixed-conditionals': 'conditional',
  'passive-voice': 'passive',
  'advanced-passive': 'passive',
  'relative-clauses': 'relative',
  'advanced-relative-clauses': 'relative',
  'modals-ability': 'modals',
  'modals-obligation': 'modals',
  'modals-advice': 'modals',
  'modals-permission': 'modals',
  'modals-deduction': 'modals',
  'modals-perfect': 'modals',
  'prepositions-time': 'prep',
  'prepositions-place': 'prep',
  'articles': 'determiners',
  'quantifiers': 'determiners',
  'countable-uncountable': 'determiners',
  'demonstratives': 'determiners',
  'personal-pronouns': 'pronouns',
  'possessives': 'pronouns',
};

function scoreText(text: string): Map<string, number> {
  const scores = new Map<string, number>();
  for (const sig of SIGNATURES) {
    if (sig.re.test(text)) {
      scores.set(sig.slug, (scores.get(sig.slug) || 0) + sig.weight);
    }
  }
  return scores;
}

function sameFamily(a: string, b: string): boolean {
  const fa = FAMILY[a];
  const fb = FAMILY[b];
  return !!fa && !!fb && fa === fb;
}

async function main(): Promise<void> {
  loadEnv();
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

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

  type Hit = {
    slug: string;
    idx: number;
    type: string;
    guessed: string;
    selfScore: number;
    otherScore: number;
    q: string;
    opts: string;
    ans: string;
  };

  const hardHits: Hit[] = []; // other clearly wins, different family
  const softHits: Hit[] = []; // other wins but same family or weaker

  // Also detect "meta filler" that is identical across topics (not content pollution but low quality)
  const metaRe =
    /^(chọn cấu trúc phù hợp nhất|điền tên cấu trúc\/chủ điểm|điều cần kiểm tra đầu tiên|chọn lời khuyên sai|có thể luôn dịch từng từ)/i;

  let total = 0;
  let metaCount = 0;
  const pollutionByLesson = new Map<string, { hard: number; soft: number; meta: number; n: number }>();

  for (const lesson of lessons ?? []) {
    const topic = topicById.get(lesson.topic_id);
    const slug = topic?.slug ?? '?';
    const xr = (Array.isArray(lesson.exercises) ? lesson.exercises : []) as Ex[];
    let hard = 0;
    let soft = 0;
    let meta = 0;

    for (let i = 0; i < xr.length; i++) {
      total++;
      const e = xr[i];
      const q = getQ(e);
      const opts = getOpts(e);
      const ans = getAns(e);
      const fb = getFb(e);
      const text = [q, opts.join(' '), String(ans ?? ''), fb].join(' \n ');

      if (metaRe.test(q.trim())) {
        meta++;
        metaCount++;
        continue;
      }

      // Skip pure "Chọn câu dùng đúng X" if X matches self topic title
      if (/^chọn câu dùng đúng/i.test(q) && q.toLowerCase().includes((topic?.title ?? '').toLowerCase().slice(0, 8))) {
        continue;
      }

      const scores = scoreText(text);
      const selfScore = scores.get(slug) || 0;

      let bestOther = { slug: '', score: 0 };
      for (const [s, sc] of scores) {
        if (s === slug) continue;
        if (sc > bestOther.score) bestOther = { slug: s, score: sc };
      }

      if (bestOther.score < 4) continue; // weak signal

      // Hard pollution: other topic score significantly higher than self
      if (bestOther.score >= selfScore + 4 && bestOther.score >= 5) {
        const hit: Hit = {
          slug,
          idx: i,
          type: String(e.type ?? ''),
          guessed: bestOther.slug,
          selfScore,
          otherScore: bestOther.score,
          q: q.slice(0, 120),
          opts: opts.map((o) => o.slice(0, 40)).join(' | ').slice(0, 140),
          ans: String(Array.isArray(ans) ? ans[0] : ans ?? '').slice(0, 60),
        };
        if (!sameFamily(slug, bestOther.slug)) {
          hard++;
          hardHits.push(hit);
        } else {
          soft++;
          softHits.push(hit);
        }
      } else if (bestOther.score >= 6 && selfScore === 0) {
        hard++;
        hardHits.push({
          slug,
          idx: i,
          type: String(e.type ?? ''),
          guessed: bestOther.slug,
          selfScore,
          otherScore: bestOther.score,
          q: q.slice(0, 120),
          opts: opts.map((o) => o.slice(0, 40)).join(' | ').slice(0, 140),
          ans: String(Array.isArray(ans) ? ans[0] : ans ?? '').slice(0, 60),
        });
      }
    }

    pollutionByLesson.set(slug, { hard, soft, meta, n: xr.length });
  }

  log('=== TOPIC POLLUTION AUDIT ===');
  log(`total exercises: ${total}`);
  log(`meta/boilerplate skipped: ${metaCount}`);
  log(`HARD cross-topic (khác family): ${hardHits.length}`);
  log(`SOFT cross-topic (cùng family): ${softHits.length}`);

  log('');
  log('=== LESSONS SORTED BY HARD POLLUTION ===');
  const ranked = [...pollutionByLesson.entries()]
    .map(([slug, v]) => ({ slug, ...v }))
    .sort((a, b) => b.hard - a.hard || b.soft - a.soft);
  log(
    'slug'.padEnd(34) +
      'n'.padStart(4) +
      ' hard'.padStart(6) +
      ' soft'.padStart(6) +
      ' meta'.padStart(6) +
      '  %hard',
  );
  for (const r of ranked) {
    const pct = r.n ? Math.round((100 * r.hard) / r.n) : 0;
    if (r.hard === 0 && r.soft === 0 && r.meta < 3) continue;
    log(
      `${r.slug.padEnd(34)}${String(r.n).padStart(4)}${String(r.hard).padStart(6)}${String(r.soft).padStart(6)}${String(r.meta).padStart(6)}  ${pct}%`,
    );
  }

  // Group hard hits by source → guessed
  log('');
  log('=== HARD POLLUTION MATRIX (source → guessed count) ===');
  const matrix = new Map<string, Map<string, number>>();
  for (const h of hardHits) {
    if (!matrix.has(h.slug)) matrix.set(h.slug, new Map());
    const m = matrix.get(h.slug)!;
    m.set(h.guessed, (m.get(h.guessed) || 0) + 1);
  }
  for (const [src, m] of [...matrix.entries()].sort((a, b) => {
    const sa = [...a[1].values()].reduce((x, y) => x + y, 0);
    const sb = [...b[1].values()].reduce((x, y) => x + y, 0);
    return sb - sa;
  })) {
    const parts = [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([g, n]) => `${g}×${n}`);
    log(`  ${src} → ${parts.join(', ')}`);
  }

  log('');
  log('=== HARD HITS DETAIL (first 120) ===');
  // group by slug
  const bySlug = new Map<string, Hit[]>();
  for (const h of hardHits) {
    if (!bySlug.has(h.slug)) bySlug.set(h.slug, []);
    bySlug.get(h.slug)!.push(h);
  }
  let shown = 0;
  for (const [slug, hits] of [...bySlug.entries()].sort((a, b) => b[1].length - a[1].length)) {
    log(`\n## ${slug} (${hits.length} hard)`);
    for (const h of hits.slice(0, 12)) {
      log(
        `  #${h.idx} [${h.type}] → ${h.guessed} (self=${h.selfScore} other=${h.otherScore})\n    Q: ${h.q}\n    opts: ${h.opts}\n    ans: ${h.ans}`,
      );
      shown++;
      if (shown >= 120) break;
    }
    if (hits.length > 12) log(`  ... +${hits.length - 12} more in this lesson`);
    if (shown >= 120) {
      log(`\n... truncated detail at 120`);
      break;
    }
  }

  // Special: dump indices of hard pollution for each lesson as JSON for fix script later
  const fixMap: Record<string, { idx: number; guessed: string; q: string }[]> = {};
  for (const h of hardHits) {
    if (!fixMap[h.slug]) fixMap[h.slug] = [];
    fixMap[h.slug].push({ idx: h.idx, guessed: h.guessed, q: h.q });
  }

  const outDir = path.join(process.cwd(), 'tmp');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'grammar-topic-pollution.md'), lines.join('\n'), 'utf8');
  writeFileSync(
    path.join(outDir, 'grammar-topic-pollution.json'),
    JSON.stringify(
      {
        summary: {
          total,
          metaCount,
          hard: hardHits.length,
          soft: softHits.length,
        },
        ranked,
        fixMap,
        hardHits,
        softHits: softHits.slice(0, 200),
      },
      null,
      2,
    ),
    'utf8',
  );
  log(`\n[audit] wrote tmp/grammar-topic-pollution.md + .json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
