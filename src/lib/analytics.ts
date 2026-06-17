/**
 * Wrapper an toàn quanh PostHog — gọi được ở bất kỳ client component nào.
 * No-op nếu chạy server-side hoặc chưa cấu hình NEXT_PUBLIC_POSTHOG_KEY.
 */
import posthog from 'posthog-js';

const enabled = () =>
  typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

export interface AnalyticsEvents {
  premium_gate_hit: { feature: string; upgradeTo: string };
  grammar_quiz_generated: { lessonId: string | null; count: number };
  grammar_quiz_completed: { correct: number; total: number; accuracy: number; mode: string };
  teacher_landing_viewed: { source?: string };
  teacher_pilot_cta_clicked: { plan: 'tutor' | 'teacher_pro' | 'center'; placement: string };
  teacher_signup_completed: { plan?: string; source?: string };
  teacher_dashboard_viewed: { classroom_count: number; student_count: number };
  teacher_class_created: { classroom_id: string; classroom_count: number };
  student_joined_teacher_class: { classroom_id: string; teacher_id: string; enrollment_count?: number };
  center_lead_submitted: { teacher_count: number; student_count: number; source: string };
}

export type AnalyticsEventName = keyof AnalyticsEvents;

/** Bắt 1 event có type-safe properties. */
export function track<E extends AnalyticsEventName>(event: E, props: AnalyticsEvents[E]): void {
  if (!enabled()) return;
  try {
    posthog.capture(event, props);
  } catch {
    /* nuốt lỗi — analytics không bao giờ được làm vỡ UX */
  }
}

/** Gắn user id để theo dõi retention theo người (gọi sau khi đăng nhập). */
export function identifyUser(userId: string, props?: Record<string, unknown>): void {
  if (!enabled()) return;
  try {
    posthog.identify(userId, props);
  } catch {
    /* no-op */
  }
}

/** Xoá định danh khi logout. */
export function resetAnalytics(): void {
  if (!enabled()) return;
  try {
    posthog.reset();
  } catch {
    /* no-op */
  }
}
