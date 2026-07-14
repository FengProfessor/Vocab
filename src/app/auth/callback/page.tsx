'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

/**
 * Client-side OAuth callback.
 * App đọc session từ localStorage (browser supabase client), nên exchange code
 * PHẢI chạy client-side để session lưu vào localStorage. Route server cũ ghi
 * session vào cookie → /student gate không thấy → bounce về /auth.
 */
export default function AuthCallbackPage() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const requestedRole = url.searchParams.get('role');
      const pilot = url.searchParams.get('pilot');
      const source = url.searchParams.get('source');

      try {
        // detectSessionInUrl có thể đã tự exchange code → bỏ qua lỗi "đã dùng", check session sau.
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) console.warn('[AuthCallback] exchange:', error.message);
        }

        // Retry getSession ~3s phòng auto-detect chạy bất đồng bộ.
        let session = null;
        for (let i = 0; i < 15; i++) {
          const { data } = await supabase.auth.getSession();
          if (data.session) { session = data.session; break; }
          await new Promise((r) => setTimeout(r, 200));
        }

        if (!session) {
          window.location.href = '/auth?error=oauth_no_session';
          return;
        }

        const userId = session.user.id;
        if (requestedRole === 'teacher') {
          const { error: roleErr } = await supabase.rpc('claim_teacher_role');
          if (roleErr) console.warn('[AuthCallback] claim_teacher_role:', roleErr.message);
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        const role = requestedRole === 'teacher' ? 'teacher' : profile?.role;
        const dest = new URL(role === 'teacher' ? '/teacher' : '/student', window.location.origin);
        if (requestedRole === 'teacher') dest.searchParams.set('pilot_signup', '1');
        if (pilot) dest.searchParams.set('pilot', pilot.slice(0, 40));
        if (source) dest.searchParams.set('source', source.slice(0, 80));
        window.location.href = dest.toString();
      } catch (err) {
        console.error('[AuthCallback]', err);
        window.location.href = '/auth?error=oauth';
      }
    })();
  }, []);

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center gap-3 bg-[#f6efe6] text-[#5e4b40]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-[-8%] top-[-10%] h-[20rem] w-[20rem] rounded-full bg-[#e57b52]/18 blur-3xl" />
        <div className="absolute right-[-8%] top-[20%] h-[18rem] w-[18rem] rounded-full bg-[#d2c09e]/30 blur-3xl" />
      </div>
      <Loader2 className="relative h-7 w-7 animate-spin text-[#b5502f]" />
      <p className="relative text-sm font-bold">Đang hoàn tất đăng nhập…</p>
    </div>
  );
}
