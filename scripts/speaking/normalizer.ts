/**
 * Ingestion Normalizer & SafeHarbor Quality Scorer
 * File: scripts/speaking/normalizer.ts
 *
 * Provides:
 * 1. Transformation of raw/seed payloads into strict `StandardizedSpeakingLesson` schemas.
 * 2. Automatic stopword filtering and SafeHarbor `coreKeywords` extraction.
 * 3. Objective multi-dimensional `qualityScore` calculation (0 - 100).
 * 4. Anti-placeholder and integrity verification.
 */

import {
  CefrLevel,
  IngestionSource,
  isCefrLevel,
  isStandardizedSpeakingLesson,
  StandardizedDialogueTurn,
  StandardizedReflexPair,
  StandardizedSpeakingLesson,
  StandardizedVocabularyItem,
} from '../../src/types/speaking-curriculum';

/**
 * Standard English function stopwords (pronouns, prepositions, articles, auxiliary verbs).
 * Filtered out during SafeHarbor core keyword extraction to preserve only semantic content words.
 */
export const STOPWORDS: ReadonlySet<string> = new Set([
  'a', 'an', 'the',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'ours', 'theirs',
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'and', 'but', 'or', 'nor', 'so', 'yet', 'if', 'because', 'as', 'until', 'while',
  'this', 'that', 'these', 'those', 'there', 'here', 'what', 'which', 'who', 'whom', 'whose',
  'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'not', 'only', 'own', 'same', 'too', 'very', 's', 't', 'just', 'don', 'now'
]);

/**
 * Extracts semantic content words (nouns, verbs, adjectives, adverbs) for SafeHarbor matching.
 * Cleans punctuation, removes stopwords, normalizes case, and deduplicates.
 */
