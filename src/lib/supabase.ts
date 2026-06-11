import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side Service Client
 * Uses SERVICE_ROLE_KEY to bypass RLS. 
 * Use ONLY in trusted server environments (API routes, cron jobs).
 */
export function createServiceClient() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}


// Type definitions matching the schema
export type UserRole = 'teacher' | 'student';
export type QuizType = 'vocabulary' | 'grammar';
export type GrammarLevel = 'beginner' | 'intermediate' | 'advanced';

export type Plan = 'free' | 'pro' | 'premium';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  daily_goal?: number;
  notification_hour?: number;
  fcm_token?: string | null;
  plan?: Plan;
  plan_expires_at?: string | null;
}

/** Token dài hạn cho Chrome Extension — DB chỉ lưu SHA-256 hash (service-role only). */
export interface ExtensionToken {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: string;
  last_used_at?: string | null;
}

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

export interface Word {
  id: string;
  classroom_id: string;
  added_by?: string;
  word: string;
  translation?: string;
  ipa?: string;
  pos?: string;
  example?: string;
  source_url?: string;
  status?: string;
  created_at: string;
  image_url?: string;
  image_source?: string;
  image_confidence?: number | null;
  synonyms?: string[];
  antonyms?: string[];
  dictionary_data?: DictionaryData | null;
  // Joined SRS for current user
  srs?: SRSProgress;
  isDue?: boolean;
  srsLevel?: number;
}

export interface DictionaryMeaning {
  pos?: string;
  definition?: string;
  example?: string;
  collocations?: string[];
}

export interface DictionaryData {
  word?: string;
  pronunciations?: { ipa?: string; region?: 'UK' | 'US' | null }[];
  results?: { meanings?: DictionaryMeaning[] }[];
  familyWords?: string[];
  image_search_query?: string;
}

export interface GlobalDictionaryEntry {
  id: string;
  word: string;
  tags: string[];
  data: DictionaryData;
  image_url?: string;
  image_source?: string;
  image_confidence?: number | null;
  image_query?: string;
  image_verified_at?: string;
  created_at: string;
}

export interface SRSProgress {
  id: string;
  user_id: string;
  word_id: string;
  ease_factor: number;
  stability?: number;
  difficulty?: number;
  interval_days: number;
  review_count: number;
  next_review_date: string;
  last_reviewed_at?: string;
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

export type GrammarExerciseType = 'multiple_choice' | 'fill_blank' | 'error_correction';

export interface GrammarExercise {
  id: string;
  classroom_id: string;
  topic: string;
  level: GrammarLevel;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  type?: GrammarExerciseType;
  difficulty?: number; // 1=easy, 2=medium, 3=hard
  lesson_id?: string | null;
  created_by?: string;
  created_at: string;
}

export interface GrammarResult {
  id: string;
  user_id: string;
  exercise_id: string;
  chosen_answer: string;
  is_correct: boolean;
  time_taken_ms?: number;
  completed_at: string;
}

export interface GrammarTopic {
  id: string;
  slug: string;
  title: string;
  title_vi?: string;
  level: GrammarLevel;
  order_index: number;
  parent_id?: string | null;
  created_at: string;
  // joined
  lessons?: GrammarLesson[];
  lessonCount?: number;
}

export interface GrammarExample {
  en: string;
  vi?: string;
  note?: string;
  annotations?: import('@/components/grammar/GrammarHighlight').WordAnnotation[];
}

export interface GrammarLesson {
  id: string;
  topic_id: string;
  title: string;
  theory?: string;
  theory_vi?: string;
  examples: GrammarExample[];
  image_url?: string;
  image_source?: string;
  image_confidence?: number | null;
  source?: string;
  source_url?: string;
  order_index: number;
  created_by?: string;
  created_at: string;
  sections?: GrammarSections | null;
  exercises?: GrammarExerciseItem[] | null;
  // joined
  topic?: GrammarTopic;
}

/** Golden Lesson — nội dung có cấu trúc (render section-cards). */
export interface GrammarSections {
  definition?: string;
  usage?: { icon?: string; label?: string; en?: string; vi?: string }[];
  formula?: { rows?: Record<string, string>[]; note?: string };
  rules?: { case?: string; rule?: string; example?: string }[];
  signals?: string[];
  examples?: { en?: string; vi?: string; note?: string }[];
  mistakes?: { wrong?: string; right?: string; why?: string }[];
  tips?: string;
  comparison?: string;
  timeline?: { caption?: string; points?: { label?: string; note?: string }[] } | null;
}

export interface GrammarExerciseItem {
  type: 'mcq' | 'fill' | 'tf' | 'error';
  q: string;
  opts?: string[];
  answer: string | string[] | boolean;
  fb?: string;
}

export interface GrammarProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  stability: number;
  difficulty: number;
  interval_days: number;
  review_count: number;
  next_review_date: string;
  last_reviewed_at?: string;
  state: string;
  mastery_score: number;
}

export interface UserGamification {
  user_id: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  daily_goal: number;
  today_xp: number;
  today_date: string | null;
}

export interface StudentProgress {
  student_id: string;
  student_name: string;
  email: string;
  classroom_id: string;
  words_reviewed: number;
  total_words: number;
  mastered_words: number;
  vms: number; // General Vocabulary Mastery Score
  active_vms: number; // Active (Productive) Mastery Score - TESOL Standard
  lcs: number;
  avg_review_count: number;
  quizzes_taken: number;
  avg_quiz_accuracy: number;
  last_active?: string;
  communicative_depth: number; // 0-100 score on contextual usage
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}
