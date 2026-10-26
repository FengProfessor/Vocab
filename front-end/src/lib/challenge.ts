export interface DailyCriteria {
  min_srs_reviews: number;
  min_quizzes: number;
  min_reading_sessions: number;
  min_listening_sessions: number;
}

export interface Challenge {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_days: number;
  deposit_amount: number;
  refund_pct: number;
  refund_cash_amount: number;
  bonus_pro_days: number;
  streak_freeze_price: number;
  max_streak_freezes: number;
  daily_criteria: DailyCriteria;
  registration_opens_at: string;
  registration_closes_at: string;
  starts_at: string;
  ends_at: string;
  max_participants: number | null;
  status: 'draft' | 'open' | 'active' | 'completed' | 'cancelled';
  created_by: string | null;
  created_at: string;
}

export type ParticipantStatus = 'pending' | 'active' | 'failed' | 'completed' | 'refunded';

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  order_id: string | null;
  status: ParticipantStatus;
  joined_at: string;
  activated_at: string | null;
  failed_at: string | null;
  failed_reason: string | null;
  completed_at: string | null;
  refunded_at: string | null;
  refund_amount: number | null;
  bonus_expires_at: string | null;
  current_streak: number;
  longest_streak: number;
  total_active_days: number;
  streak_freezes_used: number;
  reward_choice: 'cash' | 'pro' | null;
}

export interface ChallengeDailyLog {
  id: string;
  participant_id: string;
  user_id: string;
  challenge_id: string;
  log_date: string; // YYYY-MM-DD
  srs_reviews: number;
  quizzes_done: number;
  reading_sessions: number;
  listening_sessions: number;
  xp_earned: number;
  criteria_met: boolean;
  checked_at: string | null;
}

export function parseDailyCriteria(raw: unknown): DailyCriteria {
  const defaultCriteria: DailyCriteria = {
    min_srs_reviews: 10,
    min_quizzes: 1,
    min_reading_sessions: 0,
    min_listening_sessions: 0,
  };

  if (!raw || typeof raw !== 'object') {
    return defaultCriteria;
  }

  const obj = raw as Record<string, unknown>;
  return {
    min_srs_reviews: typeof obj.min_srs_reviews === 'number' ? obj.min_srs_reviews : defaultCriteria.min_srs_reviews,
    min_quizzes: typeof obj.min_quizzes === 'number' ? obj.min_quizzes : defaultCriteria.min_quizzes,
    min_reading_sessions: typeof obj.min_reading_sessions === 'number' ? obj.min_reading_sessions : defaultCriteria.min_reading_sessions,
    min_listening_sessions: typeof obj.min_listening_sessions === 'number' ? obj.min_listening_sessions : defaultCriteria.min_listening_sessions,
  };
}

export function checkCriteriaMet(
  metrics: { srs_reviews: number; quizzes_done: number; reading_sessions: number; listening_sessions: number },
  criteria: DailyCriteria,
): boolean {
  return (
    metrics.srs_reviews >= criteria.min_srs_reviews &&
    metrics.quizzes_done >= criteria.min_quizzes &&
    metrics.reading_sessions >= criteria.min_reading_sessions &&
    metrics.listening_sessions >= criteria.min_listening_sessions
  );
}

export function challengeProgress(
  participant: ChallengeParticipant,
  challenge: Challenge,
): { totalDays: number; elapsedDays: number; remainingDays: number; pctComplete: number; isActive: boolean } {
  const totalDays = challenge.duration_days;

  const now = new Date();
  const startDate = new Date(challenge.starts_at);
  const endDate = new Date(challenge.ends_at);

  let elapsedDays = 0;
  if (now > endDate) {
    elapsedDays = totalDays;
  } else if (now > startDate) {
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    elapsedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const pctComplete = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
  const isActive = participant.status === 'active' && now >= startDate && now <= endDate;

  return { totalDays, elapsedDays, remainingDays, pctComplete, isActive };
}

export function formatDepositVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function slugify(text: string): string {
  let str = text.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/[^a-z0-9 -]/g, '');
  str = str.replace(/\s+/g, '-');
  str = str.replace(/-+/g, '-');
  return str.replace(/^-+|-+$/g, '');
}
