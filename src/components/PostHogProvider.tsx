'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

/**
 * PostHog analytics + error tracking.
 * AN TOÀN: nếu thiếu env NEXT_PUBLIC_POSTHOG_KEY → no-op hoàn toàn (không bọc provider,
 * không init) → app chạy bình thường khi chưa cấu hình PostHog.
 *
 * Cấu hình khi sẵn sàng (tạo project free tại posthog.com):
 *   NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
 *   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com   (hoặc eu.i.posthog.com)
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  useEffect(() => {
    if (!key) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only', // tiết kiệm: chỉ tạo profile cho user đã định danh
      capture_pageview: true,             // tự bắt pageview qua History API (SPA)
      capture_pageleave: true,
      autocapture: true,
    });
  }, [key]);

  if (!key) return <>{children}</>;
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
