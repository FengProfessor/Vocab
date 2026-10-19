import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Divider, Form, Input, Radio, Segmented, Typography } from 'antd';
import { GoogleOutlined, LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthApi } from '@/lib/auth/AuthApi';
import { Pkce } from '@/lib/auth/Pkce';
import { ReferralTracker } from '@/lib/auth/ReferralTracker';
import { safeInternalRedirect } from '@/lib/auth/safeInternalRedirect';
import { useAuthStore } from '@/stores/useAuthStore';

type Mode = 'login' | 'signup';
type RoleChoice = 'Student' | 'Teacher';

interface AuthFormValues {
  fullName?: string;
  email: string;
  password: string;
}

/** Maps the error codes the OAuth callback and guards append to the URL to readable text. */
function describeQueryError(code: string | null): string {
  if (!code) return '';
  if (code === 'access_denied') return 'Bạn đã hủy đăng nhập Google.';
  if (code === 'oauth_relogin') return 'Phiên Google đã hết hạn. Hãy thử đăng nhập lại.';
  return 'Đăng nhập chưa hoàn tất. Hãy thử lại.';
}

/**
 * Sign-in / sign-up page of the SPA. Credentials go to the .NET API (POST /api/v1/auth/login|register),
 * which authenticates against Supabase Auth and returns the Supabase JWT pair. The SPA keeps the tokens
 * and sends the access token as a Bearer header from then on.
 */
export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const completeLogin = useAuthStore((state) => state.completeLogin);

  const initialMode: Mode =
    location.pathname.endsWith('/register') || searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [role, setRole] = useState<RoleChoice>(searchParams.get('role') === 'teacher' ? 'Teacher' : 'Student');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(describeQueryError(searchParams.get('error')));
  const [notice, setNotice] = useState(
    searchParams.get('confirmed') ? 'Email đã được xác nhận. Bạn có thể đăng nhập ngay.' : '',
  );

  const nextPath = useMemo(() => {
    const requested = safeInternalRedirect(
      searchParams.get('returnUrl') ?? searchParams.get('redirectTo'),
      '/app',
    );
    return requested.startsWith('/auth') ? '/app' : requested;
  }, [searchParams]);

  const completeUrl = (selectedRole: RoleChoice): string =>
    `/app/complete?next=${encodeURIComponent(nextPath)}&role=${selectedRole === 'Teacher' ? 'teacher' : 'student'}`;

  useEffect(() => {
    // Remember a referral code from ?ref= / ?invite= so it can be claimed after the first sign-in.
    ReferralTracker.capture();
  }, []);

  useEffect(() => {
    // Already signed in (cached session): skip the form. ProtectedRoute re-verifies and bounces back if stale.
    if (isAuthenticated) {
      navigate(completeUrl(role), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleSubmit = async (values: AuthFormValues): Promise<void> => {
    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      const email = values.email.trim();
      if (mode === 'signup') {
        const result = await AuthApi.register(email, values.password, (values.fullName ?? '').trim(), role);
        if (!result.accessToken) {
          // Supabase requires email confirmation: no session exists yet.
          setMode('login');
          setNotice('Đã gửi email xác nhận. Mở email rồi quay lại đăng nhập.');
          return;
        }
        await finishSignIn(result);
        return;
      }

      await finishSignIn(await AuthApi.login(email, values.password));
    } catch (err: unknown) {
      setError(AuthApi.describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const finishSignIn = async (tokens: { accessToken: string; refreshToken: string; expiresIn: number }): Promise<void> => {
    const verified = await completeLogin(tokens);
    if (!verified) {
      throw new Error('Không xác thực được phiên đăng nhập. Vui lòng thử lại.');
    }
    navigate(completeUrl(role), { replace: true });
  };

  const handleGoogle = async (): Promise<void> => {
    setGoogleLoading(true);
    setError('');
    try {
      const { verifier, challenge } = await Pkce.create();
      Pkce.begin(verifier, role, nextPath);
      const url = await AuthApi.getGoogleAuthorizationUrl(`${window.location.origin}/auth/callback`, challenge);
      window.location.assign(url);
    } catch (err: unknown) {
      setError(AuthApi.describeError(err));
      setGoogleLoading(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f6efe6',
        padding: 24,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 440, borderRadius: 16 }}>
        <Typography.Title level={3} style={{ marginTop: 0, textAlign: 'center' }}>
          LingoPro
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          {isSignup ? 'Tạo tài khoản để lưu từ vựng và ôn đúng lúc quên.' : 'Đăng nhập để tiếp tục học.'}
        </Typography.Paragraph>

        <Segmented
          block
          value={mode}
          onChange={(value) => {
            setMode(value as Mode);
            setError('');
            setNotice('');
          }}
          options={[
            { label: 'Đăng nhập', value: 'login' },
            { label: 'Đăng ký', value: 'signup' },
          ]}
          style={{ marginBottom: 16 }}
        />

        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        {notice && <Alert type="success" showIcon message={notice} style={{ marginBottom: 16 }} />}

        <Form<AuthFormValues> layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          {isSignup && (
            <>
              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên.' }, { max: 100 }]}
              >
                <Input prefix={<UserOutlined />} autoComplete="name" />
              </Form.Item>
              <Form.Item label="Bạn là">
                <Radio.Group value={role} onChange={(event) => setRole(event.target.value as RoleChoice)}>
                  <Radio.Button value="Student">Học viên</Radio.Button>
                  <Radio.Button value="Teacher">Giáo viên</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </>
          )}

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Email không hợp lệ.' }]}
          >
            <Input prefix={<MailOutlined />} autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, min: 6, message: 'Mật khẩu tối thiểu 6 ký tự.' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={submitting}>
            {isSignup ? 'Tạo tài khoản' : 'Đăng nhập'}
          </Button>
        </Form>

        <Divider plain>hoặc</Divider>

        <Button block icon={<GoogleOutlined />} loading={googleLoading} onClick={() => void handleGoogle()}>
          Tiếp tục với Google
        </Button>
      </Card>
    </div>
  );
};
