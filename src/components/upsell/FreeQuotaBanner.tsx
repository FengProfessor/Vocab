'use client';

/**
 * Banner dính cho Free ≥150 từ — luôn thấy (không phụ thuộc modal dismiss).
 * Mount trong StudentShell.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Crown, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getEffectivePlan } from '@/lib/entitlement';
import { useStudentContext } from '@/components/student/StudentProvider';
import {
  FREE_WORD_MONTHLY_LIMIT,
  dismissSuffixDaily,
  isDismissed,
  requestUpsell,
} from '@/lib/upsell';

type Quota = {
  used: number;
  lifetime: number;
  limit: number;
  remaining: number;
};

const SESSION_HIDE_KEY = 'lp:free_quota_banner_hide';

function isSessionHidden(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(SESSION_HIDE_KEY) === '1';
  } catch {
    return false;
  }
}

export interface FreeQuotaBannerProps {
  enabled?: boolean;
  onStatusChange?: (status: 'active' | 'inactive') => void;
  onDismiss?: () => void;
}

export function FreeQuotaBanner({
  enabled = true,
  onStatusChange,
  onDismiss,
}: FreeQuotaBannerProps) {
  const studentCtx = useStudentContext();
  const ctxProfile = studentCtx?.profile ?? null;
  const isKnownNonFree = Boolean(
    ctxProfile && getEffectivePlan(ctxProfile.plan, ctxProfile.plan_expires_at) !== 'free',
  );
  const [quota, setQuota] = useState<Quota | null>(null);
  const [hidden, setHidden] = useState<boolean>(() => isSessionHidden());
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    if (!enabled || isKnownNonFree || hidden || isSessionHidden()) {
      onStatusChangeRef.current?.('inactive');
      return;
    }

    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user || cancelled) {
        if (!cancelled) onStatusChangeRef.current?.('inactive');
        return;
      }

      try {
        const res = await fetch('/api/profile', {
          headers: { 'X-LingoPro-Request': '1' },
        });
        if (!res.ok || cancelled) {
          if (!cancelled) onStatusChangeRef.current?.('inactive');
          return;
        }
        const json = (await res.json()) as {
          success?: boolean;
          entitlement?: {
            effectivePlan: string;
            wordQuota?: {
              used?: number;
              lifetime?: number;
              limit?: number | null;
              remaining?: number | null;
            };
          };
        };
        if (!json.success || !json.entitlement || cancelled) {
          if (!cancelled) onStatusChangeRef.current?.('inactive');
          return;
        }
        if (json.entitlement.effectivePlan !== 'free') {
          onStatusChangeRef.current?.('inactive');
          return;
        }

        const wq = json.entitlement.wordQuota;
        const used = wq?.used ?? 0;
        const lifetime = wq?.lifetime ?? used;
        const limit = wq?.limit ?? FREE_WORD_MONTHLY_LIMIT;
        const remaining = wq?.remaining ?? Math.max(0, limit - used);
        const signal = Math.max(used, lifetime);
        if (signal < 150) {
          onStatusChangeRef.current?.('inactive');
          return;
        }

        setQuota({ used: Math.max(used, lifetime), lifetime, limit, remaining });
        onStatusChangeRef.current?.('active');

        // Ép mở modal nếu ≥200 (mọi lần vào shell, kể cả đã dismiss modal trước đó trong session khác)
        if (signal >= limit || used >= limit) {
          requestUpsell({
            reason: 'word_limit',
            used: Math.max(used, lifetime),
            limit,
            remaining,
            force: true,
          });
        } else if (signal >= 150 && !isDismissed('word_near_limit', dismissSuffixDaily())) {
          requestUpsell({
            reason: 'word_near_limit',
            used: Math.max(used, lifetime),
            limit,
            remaining,
          });
        }
      } catch {
        if (!cancelled) onStatusChangeRef.current?.('inactive');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, isKnownNonFree, hidden]);

  if (!enabled || isKnownNonFree || hidden || !quota) return null;

  const over = quota.used >= quota.limit || quota.remaining <= 0;
  const pct = Math.min(100, Math.round((quota.used / Math.max(1, quota.limit)) * 100));

  return (
    <div
      className={`relative z-20 border-b px-3 py-2.5 sm:px-4 ${
        over
          ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50'
          : 'border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50'
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-2 sm:gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${
            over ? 'bg-orange-600' : 'bg-violet-600'
          }`}
        >
          <Crown className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[13px] font-bold leading-snug sm:text-sm ${over ? 'text-orange-950' : 'text-violet-950'}`}>
            {over
              ? `Bạn đã lưu ${quota.used} từ (trần Free ${quota.limit}/tháng) — lưu thêm cần Pro`
              : `Đã lưu ${quota.used}/${quota.limit} từ tháng này · còn ~${quota.remaining} slot Free`}
          </p>
          <div className="mt-1 h-1.5 max-w-xs overflow-hidden rounded-full bg-black/10">
            <div
              className={`h-full rounded-full ${over ? 'bg-orange-500' : 'bg-violet-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <Link
          href="/upgrade?from=banner_quota"
          className={`shrink-0 rounded-full px-3 py-2 text-xs font-black text-white sm:px-4 sm:text-sm ${
            over ? 'bg-orange-600 hover:bg-orange-700' : 'bg-violet-600 hover:bg-violet-700'
          }`}
        >
          Nâng Pro
        </Link>
        <button
          type="button"
          aria-label="Ẩn banner phiên này"
          onClick={() => {
            setHidden(true);
            try {
              sessionStorage.setItem(SESSION_HIDE_KEY, '1');
            } catch {
              /* ignore */
            }
            onStatusChange?.('inactive');
            onDismiss?.();
          }}
          className="shrink-0 rounded-lg p-1.5 text-black/40 hover:bg-black/5 hover:text-black/70"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
