/**
 * Adaptive Leveling Engine for Daily Reading Generator.
 *
 * Requirements:
 * - A1–A2 (Cơ bản): 100–150 từ, văn phong đời thường, câu đơn/ghép dễ hiểu, câu hỏi chi tiết trực tiếp.
 * - B1–B2 (Trung cấp): 180–230 từ, ngữ pháp đa dạng, câu hỏi suy luận nhẹ.
 * - C1–C2 (Nâng cao/Academic): 250–350 từ, văn phong bài báo/tiểu luận chuyên sâu (mini-article),
 *   câu hỏi suy luận/ngữ cảnh chuyên sâu. Chỉ cần 3–5 từ nâng cao là đủ để sinh bài đọc tự nhiên, chuẩn mực.
 *
 * Threshold:
 * - Tối thiểu 3 từ đối với từ nâng cao (B2–C1).
 * - Tối thiểu 5 từ đối với từ cơ bản (A1–B1).
 */

import * as fs from 'fs';
import * as path from 'path';

export type CefrTier = 'A1_A2' | 'B1_B2' | 'C1_C2';

export interface AdaptiveLevelConfig {
  tier: CefrTier;
  cefr: 'A2' | 'B1' | 'B2' | 'C1';
  labelVi: string;
  labelEn: string;
  minWords: number;
  maxWords: number;
  minThreshold: number; // 3 for B2-C1, 5 for A1-B1
  paragraphs: string;
  complexity: string;
  passageGuidelines: string;
  questionGuidelines: string;
  clozeBlanksCount: number;
  numQuestions: number;
}

let c1WordsCache: Set<string> | null = null;
let b2WordsCache: Set<string> | null = null;
let b1WordsCache: Set<string> | null = null;

