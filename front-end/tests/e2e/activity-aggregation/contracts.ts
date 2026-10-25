/**
 * Interface Contracts and Schema Validators for Universal Student Activity Aggregation.
 * Authoritative Source: PROJECT.md § Interface Contracts
 */

// ─── Contract 1: Database & Universal Activity Timestamp Interface ─────────
export interface StudentActivitySummary {
  userId: string;
  trueLastActive: string | null; // ISO timestamp
  lastSrsAt: string | null;
  lastQuizAt: string | null;
  lastWordAt: string | null;
  lastGrammarAt: string | null;
  lastReadingAt: string | null;
  lastToeicAt: string | null;
  lastAssessmentAt: string | null;
  lastVocabPackAt: string | null;
  lastStreakDate: string | null; // YYYY-MM-DD
  wordCount: number;
  totalActivitiesCount: number;
}

// ─── Contract 2: Teacher Timeline Activity Group Contract ───────────────────
export type TimelineActivityGroup =
  | 'srs_review'
  | 'quiz'
  | 'word_saved'
  | 'grammar'
  | 'daily_reading'
  | 'toeic'
  | 'assessment'
  | 'vocab_pack';

export interface TimelineItem {
  id: string;
  type: TimelineActivityGroup;
  title: string;
  timestamp: string;
  score?: number;
  totalQuestions?: number;
  accuracy?: number;
  badge?: string;
  badgeVariant?: 'emerald' | 'amber' | 'violet' | 'sky' | 'indigo' | 'rose';
  details?: Record<string, unknown>;
}

// ─── Contract 3: CRM Multi-Skill Customer Stats Contract ────────────────────
export type CrmLifecycle = 'new' | 'active' | 'at_risk' | 'churned';

export interface MultiSkillStats {
  vocab: {
    wordsSaved: number;
    cardsLearned: number;
    reviewsTotal: number;
    lapsesTotal: number;
    dueCount: number;
    lastActive: string | null;
  };
  grammar: {
    lessonsCompleted: number;
    microLessonsPassed: number;
    lastActive: string | null;
  };
  reading: {
    articlesRead: number;
    lastActive: string | null;
  };
  toeic: {
    questionsAnswered: number;
    accuracyPercent: number;
    lastActive: string | null;
  };
  gamification: {
    streakDays: number;
    lastActiveDate: string | null;
  };
  trueLastActive: string | null;
  lifecycle: CrmLifecycle;
}

// ─── Contract 4: Pedagogical Status Contract ────────────────────────────────
export type PedagogicalStatusKey = 'dormant' | 'at_risk' | 'cramming' | 'rising_star' | 'active';

export interface StudentStatusInfo {
  key: PedagogicalStatusKey;
  dot: string;
  label: string;
  badgeClass: string;
  color: string;
  tag: string;
  title: string;
  advice: string;
}

// ─── Validation Helpers ─────────────────────────────────────────────────────

export function validateStudentActivitySummary(obj: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['Expected object for StudentActivitySummary'] };
  }
  const o = obj as Record<string, unknown>;

  if (typeof o.userId !== 'string') errors.push('userId must be a string');
  if (o.trueLastActive !== null && typeof o.trueLastActive !== 'string') {
    errors.push('trueLastActive must be string or null');
  }
  if (o.trueLastActive && isNaN(Date.parse(o.trueLastActive as string))) {
    errors.push('trueLastActive must be a valid ISO date');
  }
  if (typeof o.wordCount !== 'number' || isNaN(o.wordCount) || o.wordCount < 0) {
    errors.push('wordCount must be a non-negative number');
  }
  if (typeof o.totalActivitiesCount !== 'number' || isNaN(o.totalActivitiesCount) || o.totalActivitiesCount < 0) {
    errors.push('totalActivitiesCount must be a non-negative number');
  }

  const nullableDateProps = [
    'lastSrsAt',
    'lastQuizAt',
    'lastWordAt',
    'lastGrammarAt',
    'lastReadingAt',
    'lastToeicAt',
    'lastAssessmentAt',
    'lastVocabPackAt',
  ];
  for (const prop of nullableDateProps) {
    if (o[prop] !== null && typeof o[prop] !== 'string') {
      errors.push(`${prop} must be string or null`);
    } else if (typeof o[prop] === 'string' && isNaN(Date.parse(o[prop] as string))) {
      errors.push(`${prop} is not a valid date string`);
    }
  }

  if (o.lastStreakDate !== null && typeof o.lastStreakDate !== 'string') {
    errors.push('lastStreakDate must be string or null');
  }

  return { valid: errors.length === 0, errors };
}

export function validateTimelineItem(item: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!item || typeof item !== 'object') {
    return { valid: false, errors: ['Expected object for TimelineItem'] };
  }
  const i = item as Record<string, unknown>;

  if (typeof i.id !== 'string') errors.push('id must be a string');
  const validGroups: TimelineActivityGroup[] = [
    'srs_review',
    'quiz',
    'word_saved',
    'grammar',
    'daily_reading',
    'toeic',
    'assessment',
    'vocab_pack',
  ];
  if (!validGroups.includes(i.type as TimelineActivityGroup)) {
    errors.push(`type '${String(i.type)}' is not a valid TimelineActivityGroup`);
  }
  if (typeof i.title !== 'string' || !i.title) errors.push('title must be a non-empty string');
  if (typeof i.timestamp !== 'string' || isNaN(Date.parse(i.timestamp))) {
    errors.push('timestamp must be a valid ISO date string');
  }
  if (i.accuracy !== undefined && (typeof i.accuracy !== 'number' || isNaN(i.accuracy) || i.accuracy < 0 || i.accuracy > 1)) {
    errors.push('accuracy must be between 0 and 1');
  }

  return { valid: errors.length === 0, errors };
}

export function validateMultiSkillStats(stats: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!stats || typeof stats !== 'object') {
    return { valid: false, errors: ['Expected object for MultiSkillStats'] };
  }
  const s = stats as Record<string, unknown>;

  const validLifecycles: CrmLifecycle[] = ['new', 'active', 'at_risk', 'churned'];
  if (!validLifecycles.includes(s.lifecycle as CrmLifecycle)) {
    errors.push(`Invalid lifecycle '${String(s.lifecycle)}'`);
  }

  if (!s.vocab || typeof s.vocab !== 'object') errors.push('vocab section missing');
  if (!s.grammar || typeof s.grammar !== 'object') errors.push('grammar section missing');
  if (!s.reading || typeof s.reading !== 'object') errors.push('reading section missing');
  if (!s.toeic || typeof s.toeic !== 'object') errors.push('toeic section missing');
  if (!s.gamification || typeof s.gamification !== 'object') errors.push('gamification section missing');

  return { valid: errors.length === 0, errors };
}
