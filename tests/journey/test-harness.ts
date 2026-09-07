/**
 * E2E & Integration Test Harness for Learning Roadmap / Journey Modernization.
 * Self-contained, zero-external-dependency test runner, in-memory Supabase emulator,
 * LocalStorage fallback simulator, and assessment diagnostic engine.
 */

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

export interface SuiteStats {
  suiteName: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResult[];
}

export class TestRunner {
  private currentSuite = 'Default Suite';
  private results: TestResult[] = [];
  private beforeHooks: (() => Promise<void> | void)[] = [];
  private afterHooks: (() => Promise<void> | void)[] = [];

  describe(name: string, fn: () => void | Promise<void>) {
    this.currentSuite = name;
    fn();
  }

  beforeEach(fn: () => Promise<void> | void) {
    this.beforeHooks.push(fn);
  }

  afterEach(fn: () => Promise<void> | void) {
    this.afterHooks.push(fn);
  }

  async it(name: string, fn: () => Promise<void> | void): Promise<void> {
    const start = Date.now();
    for (const hook of this.beforeHooks) {
      await hook();
    }

    try {
      await fn();
      const durationMs = Date.now() - start;
      this.results.push({
        suite: this.currentSuite,
        name,
        passed: true,
        durationMs,
      });
      console.log(`  [PASS] ${name} (${durationMs}ms)`);
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      const error = err instanceof Error ? err : new Error(String(err));
      this.results.push({
        suite: this.currentSuite,
        name,
        passed: false,
        durationMs,
        error,
      });
      console.error(`  [FAIL] ${name} (${durationMs}ms) -> ${error.message}`);
    } finally {
      for (const hook of this.afterHooks) {
        await hook();
      }
    }
  }

  getStats(): SuiteStats {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = total - passed;
    const durationMs = this.results.reduce((acc, r) => acc + r.durationMs, 0);

    return {
      suiteName: this.currentSuite,
      total,
      passed,
      failed,
      durationMs,
      results: this.results,
    };
  }

