'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { clearDashboardSnapshotCache } from '@/lib/dashboard-snapshot-cache';

/**
 * Side-effect-only gate cho trang chủ.
 * Đã đăng nhập (phiên hợp lệ) → đẩy thẳng sang /student. Render null nên bot không-JS vẫn index markup marketing.
 */
export default function AuthRedirectGate() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session) {
        router.replace('/student');
      } else if (!error) {
        clearDashboardSnapshotCache();
      }
    });
  }, [router]);

  return null;
}