// Common A1-A2 words to never misclassify as advanced
const COMMON_BASIC_WORDS = new Set([
  'a', 'about', 'above', 'across', 'act', 'active', 'activity', 'add', 'afraid', 'after',
  'again', 'age', 'ago', 'agree', 'air', 'all', 'almost', 'alone', 'along', 'already',
  'also', 'always', 'am', 'among', 'an', 'and', 'animal', 'another', 'answer', 'any',
  'anyone', 'anything', 'appear', 'apple', 'area', 'arm', 'around', 'arrive', 'art',
  'as', 'ask', 'at', 'baby', 'back', 'bad', 'bag', 'ball', 'bank', 'base', 'be', 'bear',
  'beat', 'beautiful', 'because', 'become', 'bed', 'before', 'begin', 'behind', 'believe',
  'bell', 'best', 'better', 'between', 'big', 'bird', 'birth', 'bit', 'black', 'block',
  'blood', 'blow', 'blue', 'board', 'boat', 'body', 'bone', 'book', 'born', 'both',
  'bottom', 'box', 'boy', 'branch', 'bread', 'break', 'bright', 'bring', 'brother',
  'brown', 'build', 'burn', 'busy', 'but', 'buy', 'by', 'call', 'can', 'cannot', 'car',
  'care', 'carry', 'case', 'cat', 'catch', 'cause', 'center', 'chair', 'chance', 'change',
  'charge', 'check', 'child', 'children', 'choose', 'church', 'circle', 'city', 'class',
  'clean', 'clear', 'climb', 'clock', 'close', 'cloth', 'clothes', 'cloud', 'cold',
  'color', 'come', 'common', 'company', 'compare', 'complete', 'cook', 'cool', 'copy',
  'corner', 'cost', 'cotton', 'could', 'count', 'country', 'course', 'cover', 'cow',
  'cross', 'cry', 'cup', 'cut', 'dad', 'dance', 'dark', 'day', 'dead', 'deal', 'dear',
  'death', 'decide', 'deep', 'desk', 'did', 'die', 'different', 'difficult', 'dinner',
  'direct', 'direction', 'do', 'doctor', 'does', 'dog', 'dollar', 'done', 'door', 'double',
  'down', 'draw', 'dream', 'dress', 'drink', 'drive', 'drop', 'dry', 'duck', 'during',
  'each', 'ear', 'early', 'earth', 'east', 'easy', 'eat', 'egg', 'eight', 'either', 'else',
  'end', 'enemy', 'enjoy', 'enough', 'enter', 'even', 'evening', 'event', 'ever', 'every',
  'everyone', 'everything', 'example', 'except', 'eye', 'face', 'fact', 'fall', 'family',
  'famous', 'far', 'farm', 'farmer', 'fast', 'fat', 'father', 'fear', 'feed', 'feel',
  'feeling', 'feet', 'fell', 'felt', 'few', 'field', 'fight', 'figure', 'fill', 'final',
  'find', 'fine', 'finger', 'finish', 'fire', 'first', 'fish', 'fit', 'five', 'flat',
  'floor', 'flower', 'fly', 'follow', 'food', 'foot', 'for', 'force', 'forest', 'forget',
  'form', 'forward', 'found', 'four', 'free', 'fresh', 'friend', 'friendly', 'from',
  'front', 'full', 'fun', 'game', 'garden', 'gas', 'gather', 'gave', 'general', 'get',
  'girl', 'give', 'glad', 'glass', 'go', 'gold', 'gone', 'good', 'got', 'govern',
  'government', 'grass', 'gray', 'great', 'green', 'grew', 'ground', 'group', 'grow',
  'guess', 'guide', 'gun', 'hair', 'half', 'hall', 'hand', 'happen', 'happy', 'hard',
  'has', 'hat', 'have', 'he', 'head', 'hear', 'heard', 'heart', 'heat', 'heavy', 'held',
  'help', 'her', 'here', 'herself', 'high', 'hill', 'him', 'himself', 'his', 'history',
  'hit', 'hold', 'hole', 'home', 'hope', 'horse', 'hot', 'hour', 'house', 'how', 'huge',
  'human', 'hundred', 'hungry', 'hunt', 'hurry', 'hurt', 'husband', 'i', 'ice', 'idea',
  'if', 'ill', 'image', 'imagine', 'important', 'in', 'inch', 'include', 'indicate',
  'industry', 'information', 'insect', 'inside', 'instead', 'interest', 'into', 'iron',
  'is', 'island', 'issue', 'it', 'its', 'itself', 'job', 'join', 'joy', 'jump', 'just',
  'keep', 'kept', 'key', 'kill', 'kind', 'king', 'knew', 'knife', 'know', 'knowledge',
  'land', 'language', 'large', 'last', 'late', 'later', 'laugh', 'law', 'lay', 'lead',
  'leader', 'learn', 'least', 'leave', 'left', 'leg', 'length', 'less', 'lesson', 'let',
  'letter', 'level', 'lie', 'life', 'lift', 'light', 'like', 'line', 'lion', 'lip', 'list',
  'listen', 'little', 'live', 'local', 'long', 'look', 'lose', 'lost', 'lot', 'loud',
  'love', 'low', 'machine', 'made', 'main', 'major', 'make', 'man', 'many', 'map', 'mark',
  'market', 'marry', 'match', 'matter', 'may', 'maybe', 'me', 'mean', 'measure', 'meat',
  'meet', 'member', 'men', 'middle', 'might', 'mile', 'milk', 'million', 'mind', 'minute',
  'miss', 'modern', 'moment', 'money', 'month', 'moon', 'more', 'morning', 'most', 'mother',
  'motion', 'mountain', 'mouth', 'move', 'much', 'music', 'must', 'my', 'myself', 'name',
  'nation', 'national', 'natural', 'nature', 'near', 'nearly', 'necessary', 'neck', 'need',
  'neighbor', 'neither', 'nerve', 'never', 'new', 'news', 'next', 'nice', 'night', 'nine',
  'no', 'none', 'noon', 'nor', 'north', 'nose', 'not', 'note', 'nothing', 'notice', 'now',
  'number', 'ocean', 'of', 'off', 'offer', 'office', 'officer', 'often', 'oil', 'old',
  'on', 'once', 'one', 'only', 'open', 'operate', 'opinion', 'or', 'order', 'original',
  'other', 'our', 'out', 'outside', 'over', 'own', 'page', 'paid', 'pain', 'paint', 'pair',
  'paper', 'paragraph', 'park', 'part', 'party', 'pass', 'past', 'path', 'pay', 'peace',
  'pen', 'pencil', 'people', 'per', 'percent', 'perfect', 'period', 'person', 'personal',
  'picture', 'piece', 'place', 'plain', 'plan', 'plane', 'plant', 'plastic', 'plate',
  'play', 'pleasant', 'please', 'plenty', 'plural', 'pocket', 'point', 'poison', 'police',
  'polite', 'pool', 'poor', 'popular', 'population', 'position', 'possible', 'post',
  'pot', 'potato', 'pound', 'pour', 'powder', 'power', 'powerful', 'practice', 'prepare',
  'present', 'president', 'press', 'pretty', 'price', 'pride', 'primitive', 'principal',
  'principle', 'print', 'prison', 'private', 'prize', 'probable', 'problem', 'process',
  'produce', 'product', 'program', 'progress', 'promise', 'proper', 'property', 'protect',
  'proud', 'prove', 'provide', 'public', 'pull', 'pure', 'purpose', 'push', 'put', 'quart',
  'queen', 'question', 'quick', 'quiet', 'quite', 'rabbit', 'race', 'radio', 'railroad',
  'rain', 'raise', 'ran', 'ranch', 'range', 'rapid', 'rare', 'rate', 'rather', 'raw',
  'ray', 'reach', 'read', 'ready', 'real', 'reason', 'receive', 'record', 'red', 'refuse',
  'region', 'regular', 'relative', 'remain', 'remember', 'repeat', 'reply', 'report',
  'represent', 'require', 'rest', 'result', 'return', 'rich', 'ride', 'right', 'ring',
  'rise', 'river', 'road', 'rock', 'roll', 'roof', 'room', 'root', 'rope', 'rose', 'round',
  'row', 'rub', 'rubber', 'rule', 'ruler', 'run', 'safe', 'said', 'sail', 'same', 'sand',
  'sat', 'save', 'saw', 'say', 'scale', 'school', 'science', 'score', 'sea', 'search',
  'season', 'seat', 'second', 'secret', 'section', 'see', 'seed', 'seem', 'seen', 'seldom',
  'select', 'self', 'sell', 'send', 'sense', 'sent', 'sentence', 'separate', 'serve',
  'service', 'set', 'settle', 'seven', 'several', 'shall', 'shape', 'share', 'sharp',
  'she', 'sheep', 'sheet', 'shelf', 'shine', 'ship', 'shirt', 'shoe', 'shoot', 'shop',
  'shore', 'short', 'should', 'shoulder', 'shout', 'show', 'shut', 'sick', 'side', 'sight',
  'sign', 'signal', 'silent', 'silk', 'silly', 'silver', 'similar', 'simple', 'since',
  'sing', 'single', 'sister', 'sit', 'six', 'size', 'skill', 'skin', 'skirt', 'sky',
  'slave', 'sleep', 'slip', 'slow', 'small', 'smell', 'smile', 'smoke', 'smooth', 'snake',
  'snow', 'so', 'soap', 'social', 'society', 'soft', 'soil', 'soldier', 'solid', 'some',
  'somebody', 'somehow', 'someone', 'something', 'sometimes', 'somewhere', 'son', 'song',
  'soon', 'sore', 'sorry', 'sort', 'soul', 'sound', 'soup', 'south', 'space', 'speak',
  'special', 'speed', 'spell', 'spend', 'spent', 'spin', 'spirit', 'spite', 'split',
  'spoken', 'spot', 'spread', 'spring', 'square', 'stage', 'stair', 'stand', 'standard',
  'star', 'stare', 'start', 'state', 'station', 'stay', 'steady', 'steam', 'steel', 'step',
  'stick', 'still', 'stomach', 'stone', 'stood', 'stop', 'store', 'storm', 'story',
  'straight', 'strange', 'stranger', 'stream', 'street', 'strength', 'stretch', 'strike',
  'string', 'strip', 'strong', 'student', 'study', 'stuff', 'subject', 'substance',
  'success', 'successful', 'such', 'sudden', 'suffer', 'sugar', 'suggest', 'suit', 'summer',
  'sun', 'supper', 'supply', 'support', 'suppose', 'sure', 'surface', 'surprise', 'sweet',
  'swim', 'system', 'table', 'tail', 'take', 'talk', 'tall', 'taste', 'tax', 'tea',
  'teach', 'teacher', 'team', 'tear', 'teeth', 'telephone', 'tell', 'temperature', 'ten',
  'term', 'test', 'than', 'thank', 'that', 'the', 'their', 'them', 'themselves', 'then',
  'theory', 'there', 'therefore', 'these', 'they', 'thick', 'thin', 'thing', 'think',
  'third', 'this', 'those', 'though', 'thought', 'thousand', 'thread', 'three', 'through',
  'throw', 'thrown', 'thumb', 'thus', 'ticket', 'tide', 'tie', 'tight', 'till', 'time',
  'tin', 'tiny', 'tip', 'tire', 'tired', 'title', 'to', 'tobacco', 'today', 'together',
  'told', 'tomorrow', 'tone', 'tongue', 'tonight', 'too', 'took', 'tool', 'tooth', 'top',
  'total', 'touch', 'toward', 'towards', 'tower', 'town', 'toy', 'track', 'trade', 'traffic',
  'train', 'transportation', 'travel', 'treat', 'tree', 'triangle', 'trip', 'trouble',
  'truck', 'true', 'trust', 'truth', 'try', 'tube', 'turn', 'twelve', 'twenty', 'twice',
  'two', 'type', 'uncle', 'under', 'understand', 'unit', 'until', 'up', 'upon', 'us',
  'use', 'usual', 'valley', 'valuable', 'value', 'variety', 'various', 'vegetable',
  'verb', 'very', 'vessel', 'victory', 'view', 'village', 'visit', 'voice', 'volume',
  'vote', 'vowel', 'voyage', 'wait', 'walk', 'wall', 'want', 'war', 'warm', 'warn',
  'was', 'wash', 'waste', 'watch', 'water', 'wave', 'way', 'we', 'weak', 'wear', 'weather',
  'week', 'weight', 'welcome', 'well', 'went', 'were', 'west', 'western', 'wet', 'what',
  'whatever', 'wheel', 'when', 'whenever', 'where', 'whether', 'which', 'while', 'whisper',
  'whistle', 'white', 'who', 'whole', 'whom', 'whose', 'why', 'wide', 'wife', 'wild',
  'will', 'win', 'wind', 'window', 'wing', 'winter', 'wire', 'wise', 'wish', 'with',
  'within', 'without', 'woman', 'women', 'wonder', 'wood', 'wooden', 'wool', 'word',
  'work', 'worker', 'world', 'worry', 'worse', 'worst', 'worth', 'would', 'wound',
  'write', 'writer', 'wrong', 'wrote', 'yard', 'year', 'yellow', 'yes', 'yesterday',
  'yet', 'you', 'young', 'your', 'yourself'
]);

