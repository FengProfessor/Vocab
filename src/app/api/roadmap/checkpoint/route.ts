import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized } from '@/lib/api-security';
import { resolveUnit, getPronunciationLesson, getStarterPack } from '@/lib/roadmap';
import { resolvePack } from '@/lib/vocab-catalog';
import { normalizeLessonExercise } from '@/lib/grammar-exercises';

// Shape JSONB của global_dictionary.data (như /api/import/packages)
type GdMeaning = { pos?: string; definition?: string };
type GdData = { results?: { meanings?: GdMeaning[] }[] };
type LessonExercise = {
  type?: string;
  q?: string; question?: string;
  opts?: string[]; options?: string[];
  answer?: string | string[] | boolean; correct_answer?: string;
  fb?: string; explanation?: string;
};

export type CheckpointQuestionType = 'meaning-to-word' | 'word-to-meaning' | 'typing' | 'grammar-mcq' | 'minimal-pair' | 'listening-choice';
export interface CheckpointQuestion {
  id: string;
  type: CheckpointQuestionType;
  prompt: string;
  /** Từ cần phát audio (listening/minimal-pair). */
  audioWord?: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * GET /api/roadmap/checkpoint?unit=<unitId> — lắp bộ câu hỏi tổng hợp chặng.
 * Trộn loại: vocab 2 chiều + typing + grammar + minimal pair (nếu chặng có bài phát âm).
 * Mỗi lần gọi trả bộ trộn khác nhau (làm lại = câu khác).
 * Câu CUỐI luôn là MCQ vocab dễ (scaffold ending — kết thúc bằng cảm giác thắng).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const unitId = req.nextUrl.searchParams.get('unit') ?? '';
    const resolved = resolveUnit(unitId);
    if (!resolved) return NextResponse.json({ success: false, error: 'Chặng không tồn tại' }, { status: 400 });

    const supabase = createServiceClient();
    const { unit, level } = resolved;

    // Gom từ của 1 danh sách packId (hỗ trợ cả starter pack A0 lẫn catalog pack)
    const wordsOfPacks = (packIds: string[]): string[] => {
      const out: string[] = [];
      for (const packId of packIds) {
        const starter = getStarterPack(packId);
        if (starter) { out.push(...starter.words); continue; }
        const pack = resolvePack(packId);
        if (pack) out.push(...pack.words);
      }
      return out;
    };

    // ── Vocab chặng HIỆN TẠI ──
    const words = wordsOfPacks(unit.steps.filter((s) => s.type === 'vocab').map((s) => s.ref));

    // ── Ôn xoáy ốc: từ các chặng ĐÃ QUA trong cùng cấp (teacher review mục E) ──
    const priorWords = wordsOfPacks(
      level.units
        .filter((u) => u.index < unit.index)
        .flatMap((u) => u.steps.filter((s) => s.type === 'vocab').map((s) => s.ref)),
    );

    const allWords = [...new Set([...words, ...priorWords])];
    const { data: gdRows } = allWords.length > 0
      ? await supabase.from('global_dictionary').select('word, data').in('word', allWords)
      : { data: [] as { word: string; data: unknown }[] };
    const meaningOf = new Map<string, string>();
    for (const row of gdRows ?? []) {
      const meaning = ((row.data ?? {}) as GdData).results?.[0]?.meanings?.[0]?.definition ?? '';
      if (meaning) meaningOf.set(row.word, meaning);
    }
    const vocabPool = shuffle(words.filter((w) => meaningOf.has(w)));
    const priorPool = shuffle(priorWords.filter((w) => meaningOf.has(w) && !words.includes(w)));

    const questions: CheckpointQuestion[] = [];

    // 2 câu ÔN từ chặng cũ (nếu có) — chống "pass rồi quên"
    for (const w of priorPool.slice(0, 2)) {
      const distractors = shuffle([...vocabPool, ...priorPool].filter((x) => x !== w)).slice(0, 3);
      questions.push({
        id: `cq-rv-${w}`, type: 'meaning-to-word',
        prompt: `[Ôn lại] Từ nào nghĩa là "${meaningOf.get(w)}"?`,
        options: shuffle([w, ...distractors]), answer: w,
      });
    }