export function extractCoreKeywords(text: string): string[] {
  if (!text || typeof text !== 'string') return [];

  const cleaned = text
    .toLowerCase()
    .replace(/[’']/g, "'")
    // Expand common contractions before word splitting to avoid orphaned syllables
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\bi'd\b/g, 'i would')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bdon't\b/g, 'do not')
    .replace(/\bit's\b/g, 'it is')
    .replace(/[^a-z0-9\s-]/g, ' ');

  const tokens = cleaned
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

  const keywords: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    // Strip hyphens if any
    const pure = token.replace(/^-+|-+$/g, '');
    if (pure.length >= 3 && !STOPWORDS.has(pure) && !seen.has(pure)) {
      seen.add(pure);
      keywords.push(pure);
    }
  }

  return keywords;
}

/**
 * Detects whether any target string contains forbidden placeholder patterns.
 */
export function hasPlaceholderText(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return (
    lower.includes('todo') ||
    lower.includes('placeholder') ||
    lower.includes('lorem ipsum') ||
    lower.includes('tbd') ||
    lower.includes('sample text')
  );
}

/**
 * Evaluates completeness and educational quality of a lesson on a 0-100 scale.
 */
export function calculateQualityScore(
  lesson: Partial<StandardizedSpeakingLesson>
): number {
  let score = 0;

  // 1. Core Identity & Level (25 points)
  if (lesson.id && lesson.id.trim().length > 3) score += 10;
  if (lesson.title && lesson.title.trim().length >= 3) score += 10;
  if (lesson.cefrLevel && isCefrLevel(lesson.cefrLevel)) score += 5;

  // 2. Audio & Media Resources (20 points)
  if (lesson.audioUrl && lesson.audioUrl.trim().startsWith('http')) {
    score += 15;
  }
  if (lesson.slowAudioUrl && lesson.slowAudioUrl.trim().startsWith('http')) {
    score += 5;
  }

  // 3. Dialogue Turns & Core Keywords (25 points)
  if (Array.isArray(lesson.turns) && lesson.turns.length >= 2) {
    score += 10;
    const allHaveBothLangs = lesson.turns.every(
      (t) => Boolean(t.textEn?.trim()) && Boolean(t.textVi?.trim())
    );
    if (allHaveBothLangs) score += 10;

    const allHaveKeywords = lesson.turns.every(
      (t) => Array.isArray(t.coreKeywords) && t.coreKeywords.length > 0
    );
    if (allHaveKeywords) score += 5;
  }

  // 4. Vocabulary (15 points)
  if (Array.isArray(lesson.vocabulary) && lesson.vocabulary.length >= 2) {
    score += 10;
    const allHaveMeanings = lesson.vocabulary.every(
      (v) => Boolean(v.term?.trim()) && Boolean(v.meaningVi?.trim())
    );
    if (allHaveMeanings) score += 5;
  }

  // 5. Reflex Pairs (15 points)
  if (Array.isArray(lesson.reflexPairs) && lesson.reflexPairs.length >= 1) {
    score += 10;
    const allHaveResponses = lesson.reflexPairs.every(
      (r) => Boolean(r.promptEn?.trim()) && Boolean(r.responseEn?.trim())
    );
    if (allHaveResponses) score += 5;
  }

  // Penalty for placeholders
  const stringDump = JSON.stringify(lesson);
  if (hasPlaceholderText(stringDump)) {
    score = Math.max(0, score - 50);
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Normalizes raw dialogue turns: ensures speaker, translations, audio, and core keywords.
 */
export function normalizeTurns(
  turns: unknown[] = []
): StandardizedDialogueTurn[] {
  if (!Array.isArray(turns)) return [];

  return turns.map((item, index) => {
    const raw = (item && typeof item === 'object' ? item : {}) as Record<
      string,
      unknown
    >;

    const speaker =
      typeof raw.speaker === 'string' && raw.speaker.trim().length > 0
        ? raw.speaker.trim()
        : index % 2 === 0
        ? 'Speaker 1'
        : 'Speaker 2';

    const textEn =
      typeof raw.textEn === 'string'
        ? raw.textEn.trim()
        : typeof raw.en === 'string'
        ? raw.en.trim()
        : '';

    const textVi =
      typeof raw.textVi === 'string'
        ? raw.textVi.trim()
        : typeof raw.vi === 'string'
        ? raw.vi.trim()
        : undefined;

    const audioUrl =
      typeof raw.audioUrl === 'string' && raw.audioUrl.trim().length > 0
        ? raw.audioUrl.trim()
        : undefined;

    const startTime =
      typeof raw.startTime === 'number'
        ? raw.startTime
        : typeof raw.startSeconds === 'number'
        ? raw.startSeconds
        : undefined;

    const endTime =
      typeof raw.endTime === 'number'
        ? raw.endTime
        : typeof raw.endSeconds === 'number'
        ? raw.endSeconds
        : undefined;

    const coreKeywords =
      Array.isArray(raw.coreKeywords) && raw.coreKeywords.length > 0
        ? (raw.coreKeywords.filter((k) => typeof k === 'string') as string[])
        : extractCoreKeywords(textEn);

    return {
      speaker,
      textEn,
      textVi,
      audioUrl,
      coreKeywords,
      startTime,
      endTime,
    };
  });
}

/**
 * Normalizes vocabulary items.
 */
export function normalizeVocabulary(
  vocab: unknown[] = []
): StandardizedVocabularyItem[] {
  if (!Array.isArray(vocab)) return [];

  return vocab
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const raw = item as Record<string, unknown>;
      return {
        term: typeof raw.term === 'string' ? raw.term.trim() : '',
        ipa: typeof raw.ipa === 'string' ? raw.ipa.trim() : undefined,
        meaningVi:
          typeof raw.meaningVi === 'string'
            ? raw.meaningVi.trim()
            : typeof raw.vi === 'string'
            ? raw.vi.trim()
            : '',
        exampleEn:
          typeof raw.exampleEn === 'string'
            ? raw.exampleEn.trim()
            : typeof raw.exampleSentenceEn === 'string'
            ? raw.exampleSentenceEn.trim()
            : undefined,
        exampleVi:
          typeof raw.exampleVi === 'string'
            ? raw.exampleVi.trim()
            : typeof raw.exampleSentenceVi === 'string'
            ? raw.exampleSentenceVi.trim()
            : undefined,
      };
    })
    .filter((v) => v.term.length > 0 && v.meaningVi.length > 0);
}

/**
 * Normalizes reflex pairs.
 */
export function normalizeReflexPairs(
  pairs: unknown[] = []
): StandardizedReflexPair[] {
  if (!Array.isArray(pairs)) return [];

  return pairs
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const raw = item as Record<string, unknown>;
      const promptEn =
        typeof raw.promptEn === 'string'
          ? raw.promptEn.trim()
          : typeof raw.prompt === 'string'
          ? raw.prompt.trim()
          : '';

      const promptVi =
        typeof raw.promptVi === 'string' ? raw.promptVi.trim() : undefined;

      const responseEn =
        typeof raw.responseEn === 'string'
          ? raw.responseEn.trim()
          : typeof raw.response === 'string'
          ? raw.response.trim()
          : '';

      const responseVi =
        typeof raw.responseVi === 'string' ? raw.responseVi.trim() : undefined;

      const coreKeywords =
        Array.isArray(raw.coreKeywords) && raw.coreKeywords.length > 0
          ? (raw.coreKeywords.filter((k) => typeof k === 'string') as string[])
          : extractCoreKeywords(responseEn);

      const audioUrl =
        typeof raw.audioUrl === 'string' && raw.audioUrl.trim().length > 0
          ? raw.audioUrl.trim()
          : undefined;

      return {
        promptEn,
        promptVi,
        responseEn,
        responseVi,
        coreKeywords,
        audioUrl,
      };
    })
    .filter((r) => r.promptEn.length > 0 && r.responseEn.length > 0);
}

