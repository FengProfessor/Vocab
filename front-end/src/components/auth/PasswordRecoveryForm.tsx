
import { useEffect, useState, type FormEvent } from 'react';
import Link from '@/shared/router/navigation';
import { ArrowLeft, KeyRound, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AuthApi } from '@/features/auth/api';
import { authService } from '@/features/auth/session';

interface Props {
  mode: 'request' | 'reset';
}

interface RecoveryTokens {
  accessToken: string | null;
  tokenHash: string | null;
}

function extractRecoveryTokensFromLocation(): RecoveryTokens {
  if (typeof window === 'undefined') {
    return { accessToken: null, tokenHash: null };
  }

  let accessToken: string | null = null;
  let tokenHash: string | null = null;

  if (window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    accessToken = hashParams.get('access_token');
    tokenHash = hashParams.get('token_hash');
  }

  const searchParams = new URLSearchParams(window.location.search);
  if (!tokenHash) {
    tokenHash = searchParams.get('token_hash') ?? searchParams.get('token');
  }
  if (!accessToken) {
    accessToken = searchParams.get('access_token');
  }

  return { accessToken, tokenHash };
}

export default function PasswordRecoveryForm({ mode }: Props) {
  const [tokens, setTokens] = useState<RecoveryTokens>(() => extractRecoveryTokensFromLocation());
  const [ready, setReady] = useState(mode === 'request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const captured = extractRecoveryTokensFromLocation();
    // Strip recovery tokens from URL bar immediately so they never leak via Referer or history.
    if (window.location.hash || window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    if (mode !== 'reset') return;

    const effectiveAccessToken = captured.accessToken ?? tokens.accessToken;
    const effectiveTokenHash = captured.tokenHash ?? tokens.tokenHash;

    if (effectiveAccessToken || effectiveTokenHash) {
      setTokens({ accessToken: effectiveAccessToken, tokenHash: effectiveTokenHash });
      setReady(true);
    } else {
      setReady(false);
      setMessage('Liên kết không hợp lệ, đã dùng hoặc hết hạn. Vui lòng yêu cầu liên kết mới.');
    }
  }, [mode, tokens.accessToken, tokens.tokenHash]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !ready || done) return;
    if (mode === 'reset' && password !== confirmation) {
      setMessage('Hai mật khẩu chưa khớp.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'request') {
        await AuthApi.forgotPassword(email.trim());
        setMessage(
          'Nếu tài khoản tồn tại, hướng dẫn sẽ được gửi. Mở liên kết trong cùng trình duyệt này.',
        );
        setDone(true);
      } else {
        await AuthApi.resetPassword({
          newPassword: password,
          accessToken: tokens.accessToken,
          tokenHash: tokens.tokenHash,
        });
        authService.passwordRecoveryCompleted();
        setMessage('Đã đổi mật khẩu. Đăng nhập lại bằng mật khẩu mới.');
        setDone(true);
      }
    } catch (error) {
      const errMessage = AuthApi.describeError(error);
      setMessage(errMessage);
      if (mode === 'reset' && errMessage.includes('hết hạn')) {
        setReady(false);
      }
    } finally {
      setPassword('');
      setConfirmation('');
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-md shadow-indigo-200 dark:shadow-none mb-3">
            L
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {mode === 'request' ? 'Quên mật khẩu' : 'Đặt mật khẩu mới'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            {mode === 'request'
              ? 'Nhập địa chỉ email tài khoản để nhận liên kết khôi phục an toàn'
              : 'Tạo mật khẩu mới cho tài khoản học tập LingoPro của bạn'}
          </p>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            role="status"
            className={`mb-5 flex items-start gap-2.5 rounded-xl p-3 text-xs leading-relaxed ${
              done
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
            }`}
          >
            {done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Form Body */}
        {ready && !done && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode === 'request' ? (
              <div className="space-y-1.5">
                <label
                  htmlFor="recovery-email"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    placeholder="email@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="recovery-password"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="recovery-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      maxLength={1024}
                      placeholder="Tối thiểu 6 ký tự"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="recovery-confirmation"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="recovery-confirmation"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      maxLength={1024}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-2.5 px-4 font-bold text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>{mode === 'request' ? 'Gửi liên kết khôi phục' : 'Cập nhật mật khẩu'}</span>
              )}
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2 text-xs">
          {mode === 'reset' && !ready && (
            <Link
              href="/auth/forgot-password"
              className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Yêu cầu liên kết mới
            </Link>
          )}
          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại trang Đăng nhập</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
