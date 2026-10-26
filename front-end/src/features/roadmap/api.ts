/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  callDotNetRaw,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import { buildRoadmapTreeFromDto, mapTrackToDotNet } from '@/features/roadmap/mappers';
import {
  getFoundationVerb,
  getPlacement,
  getPronunciationLesson,
  getStarterPack,
  getThptContent,
  resolveUnit,
  scorePlacement,
  type RoadmapTrack,
} from '@/lib/roadmap';
import { resolvePack } from '@/lib/vocab-catalog';
import { getReviewUrlForStep, type AssessmentSkill } from '@/lib/roadmap-assessment';

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
  audioWord?: string;
  options?: string[];
  answer: string;
  explanation?: string;
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

function buildCheckpointPayload(unitId: string, trackParam?: RoadmapTrack | null) {
  const resolved = trackParam
    ? resolveUnit(unitId, trackParam)
    : resolveUnit(unitId, 'cefr') ||
      resolveUnit(unitId, 'thpt') ||
      resolveUnit(unitId, 'toeic');

  if (!resolved) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        error: 'Chặng không tồn tại',
      },
    };
  }

  const { unit, level } = resolved;
  const track: RoadmapTrack =
    unit.id.startsWith('u-thpt') || level.id.startsWith('lop-')
      ? 'thpt'
      : level.id.startsWith('toeic-')
        ? 'toeic'
        : 'cefr';

  const stepOfWord = new Map<string, { stepId: string; stepTitle: string; stepRef: string }>();
  const wordsOfPacks = (
    steps: Array<{ id: string; title: string; ref: string }>,
    mapTarget: Map<string, { stepId: string; stepTitle: string; stepRef: string }>,
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

  const vocabSteps = unit.steps.filter((s) => s.type === 'vocab');
  const words = wordsOfPacks(vocabSteps, stepOfWord);

  const priorStepOfWord = new Map<
    string,
    { stepId: string; stepTitle: string; stepRef: string }
  >();
  const priorSteps = level.units
    .filter((u) => u.index < unit.index)
    .flatMap((u) => u.steps.filter((s) => s.type === 'vocab'));
  const priorWords = wordsOfPacks(priorSteps, priorStepOfWord);

  const allWords = [...new Set([...words, ...priorWords])];
  const meaningOf = new Map<string, string>();
  for (const w of allWords) {
    const verbItem = getFoundationVerb(w);
    meaningOf.set(w, verbItem?.meaningVi || w);
  }

  const vocabPool = shuffle(words.filter((w) => meaningOf.has(w)));
  const priorPool = shuffle(priorWords.filter((w) => meaningOf.has(w) && !words.includes(w)));
  const questions: CheckpointQuestion[] = [];

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

  const pronStep = unit.steps.find((s) => s.type === 'pronunciation');
  const pronId = pronStep?.ref;
  if (pronId) {
    const pronTitle = pronStep?.title || pronId;
    const sourceStepId = pronStep?.id || '';
    const sourceUrl = getReviewUrlForStep(sourceStepId, 'pronunciation', pronId, track);
    const lesson = getPronunciationLesson(pronId);
    const pairs = (lesson?.minimalPairs ?? []).filter(
      (p) => /^[a-zA-Z' ]+$/.test(p.a) && /^[a-zA-Z' ]+$/.test(p.b),
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

  const easyLast = questions.find((q) => q.type === 'meaning-to-word');
  const rest = shuffle(questions.filter((q) => q !== easyLast));
  const finalQuestions = easyLast ? [...rest, easyLast] : rest;

  return {
    ok: true,
    status: 200,
    payload: {
      success: true,
      data: {
        unitId,
        track,
        title: unit.title,
        questions: finalQuestions,
        passPct: 80,
      },
    },
  };
}

/**
 * Domain API service for Learning Roadmaps, Placement Diagnostics, Checkpoints, and Step Progress.
 */
export class RoadmapApi {
  /**
   * Retrieves the hydrated roadmap tree for the specified track via `GET /api/v1/roadmap`.
   */
  public static async getRoadmap(track?: string | null) {
    let trackParam = track ?? null;
    if (trackParam && trackParam.includes('?')) {
      const sp = new URLSearchParams(trackParam.slice(trackParam.indexOf('?') + 1));
      trackParam = sp.get('track');
    }
    const dotNetTrack = mapTrackToDotNet(trackParam);
    const { ok, body } = await callDotNetRaw<Record<string, any>>('/roadmap', {
      method: 'GET',
      params: { track: dotNetTrack },
    });
    const dto = ok ? (body?.data ?? null) : null;
    const treeData = buildRoadmapTreeFromDto(trackParam, dto);
    return withResponseCompat({
      success: true,
      data: treeData,
    });
  }

  /**
   * Retrieves placement diagnostic test questions from the embedded catalog.
   */
  public static async getPlacementTest() {
    return withResponseCompat({
      success: true,
      data: getPlacement(),
    });
  }

  /**
   * Submits placement diagnostic results via `POST /api/v1/roadmap/placement`.
   */
  public static async submitPlacement(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const computedLevel =
      body.levelId ||
      body.level ||
      (body.answers && typeof body.answers === 'object'
        ? scorePlacement(body.answers as Record<string, string>)
        : 'A1');
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>(
      '/roadmap/placement',
      {
        method: 'POST',
        data: {
          track: mapTrackToDotNet(body.track),
          levelId: computedLevel,
        },
      },
    );
    return withResponseCompat(
      {
        success: ok,
        data: resBody?.data ?? { levelId: computedLevel },
        error: resBody?.message,
      },
      status,
      ok,
    );
  }

  /**
   * Marks a roadmap step as completed via `POST /api/v1/roadmap/steps/complete`.
   */
  public static async completeStep(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>(
      '/roadmap/steps/complete',
      {
        method: 'POST',
        data: {
          stepId: body.stepId,
          score: body.score ?? 100,
        },
      },
    );
    return withResponseCompat(
      {
        success: ok,
        data: {
          xpAwarded: resBody?.data?.xpAwarded ?? 15,
          unitCompleted: false,
          levelCompleted: false,
          levelId: 'A1',
        },
        error: resBody?.message,
      },
      status,
      ok,
    );
  }

  /**
   * Loads checkpoint assessment data for a unit from the embedded curriculum catalog.
   */
  public static async getCheckpoint(unitIdOrUrl: string) {
    let unit = unitIdOrUrl;
    let track: RoadmapTrack | null = null;
    if (unitIdOrUrl.includes('?')) {
      const sp = new URLSearchParams(unitIdOrUrl.slice(unitIdOrUrl.indexOf('?') + 1));
      unit = sp.get('unit') || unitIdOrUrl;
      track = (sp.get('track') as RoadmapTrack | null) ?? null;
    }
    const { ok, status, payload } = buildCheckpointPayload(unit, track);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Submits a roadmap checkpoint, mini-quiz, or level exit assessment.
   */
  public static async submitAssessment(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    if (body.passed && body.stepId) {
      await callDotNetRaw('/roadmap/steps/complete', {
        method: 'POST',
        data: {
          stepId: body.stepId,
          score: Number(body.score ?? 100),
        },
      });
    }
    return withResponseCompat({
      success: true,
      data: {
        id: `attempt-${Date.now()}`,
        targetId: body.targetId,
        tier: body.tier || 'checkpoint',
        score: Number(body.score ?? 0),
        passed: Boolean(body.passed),
      },
    });
  }
}
