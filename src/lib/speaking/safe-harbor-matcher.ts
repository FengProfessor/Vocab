/**
 * Foundational Speaking System for False Beginners
 * Module: src/lib/speaking/safe-harbor-matcher.ts
 *
 * SafeHarbor Speech Matching Engine:
 * - High-tolerance, non-punitive Levenshtein fuzzy keyword matching
 * - Contraction resolution & text normalization
 * - Stopword & minor article exclusion (a, an, the, etc.)
 * - Length-adaptive fuzzy tolerance (1 typo for <=6 chars, 2 typos for >=7 chars)
 * - Composite scoring (0.75 R_kw + 0.25 S_seq)
 * - Safe Harbor Pass Threshold (R_kw >= 75% => passed: true)
 * - Supportive, non-punitive Vietnamese pedagogical feedback
 */

import { levenshtein } from '@/lib/study';
import type {
  SafeHarborResult,
  SafeHarborEvaluationResult,
} from '@/types/speaking-foundation';

export { levenshtein };

/**
 * Common English contractions mapped to their expanded canonical forms.
 */
const CONTRACTION_EXPANSIONS: Record<string, string> = {
  // Would / Had
  "i'd like": 'i would like',
  "i'd": 'i would',
  "you'd": 'you would',
  "he'd": 'he would',
  "she'd": 'she would',
  "we'd": 'we would',
  "they'd": 'they would',

  // Will
  "i'll": 'i will',
  "you'll": 'you will',
  "he'll": 'he will',
  "she'll": 'she will',
  "we'll": 'we will',
  "they'll": 'they will',
  "it'll": 'it will',

  // Am / Are / Is
  "i'm": 'i am',
  "you're": 'you are',
  "we're": 'we are',
  "they're": 'they are',
  "it's": 'it is',
  "that's": 'that is',
  "what's": 'what is',
  "where's": 'where is',
  "here's": 'here is',
  "there's": 'there is',
  "how's": 'how is',
  "who's": 'who is',

  // Negations
  "can't": 'cannot',
  "don't": 'do not',
  "doesn't": 'does not',
  "didn't": 'did not',
  "won't": 'will not',
  "couldn't": 'could not',
  "wouldn't": 'would not',
  "shouldn't": 'should not',
  "haven't": 'have not',
  "hasn't": 'has not',
  "hadn't": 'had not',
  "isn't": 'is not',
  "aren't": 'are not',
  "wasn't": 'was not',
  "weren't": 'were not',

  // Have
  "i've": 'i have',
  "you've": 'you have',
  "we've": 'we have',
  "they've": 'they have',
  "could've": 'could have',
  "would've": 'would have',
  "should've": 'should have',
};

/**
 * Minor function words, articles, and fillers ignored unless explicitly specified in target keywords.
 */
export const FORGIVEN_FUNCTION_WORDS = new Set<string>([
  'a',
  'an',
  'the',
  'to',
  'in',
  'on',
  'at',
  'of',
  'for',
  'with',
  'by',
  'and',
  'or',
  'is',
  'are',
  'am',
  'was',
  'were',
  'be',
  'it',
  'this',
  'that',
  'these',
  'those',
  'some',
  'because',
  'so',
  'as',
  'if',
  'i',
  'me',
  'my',
  'you',
  'your',
  'we',
  'us',
  'our',
  'they',
  'them',
  'their',
  'he',
  'him',
  'his',
  'she',
  'her',
  'um',
  'uh',
  'ah',
  'oh',
]);

/**
 * Normalizes speech transcript:
 * - Lowercases text
 * - Unifies straight/curly apostrophes (' ‘ ’ `)
 * - Expands contractions
 * - Replaces non-alphanumeric punctuation with spaces
 * - Collapses repeated whitespace
 */
