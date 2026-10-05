/**
 * Realistic Mock Fixtures for Universal Activity Aggregation E2E Test Suite.
 */

import type { RawActivitySources } from '../oracle';
import type { StudentProgress } from '@/lib/supabase';

export function createMockStudentProgress(
  partial: Partial<StudentProgress> & {
    student_id: string;
    classroom_id: string;
    student_name: string;
    email: string;
  },
): StudentProgress {
  return {
    student_id: partial.student_id,
    classroom_id: partial.classroom_id,
    student_name: partial.student_name,
    email: partial.email,
    words_reviewed: partial.words_reviewed ?? 0,
    total_words: partial.total_words ?? 0,
    mastered_words: partial.mastered_words ?? 0,
    vms: partial.vms ?? 50,
    active_vms: partial.active_vms ?? 40,
    lcs: partial.lcs ?? 50,
    avg_review_count: partial.avg_review_count ?? 1,
    quizzes_taken: partial.quizzes_taken ?? 0,
    avg_quiz_accuracy: partial.avg_quiz_accuracy ?? 0,
    communicative_depth: partial.communicative_depth ?? 50,
    cefr_level: partial.cefr_level ?? 'A1',
    last_active: partial.last_active ?? undefined,
    latest_quiz: partial.latest_quiz ?? null,
    saved_words_count: partial.saved_words_count ?? 0,
    plan: partial.plan ?? 'free',
    plan_expires_at: partial.plan_expires_at ?? null,
    joined_at: partial.joined_at ?? null,
  };
}

export const FIXED_BASE_TIME = new Date('2026-10-05T12:00:00.000Z').getTime();
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

// ─── Persona 1: Diligent Grammar & TOEIC student (Hoàng Nam) ─────────────────
// Has NOT done flashcards in 5 days, but completed TOEIC drills 2 hours ago and Grammar yesterday
export const hoangNamSources: RawActivitySources = {
  srsLastReviewedAt: new Date(FIXED_BASE_TIME - 5 * DAY).toISOString(),
  quizCompletedAt: new Date(FIXED_BASE_TIME - 4 * DAY).toISOString(),
  wordCreatedAt: new Date(FIXED_BASE_TIME - 6 * DAY).toISOString(),
  grammarLastReviewedAt: new Date(FIXED_BASE_TIME - 1 * DAY).toISOString(),
  grammarMicroUpdatedAt: new Date(FIXED_BASE_TIME - 22 * HOUR).toISOString(),
  dailyReadingCompletedAt: null,
  toeicLastAnsweredAt: new Date(FIXED_BASE_TIME - 2 * HOUR).toISOString(), // 2 hours ago!
  assessmentCreatedAt: new Date(FIXED_BASE_TIME - 3 * DAY).toISOString(),
  vocabPackLastStudiedAt: null,
  streakLastActiveDate: '2026-10-05',
};

// ─── Persona 2: Active Daily Reading subscriber (Thu Trang) ──────────────────
// Account created 60 days ago. Does ONLY Daily Reading every morning.
export const thuTrangCreatedAt = new Date(FIXED_BASE_TIME - 60 * DAY).toISOString();
export const thuTrangSources: RawActivitySources = {
  srsLastReviewedAt: null,
  quizCompletedAt: null,
  wordCreatedAt: null,
  grammarLastReviewedAt: null,
  grammarMicroUpdatedAt: null,
  dailyReadingCompletedAt: new Date(FIXED_BASE_TIME - 4 * HOUR).toISOString(), // this morning!
  toeicLastAnsweredAt: null,
  assessmentCreatedAt: null,
  vocabPackLastStudiedAt: null,
  streakLastActiveDate: '2026-10-05',
};

