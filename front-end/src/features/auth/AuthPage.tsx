import React, { useEffect, useMemo, useState } from 'react';
import { App as AntdApp } from 'antd';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { appConfig } from '@/config/appConfig';
import { AuthApi } from '@/lib/auth/AuthApi';
import { InAppBrowserDetector } from '@/lib/auth/InAppBrowserDetector';
import { Pkce } from '@/lib/auth/Pkce';
import { ReferralTracker } from '@/lib/auth/ReferralTracker';
import { safeInternalRedirect } from '@/lib/auth/safeInternalRedirect';
import { useAuthStore } from '@/stores/useAuthStore';
import { InAppBrowserInfo } from '@/types/auth/InAppBrowserInfo';
import { UserRole } from '@/types/enums/UserRole';
import '@/features/auth/AuthPage.css';
import { AuthBrandPanel } from '@/features/auth/components/AuthBrandPanel';
import { AuthMode } from '@/types/auth/AuthMode';
import { SelectableRole } from '@/types/auth/SelectableRole';

/**
 * Unified Login and Registration page of the React 19 SPA (/auth/login and /auth/register).
 * Reproduces the exact visual layout, editorial brand panel, dark terracotta card, referral gift banner,
 * and in-app WebView warning from the server Login.cshtml view while authenticating via POST /api/v1/auth/*.
 */