export function normalizeSpeech(text: string): string {
  if (!text) return '';

  let normalized = text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .trim();

  // Expand known contractions
  for (const [contraction, expansion] of Object.entries(CONTRACTION_EXPANSIONS)) {
    const escaped = contraction.replace("'", "\\'");
    const pattern = new RegExp(`\\b${escaped}\\b`, 'g');
    normalized = normalized.replace(pattern, expansion);
  }

  // Strip punctuation and symbols, replacing with spaces to avoid smashing hyphenated words
  return normalized
    .replace(/[.,/#!$%^&*;:{}=\-_~()?"'–—+<>|\\@]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts content keywords from target sentence when explicit keywords are not provided.
 * Ignores forgiven function words and single-letter tokens.
 */
export function extractContentKeywords(target: string): string[] {
  const normalized = normalizeSpeech(target);
  const words = normalized.split(/\s+/).filter(Boolean);
  return words.filter((w) => !FORGIVEN_FUNCTION_WORDS.has(w) && w.length >= 2);
}

/**
 * Length-adaptive Levenshtein tolerance:
 * - Words <= 3 chars: exact match or length >= 3 with max 1 slip
 * - Words <= 6 chars: max 1 edit
 * - Words >= 7 chars: max 2 edits
 */
export function getKeywordTolerance(keyword: string): number {
  if (keyword.length <= 3) return 1;
  if (keyword.length <= 6) return 1;
  return 2;
}

/**
 * SafeHarbor Speech Evaluator:
 * Compares spoken transcript against target sentence with high affective tolerance.
 */
export function evaluateSafeHarborSpeech(
  spokenText: string,
  targetSentence: string,
  explicitKeywords?: string[]
): SafeHarborResult {
  const normSpoken = normalizeSpeech(spokenText);
  const normTarget = normalizeSpeech(targetSentence);

  // If user provided no speech at all
  if (!normSpoken) {
    const defaultMissed =
      explicitKeywords && explicitKeywords.length > 0
        ? explicitKeywords.map((k) => normalizeSpeech(k))
        : extractContentKeywords(targetSentence);

    return {
      score: 0,
      passed: false,
      tier: 'warm_retry',
      feedbackVi: 'Chưa nghe thấy giọng nói của bạn. Hãy nhấn nút micro và thử lại nhé!',
      matchedKeywords: [],
      missedKeywords: defaultMissed,
      normalizedSpoken: '',
      normalizedTarget: normTarget,
    };
  }

  // Derive target keywords
  const targetKeywords =
    explicitKeywords && explicitKeywords.length > 0
      ? explicitKeywords.map((k) => normalizeSpeech(k)).filter(Boolean)
      : extractContentKeywords(targetSentence);

  const spokenWords = normSpoken.split(/\s+/).filter(Boolean);
  const targetWords = normTarget.split(/\s+/).filter(Boolean);

  const matchedKeywords: string[] = [];
  const missedKeywords: string[] = [];
  const claimedSpokenIndices = new Set<number>();

  for (const kw of targetKeywords) {
    const tolerance = getKeywordTolerance(kw);
    let matched = false;
    let bestIndex = -1;
    let bestDist = Infinity;

    for (let i = 0; i < spokenWords.length; i++) {
      const sw = spokenWords[i];

      // Exact match
      if (sw === kw) {
        matched = true;
        bestIndex = i;
        bestDist = 0;
        break;
      }

      // Safeguarded substring match for longer compound words (length >= 4)
      if (sw.length >= 4 && kw.length >= 4 && (sw.includes(kw) || kw.includes(sw))) {
        matched = true;
        bestIndex = i;
        bestDist = 0;
        break;
      }

      // Length-adaptive Levenshtein match
      const dist = levenshtein(sw, kw);
      if (dist <= tolerance && dist < bestDist) {
        matched = true;
        bestIndex = i;
        bestDist = dist;
      }
    }

    if (matched) {
      matchedKeywords.push(kw);
      if (bestIndex !== -1) {
        claimedSpokenIndices.add(bestIndex);
      }
    } else {
      missedKeywords.push(kw);
    }
  }

  // Content-only representation for sequential similarity
  const spokenContentWords = spokenWords
    .filter((w) => !FORGIVEN_FUNCTION_WORDS.has(w) && w.length >= 2)
    .join(' ');
  const targetContentWords = targetWords
    .filter((w) => !FORGIVEN_FUNCTION_WORDS.has(w) && w.length >= 2)
    .join(' ');

  const keywordRatio =
    targetKeywords.length > 0 ? matchedKeywords.length / targetKeywords.length : 1.0;

  const isExactMatch = normSpoken === normTarget;
  let finalScore = 0;

  if (isExactMatch) {
    finalScore = 100;
  } else if (targetKeywords.length > 0 && matchedKeywords.length === 0) {
    // Zero-keyword guard: prevent score leakage on foreign/gibberish speech
    return {
      score: 0,
      passed: false,
      tier: 'warm_retry',
      feedbackVi: 'Không sao cả! Hãy nghe lại mẫu ở tốc độ 0.8x và thử nói lại nhé.',
      matchedKeywords: [],
      missedKeywords,
      normalizedSpoken: normSpoken,
      normalizedTarget: normTarget,
    };
  } else {
    const maxLen = Math.max(spokenContentWords.length, targetContentWords.length);
    const dist = levenshtein(spokenContentWords, targetContentWords);
    const sequenceSimilarity = maxLen > 0 ? Math.max(0, 1 - dist / maxLen) : 1.0;

    // Check if articles ('a', 'an', 'the') were dropped from target
    const targetArticles = targetWords.filter((w) => w === 'a' || w === 'an' || w === 'the');
    const spokenArticles = spokenWords.filter((w) => w === 'a' || w === 'an' || w === 'the');
    const omittedArticles = targetArticles.length > spokenArticles.length;

    // Composite: 70-75% keyword recall + 25-30% sequential similarity
    const rawScore = Math.round(keywordRatio * 75 + sequenceSimilarity * 25);

    if (omittedArticles && keywordRatio >= 0.9) {
      // Safe Harbor tier: score 80-85 when key content is fully understood but minor articles were dropped
      finalScore = Math.min(85, Math.max(75, rawScore - 15));
    } else {
      finalScore = Math.min(100, Math.max(0, rawScore));
    }
  }

  const passed = finalScore >= 75 || keywordRatio >= 0.75;

  let tier: 'excellent' | 'safe_pass' | 'getting_closer' | 'warm_retry';
  let feedbackVi: string;

  if (finalScore >= 90) {
    tier = 'excellent';
    feedbackVi = 'Tuyệt vời! Bạn phát âm rất rõ ràng, tự nhiên và chuẩn xác!';
  } else if (finalScore >= 75 || passed) {
    tier = 'safe_pass';
    feedbackVi = 'Rất tốt! Đạt chuẩn giao tiếp an toàn, người bản xứ hiểu bạn 100%.';
  } else if (finalScore >= 45 || keywordRatio >= 0.5) {
    tier = 'getting_closer';
    feedbackVi = 'Rất gần rồi! Bạn hãy nhấn rõ hơn các từ khóa trọng tâm nhé.';
  } else {
    tier = 'warm_retry';
    feedbackVi = 'Không sao cả! Hãy nghe lại mẫu ở tốc độ 0.8x và thử nói lại nhé.';
  }

  return {
    score: finalScore,
    passed,
    tier,
    feedbackVi,
    matchedKeywords,
    missedKeywords,
    normalizedSpoken: normSpoken,
    normalizedTarget: normTarget,
  };
}

/**
 * Detailed Safe Harbor Speech Evaluator:
 * Generates token-by-token visual feedback for frontend rendering in SafeHarborRecorder.
 */
export function evaluateSafeHarborSpeechDetailed(
  rawTranscript: string,
  targetSentence: string,
  explicitKeywords?: string[]
): SafeHarborEvaluationResult {
  const basicResult = evaluateSafeHarborSpeech(rawTranscript, targetSentence, explicitKeywords);

  const normTarget = normalizeSpeech(targetSentence);
  const targetTokens = normTarget.split(/\s+/).filter(Boolean);

  const targetKeywords =
    explicitKeywords && explicitKeywords.length > 0
      ? explicitKeywords.map((k) => normalizeSpeech(k)).filter(Boolean)
      : extractContentKeywords(targetSentence);

  const matchedSet = new Set(basicResult.matchedKeywords);
  const keywordSet = new Set(targetKeywords);

  const tokenFeedback = targetTokens.map((tok) => {
    const isKw = keywordSet.has(tok);
    const isMatched = matchedSet.has(tok);
    const isIgnored = FORGIVEN_FUNCTION_WORDS.has(tok) && !isKw;

    let status: 'matched' | 'fuzzy' | 'missed' | 'function_word';
    if (isMatched) {
      status = 'matched';
    } else if (isKw) {
      status = 'missed';
    } else {
      status = 'function_word';
    }

    return {
      word: tok,
      isKeyword: isKw,
      isIgnored,
      status,
    };
  });

  const ignoredWords = targetTokens.filter(
    (tok) => FORGIVEN_FUNCTION_WORDS.has(tok) && !keywordSet.has(tok)
  );

  const keywordRecall =
    targetKeywords.length > 0 ? basicResult.matchedKeywords.length / targetKeywords.length : 1.0;

  const maxLen = Math.max(basicResult.normalizedSpoken.length, basicResult.normalizedTarget.length);
  const seqDist = levenshtein(basicResult.normalizedSpoken, basicResult.normalizedTarget);
  const sequenceSimilarity = maxLen > 0 ? Math.max(0, 1 - seqDist / maxLen) : 1.0;

  let status: 'excellent' | 'safe_pass' | 'encouragement' | 'retry';
  if (basicResult.tier === 'excellent') status = 'excellent';
  else if (basicResult.tier === 'safe_pass') status = 'safe_pass';
  else if (basicResult.tier === 'getting_closer') status = 'encouragement';
  else status = 'retry';

  let feedbackTitleVi = 'Thử lại nhẹ nhàng';
  if (status === 'excellent') feedbackTitleVi = 'Xuất sắc!';
  else if (status === 'safe_pass') feedbackTitleVi = 'Đạt chuẩn an toàn!';
  else if (status === 'encouragement') feedbackTitleVi = 'Rất có triển vọng!';

  return {
    rawTranscript,
    cleanedTranscript: basicResult.normalizedSpoken,
    targetSentence,
    matchedKeywords: basicResult.matchedKeywords,
    missingKeywords: basicResult.missedKeywords,
    ignoredWords,
    keywordRecall,
    sequenceSimilarity,
    finalScore: basicResult.score,
    passed: basicResult.passed,
    status,
    feedbackTitleVi,
    feedbackMessageVi: basicResult.feedbackVi,
    tokenFeedback,
  };
}
