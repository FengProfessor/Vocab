'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getEffectivePlan, planMeets, type Plan, type Feature, FEATURE_MIN_PLAN } from '@/lib/entitlement';

interface UsePlanResult {
  plan: Plan;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) { setPlan('free'); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', user.id)
        .maybeSingle();
      if (!cancelled) {
        setPlan(getEffectivePlan(data?.plan as Plan | undefined, data?.plan_expires_at ?? null));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const can = (feature: Feature) => planMeets(plan, FEATURE_MIN_PLAN[feature]);

  return { plan, loading, can };
}
