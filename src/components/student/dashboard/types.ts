import type { ChallengeWidgetData } from '@/components/challenge/ChallengeWidget';

export type { ChallengeWidgetData };

export const READING_TOTAL_ARTICLES = 619;

export interface ActiveVocabPack {
  pack_id: string;
  topic_title: string;
  pack_index: number;
  status: 'not_started' | 'in_progress' | 'completed';
  word_count: number;
  reviewed_count: number;
  words: Array<{ word_id: string; position: number }>;
}

export interface EnrolledClassroom {
  id: string;
  name: string;
  description: string | null;
  invite_code: string | null;
  joined_at: string | null;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ReadingProgress {
  completedCount: number;
  inProgressCount: number;
  totalReadCount: number;
  totalArticles: number;
}

export interface ListeningStats {
  completedCount: number;
  inProgressPercent: number;
  totalCompleted: number;
}

export interface DashboardStatsPayload {
  dailyActivity: Array<{ date: string; count: number }>;
  studyStreak: number;
  todayWords: number;
  todayNewWords: number;
  todayReviewWords: number;
  todayKey?: string;
}
