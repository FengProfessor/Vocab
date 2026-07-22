'use client';

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

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setPlan('free');
          setRawPlan('free');
          setExpiresAt(null);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', user.id)
        .maybeSingle();
      if (!cancelled) {
        const raw = (data?.plan as Plan | undefined) ?? 'free';
        const exp = data?.plan_expires_at ?? null;
        const effective = getEffectivePlan(raw, exp);
        setRawPlan(raw);
        setExpiresAt(exp);
        setPlan(effective);
        if (effective !== 'free' && exp) {
          rememberPaidState(raw, exp);
        }
        setLoading(false);
      }
    };

    void load();
    const onPlanChanged = () => {
      void load();
    };
    window.addEventListener('lingopro-plan-changed', onPlanChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('lingopro-plan-changed', onPlanChanged);
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
