import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button } from '@/components/ui/Primitives';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FullScreenStatus } from '@/components/common/FullScreenStatus';
import styles from '@/features/auth/GoogleCallbackView.module.css';
import { AuthApi } from '@/lib/auth/AuthApi';
import { Pkce } from '@/lib/auth/Pkce';
import { safeInternalRedirect } from '@/lib/auth/safeInternalRedirect';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types/enums/UserRole';

/**
 * Landing page of the Google OAuth redirect (/auth/callback?code=...). It exchanges the one-time code and
 * the locally held PKCE verifier through the .NET API for the Supabase JWT pair, then enters the app.
 */
export const GoogleCallbackView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const completeLogin = useAuthStore((state) => state.completeLogin);
  const hasRun = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // StrictMode mounts twice; the authorization code is single-use, so exchange exactly once.
    if (hasRun.current) {
      return;
    }
    hasRun.current = true;

    const providerError = searchParams.get('error');
    const providerErrorDesc = searchParams.get('error_description');
    const code = searchParams.get('code');
    const handshake = Pkce.consume();

    if (providerError) {
      const descParam = providerErrorDesc ? `&error_description=${encodeURIComponent(providerErrorDesc)}` : '';
      navigate(`/auth/login?error=${encodeURIComponent(providerError)}${descParam}`, { replace: true });
      return;
    }
    if (!code || !handshake) {
      navigate('/auth/login?error=oauth_relogin', { replace: true });
      return;
    }

    const role = handshake.role === UserRole.Teacher ? UserRole.Teacher : UserRole.Student;
    void (async () => {
      try {
        const tokens = await AuthApi.exchangeGoogleCode(code, handshake.verifier, role);
        if (!(await completeLogin(tokens))) {
          throw new Error('Không xác thực được phiên đăng nhập.');
        }
        const next = safeInternalRedirect(handshake.next, '/app');
        navigate(
          `/app/complete?next=${encodeURIComponent(next)}&role=${role === UserRole.Teacher ? 'teacher' : 'student'}`,
          { replace: true },
        );
      } catch (err: unknown) {
        setError(AuthApi.describeError(err));
      }
    })();
  }, [searchParams, navigate, completeLogin]);

  if (error) {
    return (
      <div className={styles.errorScreen}>
        <div className={styles.errorBox}>
          <Alert className={styles.errorAlert} type="error" showIcon message={error} />
          <Button type="primary" block onClick={() => navigate('/auth/login', { replace: true })}>
            Quay lại đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return <FullScreenStatus message="Đang hoàn tất đăng nhập Google…" />;
};
