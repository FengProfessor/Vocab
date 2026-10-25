import { DETECTIVE_PUZZLES, GRAMMAR_PUZZLES, SENTENCE_PUZZLES, type GameMode, type GameWord } from '../data/english-games';

export interface GameRound {
  id: string;
  prompt: string;
  answer: string;
  explanation: string;
  tiles: string[];
  options: string[];
  wrongIndex?: number;
}

export function shuffleGame<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Tránh câu đố hiện sẵn đáp án, kể cả khi bộ sinh ngẫu nhiên trả lại thứ tự cũ. */
export function scrambleTiles(items: string[]): string[] {
  const result = shuffleGame(items);
  if (result.join(' ') === items.join(' ')) {
    const different = result.findIndex((item) => item !== result[0]);
    if (different > 0) [result[0], result[different]] = [result[different], result[0]];
  }
  return result;
}

export function normalizeGameAnswer(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase().replace(/[’‘]/g, "'").replace(/[.!?]+$/g, '').replace(/\s+/g, ' ').trim();
}

/** Loại dữ liệu rỗng/trùng nghĩa để câu hỏi chọn từ không có hai đáp án cùng đúng. */
export function cleanGameWords(value: unknown): GameWord[] {
  if (!Array.isArray(value)) return [];
  const words = new Set<string>();
  const meanings = new Set<string>();
  const result: GameWord[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    if (typeof row.word !== 'string' || typeof row.translation !== 'string') continue;
    const word = row.word.trim();
    const translation = row.translation.trim();
    const key = normalizeGameAnswer(word);
    const meaning = normalizeGameAnswer(translation);
    if (!word || !translation || !/[a-z]/i.test(word) || word.length > 80 || translation.length > 200 || words.has(key) || meanings.has(meaning)) continue;
    words.add(key);
    meanings.add(meaning);
    result.push({ id: `word-${result.length}`, word, translation, example: typeof row.example === 'string' ? row.example : undefined });
  }
  return result;
}

export function playableWords(mode: GameMode, words: GameWord[]): GameWord[] {
  const clean = cleanGameWords(words);
  return mode === 'scramble' ? clean.filter((w) => /^[a-z]{3,14}$/i.test(w.word) && new Set(w.word.toLowerCase()).size > 1) : clean;
}

export function makeGameRounds(mode: GameMode, words: GameWord[]): GameRound[] {
  if (mode === 'grammar') return shuffleGame(GRAMMAR_PUZZLES).slice(0, 8).map((q) => ({ ...q, tiles: [], options: shuffleGame(q.options) }));
  if (mode === 'sentence') return shuffleGame(SENTENCE_PUZZLES).slice(0, 8).map((q) => ({ ...q, tiles: scrambleTiles(q.answer.split(' ')), options: [] }));
  if (mode === 'detective') return shuffleGame(DETECTIVE_PUZZLES).slice(0, 8).map((q) => {
    const tiles = q.sentence.split(' ');
    const corrected = [...tiles];
    corrected[q.wrongIndex] = q.replacement;
    return { id: q.id, prompt: q.sentence, answer: corrected.join(' '), explanation: `${tiles[q.wrongIndex]} → ${q.replacement}. ${q.explanation}`, tiles, options: [], wrongIndex: q.wrongIndex };
  });
  const pool = playableWords(mode, words);
  return shuffleGame(pool).slice(0, mode === 'sprint' ? 20 : 8).map((w) => ({
    id: w.id, prompt: w.translation, answer: w.word,
    explanation: `${w.word} = ${w.translation}.${w.example ? ` Ví dụ: ${w.example}` : ''}`,
    tiles: mode === 'scramble' ? scrambleTiles(w.word.toLowerCase().split('')) : [],
    options: mode === 'sprint' ? shuffleGame([w.word, ...shuffleGame(pool.filter((other) => other.id !== w.id)).slice(0, 3).map((other) => other.word)]) : [],
  }));
}

export interface GameResult {
  score: number;
  correct: number;
  attempts: number;
  combo: number;
  bestCombo: number;
}

export const EMPTY_GAME_RESULT: GameResult = { score: 0, correct: 0, attempts: 0, combo: 0, bestCombo: 0 };

export function scoreGameAnswer(previous: GameResult, correct: boolean): GameResult {
  const combo = correct ? previous.combo + 1 : 0;
  return {
    score: previous.score + (correct ? 100 + Math.min(combo - 1, 5) * 20 : 0),
    correct: previous.correct + Number(correct), attempts: previous.attempts + 1,
    combo, bestCombo: Math.max(previous.bestCombo, combo),
  };
}

export function parseGameRecords(raw: string | null): Partial<Record<GameMode, number>> {
  try {
    const parsed: unknown = JSON.parse(raw ?? '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const records: Partial<Record<GameMode, number>> = {};
    for (const mode of ['memory', 'sprint', 'scramble', 'sentence', 'grammar', 'detective'] as const) {
      const score = (parsed as Record<string, unknown>)[mode];
      if (typeof score === 'number' && Number.isFinite(score) && score >= 0) records[mode] = score;
    }
    return records;
  } catch { return {}; }
}
