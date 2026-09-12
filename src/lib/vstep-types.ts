/**
 * VSTEP TypeScript Type Definitions
 * Phục vụ hệ thống khảo thí và luyện thi chuẩn hóa VSTEP B1-B2-C1
 */

export type VstepSkillType = 'listening' | 'reading' | 'writing' | 'speaking';

export type VstepCefrLevel = 'A2' | 'B1' | 'B2' | 'C1';

export type VstepExamMode = 'full_simulation' | 'practice';

export interface VstepQuestion {
  id: string;
  type: 'mcq' | 'open';
  question: string;
  options: string[];
  answer?: number; // 0: A, 1: B, 2: C, 3: D (masked on public API)
  explanationVi?: string; // (masked on public API)
  part?: string;
  orderNumber?: number;
  canonicalId?: string;
}

export interface VstepPassage {
  title: string;
  text: string;
}

export interface VstepTask {
  id: string;
  type?: string;
  formatType?: string;
  instructions?: string;
  passage?: VstepPassage;
  media?: {
    audio?: string;
    image?: string;
  };
  tapescript?: string; // (masked on public API)
  suggestion?: string; // (masked on public API)
  questions?: VstepQuestion[];
  minWords?: number;
  timeLimit?: number;
  title?: string;
  content?: string;
  description?: string;
}

export interface VstepSection {
  type: VstepSkillType;
  label: string;
  timeLimit: number; // in minutes
  totalQuestions?: number;
  tasks: VstepTask[];
}

export interface VstepExam {
  id: string;
  title: string;
  duration: number; // in minutes
  date?: string;
  sections: VstepSection[];
}

export type VstepSourceType = 'vstepowl' | 'onthivstep' | 'englishteststore' | 'vnu';

export interface VstepExamCatalogItem {
  id: string;
  title: string;
  duration: number;
  skills: VstepSkillType[];
  targetLevel: VstepCefrLevel;
  totalQuestions: number;
  totalTasks: number;
  badge: string;
  description: string;
  isPopular?: boolean;
  category: 'full_mock' | 'listening' | 'reading' | 'writing' | 'speaking';
  // Multi-source crawler metadata
  source?: VstepSourceType;
  skill?: 'full_mock' | VstepSkillType;
  cefrLevel?: VstepCefrLevel;
  titleVi?: string;
  questionsCount?: number;
}

export interface VstepScoreResult {
  listeningScore?: number; // 0.0 - 10.0
  readingScore?: number; // 0.0 - 10.0
  writingScore?: number; // 0.0 - 10.0
  speakingScore?: number; // 0.0 - 10.0
  overallScore: number; // 0.0 - 10.0 rounded according to MOET regulations
  cefrLevel: VstepCefrLevel;
  listeningCorrect?: number;
  readingCorrect?: number;
  listeningTotal?: number;
  readingTotal?: number;
  partBreakdown: Record<string, {
    label: string;
    correct: number;
    total: number;
    accuracy: number;
  }>;
}

export interface VstepSubmitPayload {
  testId: string;
  examMode: VstepExamMode;
  answers: Record<string, number>; // questionId -> selectedOptionIndex (0-3)
  questionIds?: string[]; // Allows grading dynamic practice sets
  writingSubmissions?: Record<string, string>; // taskId -> essay text
  sessionToken?: string;
  _hp_trap?: string;
}

export interface VstepExamAttemptRecord {
  attemptId: string;
  examId: string;
  examTitle: string;
  category: 'full_mock' | 'listening' | 'reading' | 'writing' | 'speaking';
  completedAt: string; // ISO 8601
  durationSeconds: number;
  overallScore: number; // 0.0 - 10.0 (MOET rounded 0.5)
  cefrLevel: VstepCefrLevel; // 'A2' | 'B1' | 'B2' | 'C1'
  accuracyRate: number; // 0 - 100
  totalQuestionsAnswered: number;
  totalQuestionsCorrect: number;
  listeningScore?: number;
  readingScore?: number;
  writingScore?: number;
  speakingScore?: number;
  listeningCorrect?: number;
  readingCorrect?: number;
  targetLevel?: string;
}

export interface VstepExamSummary {
  examId: string;
  attemptCount: number;
  highestScore: number; // monotonic max
  highestCefr: VstepCefrLevel;
  latestAttemptAt: string;
  latestScore: number;
  latestCefr: VstepCefrLevel;
  isCompleted: boolean;
}

export interface VstepExamHistoryStore {
  version: number;
  updatedAt: string;
  records: VstepExamAttemptRecord[];
}

export interface VstepPracticeOptions {
  skill: VstepSkillType;
  filterMode?: 'unseen' | 'mistakes' | 'all_random';
  excludedIds?: string[];
  mistakeIds?: string[];
  limit?: number; // default 35 for listening, 40 for reading
  seed?: number;
  part?: string;
  testId?: string;
}

export interface VstepPracticeResponse {
  exam: VstepExam;
  metadata: {
    totalQuestions: number;
    unseenRemaining: number;
    isFallbackUsed: boolean;
    filterMode: 'unseen' | 'mistakes' | 'all_random';
    skill: VstepSkillType;
    questionIds?: string[];
  };
}