export const AuthPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const completeLogin = useAuthStore((state) => state.completeLogin);

  const initialMode: AuthMode = useMemo(() => {
    const explicitMode = searchParams.get('mode')?.toLowerCase();
    const isRegisterPath = location.pathname.toLowerCase().endsWith('/register');
    const hasReferralParam = Boolean(searchParams.get('ref') || searchParams.get('invite'));
    if (explicitMode === AuthMode.Signup || isRegisterPath || (!explicitMode && hasReferralParam)) {
      return AuthMode.Signup;
    }
    return AuthMode.Login;
  }, [location.pathname, searchParams]);

  const initialRole: SelectableRole =
    searchParams.get('role')?.toLowerCase() === 'teacher' ? UserRole.Teacher : UserRole.Student;

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<SelectableRole>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(() =>
    AuthApi.describeOAuthQueryError(searchParams.get('error'), searchParams.get('error_description')),
  );
  const [statusMessage, setStatusMessage] = useState(() =>
    searchParams.get('confirmed') ? 'Đã gửi email xác nhận. Mở email rồi quay lại đăng nhập.' : '',
  );
  const [hasReferralGift, setHasReferralGift] = useState(false);
  const [inAppInfo, setInAppInfo] = useState<InAppBrowserInfo>(() => InAppBrowserDetector.detect());
  const [copiedLink, setCopiedLink] = useState(false);

  const isSignup = mode === AuthMode.Signup;
  const isTeacher = role === UserRole.Teacher;

  const homeHref = useMemo(() => `${appConfig.serverOrigin}/`, []);

  const authUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'https://lingopro.online/auth';
    }
    return `${window.location.origin}${location.pathname}${location.search || ''}`;
  }, [location.pathname, location.search]);

  const nextPath = useMemo(() => {
    const requested = safeInternalRedirect(
      searchParams.get('returnUrl') ?? searchParams.get('redirectTo'),
      '/app',
    );
    return requested.startsWith('/auth') ? '/app' : requested;
  }, [searchParams]);

  const buildCompleteUrl = (selectedRole: SelectableRole): string =>
    `/app/complete?next=${encodeURIComponent(nextPath)}&role=${selectedRole === UserRole.Teacher ? 'teacher' : 'student'}`;

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    document.title = isSignup ? 'Đăng Ký — LingoPro' : 'Đăng Nhập — LingoPro';
  }, [isSignup]);

  useEffect(() => {
    setInAppInfo(InAppBrowserDetector.detect());
    const captured = ReferralTracker.capture();
    const stored = ReferralTracker.getStoredCode();
    if (captured || stored) {
      setHasReferralGift(true);
    }
  }, []);

  useEffect(() => {
    const hasAuthQueryNotice = Boolean(searchParams.get('error') || searchParams.get('confirmed'));
    if (isAuthenticated && !hasAuthQueryNotice) {
      navigate(buildCompleteUrl(role), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const switchMode = (targetMode: AuthMode): void => {
    setMode(targetMode);
    setError('');
  };

  const finishSignIn = async (tokens: { accessToken: string; refreshToken: string; expiresIn: number }): Promise<void> => {
    const verified = await completeLogin(tokens);
    if (!verified) {
      throw new Error('Không xác thực được phiên đăng nhập. Vui lòng thử lại.');
    }
    navigate(buildCompleteUrl(role), { replace: true });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (submitting || googleLoading) {
      return;
    }

    // Ignore bot submissions that fill the hidden honeypot field.
    if (websiteHoneypot.trim().length > 0) {
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    if (isSignup && !trimmedName) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!trimmedEmail) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    setSubmitting(true);
    setError('');
    setStatusMessage(isSignup ? 'Đang tạo tài khoản...' : 'Đang đăng nhập...');

    try {
      if (isSignup) {
        const result = await AuthApi.register(trimmedEmail, password, trimmedName, role);
        if (!result.accessToken) {
          setMode(AuthMode.Login);
          setStatusMessage('Đã gửi email xác nhận. Mở email rồi quay lại đăng nhập.');
          void message.success('Kiểm tra email để xác nhận tài khoản.');
          return;
        }
        setStatusMessage('Thành công — đang vào học...');
        await finishSignIn(result);
        return;
      }

      const result = await AuthApi.login(trimmedEmail, password);
      setStatusMessage('Thành công — đang vào học...');
      await finishSignIn(result);
    } catch (err: unknown) {
      const formatted = AuthApi.describeError(err);
      setError(formatted);
      setStatusMessage('');
      void message.error(formatted);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    const detected = inAppInfo.isInApp ? inAppInfo : InAppBrowserDetector.detect();
    if (detected.isInApp) {
      const warning = `Google không cho đăng nhập trong ${detected.appName || 'app'}. Mở Chrome/Safari → lingopro.online/auth`;
      setError(warning);
      void message.error('Mở bằng Chrome hoặc Safari để đăng nhập Google');
      return;
    }

    setGoogleLoading(true);
    setError('');
    setStatusMessage('Đang mở Google...');

    try {
      const { verifier, challenge } = await Pkce.create();
      Pkce.begin(verifier, role, nextPath);
      const authorizationUrl = await AuthApi.getGoogleAuthorizationUrl(
        `${window.location.origin}/auth/callback`,
        challenge,
      );
      window.location.assign(authorizationUrl);
    } catch (err: unknown) {
      const formatted = AuthApi.describeError(err);
      setError(formatted);
      setStatusMessage('');
      setGoogleLoading(false);
      void message.error(formatted);
    }
  };

  const handleOpenExternalBrowser = (): void => {
    const { chromeIntent, plain } = InAppBrowserDetector.buildExternalBrowserUrl(authUrl);
    if (inAppInfo.isAndroid && chromeIntent) {
      window.location.href = chromeIntent;
      return;
    }
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(plain).then(() => {
        void message.success('Đã copy link — dán vào Safari/Chrome');
      });
    }
  };

  const handleCopyAuthUrl = (): void => {
    if (!navigator.clipboard) {
      return;
    }
    void navigator.clipboard.writeText(authUrl).then(() => {
      setCopiedLink(true);
      void message.success('Đã copy link!');
      window.setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <div className="lp-auth-root">

      {/* Ambient Background Glows */}
      <div className="lp-auth-glows" aria-hidden="true">
        <div className="lp-auth-glow-1" />
        <div className="lp-auth-glow-2" />
        <div className="lp-auth-glow-3" />
      </div>

      <div className="lp-auth-grid">
        {/* Desktop Brand Panel (Left Column) */}
        <AuthBrandPanel homeHref={homeHref} />

        {/* Form Column (Right Column) */}
        <div className="lp-auth-form-col">
          {/* Mobile Brand Header */}
          <div className="lp-auth-mobile-header">
            <a href={homeHref} className="lp-auth-brand-link">
              <div className="lp-auth-brand-icon lp-auth-u1" >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                  <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
                  <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
                  <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
                  <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
                  <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
                  <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
                  <path d="M6 18a4 4 0 0 1-1.967-.516" />
                  <path d="M19.967 17.484A4 4 0 0 1 18 18" />
                </svg>
              </div>
              <span className="lp-auth-brand-name">LingoPro</span>
            </a>
            <p className="lp-auth-mobile-subtitle">{isSignup ? 'Tạo tài khoản miễn phí' : 'Chào mừng trở lại'}</p>
          </div>

          <div className="lp-auth-card-wrap">
            <div className="lp-auth-card">
              {/* Desktop Card Header */}
              <div className="lp-auth-desktop-header">
                <p className="lp-auth-desktop-title">{isSignup ? 'Tạo tài khoản' : 'Đăng nhập'}</p>
                <p className="lp-auth-desktop-subtitle">
                  {isSignup ? 'Bắt đầu miễn phí — không cần thẻ.' : 'Tiếp tục lộ trình từ vựng của bạn.'}
                </p>
              </div>

              {/* Referral Gift Banner */}
              {hasReferralGift && (
                <div className="lp-auth-referral-banner">
                  <svg
                    className="lp-animate-pulse lp-auth-u2"
                    width="20"
                    height="20"
                    
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="8" width="18" height="4" rx="1" />
                    <path d="M12 8v13" />
                    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
                    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
                  </svg>
                  <div>
                    {isSignup ? (
                      <span>
                        <strong className="lp-auth-u3">Quà tặng bạn mới:</strong> Đăng ký ngay để nhận{' '}
                        <strong className="lp-auth-u4">7 ngày Pro VIP</strong> học tập cùng bạn bè!
                      </span>
                    ) : (
                      <span>
                        <strong className="lp-auth-u3">Quà tặng bạn bè:</strong> Đăng nhập để kích hoạt hoặc
                        chuyển sang tab{' '}
                        <button type="button" onClick={() => switchMode(AuthMode.Signup)} className="lp-auth-referral-link">
                          Đăng ký
                        </button>{' '}
                        nếu bạn chưa có tài khoản!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Mode Switcher Tabs (Đăng nhập / Đăng ký) */}
              <div className="lp-auth-tabs" role="tablist" aria-label="Chế độ xác thực">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isSignup}
                  onClick={() => switchMode(AuthMode.Login)}
                  className={`lp-auth-tab-btn ${!isSignup ? 'is-active' : ''}`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isSignup}
                  onClick={() => switchMode(AuthMode.Signup)}
                  className={`lp-auth-tab-btn ${isSignup ? 'is-active' : ''}`}
                >
                  Đăng ký
                </button>
              </div>

              {/* Error Alert Box */}
              {error && (
                <div role="alert" className="lp-auth-error-box">
                  <svg
                    width="20"
                    height="20"
                    className="lp-auth-u5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                  <p className="lp-auth-error-text">{error}</p>
                </div>
              )}

              <form onSubmit={(e) => void handleSubmit(e)} className="lp-auth-form" noValidate>
                {/* Honeypot anti-bot field */}
                <input
                  type="text"
                  name="website"
                  value={websiteHoneypot}
                  onChange={(e) => setWebsiteHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="lp-auth-u6"
                  aria-hidden="true"
                />

                {/* WebView / Zalo / FB Warning Banner */}
                {inAppInfo.isInApp && (
                  <div className="lp-auth-inapp-box">
                    <p className="lp-auth-u7">
                      ⚠️ Đang mở trong <span>{inAppInfo.appName || 'app'}</span>
                    </p>
                    <p className="lp-auth-u8">
                      Google <b>không cho</b> đăng nhập trong Zalo / Facebook / WebView. Hãy mở <b>Chrome</b> hoặc{' '}
                      <b>Safari</b>, vào:
                    </p>
                    <p
                      className="lp-auth-u9"
                    >
                      lingopro.online/auth
                    </p>
                    <div className="lp-auth-inapp-actions">
                      <button
                        type="button"
                        onClick={handleOpenExternalBrowser}
                        className="lp-auth-inapp-primary-btn"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M15 3h6v6" />
                          <path d="M10 14 21 3" />
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        </svg>
                        <span>{inAppInfo.isAndroid ? 'Mở bằng Chrome' : 'Copy link mở Safari'}</span>
                      </button>
                      <button type="button" onClick={handleCopyAuthUrl} className="lp-auth-inapp-secondary-btn">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                        <span>{copiedLink ? 'Đã copy link!' : 'Copy link'}</span>
                      </button>
                    </div>
                    <p className="lp-auth-u10">
                      Hoặc đăng ký / đăng nhập bằng <b>email + mật khẩu</b> bên dưới (vẫn dùng được trong app).
                    </p>
                  </div>
                )}

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  disabled={submitting || googleLoading || inAppInfo.isInApp}
                  onClick={() => void handleGoogleSignIn()}
                  className="lp-auth-google-btn"
                >
                  {googleLoading ? (
                    <svg
                      className="lp-animate-spin"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      className="lp-auth-u11"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  <span>
                    {inAppInfo.isInApp
                      ? 'Google: mở Chrome/Safari'
                      : googleLoading
                        ? 'Đang mở Google…'
                        : 'Tiếp tục với Google'}
                  </span>
                </button>

                {/* Divider */}
                <div className="lp-auth-divider">
                  <div className="lp-auth-divider-line" />
                  <span className="lp-auth-divider-text">hoặc email</span>
                  <div className="lp-auth-divider-line" />
                </div>

                {/* Signup-Only Fields (FullName & Student/Teacher Role Selector) */}
                {isSignup && (
                  <div className="lp-auth-u12">
                    <div className="lp-auth-field">
                      <svg
                        className="lp-auth-field-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <label htmlFor="full-name" className="lp-auth-sr-only">
                        Họ và tên
                      </label>
                      <input
                        id="full-name"
                        name="fullName"
                        type="text"
                        placeholder="Họ và tên"
                        autoComplete="name"
                        enterKeyHint="next"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required={isSignup}
                        maxLength={100}
                        className="lp-auth-input"
                      />
                    </div>

                    <div className="lp-auth-role-grid">
                      <button
                        type="button"
                        onClick={() => setRole(UserRole.Student)}
                        className={`lp-auth-role-btn ${!isTeacher ? 'is-active' : ''}`}
                      >
                        <svg
                          width="16"
                          height="16"
                          className="lp-auth-u11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 7v14" />
                          <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
                        </svg>
                        <span className="lp-auth-u13">
                          Học sinh
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole(UserRole.Teacher)}
                        className={`lp-auth-role-btn ${isTeacher ? 'is-active' : ''}`}
                      >
                        <svg
                          width="16"
                          height="16"
                          className="lp-auth-u11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                          <path d="M22 10v6" />
                          <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                        </svg>
                        <span className="lp-auth-u13">
                          Giáo viên
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div className="lp-auth-field">
                  <svg
                    className="lp-auth-field-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <label htmlFor="email" className="lp-auth-sr-only">
                    Địa chỉ email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    placeholder="Email"
                    autoComplete="email"
                    enterKeyHint="next"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="lp-auth-input"
                  />
                </div>

                {/* Password Field */}
                <div className="lp-auth-field">
                  <svg
                    className="lp-auth-field-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <label htmlFor="password" className="lp-auth-sr-only">
                    Mật khẩu
                  </label>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isSignup ? 'Mật khẩu (≥ 6 ký tự)' : 'Mật khẩu'}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    enterKeyHint="done"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="lp-auth-input has-toggle"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="lp-auth-pwd-toggle"
                  >
                    {showPassword ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                        <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                        <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                        <path d="m2 2 20 20" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Forgot Password Link (login mode only) */}
                {!isSignup && (
                  <div>
                    <a
                      href="#forgot-password"
                      onClick={(e) => {
                        e.preventDefault();
                        void message.info('Vui lòng liên hệ hỗ trợ hoặc đăng nhập nhanh bằng Google.');
                      }}
                      className="lp-auth-forgot-link"
                    >
                      Quên mật khẩu?
                    </a>
                  </div>
                )}

                {/* Submit Button & Status */}
                <div className="lp-auth-u14">
                  <button type="submit" disabled={submitting || googleLoading} className="lp-auth-submit-btn">
                    {submitting && (
                      <svg
                        className="lp-animate-spin"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    )}
                    <span>{isSignup ? 'Tạo tài khoản' : 'Đăng nhập'}</span>
                    {!submitting && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    )}
                  </button>

                  {statusMessage && <p className="lp-auth-status-text">{statusMessage}</p>}
                </div>
              </form>
            </div>

            {/* Footer Links */}
            <p className="lp-auth-footer">
              <a href={homeHref} className="lp-auth-footer-link">
                ← Về trang chủ
              </a>
              <span className="lp-auth-u15">·</span>
              Không cần thẻ · Miễn phí
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