  clear() {
    this.results = [];
    this.beforeHooks = [];
    this.afterHooks = [];
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Expect & Assertion Library
// ──────────────────────────────────────────────────────────────────────────

export function expect<T>(actual: T) {
  const matchers = (negate: boolean) => ({
    toBe(expected: unknown) {
      const pass = actual === expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to be' : 'to be'} ${JSON.stringify(expected)}`,
        );
      }
    },
    toEqual(expected: unknown) {
      const pass = JSON.stringify(actual) === JSON.stringify(expected);
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to equal' : 'to equal'} ${JSON.stringify(expected)}`,
        );
      }
    },
    toContain(item: unknown) {
      let pass = false;
      if (typeof actual === 'string') {
        pass = actual.includes(String(item));
      } else if (Array.isArray(actual)) {
        pass = actual.includes(item);
      }
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to contain' : 'to contain'} ${JSON.stringify(item)}`,
        );
      }
    },
    toMatch(regex: RegExp) {
      const pass = typeof actual === 'string' && regex.test(actual);
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected "${actual}" ${negate ? 'not to match' : 'to match'} ${regex.toString()}`,
        );
      }
    },
    toBeGreaterThan(expected: number) {
      const pass = typeof actual === 'number' && actual > expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${negate ? 'not to be greater than' : 'to be greater than'} ${expected}`,
        );
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      const pass = typeof actual === 'number' && actual >= expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${negate ? 'not to be >=' : 'to be >='} ${expected}`,
        );
      }
    },
    toBeLessThan(expected: number) {
      const pass = typeof actual === 'number' && actual < expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${negate ? 'not to be less than' : 'to be less than'} ${expected}`,
        );
      }
    },
    toBeLessThanOrEqual(expected: number) {
      const pass = typeof actual === 'number' && actual <= expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${negate ? 'not to be <=' : 'to be <='} ${expected}`,
        );
      }
    },
    toBeNull() {
      const pass = actual === null;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to be null' : 'to be null'}`,
        );
      }
    },
    toBeDefined() {
      const pass = actual !== undefined;
      if (negate ? pass : !pass) {
        throw new Error(`Expected value ${negate ? 'to be undefined' : 'to be defined'}`);
      }
    },
    toBeUndefined() {
      const pass = actual === undefined;
      if (negate ? pass : !pass) {
        throw new Error(`Expected value ${negate ? 'not to be undefined' : 'to be undefined'}`);
      }
    },
    toBeTruthy() {
      const pass = Boolean(actual);
      if (negate ? pass : !pass) {
        throw new Error(`Expected truthy value, got ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy() {
      const pass = !Boolean(actual);
      if (negate ? pass : !pass) {
        throw new Error(`Expected falsy value, got ${JSON.stringify(actual)}`);
      }
    },
    toThrow(expected?: string | RegExp) {
      if (typeof actual !== 'function') {
        throw new Error('Expected a function to test toThrow');
      }
      let threw = false;
      let errorMsg = '';
      try {
        (actual as Function)();
      } catch (e) {
        threw = true;
        errorMsg = e instanceof Error ? e.message : String(e);
      }
      if (negate ? threw : !threw) {
        throw new Error(
          negate
            ? 'Expected function not to throw, but it threw an error'
            : 'Expected function to throw an error, but it did not throw',
        );
      }
      if (!negate && expected) {
        if (typeof expected === 'string') {
          if (!errorMsg.includes(expected)) {
            throw new Error(
              `Expected error message to include "${expected}", but got: "${errorMsg}"`,
            );
          }
        } else if (!expected.test(errorMsg)) {
          throw new Error(
            `Expected error message to match ${expected}, but got: "${errorMsg}"`,
          );
        }
      }
    },
  });

  return {
    ...matchers(false),
    not: matchers(true),
  };
}

export async function assertRejects(
  fn: () => Promise<unknown> | unknown,
  expectedPattern?: RegExp | string,
): Promise<void> {
  let threw = false;
  let thrownError: unknown = null;
  try {
    await fn();
  } catch (err) {
    threw = true;
    thrownError = err;
  }

  if (!threw) {
    throw new Error('Expected function to throw an error, but it succeeded.');
  }

  if (expectedPattern && thrownError) {
    const msg = thrownError instanceof Error ? thrownError.message : String(thrownError);
    if (typeof expectedPattern === 'string') {
      if (!msg.includes(expectedPattern)) {
        throw new Error(
          `Expected error message to include "${expectedPattern}", but got: "${msg}"`,
        );
      }
    } else if (!expectedPattern.test(msg)) {
      throw new Error(
        `Expected error message to match ${expectedPattern}, but got: "${msg}"`,
      );
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Roadmap / Journey Domain Models & Type Definitions
// ──────────────────────────────────────────────────────────────────────────

export type RoadmapTrack = 'cefr' | 'thpt';
export type RoadmapLevelId = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'lop-10' | 'lop-11' | 'lop-12';
export type RoadmapStepType =
  | 'vocab'
  | 'grammar'
  | 'pronunciation'
  | 'checkpoint'
  | 'reading'
  | 'cloze'
  | 'arrange'
  | 'announcement'
  | 'leaflet'
  | 'exam'
  | 'exit_exam';

export type AssessmentTier = 'mini_quiz' | 'checkpoint' | 'exit_exam';
export type UnitStatus = 'completed' | 'in_progress' | 'locked' | 'review';

export interface RoadmapStepMetadata {
  id: string;
  type: RoadmapStepType;
  title: string;
  estimatedMinutes: number; // e.g. 10-15
  canDo?: string;           // Actionable can-do target
  topicPreview?: string;    // Short focal point preview
  refId?: string;
  wordCount?: number;
}

export interface RoadmapUnitMetadata {
  id: string;
  index: number;
  title: string;
  description: string;
  estimatedMinutes: number; // e.g. 45-60
  canDo: string[];          // Actionable learning objectives
  topicPreview: string;     // Short summary of core knowledge points
  badgeIcon?: string;       // Award badge icon on completion
  badgeName?: string;       // e.g. "A0 Starter Master"
  steps: RoadmapStepMetadata[];
}

export interface RoadmapLevelMetadata {
  id: RoadmapLevelId;
  title: string;
  titleVi: string;
  description: string;
  units: RoadmapUnitMetadata[];
  exitExam?: RoadmapStepMetadata;
}

export interface SkillScore {
  correct: number;
  total: number;
  score: number; // 0-100
}

export interface SkillBreakdownMap {
  vocab?: SkillScore;
  grammar?: SkillScore;
  pronunciation?: SkillScore;
  reading?: SkillScore;
}

export interface WeakConcept {
  conceptRef: string;
  title: string;
  skill: 'vocab' | 'grammar' | 'pronunciation' | 'reading';
  reviewStepId?: string;
  reviewUrl: string;
}

export interface AssessmentDetails {
  totalQuestions: number;
  correctAnswers: number;
  skillBreakdown?: SkillBreakdownMap;
  weakConcepts?: WeakConcept[];
  answers?: Record<string, string | number>;
  timeSpentSeconds?: number;
}

export interface AssessmentAttempt {
  id?: string;
  userId: string;
  track: RoadmapTrack;
  tier: AssessmentTier;
  targetId: string; // stepId, unitId, or levelId
  score: number;    // 0-100
  passed: boolean;  // true if score >= threshold
  details: AssessmentDetails;
  createdAt?: string;
}

export interface DiagnosticQuestion {
  id: string;
  skill: 'vocab' | 'grammar' | 'pronunciation' | 'reading';
  conceptRef: string;
  sourceStepId?: string;
  prompt: string;
  options: string[];
  correctAnswer: string | number;
  explanation: string;
}

// ──────────────────────────────────────────────────────────────────────────
// Interactive Widget Prop Signatures
// ──────────────────────────────────────────────────────────────────────────

export interface WordPairItem {
  id: string;
  left: string;
  right: string;
  leftAudio?: string;
  leftImage?: string;
}

export interface WordPairMatchWidgetProps {
  pairs: WordPairItem[];
  onComplete: (stats: { correct: number; attempts: number; elapsedSeconds: number }) => void;
}

export interface DialogueBlank {
  id: string;
  answer: string;
  options: string[];
}

export interface DialogueLine {
  speaker: string;
  text: string;
  blanks?: DialogueBlank[];
}

export interface DialogueClozeWidgetProps {
  dialogue: DialogueLine[];
  onComplete: (stats: { score: number; passed: boolean }) => void;
}

export interface TargetWordItem {
  word: string;
  pos: string;
  definition: string;
  audioUrl?: string;
}

export interface ComprehensionQuestionItem {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface ReadingPassageExplorerProps {
  passage: string;
  audioUrl?: string;
  targetWords: TargetWordItem[];
  comprehensionQuestions: ComprehensionQuestionItem[];
  onComplete: (stats: { score: number }) => void;
}

export interface MinimalPairItem {
  a: string;
  b: string;
  note?: string;
}

export interface PhoneticArticulationProps {
  ipa: string;
  mouthTip: string;
  whyHard: string;
  audioUrl?: string;
  minimalPairs: MinimalPairItem[];
  onComplete: (stats: { score: number; passed: boolean }) => void;
}

// ──────────────────────────────────────────────────────────────────────────
// Assessment Grading & Progress Calculation Engine
// ──────────────────────────────────────────────────────────────────────────

export const MINI_QUIZ_PASS_THRESHOLD = 75;
export const CHECKPOINT_PASS_THRESHOLD = 80;
export const EXIT_EXAM_PASS_THRESHOLD = 80;

export function gradeMiniQuiz(
  questions: Array<{ id: string; correctAnswer: string | number }>,
  answers: Record<string, string | number>,
): { score: number; passed: boolean; correctAnswers: number; totalQuestions: number } {
  if (questions.length === 0) {
    return { score: 0, passed: false, correctAnswers: 0, totalQuestions: 0 };
  }
  let correct = 0;
  for (const q of questions) {
    if (answers[q.id] !== undefined && String(answers[q.id]).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
      correct++;
    }
  }
  const score = Math.round((correct / questions.length) * 100);
  return {
    score,
    passed: score >= MINI_QUIZ_PASS_THRESHOLD,
    correctAnswers: correct,
    totalQuestions: questions.length,
  };
}

export function gradeCheckpoint(
  questions: DiagnosticQuestion[],
  answers: Record<string, string | number>,
  unitSteps: RoadmapStepMetadata[] = [],
): {
  score: number;
  passed: boolean;
  details: AssessmentDetails;
} {
  if (questions.length === 0) {
    return {
      score: 0,
      passed: false,
      details: { totalQuestions: 0, correctAnswers: 0, skillBreakdown: {}, weakConcepts: [] },
    };
  }

  let totalCorrect = 0;
  const skillCounts: Record<string, { correct: number; total: number }> = {
    vocab: { correct: 0, total: 0 },
    grammar: { correct: 0, total: 0 },
    pronunciation: { correct: 0, total: 0 },
    reading: { correct: 0, total: 0 },
  };

  const weakConceptsMap = new Map<string, WeakConcept>();

  for (const q of questions) {
    const isCorrect =
      answers[q.id] !== undefined &&
      String(answers[q.id]).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

    if (skillCounts[q.skill]) {
      skillCounts[q.skill].total++;
      if (isCorrect) skillCounts[q.skill].correct++;
    }

    if (isCorrect) {
      totalCorrect++;
    } else {
      // Find source step for deep remedial link
      const matchedStep = unitSteps.find(
        (s) => s.id === q.sourceStepId || s.refId === q.conceptRef || s.type === q.skill,
      );
      const reviewStepId = q.sourceStepId || matchedStep?.id;
      const reviewUrl = reviewStepId
        ? `/journey?focusStep=${reviewStepId}`
        : `/journey?skill=${q.skill}`;

      weakConceptsMap.set(q.conceptRef, {
        conceptRef: q.conceptRef,
        title: q.prompt.length > 50 ? q.prompt.slice(0, 47) + '...' : q.prompt,
        skill: q.skill,
        reviewStepId,
        reviewUrl,
      });
    }
  }

  const score = Math.round((totalCorrect / questions.length) * 100);
  const skillBreakdown: SkillBreakdownMap = {};

  for (const [skill, counts] of Object.entries(skillCounts)) {
    if (counts.total > 0) {
      const skillScore = Math.round((counts.correct / counts.total) * 100);
      skillBreakdown[skill as keyof SkillBreakdownMap] = {
        correct: counts.correct,
        total: counts.total,
        score: skillScore,
      };
    }
  }

  return {
    score,
    passed: score >= CHECKPOINT_PASS_THRESHOLD,
    details: {
      totalQuestions: questions.length,
      correctAnswers: totalCorrect,
      skillBreakdown,
      weakConcepts: Array.from(weakConceptsMap.values()),
      answers,
    },
  };
}

export function gradeExitExam(
  questions: DiagnosticQuestion[],
  answers: Record<string, string | number>,
  levelId: RoadmapLevelId,
): {
  score: number;
  passed: boolean;
  details: AssessmentDetails;
  badgeAwarded?: string;
} {
  const result = gradeCheckpoint(questions, answers);
  const passed = result.score >= EXIT_EXAM_PASS_THRESHOLD;
  const badgeMap: Record<string, string> = {
    A0: 'badge_a0_graduate',
    A1: 'badge_a1_graduate',
    A2: 'badge_a2_graduate',
    B1: 'badge_b1_graduate',
    B2: 'badge_b2_graduate',
    'lop-10': 'badge_thpt10_graduate',
    'lop-11': 'badge_thpt11_graduate',
    'lop-12': 'badge_thpt12_graduate',
  };

  return {
    score: result.score,
    passed,
    details: result.details,
    badgeAwarded: passed ? badgeMap[levelId] : undefined,
  };
}

export function calculateUnitProgress(
  unit: RoadmapUnitMetadata,
  completedStepIds: Set<string>,
): {
  totalSteps: number;
  completedSteps: number;
  percentage: number;
  status: UnitStatus;
} {
  const totalSteps = unit.steps.length;
  if (totalSteps === 0) {
    return { totalSteps: 0, completedSteps: 0, percentage: 0, status: 'locked' };
  }

  let completedSteps = 0;
  for (const step of unit.steps) {
    if (completedStepIds.has(step.id)) {
      completedSteps++;
    }
  }

  const percentage = Math.round((completedSteps / totalSteps) * 100);
  let status: UnitStatus = 'locked';

  if (completedSteps === totalSteps) {
    status = 'completed';
  } else if (completedSteps > 0) {
    status = 'in_progress';
  }

  return {
    totalSteps,
    completedSteps,
    percentage,
    status,
  };
}

export function formatEstimatedMinutes(minutes: number): string {
  if (minutes < 60) {
    return `~${minutes} phút`;
  }
  const hours = (minutes / 60).toFixed(1).replace(/\.0$/, '');
  return `~${hours} giờ`;
}

// ──────────────────────────────────────────────────────────────────────────
// Mock Database & Supabase Emulator
// ──────────────────────────────────────────────────────────────────────────

export interface MockUserRoadmapRow {
  user_id: string;
  track: RoadmapTrack;
  roadmap_version: string;
  level_id: string;
  current_unit_id: string | null;
  placement?: any;
  started_at: string;
  updated_at: string;
}

export interface MockUserRoadmapStepRow {
  user_id: string;
  step_id: string;
  status: 'in_progress' | 'completed';
  score: number | null;
  completed_at: string | null;
  created_at: string;
}

export interface MockUserRoadmapAssessmentRow {
  id: string;
  user_id: string;
  track: RoadmapTrack;
  tier: AssessmentTier;
  target_id: string;
  score: number;
  passed: boolean;
  details: any;
  created_at: string;
}

export interface MockUserGamificationRow {
  user_id: string;
  xp: number;
  current_streak: number;
  best_streak: number;
  badges: string[];
}

export interface MockJourneyDatabaseState {
  user_roadmap: MockUserRoadmapRow[];
  user_roadmap_steps: MockUserRoadmapStepRow[];
  user_roadmap_assessments: MockUserRoadmapAssessmentRow[];
  user_gamification: MockUserGamificationRow[];
}

export function createInitialJourneyMockDb(): MockJourneyDatabaseState {
  return {
    user_roadmap: [
      {
        user_id: 'learner-cefr-1',
        track: 'cefr',
        roadmap_version: 'roadmap-v1',
        level_id: 'A0',
        current_unit_id: 'u-a0-1',
        started_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
      },
      {
        user_id: 'learner-thpt-1',
        track: 'thpt',
        roadmap_version: 'roadmap-v1',
        level_id: 'lop-10',
        current_unit_id: 'u-thpt10-1',
        started_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
      },
      {
        user_id: 'learner-dual-1',
        track: 'cefr',
        roadmap_version: 'roadmap-v1',
        level_id: 'A1',
        current_unit_id: 'u-a1-1',
        started_at: '2026-08-15T00:00:00Z',
        updated_at: '2026-08-15T00:00:00Z',
      },
      {
        user_id: 'learner-dual-1',
        track: 'thpt',
        roadmap_version: 'roadmap-v1',
        level_id: 'lop-11',
        current_unit_id: 'u-thpt11-1',
        started_at: '2026-08-15T00:00:00Z',
        updated_at: '2026-08-15T00:00:00Z',
      },
    ],
    user_roadmap_steps: [],
    user_roadmap_assessments: [],
    user_gamification: [
      {
        user_id: 'learner-cefr-1',
        xp: 0,
        current_streak: 1,
        best_streak: 1,
        badges: [],
      },
      {
        user_id: 'learner-thpt-1',
        xp: 0,
        current_streak: 2,
        best_streak: 2,
        badges: [],
      },
      {
        user_id: 'learner-dual-1',
        xp: 150,
        current_streak: 5,
        best_streak: 7,
        badges: ['journey_unit_1'],
      },
    ],
  };
}

export function createMockJourneySupabaseClient(initialDb?: MockJourneyDatabaseState) {
  const db: MockJourneyDatabaseState = initialDb || createInitialJourneyMockDb();
  let authedUser: { id: string; email?: string } | null = {
    id: 'learner-cefr-1',
    email: 'learner@lingopro.vn',
  };

  let failNextQuery = false;

  const client = {
    _db: db,
    setAuthUser(user: { id: string; email?: string } | null) {
      authedUser = user;
    },
    setSimulateFailure(fail: boolean) {
      failNextQuery = fail;
    },
    auth: {
      async getUser() {
        if (!authedUser) return { data: { user: null }, error: new Error('Unauthorized') };
        return { data: { user: authedUser }, error: null };
      },
    },
    from(tableName: keyof MockJourneyDatabaseState) {
      const filters: Array<(item: any) => boolean> = [];
      let orderByField: string | null = null;
      let orderAscending = true;
      let limitCount: number | null = null;

      const queryBuilder = {
        select(fields = '*') {
          return queryBuilder;
        },
        eq(field: string, value: any) {
          filters.push((item) => item[field] === value);
          return queryBuilder;
        },
        in(field: string, values: any[]) {
          filters.push((item) => values.includes(item[field]));
          return queryBuilder;
        },
        order(field: string, opts?: { ascending?: boolean }) {
          orderByField = field;
          orderAscending = opts?.ascending ?? true;
          return queryBuilder;
        },
        limit(count: number) {
          limitCount = count;
          return queryBuilder;
        },
        async single() {
          if (failNextQuery) {
            failNextQuery = false;
            return { data: null, error: new Error('Simulated Supabase query error') };
          }
          const rows = queryBuilder._execute();
          if (rows.length === 0) {
            return { data: null, error: new Error(`Row not found in ${String(tableName)}`) };
          }
          return { data: rows[0], error: null };
        },
        async maybeSingle() {
          if (failNextQuery) {
            failNextQuery = false;
            return { data: null, error: new Error('Simulated Supabase query error') };
          }
          const rows = queryBuilder._execute();
          return { data: rows[0] || null, error: null };
        },
        async then(resolve: (value: { data: any; error: any }) => void) {
          if (failNextQuery) {
            failNextQuery = false;
            resolve({ data: null, error: new Error('Simulated Supabase query error') });
            return;
          }
          const rows = queryBuilder._execute();
          resolve({ data: rows, error: null });
        },
        _execute() {
          const table = (db[tableName] as any[]) || [];
          let result = table.filter((item) => filters.every((fn) => fn(item)));
          if (orderByField) {
            result = [...result].sort((a, b) => {
              if (a[orderByField!] < b[orderByField!]) return orderAscending ? -1 : 1;
              if (a[orderByField!] > b[orderByField!]) return orderAscending ? 1 : -1;
              return 0;
            });
          }
          if (limitCount !== null) {
            result = result.slice(0, limitCount);
          }
          return result;
        },
        insert(records: any | any[]) {
          if (failNextQuery) {
            failNextQuery = false;
            return {
              select: () => ({
                single: async () => ({ data: null, error: new Error('Simulated insert error') }),
                then: (res: any) => res({ data: null, error: new Error('Simulated insert error') }),
              }),
              then: (res: any) => res({ data: null, error: new Error('Simulated insert error') }),
            };
          }
          const list = Array.isArray(records) ? records : [records];
          const inserted: any[] = [];
          for (const item of list) {
            const row = {
              id: item.id || `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              created_at: item.created_at || new Date().toISOString(),
              ...item,
            };
            (db[tableName] as any[]).push(row);
            inserted.push(row);
          }

          return {
            select(fields = '*') {
              return {
                single: async () => ({ data: inserted[0], error: null }),
                maybeSingle: async () => ({ data: inserted[0] || null, error: null }),
                then: (resolve: (v: { data: any[]; error: any }) => void) =>
                  resolve({ data: inserted, error: null }),
              };
            },
            async single() {
              return { data: inserted[0], error: null };
            },
            async then(resolve: (v: { data: any[]; error: any }) => void) {
              resolve({ data: inserted, error: null });
            },
          };
        },
        upsert(records: any | any[], opts?: { onConflict?: string }) {
          const list = Array.isArray(records) ? records : [records];
          const upserted: any[] = [];
          const conflictFields = opts?.onConflict ? opts.onConflict.split(',').map((s) => s.trim()) : ['id'];

          for (const item of list) {
            const table = db[tableName] as any[];
            const existingIdx = table.findIndex((existing) =>
              conflictFields.every((field) => existing[field] === item[field]),
            );

            if (existingIdx >= 0) {
              Object.assign(table[existingIdx], item, { updated_at: new Date().toISOString() });
              upserted.push(table[existingIdx]);
            } else {
              const row = {
                id: item.id || `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                created_at: item.created_at || new Date().toISOString(),
                ...item,
              };
              table.push(row);
              upserted.push(row);
            }
          }

          return {
            select(fields = '*') {
              return {
                single: async () => ({ data: upserted[0], error: null }),
                then: (resolve: (v: { data: any[]; error: any }) => void) =>
                  resolve({ data: upserted, error: null }),
              };
            },
            async single() {
              return { data: upserted[0], error: null };
            },
            async then(resolve: (v: { data: any[]; error: any }) => void) {
              resolve({ data: upserted, error: null });
            },
          };
        },
        update(updates: any) {
          return {
            eq(field: string, value: any) {
              filters.push((item) => item[field] === value);
              return {
                select(fields = '*') {
                  return {
                    single: async () => {
                      const rows = queryBuilder._execute();
                      if (rows.length === 0) return { data: null, error: new Error('Update row not found') };
                      Object.assign(rows[0], updates);
                      return { data: rows[0], error: null };
                    },
                  };
                },
                then: async (resolve: (v: { data: any; error: any }) => void) => {
                  const rows = queryBuilder._execute();
                  for (const r of rows) {
                    Object.assign(r, updates);
                  }
                  resolve({ data: rows, error: null });
                },
              };
            },
          };
        },
      };

      return queryBuilder;
    },
  };

  return client;
}

// ──────────────────────────────────────────────────────────────────────────
// LocalStorage Fallback Emulator
// ──────────────────────────────────────────────────────────────────────────

export class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Offline Assessment Sync Manager
// ──────────────────────────────────────────────────────────────────────────

export class OfflineAssessmentSyncManager {
  private storageKey = 'vocab_roadmap_pending_assessments';

  constructor(private storage: MockLocalStorage) {}

  saveAttemptOffline(attempt: AssessmentAttempt): void {
    const existingStr = this.storage.getItem(this.storageKey);
    const pending: AssessmentAttempt[] = existingStr ? JSON.parse(existingStr) : [];
    pending.push({
      ...attempt,
      id: attempt.id || `offline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: attempt.createdAt || new Date().toISOString(),
    });
    this.storage.setItem(this.storageKey, JSON.stringify(pending));
  }

  getPendingAttempts(): AssessmentAttempt[] {
    const existingStr = this.storage.getItem(this.storageKey);
    return existingStr ? JSON.parse(existingStr) : [];
  }

  clearPendingAttempts(): void {
    this.storage.removeItem(this.storageKey);
  }

  async syncPendingAttempts(supabaseClient: ReturnType<typeof createMockJourneySupabaseClient>): Promise<{
    syncedCount: number;
    failedCount: number;
  }> {
    const pending = this.getPendingAttempts();
    if (pending.length === 0) return { syncedCount: 0, failedCount: 0 };

    let synced = 0;
    let failed = 0;
    const remaining: AssessmentAttempt[] = [];

    for (const attempt of pending) {
      try {
        const { error } = await supabaseClient.from('user_roadmap_assessments').insert({
          id: attempt.id,
          user_id: attempt.userId,
          track: attempt.track,
          tier: attempt.tier,
          target_id: attempt.targetId,
          score: attempt.score,
          passed: attempt.passed,
          details: attempt.details,
          created_at: attempt.createdAt,
        });

        if (error) {
          failed++;
          remaining.push(attempt);
        } else {
          synced++;
        }
      } catch {
        failed++;
        remaining.push(attempt);
      }
    }

    if (remaining.length > 0) {
      this.storage.setItem(this.storageKey, JSON.stringify(remaining));
    } else {
      this.clearPendingAttempts();
    }

    return { syncedCount: synced, failedCount: failed };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Responsive Layout & Widget Schema Validators
// ──────────────────────────────────────────────────────────────────────────

export function validateTouchTarget(sizePx: { width: number; height: number }): boolean {
  return sizePx.width >= 44 && sizePx.height >= 44;
}

export function getResponsiveLayout(screenWidthPx: number): {
  deviceCategory: 'mobile' | 'tablet' | 'desktop';
  gridColumns: number;
  isCompactView: boolean;
} {
  if (screenWidthPx < 640) {
    return { deviceCategory: 'mobile', gridColumns: 1, isCompactView: true };
  }
  if (screenWidthPx < 1024) {
    return { deviceCategory: 'tablet', gridColumns: 2, isCompactView: false };
  }
  return { deviceCategory: 'desktop', gridColumns: 3, isCompactView: false };
}

export function validateWidgetProps(
  widgetType: 'word_match' | 'dialogue_cloze' | 'passage_explorer' | 'phonetic_drill',
  props: any,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (widgetType === 'word_match') {
    const p = props as WordPairMatchWidgetProps;
    if (!p.pairs || !Array.isArray(p.pairs)) {
      errors.push('Missing pairs array');
    } else {
      if (p.pairs.length < 3 || p.pairs.length > 8) {
        errors.push(`Pair count ${p.pairs.length} outside optimal micro-learning range (3-8)`);
      }
      for (const pair of p.pairs) {
        if (!pair.id || !pair.left || !pair.right) {
          errors.push(`Invalid pair structure: ${JSON.stringify(pair)}`);
        }
      }
    }
    if (typeof p.onComplete !== 'function') {
      errors.push('Missing onComplete callback');
    }
  } else if (widgetType === 'dialogue_cloze') {
    const p = props as DialogueClozeWidgetProps;
    if (!p.dialogue || !Array.isArray(p.dialogue)) {
      errors.push('Missing dialogue array');
    } else {
      if (p.dialogue.length === 0) errors.push('Empty dialogue');
      for (const line of p.dialogue) {
        if (!line.speaker || typeof line.text !== 'string') {
          errors.push(`Invalid line structure: ${JSON.stringify(line)}`);
        }
      }
    }
    if (typeof p.onComplete !== 'function') {
      errors.push('Missing onComplete callback');
    }
  } else if (widgetType === 'passage_explorer') {
    const p = props as ReadingPassageExplorerProps;
    if (!p.passage || typeof p.passage !== 'string' || p.passage.trim().length === 0) {
      errors.push('Missing or empty reading passage');
    }
    if (!p.targetWords || !Array.isArray(p.targetWords) || p.targetWords.length === 0) {
      errors.push('Missing target words list');
    }
    if (!p.comprehensionQuestions || !Array.isArray(p.comprehensionQuestions) || p.comprehensionQuestions.length === 0) {
      errors.push('Missing comprehension questions');
    }
    if (typeof p.onComplete !== 'function') {
      errors.push('Missing onComplete callback');
    }
  } else if (widgetType === 'phonetic_drill') {
    const p = props as PhoneticArticulationProps;
    if (!p.ipa || typeof p.ipa !== 'string') errors.push('Missing IPA symbol');
    if (!p.mouthTip || typeof p.mouthTip !== 'string') errors.push('Missing mouthTip explanation');
    if (!p.whyHard || typeof p.whyHard !== 'string') errors.push('Missing whyHard contrastive tip');
    if (!p.minimalPairs || !Array.isArray(p.minimalPairs) || p.minimalPairs.length === 0) {
      errors.push('Missing minimal pairs list');
    }
    if (typeof p.onComplete !== 'function') {
      errors.push('Missing onComplete callback');
    }
  }

  return { valid: errors.length === 0, errors };
}
