'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AUTO_GIFT_KEY = 'lingopro_silent_pro_gift_20260806';

export function UpgradeGiftModal() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (localStorage.getItem(AUTO_GIFT_KEY) === 'true') return;
    } catch {
      // ignore
    }

    async function silentGrantGift() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token || !session.user) return;

        // Gọi API âm thầm cộng 7 ngày Pro trong background không hiển thị bất kỳ thông báo nào
        await fetch('/api/billing/claim-upgrade-gift', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        }).catch(() => null);

        localStorage.setItem(AUTO_GIFT_KEY, 'true');
      } catch {
        // ignore
      }
    }

    void silentGrantGift();
  }, []);

  return null; // Không hiển thị bất kỳ Pop-up hay thông báo nào trên màn hình
}
