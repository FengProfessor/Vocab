'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Brain,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Loader2,
  GraduationCap,
  BookOpen,
  AlertCircle,
  ArrowRight,
  Check,
  Sparkles,
  Chrome,
  Repeat2,
  ExternalLink,
  Copy,
} from 'lucide-react';
import type { UserRole } from '@/lib/supabase';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';
import { detectInAppBrowser, externalBrowserUrl } from '@/lib/in-app-browser';

const display = 'font-bold tracking-tight';

/** sessionStorage keys — không nhét query vào redirectTo (Google/Supabase reject). */
const OAUTH_ROLE_KEY = 'lingopro_oauth_role';
const OAUTH_PILOT_KEY = 'lingopro_oauth_pilot';
const OAUTH_SOURCE_KEY = 'lingopro_oauth_source';

type Mode = 'login' | 'signup';

const BENEFITS = [
  { icon: Chrome, text: 'Tra từ 1 chạm trên web' },
  { icon: Sparkles, text: 'Lưu kho riêng · ảnh + ví dụ' },
  { icon: Repeat2, text: 'Ôn FSRS đúng lúc quên' },
] as const;

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [debugError, setDebugError] = useState(() => (
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? ''
      : 'Thiếu cấu hình Supabase. Vui lòng kiểm tra các biến môi trường.'
  ));
  const [showManualRedirect, setShowManualRedirect] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [inApp, setInApp] = useState<ReturnType<typeof detectInAppBrowser> | null>(null);

  const authUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'https://lingopro.online/auth';
    return `${window.location.origin}/auth${window.location.search || ''}`;
  }, []);

  useEffect(() => {
    const info = detectInAppBrowser();
    setInApp(info);

    const params = new URLSearchParams(window.location.search);
    const timer = window.setTimeout(() => {
      if (params.get('mode') === 'signup') setMode('signup');
      if (params.get('role') === 'teacher') setRole('teacher');

      // Lỗi OAuth từ callback / Google
      const err = params.get('error');
      const errDesc = (params.get('error_description') || '').toLowerCase();
      if (err === 'disallowed_useragent' || errDesc.includes('disallowed_useragent')) {
        setDebugError(
          'Google chặn đăng nhập trong Zalo/Facebook/WebView. Mở Chrome hoặc Safari rồi vào lingopro.online/auth',
        );
      } else if (err === 'oauth' || err === 'oauth_no_session') {
        setDebugError(
          'Đăng nhập Google chưa hoàn tất. Mở Chrome/Safari (không mở trong Zalo/FB) rồi thử lại.',
        );
      } else if (err === 'access_denied') {
        setDebugError('Bạn đã hủy đăng nhập Google.');
      } else if (err) {
        setDebugError(`Lỗi đăng nhập: ${err}`);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  /** Role từ JWT metadata — KHÔNG query profiles. Default student. */
  const destFromSession = (user: { user_metadata?: Record<string, unknown> } | null | undefined) => {
    const metaRole = user?.user_metadata?.role;
    if (metaRole === 'teacher') return '/teacher';
    const wantTeacher =
      new URLSearchParams(window.location.search).get('role') === 'teacher' ||
      sessionStorage.getItem(OAUTH_ROLE_KEY) === 'teacher';
    return wantTeacher ? '/teacher' : '/student';
  };

  useEffect(() => {
    // Session localStorage — 1 tick để form render trước
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled || !session) return;
        if (new URLSearchParams(window.location.search).get('role') === 'teacher') {
          void supabase.rpc('claim_teacher_role').then(({ error: roleErr }) => {
            if (roleErr) console.warn('[Auth] claim_teacher_role:', roleErr.message);
          });
        }
        window.location.replace(destFromSession(session.user));
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  /** Chuẩn hóa lỗi Supabase auth → tiếng Việt, gợi ý Google khi rate limit email. */
  const formatAuthError = (raw: string): string => {
    const m = raw.toLowerCase();
    if (m.includes('email rate limit') || (m.includes('rate limit') && m.includes('email'))) {
      return 'Hệ thống email đang quá tải (nhiều người đăng ký cùng lúc). Dùng «Tiếp tục với Google» hoặc thử lại sau 10–30 phút.';
    }
    if (m.includes('invalid login') || m.includes('invalid credentials')) {
      return 'Sai email hoặc mật khẩu.';
    }
    if (m.includes('email not confirmed')) {
      return 'Email chưa xác nhận. Dùng Google, hoặc đăng ký lại (tài khoản mới không cần mail).';
    }
    if (m.includes('user already') || m.includes('already registered')) {
      return 'Email đã có tài khoản — hãy đăng nhập.';
    }
    if (m.includes('too many requests') || m.includes('429')) {
      return 'Thao tác quá nhanh. Chờ chút rồi thử lại, hoặc dùng Google.';
    }
    return raw;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(mode === 'signup' ? 'Đang tạo tài khoản...' : 'Đang đăng nhập...');
    setDebugError('');
    setShowManualRedirect(false);

    const timeout = setTimeout(() => {
      setLoading(false);
      setStatus('');
      setDebugError('Yêu cầu đã hết thời gian chờ. Vui lòng kiểm tra kết nối Internet.');
      toast.error('Xác thực đã hết thời gian chờ.');
    }, 15000);

    try {
      if (mode === 'signup') {
        // API register: email_confirm server-side — KHÔNG gửi mail (tránh limit 2 mail/giờ Supabase)
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
            fullName: fullName.trim(),
            role,
            website: '', // honeypot
          }),
        });
        const json = (await res.json()) as { success?: boolean; error?: string; code?: string };

        if (!res.ok || !json.success) {
          if (json.code === 'already_registered') {
            // Đã có tài khoản → thử đăng nhập luôn
            setStatus('Email đã có — đang đăng nhập...');
            const { data, error } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            });
            if (error) throw new Error(json.error || error.message);
            if (data.session) {
              window.location.replace(destFromSession(data.session.user));
              return;
            }
          }
          throw new Error(json.error || 'Không đăng ký được.');
        }

        if (role === 'teacher') {
          const params = new URLSearchParams(window.location.search);
          track('teacher_signup_completed', {
            plan: params.get('pilot') ?? sessionStorage.getItem('teacher_pilot_plan') ?? undefined,
            source: params.get('utm_source') ?? sessionStorage.getItem('teacher_pilot_source') ?? 'teacher_landing',
          });
        }

        // Đăng nhập ngay — không chờ confirm email
        setStatus('Đang đăng nhập...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (!data.session) {
          toast.success('Tạo tài khoản xong — hãy đăng nhập.');
          setMode('login');
          setLoading(false);
          return;
        }
        setStatus('Thành công — đang vào học...');
        window.location.replace(destFromSession(data.session.user));
        return;
      }

      setStatus('Đang xác thực...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      const session = data.session;
      if (!session) {
        setShowManualRedirect(true);
        setStatus('Đăng nhập OK nhưng phiên chưa sẵn sàng.');
        setDebugError('Nhấn nút chuyển hướng bên dưới hoặc tắt chế độ Ẩn danh.');
        setLoading(false);
        return;
      }

      setStatus('Thành công — đang vào học...');
      window.location.replace(destFromSession(session.user));
      return;
    } catch (err: unknown) {
      console.error('CRITICAL Auth Error:', err);
      const raw = err instanceof Error ? err.message : 'Xác thực thất bại.';
      const msg = formatAuthError(raw);
      setDebugError(msg);
      toast.error(msg);
      setStatus('');
      setLoading(false);
    } finally {
      clearTimeout(timeout);
    }
  };

  const openInExternalBrowser = () => {
    const { chromeIntent, plain } = externalBrowserUrl(authUrl);
    if (inApp?.isAndroid && chromeIntent) {
      // Thử Chrome intent; nếu fail user vẫn thấy link copy
      window.location.href = chromeIntent;
      return;
    }
    // iOS / khác: copy + hướng dẫn
    void navigator.clipboard?.writeText(plain).then(
      () => toast.success('Đã copy link — dán vào Safari/Chrome'),
      () => toast.message(plain),
    );
  };

  const handleGoogleSignIn = async () => {
    // Google policy: cấm OAuth trong WebView (Zalo, FB, …) → 403 disallowed_useragent
    const detected = inApp ?? detectInAppBrowser();
    if (detected.isInApp) {
      setDebugError(
        `Google không cho đăng nhập trong ${detected.appName || 'app'}. Mở Chrome/Safari → lingopro.online/auth`,
      );
      toast.error('Mở bằng Chrome hoặc Safari để đăng nhập Google');
      return;
    }

    setGoogleLoading(true);
    setStatus('Đang mở Google...');
    setDebugError('');

    try {
      // Lưu role/pilot vào sessionStorage — redirectTo phải TRÙNG allowlist (không query string)
      const params = new URLSearchParams(window.location.search);
      sessionStorage.setItem(OAUTH_ROLE_KEY, role);
      const pilot = params.get('pilot') ?? sessionStorage.getItem('teacher_pilot_plan');
      const source = params.get('utm_source') ?? sessionStorage.getItem('teacher_pilot_source');
      if (pilot) sessionStorage.setItem(OAUTH_PILOT_KEY, pilot.slice(0, 40));
      else sessionStorage.removeItem(OAUTH_PILOT_KEY);
      if (source) sessionStorage.setItem(OAUTH_SOURCE_KEY, source.slice(0, 80));
      else sessionStorage.removeItem(OAUTH_SOURCE_KEY);

      // Chỉ path sạch — Google + Supabase reject redirect lạ / query
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: false,
          queryParams: {
            // ép màn chọn tài khoản (tránh session Google cũ / WebView lỗi)
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.error('[Auth] Google OAuth:', error);
        setDebugError(error.message);
        toast.error(error.message);
        setStatus('');
        setGoogleLoading(false);
        return;
      }

      // Một số môi trường không auto-redirect — gán URL thủ công
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      // Browser redirect đã chạy — giữ spinner
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không mở được Google đăng nhập';
      console.error('[Auth] Google OAuth exception:', err);
      setDebugError(msg);
      toast.error(msg);
      setStatus('');
      setGoogleLoading(false);
    }
  };

  // text-base (16px) — tránh iOS zoom khi focus
  const inputClass =
    'w-full min-h-12 rounded-2xl border border-[#bca58f]/45 bg-white/90 pl-11 pr-4 py-3 text-base font-semibold text-[#241710] placeholder:text-[#a08b7c] shadow-sm transition-all focus:border-[#b5502f]/50 focus:outline-none focus:ring-4 focus:ring-[#b5502f]/10';

  return (
    <div
      className={`min-h-dvh overflow-x-hidden bg-[#f6efe6] text-[#241710]`}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-[-20%] top-[-12%] h-56 w-56 rounded-full bg-[#e57b52]/18 blur-3xl sm:left-[-8%] sm:h-[24rem] sm:w-[24rem]" />
        <div className="absolute right-[-18%] top-[12%] h-52 w-52 rounded-full bg-[#d2c09e]/30 blur-3xl sm:right-[-8%] sm:h-[26rem] sm:w-[26rem]" />
        <div className="absolute bottom-[-12%] left-1/3 hidden h-[20rem] w-[20rem] rounded-full bg-[#f1c46d]/15 blur-3xl sm:block" />
      </div>

      <div className="relative mx-auto grid min-h-dvh w-full max-w-6xl lg:grid-cols-[1.05fr_0.95fr]">
        {/* Desktop brand panel */}
        <aside className="relative hidden flex-col justify-between p-8 lg:flex lg:p-12">
          <Link href="/" className="inline-flex items-center gap-2.5 text-[#241710]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#241710] text-[#f6efe6]">
              <Brain className="h-5 w-5" />
            </div>
            <span className={`${display} text-xl font-bold tracking-tight`}>LingoPro</span>
          </Link>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b86f52]/20 bg-white/80 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#9f4d2f]">
              <Sparkles className="h-3 w-3" />
              App học từ vựng · FSRS
            </div>

            <h1
              className={`${display} max-w-md text-4xl font-bold leading-[1.1] tracking-[-0.03em] xl:text-[2.75rem]`}
            >
              Học từ vựng —{' '}
              <span className="text-[#b5502f]">tra 1 chạm, nhớ lâu hơn</span>
            </h1>

            <p className="max-w-sm text-base leading-7 text-[#5e4b40]">
              Tra từ trên web → lưu kho riêng → ôn đúng lúc bằng FSRS.
              Chặng ngắn 5–8 phút, lộ trình sẵn cho người Việt.
            </p>

            <ul className="space-y-3">
              {BENEFITS.map((b) => (
                <li
                  key={b.text}
                  className="flex items-center gap-3 rounded-2xl border border-[#bca58f]/35 bg-white/70 px-4 py-3 shadow-sm"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#241710] text-[#f6efe6]">
                    <b.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-[#3d2c22]">{b.text}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#7b6558]">
              {['Miễn phí bắt đầu', '5–8 phút/chặng', 'Lộ trình sẵn'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#2d7f5e]" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs font-semibold text-[#a08b7c]">
            9.000+ từ · 660+ chặng · 30+ lộ trình
          </p>
        </aside>

        {/* Form: mobile top-align + scroll; desktop center */}
        <div className="flex min-h-dvh w-full flex-col items-center justify-start px-3 pb-8 pt-3 sm:px-6 sm:pb-10 sm:pt-8 lg:justify-center lg:py-12">
          <div className="mb-3 flex w-full max-w-md flex-col items-center sm:mb-5 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 text-[#241710]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#241710] text-[#f6efe6]">
                <Brain className="h-4 w-4" />
              </div>
              <span className={`${display} text-lg font-bold tracking-tight sm:text-xl`}>
                LingoPro
              </span>
            </Link>
            <p className="mt-1.5 text-center text-xs font-semibold text-[#7b6558] sm:text-sm">
              {mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản miễn phí'}
            </p>
          </div>

          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-[#241710]/10 bg-[#241710] p-4 text-[#f6efe6] shadow-[0_20px_50px_rgba(36,23,16,0.2)] sm:rounded-[1.75rem] sm:p-6 lg:p-8">
              <div className="mb-5 hidden lg:block">
                <p className={`${display} text-2xl font-bold tracking-tight`}>
                  {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                </p>
                <p className="mt-1.5 text-sm text-[#d8c9bc]">
                  {mode === 'login'
                    ? 'Tiếp tục lộ trình từ vựng của bạn.'
                    : 'Bắt đầu miễn phí — không cần thẻ.'}
                </p>
              </div>

              <div className="mb-4 flex rounded-2xl border border-white/10 bg-white/[0.06] p-1 sm:mb-5">
                {(['login', 'signup'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setDebugError('');
                      setShowManualRedirect(false);
                    }}
                    className={`min-h-11 flex-1 rounded-xl text-sm font-black transition-all sm:min-h-12 ${
                      mode === m
                        ? 'bg-[#b5502f] text-white shadow-[0_8px_20px_rgba(181,80,47,0.35)]'
                        : 'text-[#cbb7a6] hover:text-[#f6efe6]'
                    }`}
                  >
                    {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                  </button>
                ))}
              </div>

              {debugError && (
                <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-rose-400/25 bg-rose-500/15 p-3 sm:mb-5 sm:p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
                  <p className="break-words text-xs font-semibold leading-relaxed text-rose-100">{debugError}</p>
                </div>
              )}

              {showManualRedirect ? (
                <div className="space-y-3 py-1 text-center sm:space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#2d7f5e]/25 sm:h-16 sm:w-16">
                    <ArrowRight className="h-7 w-7 text-[#7dcea0]" />
                  </div>
                  <h3 className={`${display} text-base font-bold sm:text-lg`}>
                    Đăng nhập thành công!
                  </h3>
                  <p className="text-sm text-[#d8c9bc]">
                    Nếu trang không tự chuyển, nhấn nút bên dưới:
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const { data: { session } } = await supabase.auth.getSession();
                      window.location.replace(
                        session ? destFromSession(session.user) : '/student',
                      );
                    }}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2d7f5e] text-sm font-black text-white shadow-lg active:scale-[0.98]"
                  >
                    Đi tới trang tổng quan
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('')}
                    className="min-h-10 px-3 text-xs font-semibold text-[#a08b7c] underline"
                  >
                    Ở lại trang này
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* WebView / Zalo / FB — Google chặn OAuth (403 disallowed_useragent) */}
                  {inApp?.isInApp && (
                    <div className="space-y-2.5 rounded-2xl border border-amber-400/40 bg-amber-500/15 p-3.5">
                      <p className="text-sm font-black text-amber-100">
                        ⚠️ Đang mở trong {inApp.appName || 'app'}
                      </p>
                      <p className="text-xs font-semibold leading-relaxed text-amber-50/90">
                        Google <b>không cho</b> đăng nhập trong Zalo / Facebook / WebView.
                        Hãy mở <b>Chrome</b> hoặc <b>Safari</b>, vào:
                      </p>
                      <p className="break-all rounded-xl bg-black/25 px-3 py-2 font-mono text-[12px] font-bold text-white">
                        lingopro.online/auth
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={openInExternalBrowser}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-amber-400 px-3 text-sm font-black text-[#241710] active:scale-[0.98]"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {inApp.isAndroid ? 'Mở bằng Chrome' : 'Copy link mở Safari'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard?.writeText(authUrl).then(
                              () => toast.success('Đã copy link'),
                              () => toast.message(authUrl),
                            );
                          }}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 text-sm font-bold text-white active:scale-[0.98]"
                        >
                          <Copy className="h-4 w-4" />
                          Copy link
                        </button>
                      </div>
                      <p className="text-[11px] font-semibold text-amber-50/80">
                        Hoặc đăng ký / đăng nhập bằng <b>email + mật khẩu</b> bên dưới (vẫn dùng được trong app).
                      </p>
                    </div>
                  )}

                  {/* Google trước — chỉ khuyến khích khi KHÔNG in-app */}
                  <button
                    type="button"
                    onClick={() => { void handleGoogleSignIn(); }}
                    disabled={loading || googleLoading || Boolean(inApp?.isInApp)}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full border border-white/15 bg-white text-sm font-bold text-[#241710] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {googleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    )}
                    {inApp?.isInApp
                      ? 'Google: mở Chrome/Safari'
                      : googleLoading
                        ? 'Đang mở Google…'
                        : 'Tiếp tục với Google'}
                  </button>

                  <div className="flex items-center gap-3 py-0.5">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#a08b7c]">
                      hoặc email
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  {mode === 'signup' && (
                    <>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a08b7c]" />
                        <label htmlFor="full-name" className="sr-only">Họ và tên</label>
                        <input
                          id="full-name"
                          name="fullName"
                          type="text"
                          placeholder="Họ và tên"
                          autoComplete="name"
                          enterKeyHint="next"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {(['student', 'teacher'] as UserRole[]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border px-2 text-sm font-bold transition-all ${
                              role === r
                                ? 'border-[#b5502f]/60 bg-[#b5502f]/20 text-white'
                                : 'border-white/10 bg-white/[0.06] text-[#cbb7a6]'
                            }`}
                          >
                            {r === 'student' ? (
                              <BookOpen className="h-4 w-4 shrink-0" />
                            ) : (
                              <GraduationCap className="h-4 w-4 shrink-0" />
                            )}
                            <span className="truncate">{r === 'student' ? 'Học sinh' : 'Giáo viên'}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a08b7c]" />
                    <label htmlFor="email" className="sr-only">Địa chỉ email</label>
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
                      className={inputClass}
                    />
                  </div>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a08b7c]" />
                    <label htmlFor="password" className="sr-only">Mật khẩu</label>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'signup' ? 'Mật khẩu (≥ 6 ký tự)' : 'Mật khẩu'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      enterKeyHint="done"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[#a08b7c] active:bg-black/5"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="pt-0.5">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#b5502f] text-sm font-black text-white shadow-[0_14px_36px_rgba(181,80,47,0.35)] transition-all active:scale-[0.98] disabled:opacity-60"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </button>

                    {status && (
                      <p className="mt-2.5 text-center text-[11px] font-bold leading-snug text-[#f1c46d]">
                        {status}
                      </p>
                    )}
                  </div>
                </form>
              )}
            </div>

            <p className="mt-4 px-1 pb-2 text-center text-[11px] font-semibold leading-5 text-[#7b6558] sm:mt-5 sm:text-xs">
              <Link href="/" className="underline decoration-[#bca58f] underline-offset-2 hover:text-[#241710]">
                ← Về trang chủ
              </Link>
              <span className="mx-1.5 text-[#bca58f]">·</span>
              Không cần thẻ · Miễn phí
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
