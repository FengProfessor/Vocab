'use client';
import { authService } from '@/features/auth/session';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  getEffectivePlan,
  getRemainingDays,
  planMeets,
  type Plan,
  type Feature,
  FEATURE_MIN_PLAN,
} from '@/lib/entitlement';
import { rememberPaidState } from '@/lib/upsell';
import { authStateVersion } from '@/lib/app-auth-client';
import { fetchProfileOnce, getStoredProfile } from '@/components/student/StudentProvider';

interface UsePlanResult {
  plan: Plan;
  rawPlan: Plan;
  expiresAt: string | null;
  remainingDays: number | null;
  isPaid: boolean;
  loading: boolean;
  /** Gói hiệu lực có đạt 1 tính năng không (cho UI hiện/ẩn, badge). */
  can: (feature: Feature) => boolean;
}

/**
 * Đọc gói hiệu lực của user hiện tại (client-side, qua RLS).
 * Dùng cho UI: hiện badge "Premium", upsell, ẩn nút... KHÔNG thay thế gate server-side.
 */
export function usePlan(): UsePlanResult {
  const [plan, setPlan] = useState<Plan>('free');
  const [rawPlan, setRawPlan] = useState<Plan>('free');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let request = 0;
    let accountId: string | null = null;

    const applyPlan = (raw: Plan, exp: string | null) => {
      const effective = getEffectivePlan(raw, exp);
      setRawPlan(raw);
      setExpiresAt(exp);
      setPlan(effective);
      if (effective !== 'free' && exp) rememberPaidState(raw, exp);
      setLoading(false);
    };

    const load = async () => {
      const currentRequest = ++request;
      const version = authStateVersion();
      const {
        data: { session },
        error,
      } = await authService.getSession();
      if (cancelled || currentRequest !== request || version !== authStateVersion() || error) return;
      const user = session?.user;
      if (!user) {
        accountId = null;
        applyPlan('free', null);
        return;
      }
      if (accountId !== user.id) {
        accountId = user.id;
        setPlan('free');
        setRawPlan('free');
        setExpiresAt(null);
        setLoading(true);
        const cached = getStoredProfile(user.id);
        if (cached) applyPlan(cached.plan ?? 'free', cached.plan_expires_at ?? null);
      }
      const data = await fetchProfileOnce(user.id);
      // Lỗi mạng/RLS chưa chứng minh gói Free; giữ trạng thái cuối cùng của cùng tài khoản.
      if (cancelled || currentRequest !== request || version !== authStateVersion() || !data) return;
      applyPlan(data.plan ?? 'free', data.plan_expires_at ?? null);
    };

    void load();
    const onPlanChanged = () => {
      void load();
    };
    const { data: { subscription } } = authService.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === 'SIGNED_OUT') {
        request++;
        accountId = null;
        applyPlan('free', null);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        void load();
      }
    });
    window.addEventListener('lingopro-plan-changed', onPlanChanged);
    window.addEventListener('focus', onPlanChanged);
    window.addEventListener('online', onPlanChanged);
    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener('lingopro-plan-changed', onPlanChanged);
      window.removeEventListener('focus', onPlanChanged);
      window.removeEventListener('online', onPlanChanged);
    };
  }, []);

  const remainingDays = getRemainingDays(expiresAt);
  const can = (feature: Feature) => planMeets(plan, FEATURE_MIN_PLAN[feature]);

  return {
    plan,
    rawPlan,
    expiresAt,
    remainingDays,
    isPaid: plan !== 'free',
    loading,
    can,
  };
}