function loadWordLists(): { c1Set: Set<string>; b2Set: Set<string>; b1Set: Set<string> } {
  if (c1WordsCache && b2WordsCache && b1WordsCache) {
    return { c1Set: c1WordsCache, b2Set: b2WordsCache, b1Set: b1WordsCache };
  }

  const c1Set = new Set<string>();
  const b2Set = new Set<string>();
  const b1Set = new Set<string>();

  const possiblePaths = [
    path.resolve(process.cwd(), 'scripts/lists'),
    path.resolve(process.cwd(), '../scripts/lists'),
  ];
  const listDir = possiblePaths.find((p) => fs.existsSync(p));

  if (listDir) {
    // 1. Intermediate B1 / KET-PET lists (load first to guard against misclassification in C1 lists)
    const petFile = path.join(listDir, 'cambridge-ket-pet.txt');
    if (fs.existsSync(petFile)) {
      try {
        const content = fs.readFileSync(petFile, 'utf8');
        const tokens = content.split(/[\r\n,;]+/).map((t) => t.trim().toLowerCase());
        for (const tok of tokens) {
          if (tok && tok.length > 2 && !tok.startsWith('#') && !COMMON_BASIC_WORDS.has(tok)) {
            b1Set.add(tok);
          }
        }
      } catch {}
    }

    // 2. Cambridge C1 Advanced & Academic lists (exclude common basic and KET-PET words)
    const c1Files = [
      'cambridge-c1-advanced.txt',
      'academic-word-list.txt',
      'ielts-band7-8.txt',
      'ielts-advanced-band7.txt',
    ];
    for (const f of c1Files) {
      const full = path.join(listDir, f);
      if (fs.existsSync(full)) {
        try {
          const content = fs.readFileSync(full, 'utf8');
          const tokens = content.split(/[\r\n,;]+/).map((t) => t.trim().toLowerCase());
          for (const tok of tokens) {
            if (
              tok &&
              tok.length > 2 &&
              !tok.startsWith('#') &&
              !COMMON_BASIC_WORDS.has(tok) &&
              !b1Set.has(tok)
            ) {
              c1Set.add(tok);
            }
          }
        } catch {}
      }
    }

    // 3. Oxford 5000 B2-C1
    const b2Files = ['oxford-5000-b2c1.txt'];
    for (const f of b2Files) {
      const full = path.join(listDir, f);
      if (fs.existsSync(full)) {
        try {
          const content = fs.readFileSync(full, 'utf8');
          const tokens = content.split(/[\r\n,;]+/).map((t) => t.trim().toLowerCase());
          for (const tok of tokens) {
            if (
              tok &&
              tok.length > 2 &&
              !tok.startsWith('#') &&
              !COMMON_BASIC_WORDS.has(tok) &&
              !c1Set.has(tok)
            ) {
              b2Set.add(tok);
            }
          }
        } catch {}
      }
    }

    // 4. Additional Intermediate B1 lists
    const b1Files = ['vstep-b1-b2.txt'];
    for (const f of b1Files) {
      const full = path.join(listDir, f);
      if (fs.existsSync(full)) {
        try {
          const content = fs.readFileSync(full, 'utf8');
          const tokens = content.split(/[\r\n,;]+/).map((t) => t.trim().toLowerCase());
          for (const tok of tokens) {
            if (
              tok &&
              tok.length > 2 &&
              !tok.startsWith('#') &&
              !COMMON_BASIC_WORDS.has(tok) &&
              !c1Set.has(tok) &&
              !b2Set.has(tok)
            ) {
              b1Set.add(tok);
            }
          }
        } catch {}
      }
    }
  }

  // Hardcoded curated C1 words
  const coreC1 = [
    'paradigm', 'consensus', 'ambiguous', 'epiphany', 'resilience', 'meticulous',
    'ubiquitous', 'inevitable', 'scrutinize', 'advocate', 'downturn', 'prospector',
    'immense', 'intertwine', 'statehood', 'amendment', 'admission', 'consolation',
    'splurge', 'phenomenon', 'hypothesis', 'comprehensive', 'preliminary', 'arbitrary',
    'coherent', 'prevalent', 'predominant', 'deteriorate', 'exacerbate', 'mitigate',
    'disseminate', 'feasibility', 'adversity', 'tectonic', 'formative assessment'
  ];
  for (const w of coreC1) c1Set.add(w);

  // Hardcoded curated B2 words
  const coreB2 = [
    'sustainable', 'significant', 'soar', 'sacred', 'stem', 'distinction',
    'efficiently', 'critically', 'challenging', 'championship', 'democracy',
    'evolution', 'excessive', 'exposure', 'profound', 'proposition', 'neglect',
    'regulatory', 'stereotype', 'thought-provoking'
  ];
  for (const w of coreB2) {
    if (!c1Set.has(w)) b2Set.add(w);
  }

  c1WordsCache = c1Set;
  b2WordsCache = b2Set;
  b1WordsCache = b1Set;
  return { c1Set, b2Set, b1Set };
}

