'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const OAUTH_ROLE_KEY = 'lingopro_oauth_role';
const OAUTH_PILOT_KEY = 'lingopro_oauth_pilot';
const OAUTH_SOURCE_KEY = 'lingopro_oauth_source';

/**
 * OAuth callback — PKCE exchange.
 * Role/pilot lấy từ sessionStorage (không query trên redirectTo — tránh Google chặn).
 */
export default function AuthCallbackPage() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const oauthError = url.searchParams.get('error');
      const oauthDesc = url.searchParams.get('error_description');

      if (oauthError) {
        console.warn('[AuthCallback] provider error:', oauthError, oauthDesc);
        const q = new URLSearchParams({ error: oauthError });
        window.location.replace(`/auth?${q.toString()}`);
        return;
      }

      // Ưu tiên sessionStorage; fallback query cũ (nếu còn link cũ)
      const requestedRole =
        sessionStorage.getItem(OAUTH_ROLE_KEY) ||
        url.searchParams.get('role') ||
        '';
      const pilot =
        sessionStorage.getItem(OAUTH_PILOT_KEY) ||
        url.searchParams.get('pilot') ||
        '';
      const source =
        sessionStorage.getItem(OAUTH_SOURCE_KEY) ||
        url.searchParams.get('source') ||
        '';

      const go = (path: string) => {
        sessionStorage.removeItem(OAUTH_ROLE_KEY);
        sessionStorage.removeItem(OAUTH_PILOT_KEY);
        sessionStorage.removeItem(OAUTH_SOURCE_KEY);

        const dest = new URL(path, window.location.origin);
        if (requestedRole === 'teacher') dest.searchParams.set('pilot_signup', '1');
        if (pilot) dest.searchParams.set('pilot', pilot.slice(0, 40));
        if (source) dest.searchParams.set('source', source.slice(0, 80));
        window.location.replace(dest.toString());
      };

      try {
        let session = null as Awaited<
          ReturnType<typeof supabase.auth.getSession>
        >['data']['session'];

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) console.warn('[AuthCallback] exchange:', error.message);
          session = data.session ?? null;
        }

        if (!session) {
          const { data } = await supabase.auth.getSession();
          session = data.session;
        }

        if (!session) {
          await new Promise((r) => setTimeout(r, 200));
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
