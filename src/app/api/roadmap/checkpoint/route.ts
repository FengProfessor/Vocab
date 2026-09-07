import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized } from '@/lib/api-security';
import {
  resolveUnit,
  getPronunciationLesson,
  getStarterPack,
  getThptContent,
  type RoadmapTrack,
} from '@/lib/roadmap';
import { resolvePack } from '@/lib/vocab-catalog';
import { normalizeLessonExercise } from '@/lib/grammar-exercises';
import { getReviewUrlForStep, type AssessmentSkill } from '@/lib/roadmap-assessment';

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

export type CheckpointQuestionType =
  | 'meaning-to-word'
  | 'word-to-meaning'
  | 'typing'
  | 'grammar-mcq'
  | 'minimal-pair'
  | 'listening-choice';

export interface CheckpointQuestion {
  id: string;
  type: CheckpointQuestionType;
  prompt: string;
  /** Từ cần phát audio (listening/minimal-pair). */
  audioWord?: string;
  options?: string[];
  answer: string;
  explanation?: string;
  /** Siêu dữ liệu chẩn đoán (Diagnostic Metadata) phục vụ phân tích điểm yếu & 1-click review */
  skill?: AssessmentSkill;
  subSkill?: string;
  conceptRef?: string;
  conceptName?: string;
  sourceStepId?: string;
  sourceStepTitle?: string;
  sourceUrl?: string;
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
 * GET /api/roadmap/checkpoint?unit=<unitId>&track=<cefr|thpt> — lắp bộ câu hỏi tổng hợp chặng
 * kèm siêu dữ liệu chẩn đoán (Diagnostic Metadata) gắn liền với node nguồn.
 * Trộn loại: vocab 2 chiều + typing + grammar + minimal pair (hoặc reading nếu THPT).
 * Mỗi lần gọi trả bộ trộn khác nhau (làm lại = câu khác).
 * Câu CUỐI luôn là MCQ vocab dễ (scaffold ending — kết thúc bằng cảm giác thắng).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const unitId = req.nextUrl.searchParams.get('unit') ?? '';
    const trackParam = req.nextUrl.searchParams.get('track') as RoadmapTrack | null;

    // Tìm chặng ở cả 3 track nếu không chỉ định
    let resolved = trackParam
      ? resolveUnit(unitId, trackParam)
      : (resolveUnit(unitId, 'cefr') || resolveUnit(unitId, 'thpt') || resolveUnit(unitId, 'toeic'));