/**
 * Check if a word is C1 (Academic / Advanced).
 */
export function isC1Word(word: string): boolean {
  const clean = word.trim().toLowerCase();
  if (!clean || COMMON_BASIC_WORDS.has(clean)) return false;
  const { c1Set } = loadWordLists();
  if (c1Set.has(clean)) return true;
  if (clean.includes(' ') && clean.length >= 12) return true;
  return false;
}

/**
 * Check if a word is B2 (Upper-Intermediate).
 */
export function isB2Word(word: string): boolean {
  const clean = word.trim().toLowerCase();
  if (!clean || COMMON_BASIC_WORDS.has(clean)) return false;
  if (isC1Word(clean)) return false;
  const { b2Set } = loadWordLists();
  return b2Set.has(clean);
}

/**
 * Check if a word is B1 (Intermediate).
 */
export function isB1Word(word: string): boolean {
  const clean = word.trim().toLowerCase();
  if (!clean || COMMON_BASIC_WORDS.has(clean)) return false;
  if (isC1Word(clean) || isB2Word(clean)) return false;
  const { b1Set } = loadWordLists();
  return b1Set.has(clean);
}

/**
 * Check if a word is B2 or higher.
 */
export function isB2OrHigherWord(word: string): boolean {
  const clean = word.trim().toLowerCase();
  if (!clean || COMMON_BASIC_WORDS.has(clean)) return false;
  return isC1Word(clean) || isB2Word(clean);
}