    // 3 câu meaning→word
    for (const w of vocabPool.slice(0, 3)) {
      const distractors = shuffle(vocabPool.filter((x) => x !== w)).slice(0, 3);
      questions.push({
        id: `cq-mw-${w}`, type: 'meaning-to-word',
        prompt: `Từ nào nghĩa là "${meaningOf.get(w)}"?`,
        options: shuffle([w, ...distractors]), answer: w,
      });
    }
    // 2 câu word→meaning
    for (const w of vocabPool.slice(3, 5)) {
      const distractors = shuffle(vocabPool.filter((x) => x !== w)).slice(0, 3).map((x) => meaningOf.get(x)!);
      questions.push({
        id: `cq-wm-${w}`, type: 'word-to-meaning',
        prompt: `"${w}" nghĩa là gì?`,
        options: shuffle([meaningOf.get(w)!, ...distractors]), answer: meaningOf.get(w)!,
      });
    }
    // 1 câu typing (nghĩa → gõ từ)
    const typingWord = vocabPool[5];
    if (typingWord) {
      questions.push({
        id: `cq-ty-${typingWord}`, type: 'typing',
        prompt: `Gõ từ tiếng Anh có nghĩa: "${meaningOf.get(typingWord)}"`,
        answer: typingWord,
      });
    }
    // 1 câu listening: nghe audio → chọn từ
    const listenWord = vocabPool[6];
    if (listenWord) {
      const distractors = shuffle(vocabPool.filter((x) => x !== listenWord)).slice(0, 3);
      questions.push({
        id: `cq-ls-${listenWord}`, type: 'listening-choice',
        prompt: 'Nghe và chọn từ bạn nghe được:',
        audioWord: listenWord,
        options: shuffle([listenWord, ...distractors]), answer: listenWord,
      });
    }

    // ── Grammar: lấy exercises từ lesson của topic trong chặng ──
    const grammarSlug = unit.steps.find((s) => s.type === 'grammar')?.ref;
    if (grammarSlug) {
      const { data: topic } = await supabase.from('grammar_topics').select('id, title, level').eq('slug', grammarSlug).maybeSingle();
      if (topic) {
        const { data: lessons } = await supabase.from('grammar_lessons').select('id, exercises').eq('topic_id', topic.id).limit(1);
        const lessonId = lessons?.[0]?.id ?? grammarSlug;
        const rawList = (lessons?.[0]?.exercises ?? []) as LessonExercise[];
        const normalized = rawList
          .map((raw, i) => normalizeLessonExercise(raw, lessonId, i, topic.title || grammarSlug, topic.level || 'intermediate', 'cp'))
          .filter((e) => {
            // Cần có đề + ≥2 options + đáp án khớp mềm
            if (!e.question.trim() || e.options.length < 2 || !e.correct_answer) return false;
            const soft = e.options.some(
              (o) => o.trim().toLowerCase() === e.correct_answer.trim().toLowerCase(),
            );
            return soft;
          });
        for (const [i, e] of shuffle(normalized).slice(0, 4).entries()) {
          questions.push({
            id: `cq-gr-${grammarSlug}-${i}`,
            type: 'grammar-mcq',
            prompt: e.question,
            options: e.options,
            answer: e.correct_answer,
            explanation: e.explanation || undefined,
          });
        }
      }
    }

    // ── Minimal pair (nếu chặng có bài phát âm) ──
    const pronId = unit.steps.find((s) => s.type === 'pronunciation')?.ref;
    if (pronId) {
      const lesson = getPronunciationLesson(pronId);
      const pairs = (lesson?.minimalPairs ?? []).filter((p) => /^[a-zA-Z' ]+$/.test(p.a) && /^[a-zA-Z' ]+$/.test(p.b));
      for (const [i, pair] of shuffle(pairs).slice(0, 2).entries()) {
        const target = Math.random() < 0.5 ? pair.a : pair.b;
        questions.push({
          id: `cq-mp-${pronId}-${i}`, type: 'minimal-pair',
          prompt: 'Nghe và chọn đúng từ bạn nghe được:',
          audioWord: target,
          options: shuffle([pair.a, pair.b]), answer: target,
          explanation: pair.note || undefined,
        });
      }
    }

    // Trộn tất cả nhưng giữ câu CUỐI là MCQ vocab dễ (scaffold ending)
    const easyLast = questions.find((q) => q.type === 'meaning-to-word');
    const rest = shuffle(questions.filter((q) => q !== easyLast));
    const finalQuestions = easyLast ? [...rest, easyLast] : rest;

    return NextResponse.json({
      success: true,
      data: { unitId, title: unit.title, questions: finalQuestions, passPct: 80 },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