    if (!resolved) {
      return NextResponse.json({ success: false, error: 'Chặng không tồn tại' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { unit, level } = resolved;
    const track: RoadmapTrack =
      unit.id.startsWith('u-thpt') || level.id.startsWith('lop-') ? 'thpt'
      : level.id.startsWith('toeic-') ? 'toeic'
      : 'cefr';

    // Ánh xạ từng từ về step nguồn
    const stepOfWord = new Map<string, { stepId: string; stepTitle: string; stepRef: string }>();
    const wordsOfPacks = (
      steps: Array<{ id: string; title: string; ref: string }>,
      mapTarget: Map<string, { stepId: string; stepTitle: string; stepRef: string }>
    ): string[] => {
      const out: string[] = [];
      for (const s of steps) {
        const starter = getStarterPack(s.ref);
        const packWords = starter ? starter.words : (resolvePack(s.ref)?.words ?? []);
        for (const w of packWords) {
          out.push(w);
          if (!mapTarget.has(w)) {
            mapTarget.set(w, { stepId: s.id, stepTitle: s.title, stepRef: s.ref });
          }
        }
      }
      return out;
    };

    // ── Vocab chặng HIỆN TẠI ──
    const vocabSteps = unit.steps.filter((s) => s.type === 'vocab');
    const words = wordsOfPacks(vocabSteps, stepOfWord);

    // ── Ôn xoáy ốc: từ các chặng ĐÃ QUA trong cùng cấp (spiral review) ──
    const priorStepOfWord = new Map<string, { stepId: string; stepTitle: string; stepRef: string }>();
    const priorSteps = level.units
      .filter((u) => u.index < unit.index)
      .flatMap((u) => u.steps.filter((s) => s.type === 'vocab'));
    const priorWords = wordsOfPacks(priorSteps, priorStepOfWord);

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
      const stepInfo = priorStepOfWord.get(w) || {
        stepId: '',
        stepTitle: 'Từ vựng chặng trước',
        stepRef: '',
      };
      const sourceUrl = stepInfo.stepId
        ? getReviewUrlForStep(stepInfo.stepId, 'vocab', stepInfo.stepRef, track)
        : `/journey?track=${track}`;

      questions.push({
        id: `cq-rv-${w}`,
        type: 'meaning-to-word',
        prompt: `[Ôn lại] Từ nào nghĩa là "${meaningOf.get(w)}"?`,
        options: shuffle([w, ...distractors]),
        answer: w,
        skill: 'vocab',
        subSkill: 'meaning-to-word',
        conceptRef: w,
        conceptName: `Từ vựng: ${w}`,
        sourceStepId: stepInfo.stepId,
        sourceStepTitle: stepInfo.stepTitle,
        sourceUrl,
      });
    }

    // 3 câu meaning→word
    for (const w of vocabPool.slice(0, 3)) {
      const distractors = shuffle(vocabPool.filter((x) => x !== w)).slice(0, 3);
      const stepInfo = stepOfWord.get(w) || {
        stepId: '',
        stepTitle: unit.title,
        stepRef: '',
      };
      const sourceUrl = stepInfo.stepId
        ? getReviewUrlForStep(stepInfo.stepId, 'vocab', stepInfo.stepRef, track)
        : `/journey?track=${track}`;

      questions.push({
        id: `cq-mw-${w}`,
        type: 'meaning-to-word',
        prompt: `Từ nào nghĩa là "${meaningOf.get(w)}"?`,
        options: shuffle([w, ...distractors]),
        answer: w,
        skill: 'vocab',
        subSkill: 'meaning-to-word',
        conceptRef: w,
        conceptName: `Từ vựng: ${w}`,
        sourceStepId: stepInfo.stepId,
        sourceStepTitle: stepInfo.stepTitle,
        sourceUrl,
      });
    }

    // 2 câu word→meaning
    for (const w of vocabPool.slice(3, 5)) {
      const distractors = shuffle(vocabPool.filter((x) => x !== w))
        .slice(0, 3)
        .map((x) => meaningOf.get(x)!);
      const stepInfo = stepOfWord.get(w) || {
        stepId: '',
        stepTitle: unit.title,
        stepRef: '',
      };
      const sourceUrl = stepInfo.stepId
        ? getReviewUrlForStep(stepInfo.stepId, 'vocab', stepInfo.stepRef, track)
        : `/journey?track=${track}`;

      questions.push({
        id: `cq-wm-${w}`,
        type: 'word-to-meaning',
        prompt: `"${w}" nghĩa là gì?`,
        options: shuffle([meaningOf.get(w)!, ...distractors]),
        answer: meaningOf.get(w)!,
        skill: 'vocab',
        subSkill: 'word-to-meaning',
        conceptRef: w,
        conceptName: `Từ vựng: ${w}`,
        sourceStepId: stepInfo.stepId,
        sourceStepTitle: stepInfo.stepTitle,
        sourceUrl,
      });
    }

    // 1 câu typing (nghĩa → gõ từ)
    const typingWord = vocabPool[5];
    if (typingWord) {
      const stepInfo = stepOfWord.get(typingWord) || {
        stepId: '',
        stepTitle: unit.title,
        stepRef: '',
      };
      const sourceUrl = stepInfo.stepId
        ? getReviewUrlForStep(stepInfo.stepId, 'vocab', stepInfo.stepRef, track)
        : `/journey?track=${track}`;

      questions.push({
        id: `cq-ty-${typingWord}`,
        type: 'typing',
        prompt: `Gõ từ tiếng Anh có nghĩa: "${meaningOf.get(typingWord)}"`,
        answer: typingWord,
        skill: 'vocab',
        subSkill: 'typing',
        conceptRef: typingWord,
        conceptName: `Từ vựng: ${typingWord}`,
        sourceStepId: stepInfo.stepId,
        sourceStepTitle: stepInfo.stepTitle,
        sourceUrl,
      });
    }

    // 1 câu listening: nghe audio → chọn từ
    const listenWord = vocabPool[6];
    if (listenWord) {
      const distractors = shuffle(vocabPool.filter((x) => x !== listenWord)).slice(0, 3);
      const stepInfo = stepOfWord.get(listenWord) || {
        stepId: '',
        stepTitle: unit.title,
        stepRef: '',
      };
      const sourceUrl = stepInfo.stepId
        ? getReviewUrlForStep(stepInfo.stepId, 'vocab', stepInfo.stepRef, track)
        : `/journey?track=${track}`;

      questions.push({
        id: `cq-ls-${listenWord}`,
        type: 'listening-choice',
        prompt: 'Nghe và chọn từ bạn nghe được:',
        audioWord: listenWord,
        options: shuffle([listenWord, ...distractors]),
        answer: listenWord,
        skill: 'vocab',
        subSkill: 'listening-choice',
        conceptRef: listenWord,
        conceptName: `Từ vựng: ${listenWord}`,
        sourceStepId: stepInfo.stepId,
        sourceStepTitle: stepInfo.stepTitle,
        sourceUrl,
      });
    }

    // ── Grammar: lấy exercises từ lesson của topic trong chặng ──
    const grammarStep = unit.steps.find((s) => s.type === 'grammar');
    const grammarSlug = grammarStep?.ref;
    if (grammarSlug) {
      const grammarTitle = grammarStep?.title || grammarSlug;
      const sourceStepId = grammarStep?.id || '';
      const sourceUrl = getReviewUrlForStep(sourceStepId, 'grammar', grammarSlug, track);

      const { data: topic } = await supabase
        .from('grammar_topics')
        .select('id, title, level')
        .eq('slug', grammarSlug)
        .maybeSingle();

      if (topic) {
        const { data: lessons } = await supabase
          .from('grammar_lessons')
          .select('id, exercises')
          .eq('topic_id', topic.id)
          .limit(1);

        const lessonId = lessons?.[0]?.id ?? grammarSlug;
        const rawList = (lessons?.[0]?.exercises ?? []) as LessonExercise[];
        const normalized = rawList
          .map((raw, i) =>
            normalizeLessonExercise(
              raw,
              lessonId,
              i,
              topic.title || grammarSlug,
              topic.level || 'intermediate',
              'cp'
            )
          )
          .filter((e) => {
            // Cần có đề + ≥2 options + đáp án khớp mềm
            if (!e.question.trim() || e.options.length < 2 || !e.correct_answer) return false;
            return e.options.some(
              (o) => o.trim().toLowerCase() === e.correct_answer.trim().toLowerCase()
            );
          });

        for (const [i, e] of shuffle(normalized).slice(0, 4).entries()) {
          questions.push({
            id: `cq-gr-${grammarSlug}-${i}`,
            type: 'grammar-mcq',
            prompt: e.question,
            options: e.options,
            answer: e.correct_answer,
            explanation: e.explanation || undefined,
            skill: 'grammar',
            subSkill: 'grammar-mcq',
            conceptRef: grammarSlug,
            conceptName: `Ngữ pháp: ${grammarTitle}`,
            sourceStepId,
            sourceStepTitle: grammarTitle,
            sourceUrl,
          });
        }
      }
    }

    // ── Minimal pair (nếu chặng có bài phát âm) ──
    const pronStep = unit.steps.find((s) => s.type === 'pronunciation');
    const pronId = pronStep?.ref;
    if (pronId) {
      const pronTitle = pronStep?.title || pronId;
      const sourceStepId = pronStep?.id || '';
      const sourceUrl = getReviewUrlForStep(sourceStepId, 'pronunciation', pronId, track);

      const lesson = getPronunciationLesson(pronId);
      const pairs = (lesson?.minimalPairs ?? []).filter(
        (p) => /^[a-zA-Z' ]+$/.test(p.a) && /^[a-zA-Z' ]+$/.test(p.b)
      );

      for (const [i, pair] of shuffle(pairs).slice(0, 2).entries()) {
        const target = Math.random() < 0.5 ? pair.a : pair.b;
        questions.push({
          id: `cq-mp-${pronId}-${i}`,
          type: 'minimal-pair',
          prompt: 'Nghe và chọn đúng từ bạn nghe được:',
          audioWord: target,
          options: shuffle([pair.a, pair.b]),
          answer: target,
          explanation: pair.note || undefined,
          skill: 'pronunciation',
          subSkill: 'minimal-pair',
          conceptRef: pronId,
          conceptName: `Phát âm: ${pronTitle} (${pair.a} vs ${pair.b})`,
          sourceStepId,
          sourceStepTitle: pronTitle,
          sourceUrl,
        });
      }
    }

    // ── Reading / Dạng bài thi THPT (nếu là track THPT và chặng có bài đọc) ──
    const readingStep = unit.steps.find((s) => s.type === 'reading');
    if (readingStep) {
      const readItem = getThptContent('reading', readingStep.ref);
      if (readItem && 'questions' in readItem && Array.isArray(readItem.questions)) {
        const sourceUrl = getReviewUrlForStep(readingStep.id, 'reading', readingStep.ref, track);
        const sampled = shuffle(readItem.questions).slice(0, 2);
        for (const [i, rq] of sampled.entries()) {
          questions.push({
            id: `cq-rd-${readingStep.ref}-${i}`,
            type: 'meaning-to-word',
            prompt: `[Đọc hiểu: ${readItem.title}] ${rq.q}`,
            options: shuffle(rq.options),
            answer: rq.answer,
            explanation: rq.explain,
            skill: 'reading',
            subSkill: 'reading-comprehension',
            conceptRef: readingStep.ref,
            conceptName: `Đọc hiểu: ${readingStep.title}`,
            sourceStepId: readingStep.id,
            sourceStepTitle: readingStep.title,
            sourceUrl,
          });
        }
      }
    }

    // Trộn tất cả nhưng giữ câu CUỐI là MCQ vocab dễ (scaffold ending — kết thúc bằng cảm giác thắng)
    const easyLast = questions.find((q) => q.type === 'meaning-to-word');
    const rest = shuffle(questions.filter((q) => q !== easyLast));
    const finalQuestions = easyLast ? [...rest, easyLast] : rest;

    return NextResponse.json({
      success: true,
      data: {
        unitId,
        track,
        title: unit.title,
        questions: finalQuestions,
        passPct: 80,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
