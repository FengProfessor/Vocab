'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { appAuth } from '@/lib/app-auth-client';

interface Props { mode: 'request' | 'reset' }

export default function PasswordRecoveryForm({ mode }: Props) {
  const [ready, setReady] = useState(mode === 'request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    // Không consume implicit bearer fragment; xóa khỏi URL trước mọi request/UI.
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
    if (mode !== 'reset') return;
    let cancelled = false;
    void fetch('/api/auth/recovery', { headers: { 'X-LingoPro-Request': '1' }, cache: 'no-store' })
      .then(async response => {
        const body: unknown = await response.json();
        const available = response.ok && !!body && typeof body === 'object' && 'ready' in body && body.ready === true;
        if (!cancelled) {
          setReady(available);
          if (!available) setMessage('Liên kết không hợp lệ, đã dùng hoặc hết hạn. Yêu cầu liên kết mới.');
        }
      }).catch(() => { if (!cancelled) setMessage('Tạm thời không khả dụng. Thử lại sau.'); });
    return () => { cancelled = true; };
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !ready || done) return;
    if (mode === 'reset' && password !== confirmation) {
      setMessage('Hai mật khẩu chưa khớp.'); return;
    }
    setBusy(true); setMessage('');
    try {
      const response = await fetch(mode === 'request' ? '/api/auth/recovery/request' : '/api/auth/recovery', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-LingoPro-Request': '1' },
        body: JSON.stringify(mode === 'request' ? { email } : { password, confirmation }), cache: 'no-store',
      });
      const body: unknown = await response.json();
      const accepted = !!body && typeof body === 'object' && (mode === 'request' ?
        'accepted' in body && body.accepted === true : 'success' in body && body.success === true &&
        'reloginRequired' in body && body.reloginRequired === true);
      if (response.ok && accepted) {
        if (mode === 'reset') appAuth.passwordRecoveryCompleted();
        setMessage(mode === 'request' ? 'Nếu tài khoản tồn tại, hướng dẫn sẽ được gửi. Mở liên kết trong cùng trình duyệt này.' :
          'Đã đổi mật khẩu. Đăng nhập lại bằng mật khẩu mới.');
        setDone(true);
      } else if (response.status === 429) {
        setMessage('Quá nhiều yêu cầu. Thử lại sau.');
      } else if (response.status === 400) {
        setMessage('Kiểm tra email hoặc yêu cầu mật khẩu của tài khoản.');
      } else {
        setMessage('Liên kết không khả dụng. Yêu cầu liên kết mới hoặc thử lại sau.');
        if (mode === 'reset') setReady(false);
      }
    } catch { setMessage('Tạm thời không khả dụng. Thử lại sau.'); }
    finally { setPassword(''); setConfirmation(''); setBusy(false); }
  }

  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 px-6">
    <h1 className="text-2xl font-bold">{mode === 'request' ? 'Quên mật khẩu' : 'Đặt mật khẩu mới'}</h1>
    {message && <p role="status">{message}</p>}
    {ready && !done && <form onSubmit={submit} className="flex flex-col gap-4">
      {mode === 'request' ? <label>Email
        <input id="recovery-email" type="email" autoComplete="email" required maxLength={254}
          value={email} onChange={event => setEmail(event.target.value)} className="w-full rounded border p-3" />
      </label> : <>
        <label>Mật khẩu mới
          <input id="recovery-password" type="password" autoComplete="new-password" required minLength={6} maxLength={1024}
            value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded border p-3" />
        </label>
        <label>Nhập lại mật khẩu
          <input id="recovery-confirmation" type="password" autoComplete="new-password" required minLength={6} maxLength={1024}
            value={confirmation} onChange={event => setConfirmation(event.target.value)} className="w-full rounded border p-3" />
        </label>
      </>}
      <button type="submit" disabled={busy} className="rounded bg-orange-800 p-3 text-white disabled:opacity-50">
        {busy ? 'Đang xử lý...' : mode === 'request' ? 'Gửi hướng dẫn' : 'Đổi mật khẩu'}
      </button>
    </form>}
    {mode === 'reset' && !ready && <Link href="/auth/forgot-password">Yêu cầu liên kết mới</Link>}
    <Link href="/auth">Quay lại đăng nhập</Link>
  </main>;
}
