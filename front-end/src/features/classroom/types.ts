import { CertLevel } from '@/types/enums';
import type { Profile } from '@/features/auth/types';

export type QuizType = 'vocabulary' | 'grammar';

export interface Classroom {
  id: string;
  teacher_id: string;
  name: string;
  description?: string;
  invite_code: string;
  created_at: string;
  // Joined fields
  teacher?: Profile;
  enrollment_count?: number;
}

export interface QuizResult {
  id: string;
  user_id: string;
  classroom_id: string;
  quiz_type: QuizType;
  score: number;
  total_questions: number;
  accuracy: number;
  completed_at: string;
}

export interface StudentProgress {
  student_id: string;
  student_name: string;
  email: string;
  classroom_id: string;
  words_reviewed?: number;
  total_words?: number;
  mastered_words?: number;
  vms?: number; // General Vocabulary Mastery Score
  active_vms?: number; // Active (Productive) Mastery Score - TESOL Standard
  lcs?: number;
  avg_review_count?: number;
  quizzes_taken?: number;
  avg_quiz_accuracy?: number;
  last_active?: string | null;
  true_last_active?: string | null;
  communicative_depth?: number; // 0-100 score on contextual usage
  cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  plan?: string;
  plan_expires_at?: string | null;
  joined_at?: string | null;
  latest_quiz?: {
    score: number;
    total_questions: number;
    accuracy: number;
    completed_at: string;
    quiz_type?: string;
  } | null;
  saved_words_count?: number;
}

/**
 * Represents a teacher-managed classroom cohort and its real-time learner telemetry.
 */
export interface ClassroomSummaryDto {
  id: string;
  className: string;
  joinCode: string;
  targetLevel: CertLevel;
  studentCount: number;
  activeTodayCount: number;
  completionRatePercent: number;
  atRiskStudentCount: number;
}

export interface ServerClassroomDto {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  teacherId: string;
  studentCount: number;
  createdAt: string;
}

/**
 * Represents a homework assignment dispatched by a teacher to a classroom cohort.
 */
export interface TeacherAssignmentDto {
  id: string;
  title: string;
  className: string;
  moduleType: string;
  dueAt: string;
  submittedCount: number;
  totalAssignedCount: number;
}
