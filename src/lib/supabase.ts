import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://jyhdxhqkftirncbstfpe.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_cNsBhEJMkhMDa_2k5MHJCw_I68kPEEf';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Client-side Supabase client — PKCE + localStorage session (login nhanh, không đụng cookie server)
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
);

/**
 * Server-side Service Client
 * Uses SERVICE_ROLE_KEY to bypass RLS. 
 * Use ONLY in trusted server environments (API routes, cron jobs).
 */
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  return createClient(
    supabaseUrl,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Helper to fetch all rows beyond Supabase's default 1000-row limit.
 * Pass a callback that builds the query with a `.range(from, to)`.
 */
export async function fetchAllRows<T = any>(buildQuery: (from: number, to: number) => any): Promise<T[]> {
  let all: T[] = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await buildQuery(from, from + step - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < step) break;
    from += step;
  }
  return all;
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

export type OrderKind = 'individual' | 'group';
export type GroupStatus = 'active' | 'expired' | 'cancelled';

/** Gói nhóm đã kích hoạt: 1 owner trả gộp, chia ghế Pro cho nhóm bạn. */
export interface Group {
  id: string;
  owner_id: string;
  plan: Exclude<Plan, 'free'>;
  seat_limit: number;        // gồm cả owner (owner = 1 ghế)
  invite_code: string;
  status: GroupStatus;
  starts_at?: string | null;
  expires_at?: string | null;
  order_id?: string | null;
  created_at: string;
  // Joined fields
  owner?: Profile;
  members?: GroupMember[];
  seats_used?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  // Joined fields
  profile?: Profile;
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
  /** Bản dịch VI tự nhiên của example — sub khi học từ mới */
  example_vi?: string | null;
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
  /** Sub VI của example (nếu có) */
  example_vi?: string;
  collocations?: string[];
}

/** Một từ trong word family (từ phái sinh) kèm nghĩa Việt. */
export interface WordFamilyEntry {
  word: string;
  pos?: string;
  meaning?: string;
}

export interface DictionaryData {
  word?: string;
  pronunciations?: { ipa?: string; region?: 'UK' | 'US' | null }[];
  results?: { meanings?: DictionaryMeaning[] }[];
  /** Dạng cũ: string[] ("word (pos)"). Dạng mới: WordFamilyEntry[] (có nghĩa Việt). Reader phải chấp nhận cả hai. */
  familyWords?: (string | WordFamilyEntry)[];
  synonyms?: string[];
  antonyms?: string[];
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
  examples?: GrammarExample[];
  mistakes?: { wrong?: string; right?: string; why?: string }[];
  tips?: string;
  comparison?: string;
  timeline?: { caption?: string; points?: { label?: string; note?: string }[] } | null;
  /**
   * Bảng từ / case đặc biệt (dài) — U list, irregular plurals, irregular verbs…
   * Render thành card + table; cột tự suy từ keys của row đầu.
   */
  wordbanks?: {
    title: string;
    icon?: string;
    note?: string;
    rows: Record<string, string>[];
  }[];
}

export interface GrammarExerciseItem {
  type: 'mcq' | 'fill' | 'tf' | 'error' | 'multiple_choice' | 'fill_blank' | 'error_correction';
  q?: string;
  opts?: string[];
  answer?: string | string[] | boolean;
  fb?: string;
  question?: string;
  options?: string[];
  correct_answer?: string | string[] | boolean;
  explanation?: string;
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

// Lộ trình: multi-track (user_id, track) — migration 20260716
export type RoadmapDbLevelId = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'lop-10' | 'lop-11' | 'lop-12';
export type RoadmapDbTrack = 'cefr' | 'thpt';
export interface UserRoadmap {
  user_id: string;
  track: RoadmapDbTrack;
  roadmap_version: string;
  level_id: RoadmapDbLevelId;
  current_unit_id: string | null;
  placement: Record<string, unknown> | null;
  started_at: string;
  updated_at: string;
}
export interface UserRoadmapStep {
  user_id: string;
  step_id: string;
  status: 'in_progress' | 'completed';
  score: number | null;
  completed_at: string | null;
  created_at: string;
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
