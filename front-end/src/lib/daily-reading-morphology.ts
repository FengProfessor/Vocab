/**
 * Morphological Lemmatizer & Inflection Matcher for Daily Reading.
 *
 * Shared between client components and backend generator/scripts.
 * Zero external dependencies (pure TypeScript).
 */

export interface WordItem {
  word: string;
  translation: string;
  pos?: string;
  definition_en?: string;
}

// ── Known Irregular Forms Map (Past / Participle -> Lemma) ──
const IRREGULAR_VERBS: Record<string, string> = {
  underwent: 'undergo',
  undergone: 'undergo',
  went: 'go',
  gone: 'go',
  ran: 'run',
  came: 'come',
  became: 'become',
  overcame: 'overcome',
  saw: 'see',
  seen: 'see',
  gave: 'give',
  given: 'give',
  took: 'take',
  taken: 'take',
  made: 'make',
  knew: 'know',
  known: 'know',
  thought: 'think',
  bought: 'buy',
  brought: 'bring',
  caught: 'catch',
  taught: 'teach',
  fought: 'fight',
  sought: 'seek',
  found: 'find',
  held: 'hold',
  told: 'tell',
  sold: 'sell',
  lost: 'lose',
  won: 'win',
  met: 'meet',
  led: 'lead',
  spoke: 'speak',
  spoken: 'speak',
  broke: 'break',
  broken: 'break',
  chose: 'choose',
  chosen: 'choose',
  froze: 'freeze',
  frozen: 'freeze',
  wore: 'wear',
  worn: 'wear',
  bore: 'bear',
  borne: 'bear',
  tore: 'tear',
  torn: 'tear',
  wrote: 'write',
  written: 'write',
  drove: 'drive',
  driven: 'drive',
  rode: 'ride',
  ridden: 'ride',
  rose: 'rise',
  risen: 'rise',
  arose: 'arise',
  arisen: 'arise',
  fell: 'fall',
  fallen: 'fall',
  drew: 'draw',
  drawn: 'draw',
  flew: 'fly',
  flown: 'fly',
  grew: 'grow',
  grown: 'grow',
  threw: 'throw',
  thrown: 'throw',
  blew: 'blow',
  blown: 'blow',
  shook: 'shake',
  shaken: 'shake',
  stood: 'stand',
  understood: 'understand',
  began: 'begin',
  begun: 'begin',
  swam: 'swim',
  swum: 'swim',
  drank: 'drink',
  drunk: 'drink',
  sang: 'sing',
  sung: 'sing',
  rang: 'ring',
  rung: 'ring',
  sank: 'sink',
  sunk: 'sink',
  shrank: 'shrink',
  shrunk: 'shrink',
  struck: 'strike',
  stricken: 'strike',
  spun: 'spin',
  hung: 'hang',
  swung: 'swing',
  slid: 'slide',
  dug: 'dig',
  stuck: 'stick',
  spent: 'spend',
  lent: 'lend',
  sent: 'send',
  built: 'build',
  burnt: 'burn',
  learnt: 'learn',
  meant: 'mean',
  slept: 'sleep',
  swept: 'sweep',
  kept: 'keep',
  wept: 'weep',
  crept: 'creep',
  felt: 'feel',
  dealt: 'deal',
  spelt: 'spell',
  knelt: 'kneel',
  left: 'leave',
  laid: 'lay',
  paid: 'pay',
  said: 'say',
  heard: 'hear',
  done: 'do',
  did: 'do',
  been: 'be',
  was: 'be',
  were: 'be',
  had: 'have',
  got: 'get',
  gotten: 'get',
  forgot: 'forget',
  forgotten: 'forget',
  shone: 'shine',
  shot: 'shoot',
};

// ── Known Irregular / Academic Plurals -> Lemma ──
const IRREGULAR_NOUNS: Record<string, string> = {
  analyses: 'analysis',
  hypotheses: 'hypothesis',
  theses: 'thesis',
  crises: 'crisis',
  diagnoses: 'diagnosis',
  syntheses: 'synthesis',
  parentheses: 'parenthesis',
  criteria: 'criterion',
  phenomena: 'phenomenon',
  curricula: 'curriculum',
  bacteria: 'bacterium',
  data: 'datum',
  media: 'medium',
  strata: 'stratum',
  indices: 'index',
  matrices: 'matrix',
  appendices: 'appendix',
  foci: 'focus',
  stimuli: 'stimulus',
  radii: 'radius',
  syllabi: 'syllabus',
  children: 'child',
  people: 'person',
  men: 'man',
  women: 'woman',
  teeth: 'tooth',
  feet: 'foot',
  mice: 'mouse',
  lice: 'louse',
  geese: 'goose',
  oxen: 'ox',
};

/**
 * Generate potential base lemma candidates for an English word.
 */
