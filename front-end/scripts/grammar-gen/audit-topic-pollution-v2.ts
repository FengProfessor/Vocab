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

// Improved Signatures to avoid false positives
const SIGNATURES: { slug: string; weight: number; re: RegExp }[] = [
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
  { slug: 'advanced-passive', weight: 5, re: /it is (said|believed|reported|rumored|thought) to|advanced passive/i },
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
  { slug: 'subjunctive', weight: 5, re: /subjunctive|insist that|essential that|vital that|important that|imperative that/i },
  { slug: 'causative', weight: 5, re: /causative|have .+ done|get .+ to/i },
  { slug: 'inversion', weight: 5, re: /inversion|never have i|not only|hardly had|seldom/i },
  { slug: 'cleft-sentences', weight: 5, re: /\bcleft\b|it is \w+ who|it was \w+ who|it is \w+ that|it was \w+ that|what .* is/i },
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
];

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
  'emphasis-structures': 'emphasis-inversion',
  'inversion': 'emphasis-inversion',
  'subjunctive': 'subjunctive-wish',
  'wish-if-only': 'subjunctive-wish'
};

const getQ = (e: Ex) => String(e.question ?? e.q ?? '');
const getOpts = (e: Ex) => {
  const o = e.options ?? e.opts;
  return Array.isArray(o) ? o.map(String) : [];
};
const getAns = (e: Ex) => e.correct_answer !== undefined ? e.correct_answer : e.answer;
const getFb = (e: Ex) => String(e.explanation ?? e.fb ?? '');

function sameFamily(a: string, b: string): boolean {
  const fa = FAMILY[a];
  const fb = FAMILY[b];
  return !!fa && !!fb && fa === fb;
}

function scoreText(text: string): Map<string, number> {
  const scores = new Map<string, number>();
  for (const sig of SIGNATURES) {
    if (sig.re.test(text)) {
      scores.set(sig.slug, (scores.get(sig.slug) || 0) + sig.weight);
    }
  }
  return scores;
}

async function main(): Promise<void> {
  loadEnv();
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: topics, error: te } = await client.from('grammar_topics').select('id, slug');
  if (te) throw te;
  const { data: lessons, error: le } = await client.from('grammar_lessons').select('id, topic_id, exercises');
  if (le) throw le;

  const topicById = new Map(topics.map((t) => [t.id, t]));
  const hardHits: any[] = [];
  const softHits: any[] = [];

  let total = 0;

  for (const lesson of lessons) {
    const topic = topicById.get(lesson.topic_id);
    const slug = topic?.slug ?? '?';
    const xr = (Array.isArray(lesson.exercises) ? lesson.exercises : []) as Ex[];

    for (let i = 0; i < xr.length; i++) {
      total++;
      const e = xr[i];
      const q = getQ(e);
      const opts = getOpts(e);
      const ans = getAns(e);
      const fb = getFb(e);
      const text = [q, opts.join(' '), String(ans ?? ''), fb].join(' \n ');

      // Filter false positives in cleft-sentences that are reporting passives
      if (slug === 'advanced-passive' && /It is (believed|said|reported|thought|expected)/i.test(q)) {
        continue;
      }
      // Filter false positives in subjunctive that contain 'It is vital/important/imperative'
      if (slug === 'subjunctive' && /It is (vital|important|imperative|essential|crucial)/i.test(q)) {
        continue;
      }
      // Filter false positives in hedging-language that contain 'It is likely'
      if (slug === 'hedging-language' && /It is likely/i.test(q)) {
        continue;
      }

      const scores = scoreText(text);
      const selfScore = scores.get(slug) || 0;

      let bestOther = { slug: '', score: 0 };
      for (const [s, sc] of scores) {
        if (s === slug) continue;
        if (sc > bestOther.score) bestOther = { slug: s, score: sc };
      }

      if (bestOther.score >= 4) {
        if (bestOther.score >= selfScore + 4 && bestOther.score >= 5) {
          if (!sameFamily(slug, bestOther.slug)) {
            hardHits.push({ slug, idx: i, q, guessed: bestOther.slug });
          } else {
            softHits.push({ slug, idx: i, q, guessed: bestOther.slug });
          }
        } else if (bestOther.score >= 6 && selfScore === 0) {
          if (!sameFamily(slug, bestOther.slug)) {
            hardHits.push({ slug, idx: i, q, guessed: bestOther.slug });
          } else {
            softHits.push({ slug, idx: i, q, guessed: bestOther.slug });
          }
        }
      }
    }
  }

  const results = {
    summary: {
      total,
      hard: hardHits.length,
      soft: softHits.length
    },
    hardHits,
    softHits
  };

  writeFileSync(path.join(process.cwd(), 'tmp', 'grammar-upgrade-final.json'), JSON.stringify(results, null, 2), 'utf8');
  console.log(`Final V2 Audit results: total=${total}, hard=${hardHits.length}, soft=${softHits.length}`);
}

main().catch(console.error);
