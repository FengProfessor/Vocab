'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * Side-effect-only gate cho trang chủ.
 * Đã đăng nhập → đẩy thẳng sang /student. Render null nên bot không-JS vẫn index markup marketing.
 */
export default function AuthRedirectGate() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/student');
      }
    });
  }, [router]);

  return null;
}
