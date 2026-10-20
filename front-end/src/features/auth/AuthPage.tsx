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

type AuthMode = 'login' | 'signup';
type SelectableRole = UserRole.Student | UserRole.Teacher;

/**
 * Scoped stylesheet mirroring the server-rendered Login.cshtml layout, editorial brand panel,
 * dark terracotta card, referral gift banner, and responsive mobile/desktop breakpoints.
 */
const AUTH_PAGE_CSS = `
.lp-auth-root {
  --lp-font: 'Inter', 'Be Vietnam Pro', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100dvh;
  overflow-x: hidden;
  background-color: #f6efe6;
  color: #241710;
  font-family: var(--lp-font);
  -webkit-font-smoothing: antialiased;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
}
.lp-auth-root *,
.lp-auth-root *::before,
.lp-auth-root *::after {
  box-sizing: border-box;
}
.lp-auth-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
@keyframes lpSpinIcon {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.lp-animate-spin { animation: lpSpinIcon 1s linear infinite; }
@keyframes lpPulseSlow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.lp-animate-pulse { animation: lpPulseSlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
.lp-auth-glows {
  pointer-events: none;
  position: fixed;
  inset: 0;
  overflow: hidden;
}
.lp-auth-glow-1 {
  position: absolute;
  left: -20%;
  top: -12%;
  width: 14rem;
  height: 14rem;
  border-radius: 9999px;
  background: rgba(229, 123, 82, 0.18);
  filter: blur(64px);
}
.lp-auth-glow-2 {
  position: absolute;
  right: -18%;
  top: 12%;
  width: 13rem;
  height: 13rem;
  border-radius: 9999px;
  background: rgba(210, 192, 158, 0.3);
  filter: blur(64px);
}
.lp-auth-glow-3 {
  display: none;
  position: absolute;
  bottom: -12%;
  left: 33.333333%;
  width: 20rem;
  height: 20rem;
  border-radius: 9999px;
  background: rgba(241, 196, 109, 0.15);
  filter: blur(64px);
}
@media (min-width: 640px) {
  .lp-auth-glow-1 { left: -8%; width: 24rem; height: 24rem; }
  .lp-auth-glow-2 { right: -8%; width: 26rem; height: 26rem; }
  .lp-auth-glow-3 { display: block; }
}
.lp-auth-grid {
  position: relative;
  margin-left: auto;
  margin-right: auto;
  display: grid;
  min-height: 100dvh;
  width: 100%;
  max-width: 72rem;
}
@media (min-width: 1024px) {
  .lp-auth-grid { grid-template-columns: 1.05fr 0.95fr; }
}
.lp-auth-aside {
  position: relative;
  display: none;
  flex-direction: column;
  justify-content: space-between;
  padding: 2rem;
}
@media (min-width: 1024px) {
  .lp-auth-aside { display: flex; padding: 3rem; }
}
.lp-auth-brand-link {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  color: #241710;
  text-decoration: none;
}
.lp-auth-brand-link:hover { color: #241710; }
.lp-auth-brand-icon {
  display: flex;
  width: 2.5rem;
  height: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background-color: #241710;
  color: #f6efe6;
}
.lp-auth-brand-name {
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.025em;
}
.lp-auth-hero-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.lp-auth-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  border-radius: 9999px;
  border: 1px solid rgba(184, 111, 82, 0.2);
  background-color: rgba(255, 255, 255, 0.8);
  padding: 0.25rem 0.875rem;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #9f4d2f;
}
.lp-auth-headline {
  margin: 0;
  max-width: 28rem;
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #241710;
}
@media (min-width: 1280px) {
  .lp-auth-headline { font-size: 2.75rem; }
}
.lp-auth-headline-accent { color: #b5502f; }
.lp-auth-lead {
  margin: 0;
  max-width: 24rem;
  font-size: 1rem;
  line-height: 1.75rem;
  color: #5e4b40;
}
.lp-auth-benefits {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.lp-auth-benefit-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 1rem;
  border: 1px solid rgba(188, 165, 143, 0.35);
  background-color: rgba(255, 255, 255, 0.7);
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.lp-auth-benefit-icon {
  display: flex;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background-color: #241710;
  color: #f6efe6;
}
.lp-auth-benefit-text {
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 700;
  color: #3d2c22;
}
.lp-auth-Perks {
  display: flex;
  flex-wrap: wrap;
  column-gap: 1.25rem;
  row-gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 600;
  color: #7b6558;
}
.lp-auth-perk-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}
.lp-auth-aside-footer {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 600;
  color: #a08b7c;
}
.lp-auth-form-col {
  display: flex;
  min-height: 100dvh;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 0.75rem 0.75rem 2rem;
}
@media (min-width: 640px) {
  .lp-auth-form-col { padding: 2rem 1.5rem 2.5rem; }
}
@media (min-width: 1024px) {
  .lp-auth-form-col { justify-content: center; padding-top: 3rem; padding-bottom: 3rem; }
}
.lp-auth-mobile-header {
  margin-bottom: 0.75rem;
  display: flex;
  width: 100%;
  max-width: 28rem;
  flex-direction: column;
  align-items: center;
}
@media (min-width: 640px) {
  .lp-auth-mobile-header { margin-bottom: 1.25rem; }
}
@media (min-width: 1024px) {
  .lp-auth-mobile-header { display: none; }
}
.lp-auth-mobile-subtitle {
  margin: 0.375rem 0 0;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #7b6558;
}
@media (min-width: 640px) {
  .lp-auth-mobile-subtitle { font-size: 0.875rem; }
}
.lp-auth-card-wrap { width: 100%; max-width: 28rem; }
.lp-auth-card {
  border-radius: 1rem;
  border: 1px solid rgba(36, 23, 16, 0.1);
  background-color: #241710;
  padding: 1rem;
  color: #f6efe6;
  box-shadow: 0 20px 50px rgba(36, 23, 16, 0.2);
}
@media (min-width: 640px) {
  .lp-auth-card { border-radius: 1.75rem; padding: 1.5rem; }
}
@media (min-width: 1024px) {
  .lp-auth-card { padding: 2rem; }
}
.lp-auth-desktop-header { margin-bottom: 1.25rem; display: none; }
@media (min-width: 1024px) {
  .lp-auth-desktop-header { display: block; }
}
.lp-auth-desktop-title {
  margin: 0;
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #f6efe6;
}
.lp-auth-desktop-subtitle {
  margin: 0.375rem 0 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #d8c9bc;
}
.lp-auth-referral-banner {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  border-radius: 1rem;
  border: 1px solid rgba(251, 191, 36, 0.4);
  background-color: rgba(245, 158, 11, 0.15);
  padding: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fef3c7;
  line-height: 1.625;
}
.lp-auth-referral-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-weight: 700;
  color: #fcd34d;
  text-decoration: underline;
  cursor: pointer;
}
.lp-auth-referral-link:hover { color: #fde68a; }
.lp-auth-tabs {
  margin-bottom: 1rem;
  display: flex;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.06);
  padding: 0.25rem;
}
@media (min-width: 640px) {
  .lp-auth-tabs { margin-bottom: 1.25rem; }
}
.lp-auth-tab-btn {
  min-height: 2.75rem;
  flex: 1;
  border-radius: 0.75rem;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 900;
  transition: all 0.18s ease;
  cursor: pointer;
  color: #cbb7a6;
}
@media (min-width: 640px) {
  .lp-auth-tab-btn { min-height: 3rem; }
}
.lp-auth-tab-btn:hover { color: #f6efe6; }
.lp-auth-tab-btn.is-active {
  background-color: #b5502f;
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(181, 80, 47, 0.35);
}
.lp-auth-error-box {
  margin-bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  border-radius: 1rem;
  border: 1px solid rgba(251, 113, 133, 0.25);
  background-color: rgba(244, 63, 94, 0.15);
  padding: 0.75rem;
}
@media (min-width: 640px) {
  .lp-auth-error-box { margin-bottom: 1.25rem; padding: 1rem; }
}
.lp-auth-error-text {
  margin: 0;
  word-break: break-word;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.625;
  color: #ffe4e6;
}
.lp-auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.lp-auth-inapp-box {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  border-radius: 1rem;
  border: 1px solid rgba(251, 191, 36, 0.4);
  background-color: rgba(245, 158, 11, 0.15);
  padding: 0.875rem;
}
.lp-auth-inapp-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
@media (min-width: 640px) {
  .lp-auth-inapp-actions { flex-direction: row; }
}
.lp-auth-inapp-primary-btn {
  display: inline-flex;
  min-height: 2.75rem;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 9999px;
  border: none;
  background-color: #fbbf24;
  padding: 0 0.75rem;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 900;
  color: #241710;
  cursor: pointer;
}
.lp-auth-inapp-secondary-btn {
  display: inline-flex;
  min-height: 2.75rem;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0 0.75rem;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  color: #ffffff;
  cursor: pointer;
}
.lp-auth-google-btn {
  display: inline-flex;
  min-height: 3rem;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background-color: #ffffff;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  color: #241710;
  transition: transform 0.15s ease, opacity 0.15s ease;
  cursor: pointer;
}
.lp-auth-google-btn:active:not(:disabled) { transform: scale(0.98); }
.lp-auth-google-btn:disabled { cursor: not-allowed; opacity: 0.5; }
.lp-auth-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.125rem 0;
}
.lp-auth-divider-line {
  height: 1px;
  flex: 1;
  background-color: rgba(255, 255, 255, 0.1);
}
.lp-auth-divider-text {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #a08b7c;
}
.lp-auth-field { position: relative; }
.lp-auth-field-icon {
  pointer-events: none;
  position: absolute;
  left: 0.875rem;
  top: 50%;
  width: 1rem;
  height: 1rem;
  transform: translateY(-50%);
  color: #a08b7c;
}
.lp-auth-input {
  width: 100%;
  min-height: 3rem;
  border-radius: 1rem;
  border: 1px solid rgba(188, 165, 143, 0.45);
  background-color: rgba(255, 255, 255, 0.9);
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  color: #241710;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.15s ease;
}
.lp-auth-input::placeholder { color: #a08b7c; }
.lp-auth-input:focus {
  border-color: rgba(181, 80, 47, 0.5);
  outline: none;
  box-shadow: 0 0 0 4px rgba(181, 80, 47, 0.1);
}
.lp-auth-input.has-toggle { padding-right: 3rem; }
.lp-auth-pwd-toggle {
  position: absolute;
  right: 0.375rem;
  top: 50%;
  display: flex;
  width: 2.5rem;
  height: 2.5rem;
  transform: translateY(-50%);
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  border: none;
  background: transparent;
  color: #a08b7c;
  cursor: pointer;
}
.lp-auth-pwd-toggle:active { background-color: rgba(0, 0, 0, 0.05); }
.lp-auth-role-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}
.lp-auth-role-btn {
  display: flex;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.06);
  padding: 0 0.5rem;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  color: #cbb7a6;
  transition: all 0.15s ease;
  cursor: pointer;
}
.lp-auth-role-btn.is-active {
  border-color: rgba(181, 80, 47, 0.6);
  background-color: rgba(181, 80, 47, 0.2);
  color: #ffffff;
}
.lp-auth-forgot-link {
  font-size: 0.875rem;
  color: #f6efe6;
  text-decoration: underline;
}
.lp-auth-forgot-link:hover { color: #ffffff; }
.lp-auth-submit-btn {
  display: inline-flex;
  min-height: 3rem;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 9999px;
  border: none;
  background-color: #b5502f;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 900;
  color: #ffffff;
  box-shadow: 0 14px 36px rgba(181, 80, 47, 0.35);
  transition: transform 0.15s ease, opacity 0.15s ease;
  cursor: pointer;
}
.lp-auth-submit-btn:active:not(:disabled) { transform: scale(0.98); }
.lp-auth-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.lp-auth-status-text {
  margin: 0.625rem 0 0;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.375;
  color: #f1c46d;
}
.lp-auth-footer {
  margin: 1rem 0 0;
  padding: 0 0.25rem 0.5rem;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.25rem;
  color: #7b6558;
}
@media (min-width: 640px) {
  .lp-auth-footer { margin-top: 1.25rem; font-size: 0.75rem; }
}
.lp-auth-footer-link {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: #bca58f;
  text-underline-offset: 2px;
}
.lp-auth-footer-link:hover { color: #241710; }
`;

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
    if (explicitMode === 'signup' || isRegisterPath || (!explicitMode && hasReferralParam)) {
      return 'signup';
    }
    return 'login';
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

  const isSignup = mode === 'signup';
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
          setMode('login');
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
      <style>{AUTH_PAGE_CSS}</style>

      {/* Ambient Background Glows */}
      <div className="lp-auth-glows" aria-hidden="true">
        <div className="lp-auth-glow-1" />
        <div className="lp-auth-glow-2" />
        <div className="lp-auth-glow-3" />
      </div>

      <div className="lp-auth-grid">
        {/* Desktop Brand Panel (Left Column) */}
        <aside className="lp-auth-aside">
          <a href={homeHref} className="lp-auth-brand-link">
            <div className="lp-auth-brand-icon">
              <svg
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

          <div className="lp-auth-hero-stack">
            <div className="lp-auth-badge">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                <path d="M20 3v4" />
                <path d="M22 5h-4" />
                <path d="M4 17v2" />
                <path d="M5 18H3" />
              </svg>
              App học từ vựng · FSRS
            </div>

            <h1 className="lp-auth-headline">
              Học từ vựng — <span className="lp-auth-headline-accent">tra 1 chạm, nhớ lâu hơn</span>
            </h1>

            <p className="lp-auth-lead">
              Tra từ trên web → lưu kho riêng → ôn đúng lúc bằng FSRS. Chặng ngắn 5–8 phút, lộ trình sẵn cho người
              Việt.
            </p>

            <ul className="lp-auth-benefits">
              <li className="lp-auth-benefit-item">
                <div className="lp-auth-benefit-icon">
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
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" />
                    <line x1="21.17" x2="12" y1="8" y2="8" />
                    <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
                    <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
                  </svg>
                </div>
                <span className="lp-auth-benefit-text">Tra từ 1 chạm trên web</span>
              </li>
              <li className="lp-auth-benefit-item">
                <div className="lp-auth-benefit-icon">
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
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                    <path d="M20 3v4" />
                    <path d="M22 5h-4" />
                    <path d="M4 17v2" />
                    <path d="M5 18H3" />
                  </svg>
                </div>
                <span className="lp-auth-benefit-text">Lưu kho riêng · ảnh + ví dụ</span>
              </li>
              <li className="lp-auth-benefit-item">
                <div className="lp-auth-benefit-icon">
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
                    <path d="m2 9 3-3 3 3" />
                    <path d="M13 18H7a2 2 0 0 1-2-2V6" />
                    <path d="m22 15-3 3-3-3" />
                    <path d="M11 6h6a2 2 0 0 1 2 2v10" />
                  </svg>
                </div>
                <span className="lp-auth-benefit-text">Ôn FSRS đúng lúc quên</span>
              </li>
            </ul>

            <div className="lp-auth-Perks">
              {['Miễn phí bắt đầu', '5–8 phút/chặng', 'Lộ trình sẵn'].map((perk) => (
                <span key={perk} className="lp-auth-perk-item">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2d7f5e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {perk}
                </span>
              ))}
            </div>
          </div>

          <p className="lp-auth-aside-footer">9.000+ từ · 660+ chặng · 30+ lộ trình</p>
        </aside>

        {/* Form Column (Right Column) */}
        <div className="lp-auth-form-col">
          {/* Mobile Brand Header */}
          <div className="lp-auth-mobile-header">
            <a href={homeHref} className="lp-auth-brand-link">
              <div className="lp-auth-brand-icon" style={{ width: '2.25rem', height: '2.25rem' }}>
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
                    className="lp-animate-pulse"
                    width="20"
                    height="20"
                    style={{ flexShrink: 0, color: '#fbbf24' }}
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
                        <strong style={{ color: '#ffffff' }}>Quà tặng bạn mới:</strong> Đăng ký ngay để nhận{' '}
                        <strong style={{ color: '#fcd34d' }}>7 ngày Pro VIP</strong> học tập cùng bạn bè!
                      </span>
                    ) : (
                      <span>
                        <strong style={{ color: '#ffffff' }}>Quà tặng bạn bè:</strong> Đăng nhập để kích hoạt hoặc
                        chuyển sang tab{' '}
                        <button type="button" onClick={() => switchMode('signup')} className="lp-auth-referral-link">
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
                  onClick={() => switchMode('login')}
                  className={`lp-auth-tab-btn ${!isSignup ? 'is-active' : ''}`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isSignup}
                  onClick={() => switchMode('signup')}
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
                    style={{ marginTop: 2, flexShrink: 0, color: '#fda4af' }}
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
                  style={{ display: 'none' }}
                  aria-hidden="true"
                />

                {/* WebView / Zalo / FB Warning Banner */}
                {inAppInfo.isInApp && (
                  <div className="lp-auth-inapp-box">
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 900, color: '#fef3c7' }}>
                      ⚠️ Đang mở trong <span>{inAppInfo.appName || 'app'}</span>
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.6, color: '#fffbeb' }}>
                      Google <b>không cho</b> đăng nhập trong Zalo / Facebook / WebView. Hãy mở <b>Chrome</b> hoặc{' '}
                      <b>Safari</b>, vào:
                    </p>
                    <p
                      style={{
                        margin: 0,
                        wordBreak: 'break-all',
                        borderRadius: '0.75rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        padding: '0.5rem 0.75rem',
                        fontFamily: 'monospace',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#ffffff',
                      }}
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
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'rgba(255, 251, 235, 0.8)' }}>
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
                      style={{ flexShrink: 0 }}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                          style={{ flexShrink: 0 }}
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
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          style={{ flexShrink: 0 }}
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
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                <div style={{ paddingTop: 2 }}>
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
              <span style={{ margin: '0 0.375rem', color: '#bca58f' }}>·</span>
              Không cần thẻ · Miễn phí
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
