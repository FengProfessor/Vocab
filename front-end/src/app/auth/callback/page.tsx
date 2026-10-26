'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthApi } from '@/features/auth/api';
import { hydrateSessionFromAuthTokens } from '@/features/auth/session';
import { Pkce } from '@/lib/auth/Pkce';

export default function OAuthCallbackPage() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const url = new URL(window.location.href);
      const oauthError = url.searchParams.get('error');
      const oauthDesc = url.searchParams.get('error_description');

      if (oauthError) {
        const q = new URLSearchParams({ error: oauthError });
        if (oauthDesc) q.set('error_description', oauthDesc);
        window.location.replace(`/auth?${q.toString()}`);
        return;
      }

      const code = url.searchParams.get('code');
      const handshake = Pkce.consume();
      const storedVerifier =
        handshake?.verifier || sessionStorage.getItem('lp:oauth:pkce_verifier') || '';
      const requestedRole =
        sessionStorage.getItem('lingopro_oauth_role') ||
        (handshake?.role ? String(handshake.role) : 'student');

      if (!code || !storedVerifier) {
        window.location.replace('/auth?error=oauth_relogin');
        return;
      }

      try {
        const tokens = await AuthApi.exchangeGoogleCode(
          code,
          storedVerifier,
          requestedRole.toLowerCase() === 'teacher' ? 'teacher' : 'student',
        );
        if (tokens?.accessToken) {
          hydrateSessionFromAuthTokens(tokens);
          sessionStorage.removeItem('lp:oauth:pkce_verifier');
          window.location.replace('/auth/complete');
          return;
        }
        window.location.replace('/auth?error=oauth_no_session');
      } catch {
        window.location.replace('/auth?error=oauth');
      }
    })();
  }, []);

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center gap-3 bg-[#f6efe6] text-[#5e4b40]">
      <Loader2 className="relative h-7 w-7 animate-spin text-[#b5502f]" />
      <p className="relative text-sm font-bold">Đang hoàn tất đăng nhập Google…</p>
    </div>
  );
}