/**
 * Master Normalizer: Converts any raw or seed input into a valid StandardizedSpeakingLesson.
 */
export function normalizeLesson(
  rawInput: Record<string, unknown>,
  defaultSource: IngestionSource = 'elllo'
): StandardizedSpeakingLesson {
  const source: IngestionSource =
    rawInput.source === 'elllo' ||
    rawInput.source === 'talkenglish' ||
    rawInput.source === 'youtube' ||
    rawInput.source === 'curriculum'
      ? (rawInput.source as IngestionSource)
      : defaultSource;

  const rawLevel = String(rawInput.cefrLevel || rawInput.level || 'A1').toUpperCase();
  const cefrLevel: CefrLevel =
    rawLevel === 'A2' || rawLevel === 'B1' || rawLevel === 'B2'
      ? rawLevel
      : 'A1';

  const id =
    typeof rawInput.id === 'string' && rawInput.id.trim().length > 0
      ? rawInput.id.trim()
      : `${source}-${cefrLevel.toLowerCase()}-${Date.now().toString(36)}`;

  const title =
    typeof rawInput.title === 'string' && rawInput.title.trim().length > 0
      ? rawInput.title.trim()
      : typeof rawInput.titleEn === 'string'
      ? rawInput.titleEn.trim()
      : 'Conversational English Lesson';

  const topic =
    typeof rawInput.topic === 'string' && rawInput.topic.trim().length > 0
      ? rawInput.topic.trim()
      : 'General Conversation';

  const audioUrl =
    typeof rawInput.audioUrl === 'string' && rawInput.audioUrl.trim().length > 0
      ? rawInput.audioUrl.trim()
      : undefined;

  const slowAudioUrl =
    typeof rawInput.slowAudioUrl === 'string' && rawInput.slowAudioUrl.trim().length > 0
      ? rawInput.slowAudioUrl.trim()
      : undefined;

  const turns = normalizeTurns(
    (rawInput.turns as unknown[]) ||
      ((rawInput.transcript as Record<string, unknown>)?.turns as unknown[])
  );

  const vocabulary = normalizeVocabulary(
    (rawInput.vocabulary as unknown[]) || (rawInput.vocab as unknown[])
  );

  const reflexPairs = normalizeReflexPairs(
    (rawInput.reflexPairs as unknown[]) || (rawInput.reflexes as unknown[])
  );

  const candidate: StandardizedSpeakingLesson = {
    id,
    source,
    title,
    cefrLevel,
    topic,
    audioUrl,
    slowAudioUrl,
    turns,
    vocabulary,
    reflexPairs,
    qualityScore: 0,
    crawledAt:
      typeof rawInput.crawledAt === 'string'
        ? rawInput.crawledAt
        : new Date().toISOString(),
    sourceUrl:
      typeof rawInput.sourceUrl === 'string' ? rawInput.sourceUrl : undefined,
    rawMetadata:
      rawInput.rawMetadata && typeof rawInput.rawMetadata === 'object'
        ? (rawInput.rawMetadata as Record<string, unknown>)
        : undefined,
  };

  candidate.qualityScore = calculateQualityScore(candidate);

  if (!isStandardizedSpeakingLesson(candidate)) {
    throw new Error(
      `Normalization failed: Lesson "${id}" does not conform to StandardizedSpeakingLesson contract.`
    );
  }

  return candidate;
}
