/**
 * Wrapper an toàn quanh PostHog — gọi được ở bất kỳ client component nào.
 * No-op nếu chạy server-side hoặc chưa cấu hình NEXT_PUBLIC_POSTHOG_KEY.
 */
import posthog from 'posthog-js';

const enabled = () =>
  typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

/** Bắt 1 event. Prefix tên rõ ràng, vd 'grammar_quiz_completed'. */
export function track(event: string, props?: Record<string, unknown>): void {
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
