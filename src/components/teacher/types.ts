// Shared types for the unified teacher dashboard panels.

export interface ClassStats {
  active_students: number;
  total_enrolled: number;
  total_class_words: number;
  avg_accuracy: number;
  words_due_today: number;
}

export interface StudentSummary {
  student_id: string;
  student_name: string;
  email: string;
  vms: number;
  avg_accuracy?: number; // cho struggling students (% đã round)
  words_reviewed: number;
  lcs: number;
  last_active?: string;
}

export interface WordDifficulty {
  word_id: string;
  word: string;
  fail_rate: number;
}

export interface WordCoverage {
  word_id: string;
  word: string;
  students_reviewed: number;
  coverage_pct: number;
}

export interface ActivityItem {
  type: 'quiz' | 'review';
  student_id: string;
  student_name: string;
  detail: string;
  timestamp: string;
}

export interface AnalyticsData {
  classStats: ClassStats;
  topStudents: StudentSummary[];
  strugglingStudents: StudentSummary[];
  wordCoverage: WordCoverage[];
  wordDifficulty: WordDifficulty[];
  activityFeed: ActivityItem[];
}

export interface PendingWord {
  id: string;
  word: string;
  translation?: string;
  pos?: string;
  added_by?: string;
  created_at: string;
  adder_name?: string;
}

export type TeacherTab = 'students' | 'words' | 'grammar' | 'analytics';