// ─── Persona 3: Multi-Skill Customer (Bảo Long) ─────────────────────────────
export const baoLongCreatedAt = new Date(FIXED_BASE_TIME - 45 * DAY).toISOString();
export const baoLongSources: RawActivitySources = {
  srsLastReviewedAt: new Date(FIXED_BASE_TIME - 1 * DAY).toISOString(),
  quizCompletedAt: new Date(FIXED_BASE_TIME - 2 * DAY).toISOString(),
  wordCreatedAt: new Date(FIXED_BASE_TIME - 3 * DAY).toISOString(),
  grammarLastReviewedAt: new Date(FIXED_BASE_TIME - 12 * HOUR).toISOString(),
  grammarMicroUpdatedAt: new Date(FIXED_BASE_TIME - 12 * HOUR).toISOString(),
  dailyReadingCompletedAt: new Date(FIXED_BASE_TIME - 18 * HOUR).toISOString(),
  toeicLastAnsweredAt: new Date(FIXED_BASE_TIME - 6 * HOUR).toISOString(),
  assessmentCreatedAt: new Date(FIXED_BASE_TIME - 7 * DAY).toISOString(),
  vocabPackLastStudiedAt: new Date(FIXED_BASE_TIME - 2 * DAY).toISOString(),
  streakLastActiveDate: '2026-10-05',
};

// ─── Persona 4: Truly Dormant Student (Tuấn Kiệt) ───────────────────────────
// Inactive across all modules for 12 days
export const tuanKietSources: RawActivitySources = {
  srsLastReviewedAt: new Date(FIXED_BASE_TIME - 12 * DAY).toISOString(),
  quizCompletedAt: new Date(FIXED_BASE_TIME - 14 * DAY).toISOString(),
  wordCreatedAt: new Date(FIXED_BASE_TIME - 15 * DAY).toISOString(),
  grammarLastReviewedAt: new Date(FIXED_BASE_TIME - 13 * DAY).toISOString(),
  grammarMicroUpdatedAt: null,
  dailyReadingCompletedAt: null,
  toeicLastAnsweredAt: null,
  assessmentCreatedAt: null,
  vocabPackLastStudiedAt: null,
  streakLastActiveDate: '2026-09-23',
};

// ─── Persona 5: Brand New Registered Student (Lan Hương) ─────────────────────
// Registered yesterday, 0 activity
export const lanHuongCreatedAt = new Date(FIXED_BASE_TIME - 1 * DAY).toISOString();
export const lanHuongSources: RawActivitySources = {
  srsLastReviewedAt: null,
  quizCompletedAt: null,
  wordCreatedAt: null,
  grammarLastReviewedAt: null,
  grammarMicroUpdatedAt: null,
  dailyReadingCompletedAt: null,
  toeicLastAnsweredAt: null,
  assessmentCreatedAt: null,
  vocabPackLastStudiedAt: null,
  streakLastActiveDate: null,
};

// ─── Classroom of 20 Mixed-Activity Students ─────────────────────────────────
export interface MockClassroomStudent {
  id: string;
  name: string;
  email: string;
  sources: RawActivitySources;
  vms: number;
  words_reviewed: number;
  lcs: number;
  avg_quiz_accuracy: number;
  quizzes_taken: number;
  createdAt: string;
}

