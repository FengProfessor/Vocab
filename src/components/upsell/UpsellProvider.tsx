'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  FREE_WORD_MONTHLY_LIMIT,
  UPSELL_EVENT,
  dismissSuffixDaily,
  dismissSuffixExpiry,
  dismissSuffixWordMonth,
  dismissUpsell,
  pickBootUpsell,
  rememberPaidState,
  requestUpsell,
  type UpsellPayload,
} from '@/lib/upsell';
import { track } from '@/lib/analytics';
import { UpsellModal } from '@/components/upsell/UpsellModal';

function shouldSkipPath(pathname: string): boolean {
  if (!pathname) return true;
  const skip = ['/auth', '/upgrade', '/landing', '/for-teachers', '/privacy', '/terms', '/offline'];
  if (pathname === '/') return true;
  return skip.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Demo: /student?upsell=word_near|word_limit|expiring|expired */
function demoPayloadFromUrl(): UpsellPayload | null {
  if (typeof window === 'undefined') return null;
  const kind = new URLSearchParams(window.location.search).get('upsell');
  if (!kind) return null;
  const limit = FREE_WORD_MONTHLY_LIMIT;
  const map: Record<string, UpsellPayload> = {
    word_near: {
      reason: 'word_near_limit',
      used: 150,
      limit,
      remaining: 50,
      force: true,
    },
    word_limit: {
      reason: 'word_limit',
      used: 200,
      limit,
      remaining: 0,
      force: true,
    },
    expiring: {
      reason: 'plan_expiring',
      daysLeft: 3,
      expiresAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      force: true,
    },
    expired: {
      reason: 'plan_expired',
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
      force: true,
    },
  };
  return map[kind] ?? null;
}

/**
 * Boot soft-upsell (hết hạn / gần 150 từ) + nghe event hard (FREE_WORD_LIMIT).
 * Mount 1 lần qua ClientBoot.
 */
export function UpsellProvider() {
  const pathname = usePathname() ?? '';
  const [payload, setPayload] = useState<UpsellPayload | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const open = Boolean(payload);

  // Demo query (?upsell=word_near|…) — force, không cần login
  useEffect(() => {
    const demo = demoPayloadFromUrl();
    if (demo) {
      setIsDemo(true);
      setPayload(demo);
    }
  }, [pathname]);

  const show = useCallback((next: UpsellPayload) => {
    setPayload((prev) => {
      // Hard force luôn thắng soft đang mở
      if (next.force) return next;
      if (prev?.force) return prev;
      if (prev) return prev;
      return next;
    });
  }, []);

  const handleDismiss = useCallback(() => {
    if (!payload) {
      setPayload(null);
      return;
    }

    const { reason } = payload;
    // force word_limit (≥200): chỉ đóng session — mở app/tab mới vẫn hiện lại
    if (reason === 'plan_expiring') {
      dismissUpsell(reason, dismissSuffixDaily());
    } else if (reason === 'plan_expired' && payload.expiresAt) {
      dismissUpsell(reason, dismissSuffixExpiry(payload.expiresAt));
    } else if (reason === 'word_near_limit') {
      dismissUpsell(reason, dismissSuffixDaily());
    } else if (reason === 'word_limit' && !payload.force) {
      dismissUpsell(reason, dismissSuffixWordMonth());
    }
    // payload.force word_limit → không ghi localStorage

    try {
      track('upsell_dismiss', { reason });
    } catch {
      /* analytics optional */
    }
    setPayload(null);
  }, [payload]);

  // Event bus: hard limit từ save word
  useEffect(() => {
    const onUpsell = (ev: Event) => {
      const detail = (ev as CustomEvent<UpsellPayload>).detail;
      if (!detail?.reason) return;
      show(detail);
      try {
        track('upsell_shown', { reason: detail.reason, force: Boolean(detail.force) });
      } catch {
        /* ignore */
      }
    };
    window.addEventListener(UPSELL_EVENT, onUpsell);
    return () => window.removeEventListener(UPSELL_EVENT, onUpsell);
  }, [show]);

  // Boot evaluate
  useEffect(() => {
    if (isDemo) return;
    if (shouldSkipPath(pathname)) return;

    let cancelled = false;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token || cancelled) return;

      try {
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok || cancelled) return;

        const json = (await res.json()) as {
          success?: boolean;
          data?: { plan?: string; plan_expires_at?: string | null };
          entitlement?: {
            rawPlan: string;
            effectivePlan: string;
            expiresAt: string | null;
            remainingDays: number | null;
            wordQuota: {
              used: number;
              lifetime?: number;
              limit: number | null;
              remaining: number | null;
            };
          };
        };

        if (!json.success || !json.entitlement || cancelled) return;

        const { rawPlan, effectivePlan, expiresAt, remainingDays, wordQuota } = json.entitlement;

        // Nhớ paid state khi còn Pro
        if (effectivePlan !== 'free' && expiresAt) {
          rememberPaidState(rawPlan || effectivePlan, expiresAt);
        }

        const boot = pickBootUpsell({
          effectivePlan,
          rawPlan: rawPlan ?? json.data?.plan ?? 'free',
          expiresAt: expiresAt ?? json.data?.plan_expires_at ?? null,
          remainingDays,
          wordUsed: wordQuota?.used ?? null,
          wordLifetime: wordQuota?.lifetime ?? null,
          wordLimit: wordQuota?.limit ?? 200,
        });

        if (boot && !cancelled) {
          show(boot);
          try {
            track('upsell_shown', { reason: boot.reason, force: false });
          } catch {
            /* ignore */
          }
        }
      } catch (err) {
        console.warn('[Upsell] boot evaluate failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, show, isDemo]);

  return <UpsellModal open={open} payload={payload} onDismiss={handleDismiss} />;
}

/** Re-export để caller hard-limit gọn */
export { requestUpsell };