export function getLemmaCandidates(word: string): string[] {
  const clean = word.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '').trim();
  if (!clean) return [];

  const candidates = new Set<string>();
  candidates.add(clean);

  // 1. Direct irregular lookups
  if (IRREGULAR_VERBS[clean]) candidates.add(IRREGULAR_VERBS[clean]);
  if (IRREGULAR_NOUNS[clean]) candidates.add(IRREGULAR_NOUNS[clean]);

  // 2. Plurals
  if (clean.endsWith('ies') && clean.length > 4) {
    candidates.add(clean.slice(0, -3) + 'y');
  }
  if (clean.endsWith('ves') && clean.length > 4) {
    candidates.add(clean.slice(0, -3) + 'f');
    candidates.add(clean.slice(0, -3) + 'fe');
  }
  if (clean.endsWith('es') && clean.length > 3) {
    candidates.add(clean.slice(0, -2));
    candidates.add(clean.slice(0, -1));
  }
  if (clean.endsWith('s') && !clean.endsWith('ss') && clean.length > 2) {
    candidates.add(clean.slice(0, -1)); // vehicles -> vehicle
  }

  // 3. Past / Participle
  if (clean.endsWith('ied') && clean.length > 4) {
    candidates.add(clean.slice(0, -3) + 'y');
  }
  if (clean.endsWith('ed') && clean.length > 3) {
    candidates.add(clean.slice(0, -2)); // walked -> walk
    candidates.add(clean.slice(0, -1)); // splurged -> splurge
    if (clean.length > 4 && clean[clean.length - 3] === clean[clean.length - 4]) {
      candidates.add(clean.slice(0, -3)); // stopped -> stop, planned -> plan
    }
  }

  // 4. Gerund / Participle
  if (clean.endsWith('ing') && clean.length > 4) {
    candidates.add(clean.slice(0, -3)); // walking -> walk
    candidates.add(clean.slice(0, -3) + 'e'); // accelerating -> accelerate
    if (clean.length > 5 && clean[clean.length - 4] === clean[clean.length - 5]) {
      candidates.add(clean.slice(0, -4)); // running -> run
    }
  }

  // 5. Adverbs
  if (clean.endsWith('ly') && clean.length > 3) {
    candidates.add(clean.slice(0, -2)); // quickly -> quick
    if (clean.endsWith('ily')) {
      candidates.add(clean.slice(0, -3) + 'y'); // happily -> happy
    }
  }

  // 6. Comparatives & Superlatives
  if (clean.endsWith('ier') && clean.length > 4) {
    candidates.add(clean.slice(0, -3) + 'y'); // easier -> easy
  }
  if (clean.endsWith('iest') && clean.length > 5) {
    candidates.add(clean.slice(0, -4) + 'y'); // easiest -> easy
  }
  if (clean.endsWith('er') && clean.length > 3) {
    candidates.add(clean.slice(0, -2)); // faster -> fast
    candidates.add(clean.slice(0, -1)); // larger -> large
  }
  if (clean.endsWith('est') && clean.length > 4) {
    candidates.add(clean.slice(0, -3)); // fastest -> fast
    candidates.add(clean.slice(0, -2)); // largest -> large
  }

  return Array.from(candidates);
}

/**
 * Match a raw passage word (including inflected forms and collocations) against a list of vocabulary items.
 */
export function findMatchingSourceWord(
  rawWord: string,
  sourceWords: WordItem[],
  bonusWords?: WordItem[],
): { word: string; translation: string; pos?: string } | null {
  if (!rawWord) return null;
  const pool = [...(sourceWords || []), ...(bonusWords || [])];
  if (pool.length === 0) return null;

  const clean = rawWord.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '').trim();
  if (!clean) return null;

  // 1. Direct exact match
  const direct = pool.find((w) => w.word.toLowerCase().trim() === clean);
  if (direct) return direct;

  // 2. Candidate lemmas from English morphology & irregular tables
  const candidates = getLemmaCandidates(clean);
  for (const cand of candidates) {
    const hit = pool.find((w) => w.word.toLowerCase().trim() === cand);
    if (hit) return hit;
  }

  // 3. Multi-word phrase & collocation matching
  // (e.g. passage has "trajectories", target pool has "upward trajectory"; or passage has "bore", pool has "bear something in mind")
  for (const item of pool) {
    const itemWord = item.word.toLowerCase().trim();
    if (itemWord.includes(' ') || itemWord.includes('-')) {
      const parts = itemWord.split(/[\s-]+/).map((p) => p.replace(/^[^\w]+|[^\w]+$/g, '').trim()).filter(Boolean);
      // Check if clicked word matches any token in the phrase, or if its candidates match any token
      for (const p of parts) {
        if (p.length >= 3) {
          if (p === clean || candidates.includes(p)) return item;
          const pCandidates = getLemmaCandidates(p);
          if (pCandidates.includes(clean)) return item;
        }
      }
    }
  }

  // 4. Substring / Stem prefix matching
  for (const item of pool) {
    const base = item.word.toLowerCase().trim();
    if (base.length >= 3 && !base.includes(' ')) {
      if (clean.startsWith(base)) return item;
      if (base.endsWith('e') && clean.startsWith(base.slice(0, -1))) return item;
      if (base.startsWith(clean) && clean.length >= 4) return item;
    }
  }

  return null;
}