/**
 * Backward compatible helper: checks if word is B2 or C1.
 */
export function isAdvancedWord(word: string): boolean {
  return isB2OrHigherWord(word);
}

/**
 * Categorize a list of target vocabulary words into CEFR tier & config.
 */
export function analyzeVocabularyTier(words: Array<{ word: string }>): AdaptiveLevelConfig {
  let c1Count = 0;
  let b2Count = 0;
  let b1Count = 0;

  for (const w of words) {
    const key = w.word.trim().toLowerCase();
    if (isC1Word(key)) {
      c1Count++;
    } else if (isB2Word(key)) {
      b2Count++;
    } else if (isB1Word(key)) {
      b1Count++;
    }
  }

  const total = words.length;
  const advancedCount = c1Count + b2Count; // B2 + C1

  // Tier 1: C1–C2 (Nâng cao / Academic)
  // Requirement R2: "Chỉ cần 3–5 từ nâng cao là đủ để sinh bài đọc tự nhiên, chuẩn mực."
  // Triggers when C1 vocabulary dominates (at least 3 C1 words, or 2 C1 words in a small set)
  const isC1Tier = c1Count >= 3 || (c1Count >= 2 && total <= 5);

  if (isC1Tier) {
    const clozeCount = Math.min(total, Math.min(8, Math.max(2, Math.round(total * 0.5))));
    return {
      tier: 'C1_C2',
      cefr: 'C1',
      labelVi: 'Nâng cao / Academic (C1–C2)',
      labelEn: 'Advanced Academic (C1–C2)',
      minWords: 250,
      maxWords: 350,
      minThreshold: 3, // 3-5 advanced words sufficient (R1)
      paragraphs: '2–3 paragraphs (mini-article / scholarly essay style)',
      complexity:
        'Academic syntax, complex sentence structures, sophisticated collocations, nuanced stances, and natural cohesive discourse markers.',
      passageGuidelines:
        'Write 250–350 English words in the style of an in-depth mini-article, thoughtful essay, or journalistic analysis. Use sophisticated sentence structures (cleft sentences, participle clauses, inversion, passive voice where natural). Ground the context deeply so the nuance of each target word is clearly highlighted.',
      questionGuidelines:
        'Create challenging multiple choice questions focusing on deep inference, author stance/tone, context clues, and analytical understanding. Avoid superficial literal matching.',
      clozeBlanksCount: clozeCount,
      numQuestions: total <= 6 ? 4 : 5,
    };
  }

  // Tier 2: B1–B2 (Trung cấp)
  // Requirement R1: "Tối thiểu 3 từ (đối với từ nâng cao B2-C1) hoặc 5 từ (đối với từ cơ bản A1-B1)"
  // Threshold 3 is granted only when the word set contains at least 3 advanced words (B2/C1).
  const hasAdvancedThreshold = advancedCount >= 3;
  const isB2Tier = hasAdvancedThreshold || b2Count >= 2 || (advancedCount >= 1 && total >= 5);
  const isB1Tier = b1Count >= 3 || (total >= 5 && b1Count >= 2);

  if (isB2Tier || isB1Tier) {
    const cefr = isB2Tier ? 'B2' : 'B1';
    const minThreshold = hasAdvancedThreshold ? 3 : 5;
    const clozeCount = Math.min(total, Math.min(6, Math.max(2, Math.round(total * 0.45))));

    return {
      tier: 'B1_B2',
      cefr,
      labelVi: cefr === 'B2' ? 'Khá (B2)' : 'Trung cấp (B1)',
      labelEn: cefr === 'B2' ? 'Upper-Intermediate (B2)' : 'Intermediate (B1)',
      minWords: 180,
      maxWords: 230,
      minThreshold,
      paragraphs: '2 paragraphs (vivid modern story or lifestyle article)',
      complexity:
        'Diverse grammar (present perfect, conditionals, relative clauses, passive voice lightly), rich adjectives and connectors.',
      passageGuidelines:
        'Write 180–230 English words (2 paragraphs). Style: engaging modern story, realistic diary entry, or relatable lifestyle article. Sentences should have natural variety and flow nicely without feeling rigid.',
      questionGuidelines:
        'Questions should combine factual detail with light inference (e.g. Why did X feel this way? What can be inferred about Y?). All answers must be grounded strictly in the passage.',
      clozeBlanksCount: clozeCount,
      numQuestions: 4,
    };
  }

  // Tier 3: A1–A2 (Cơ bản)
  // Default for everyday basic vocabulary
  const clozeCount = Math.min(total, Math.min(5, Math.max(2, Math.round(total * 0.4))));
  return {
    tier: 'A1_A2',
    cefr: 'A2',
    labelVi: 'Cơ bản (A1–A2)',
    labelEn: 'Elementary (A1–A2)',
    minWords: 100,
    maxWords: 150,
    minThreshold: 5, // Basic requires at least 5 words (R1)
    paragraphs: '1–2 short paragraphs (simple daily life story)',
    complexity:
      'Simple and compound sentences (SVO), high-frequency words, clear connectors (and, but, because, so).',
    passageGuidelines:
      'Write 100–150 English words (1–2 short paragraphs). Style: everyday life, friendly, relatable, clear narrative. Keep sentences simple and concise so learners can understand immediately.',
    questionGuidelines:
      'Direct, factual detail questions (Who, What, Where, Why did X do Y?). The answer must be stated directly in the text.',
    clozeBlanksCount: clozeCount,
    numQuestions: 3,
  };
}

