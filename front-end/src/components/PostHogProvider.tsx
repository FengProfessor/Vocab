import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { env } from '@/shared/config/env';

/**
 * PostHog analytics — lazy load SDK.
 * AN TOÀN: thiếu VITE_POSTHOG_KEY → no-op, không tải SDK.
 * SDK chỉ import sau idle → không chặn hydration / TTI.
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  const key = env.posthogKey;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [client, setClient] = useState<any>(null);
  const [Provider, setProvider] = useState<ComponentType<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client: any;
    children: ReactNode;
  }> | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;

    const init = async () => {
      try {
        const [{ default: posthog }, reactMod] = await Promise.all([
          import('posthog-js'),
          import('posthog-js/react'),
        ]);
        if (cancelled) return;

        posthog.init(key, {
          api_host: env.posthogHost,
          person_profiles: 'identified_only',
          capture_pageview: true,
          capture_pageleave: true,
          autocapture: true,
          disable_session_recording: true,
        });

        if (cancelled) return;
        setClient(posthog);
        setProvider(() => reactMod.PostHogProvider);
      } catch (err) {
        console.error('[PostHog] Init error:', err);
      }
    };

    const ric = window.requestIdleCallback?.bind(window);
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (ric) {
      idleId = ric(() => { void init(); }, { timeout: 5000 });
    } else {
      timeoutId = setTimeout(() => { void init(); }, 3000);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && window.cancelIdleCallback) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [key]);

  if (!key || !client || !Provider) {
    return <>{children}</>;
  }

  return <Provider client={client}>{children}</Provider>;
}
