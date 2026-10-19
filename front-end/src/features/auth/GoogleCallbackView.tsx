import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Spin, Typography } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthApi } from '@/lib/auth/AuthApi';
import { Pkce } from '@/lib/auth/Pkce';
import { safeInternalRedirect } from '@/lib/auth/safeInternalRedirect';
import { useAuthStore } from '@/stores/useAuthStore';

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
    const code = searchParams.get('code');
    const handshake = Pkce.consume();

    if (providerError) {
      navigate(`/auth/login?error=${encodeURIComponent(providerError)}`, { replace: true });
      return;
    }
    if (!code || !handshake) {
      navigate('/auth/login?error=oauth_relogin', { replace: true });
      return;
    }

    const role = handshake.role === 'Teacher' ? 'Teacher' : 'Student';
    void (async () => {
      try {
        const tokens = await AuthApi.exchangeGoogleCode(code, handshake.verifier, role);
        if (!(await completeLogin(tokens))) {
          throw new Error('Không xác thực được phiên đăng nhập.');
        }
        const next = safeInternalRedirect(handshake.next, '/app');
        navigate(
          `/app/complete?next=${encodeURIComponent(next)}&role=${role === 'Teacher' ? 'teacher' : 'student'}`,
          { replace: true },
        );
      } catch (err: unknown) {
        setError(AuthApi.describeError(err));
      }
    })();
  }, [searchParams, navigate, completeLogin]);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ maxWidth: 420, width: '100%' }}>
          <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />
          <Button type="primary" block onClick={() => navigate('/auth/login', { replace: true })}>
            Quay lại đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        background: '#f6efe6',
      }}
    >
      <Spin size="large" />
      <Typography.Text strong style={{ color: '#5e4b40' }}>
        Đang hoàn tất đăng nhập Google…
      </Typography.Text>
    </div>
  );
};