export function generate20StudentClassroom(): MockClassroomStudent[] {
  const students: MockClassroomStudent[] = [];

  // Group 1: 5 Full-Stack Active Learners (active < 1 day)
  for (let i = 1; i <= 5; i++) {
    students.push({
      id: `std-full-${i}`,
      name: `FullStack Học Viên ${i}`,
      email: `full${i}@example.com`,
      sources: {
        srsLastReviewedAt: new Date(FIXED_BASE_TIME - i * 3 * HOUR).toISOString(),
        quizCompletedAt: new Date(FIXED_BASE_TIME - i * 4 * HOUR).toISOString(),
        wordCreatedAt: new Date(FIXED_BASE_TIME - i * 5 * HOUR).toISOString(),
        grammarLastReviewedAt: new Date(FIXED_BASE_TIME - i * 2 * HOUR).toISOString(),
        toeicLastAnsweredAt: new Date(FIXED_BASE_TIME - i * HOUR).toISOString(),
      },
      vms: 85,
      words_reviewed: 120,
      lcs: 90,
      avg_quiz_accuracy: 0.95,
      quizzes_taken: 8,
      createdAt: new Date(FIXED_BASE_TIME - 30 * DAY).toISOString(),
    });
  }

  // Group 2: 4 TOEIC-Only Learners (no flashcards in 10d, active in TOEIC 2h-1d ago)
  for (let i = 1; i <= 4; i++) {
    students.push({
      id: `std-toeic-${i}`,
      name: `TOEIC Chỉ Học ${i}`,
      email: `toeic${i}@example.com`,
      sources: {
        srsLastReviewedAt: new Date(FIXED_BASE_TIME - 10 * DAY).toISOString(),
        toeicLastAnsweredAt: new Date(FIXED_BASE_TIME - i * 5 * HOUR).toISOString(),
      },
      vms: 45,
      words_reviewed: 30,
      lcs: 75,
      avg_quiz_accuracy: 0.85,
      quizzes_taken: 3,
      createdAt: new Date(FIXED_BASE_TIME - 20 * DAY).toISOString(),
    });
  }

  // Group 3: 3 Daily Reading-Only Learners (active in Reading 6h-2d ago)
  for (let i = 1; i <= 3; i++) {
    students.push({
      id: `std-reading-${i}`,
      name: `Reading Chỉ Học ${i}`,
      email: `reading${i}@example.com`,
      sources: {
        srsLastReviewedAt: new Date(FIXED_BASE_TIME - 14 * DAY).toISOString(),
        dailyReadingCompletedAt: new Date(FIXED_BASE_TIME - i * 12 * HOUR).toISOString(),
      },
      vms: 50,
      words_reviewed: 20,
      lcs: 70,
      avg_quiz_accuracy: 0.8,
      quizzes_taken: 2,
      createdAt: new Date(FIXED_BASE_TIME - 25 * DAY).toISOString(),
    });
  }

  // Group 4: 3 Grammar-Only Learners (active in Grammar 1d-3d ago)
  for (let i = 1; i <= 3; i++) {
    students.push({
      id: `std-grammar-${i}`,
      name: `Grammar Chỉ Học ${i}`,
      email: `grammar${i}@example.com`,
      sources: {
        srsLastReviewedAt: null,
        grammarLastReviewedAt: new Date(FIXED_BASE_TIME - i * 18 * HOUR).toISOString(),
      },
      vms: 60,
      words_reviewed: 40,
      lcs: 65,
      avg_quiz_accuracy: 0.82,
      quizzes_taken: 4,
      createdAt: new Date(FIXED_BASE_TIME - 15 * DAY).toISOString(),
    });
  }

  // Group 5: 2 Truly Dormant Learners (inactive > 8 days)
  for (let i = 1; i <= 2; i++) {
    students.push({
      id: `std-dormant-${i}`,
      name: `Vắng Mặt Học Viên ${i}`,
      email: `dormant${i}@example.com`,
      sources: {
        srsLastReviewedAt: new Date(FIXED_BASE_TIME - (8 + i * 2) * DAY).toISOString(),
        quizCompletedAt: new Date(FIXED_BASE_TIME - (9 + i * 2) * DAY).toISOString(),
      },
      vms: 25,
      words_reviewed: 15,
      lcs: 20,
      avg_quiz_accuracy: 0.5,
      quizzes_taken: 2,
      createdAt: new Date(FIXED_BASE_TIME - 40 * DAY).toISOString(),
    });
  }

  // Group 6: 2 Brand New Students (created 1d ago, 0 activity)
  for (let i = 1; i <= 2; i++) {
    students.push({
      id: `std-new-${i}`,
      name: `Tân Học Viên ${i}`,
      email: `new${i}@example.com`,
      sources: {},
      vms: 0,
      words_reviewed: 0,
      lcs: 0,
      avg_quiz_accuracy: 0,
      quizzes_taken: 0,
      createdAt: new Date(FIXED_BASE_TIME - i * 12 * HOUR).toISOString(),
    });
  }

  // Group 7: 1 Crammer (low LCS < 30, high accuracy > 0.8, quizzes > 2)
  students.push({
    id: `std-crammer-1`,
    name: `Học Dồn Học Viên`,
    email: `crammer@example.com`,
    sources: {
      srsLastReviewedAt: new Date(FIXED_BASE_TIME - 1 * DAY).toISOString(),
      quizCompletedAt: new Date(FIXED_BASE_TIME - 1 * DAY).toISOString(),
    },
    vms: 40,
    words_reviewed: 50,
    lcs: 20, // LCS < 30
    avg_quiz_accuracy: 0.9, // Accuracy > 0.8
    quizzes_taken: 5, // Quizzes > 2
    createdAt: new Date(FIXED_BASE_TIME - 10 * DAY).toISOString(),
  });

  return students;
}
