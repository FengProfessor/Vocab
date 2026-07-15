'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

/**
 * OAuth callback — tối ưu tốc độ:
 * - exchange code 1 lần
 * - KHÔNG poll 15×200ms
 * - KHÔNG query profiles (role từ user_metadata / query role=teacher)
 * - claim_teacher fire-and-forget
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

      const go = (path: string) => {
        const dest = new URL(path, window.location.origin);
        if (requestedRole === 'teacher') dest.searchParams.set('pilot_signup', '1');
        if (pilot) dest.searchParams.set('pilot', pilot.slice(0, 40));
        if (source) dest.searchParams.set('source', source.slice(0, 80));
        window.location.replace(dest.toString());
      };

      try {
        let session = null as Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) console.warn('[AuthCallback] exchange:', error.message);
          session = data.session ?? null;
        }

        if (!session) {
          const { data } = await supabase.auth.getSession();
          session = data.session;
        }

        // 1 retry ngắn nếu auto-detect chưa xong (thay vì poll 3s)
        if (!session) {
          await new Promise((r) => setTimeout(r, 150));
          const { data } = await supabase.auth.getSession();
          session = data.session;
        }

        if (!session) {
          window.location.replace('/auth?error=oauth_no_session');
          return;
        }

        if (requestedRole === 'teacher') {
          void supabase.rpc('claim_teacher_role').then(({ error: roleErr }) => {
            if (roleErr) console.warn('[AuthCallback] claim_teacher_role:', roleErr.message);
          });
        }

        const metaRole = session.user.user_metadata?.role;
        const isTeacher = requestedRole === 'teacher' || metaRole === 'teacher';
        go(isTeacher ? '/teacher' : '/student');
      } catch (err) {
        console.error('[AuthCallback]', err);
        window.location.replace('/auth?error=oauth');
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
      <p className="relative text-sm font-bold">Đang vào học…</p>
    </div>
  );
}