export interface RepetitionCheckResult {
  passed: boolean;
  reason?: string;
  duplicatePatterns?: string[];
}

/**
 * Quality Gate: Anti-Repetition Check (R2)
 *
 * Scans generated reading passages to ensure they are authentic, cohesive, and natural.
 * Automatically rejects passages if:
 * 1. Contains forbidden robotic template clichés (e.g. "In this context, X plays an essential role...").
 * 2. Two or more sentences share the identical structural template where only the target word was substituted.
 * 3. Repetitive formulaic sentence starters or boilerplate prefixes appear multiple times.
 * 4. High word-level structural overlap (>= 70% Jaccard similarity) between any pair of distinct sentences.
 */
export function checkPassageRepetition(
  passage: string,
  targetWords: string[] = [],
): RepetitionCheckResult {
  const cleanPassage = passage.trim();
  if (!cleanPassage) {
    return { passed: false, reason: 'Passage is empty' };
  }

  // 1. Check for known forbidden robotic patterns
  const forbiddenRegexes: Array<{ regex: RegExp; desc: string }> = [
    {
      regex: /\b(?:in this context|in such context)[^.!?]*plays an essential role\b/i,
      desc: 'plays an essential role pattern',
    },
    {
      regex: /\bimpacts the overarching environment\b/i,
      desc: 'impacts the overarching environment cliché',
    },
    {
      regex: /\bplays an essential role in the overarching\b/i,
      desc: 'essential role in overarching boilerplate',
    },
  ];

  for (const { regex, desc } of forbiddenRegexes) {
    if (regex.test(cleanPassage)) {
      return {
        passed: false,
        reason: `Passage contains banned robotic template phrase (${desc})`,
      };
    }
  }

  // Count occurrences of repetitive phrases like "plays a ... role"
  const roleMatches = cleanPassage.match(
    /\bplays (?:an?|a) (?:essential|vital|crucial|pivotal|key|significant) role\b/gi,
  );
  if (roleMatches && roleMatches.length >= 2) {
    return {
      passed: false,
      reason: `Repetitive phrasing: "plays a ... role" repeated ${roleMatches.length} times`,
      duplicatePatterns: roleMatches,
    };
  }

  // 2. Extract and analyze sentences
  const rawSentences = cleanPassage
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15);

  if (rawSentences.length < 2) {
    return { passed: true };
  }

  const targetLower = targetWords.map((w) => w.trim().toLowerCase()).filter(Boolean);

  const abstractSentence = (sentence: string): string => {
    let s = sentence;
    s = s.replace(/\*\*([^*]+)\*\*/g, '__TARGET__');

    for (const tw of targetLower) {
      if (tw.length >= 2) {
        const esc = tw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`\\b${esc}(?:s|es|ed|ing|d)?\\b`, 'gi');
        s = s.replace(re, '__TARGET__');
      }
    }

    return s
      .toLowerCase()
      .replace(/[^\w\s_]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const abstractedMap = new Map<string, string[]>();
  const prefixMap = new Map<string, string[]>();

  for (const raw of rawSentences) {
    const skeleton = abstractSentence(raw);
    const tokens = skeleton.split(' ').filter(Boolean);

    if (tokens.length >= 5 && skeleton.includes('__target__')) {
      const existing = abstractedMap.get(skeleton) || [];
      existing.push(raw);
      abstractedMap.set(skeleton, existing);
    }

    if (tokens.length >= 4) {
      const prefix4 = tokens.slice(0, 4).join(' ');
      const existing = prefixMap.get(prefix4) || [];
      existing.push(raw);
      prefixMap.set(prefix4, existing);
    }
  }

  for (const [skeleton, occurrences] of abstractedMap.entries()) {
    if (occurrences.length >= 2) {
      return {
        passed: false,
        reason: `Duplicate sentence template detected across ${occurrences.length} sentences ("${skeleton.slice(0, 80)}...")`,
        duplicatePatterns: occurrences.slice(0, 3),
      };
    }
  }

  const formulaicPrefixBlacklist = [
    'in this context',
    'scholars observed how',
    'scholars noted that',
    'researchers observed how',
    'it plays an',
    'in this situation',
  ];
  for (const [prefix, occurrences] of prefixMap.entries()) {
    if (occurrences.length >= 2) {
      const isBlacklisted = formulaicPrefixBlacklist.some((b) => prefix.startsWith(b));
      if (isBlacklisted) {
        return {
          passed: false,
          reason: `Formulaic prefix "${prefix}" repeated across ${occurrences.length} sentences`,
          duplicatePatterns: occurrences.slice(0, 3),
        };
      }
    }
  }

  // 3. Jaccard token overlap between distinct sentence pairs
  for (let i = 0; i < rawSentences.length; i++) {
    const tokensA = new Set(
      abstractSentence(rawSentences[i])
        .split(' ')
        .filter((t) => t.length > 2 && t !== '__target__'),
    );
    if (tokensA.size < 5) continue;

    for (let j = i + 1; j < rawSentences.length; j++) {
      const tokensB = new Set(
        abstractSentence(rawSentences[j])
          .split(' ')
          .filter((t) => t.length > 2 && t !== '__target__'),
      );
      if (tokensB.size < 5) continue;

      let intersectionCount = 0;
      for (const tok of tokensA) {
        if (tokensB.has(tok)) intersectionCount++;
      }
      const unionCount = new Set([...tokensA, ...tokensB]).size;
      const jaccard = unionCount > 0 ? intersectionCount / unionCount : 0;

      if (jaccard >= 0.75) {
        return {
          passed: false,
          reason: `High structural/lexical overlap (${(jaccard * 100).toFixed(0)}%) between sentences`,
          duplicatePatterns: [rawSentences[i], rawSentences[j]],
        };
      }
    }
  }

  return { passed: true };
}

