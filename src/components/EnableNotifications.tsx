'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { requestForToken } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  dismissEnablePrompt,
  dismissReconnectPrompt,
  isEnablePromptDismissed,
  isPushDeviceRegistered,
  isReconnectDismissedThisSession,
  markPushDeviceRegistered,
} from '@/lib/push-device-state';

const STALE_DAYS = 5;

/**
 * Popup nhắc bật Push — mobile: bottom sheet nổi; desktop: banner.
 */
export function EnableNotifications() {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'enable' | 'reconnect'>('enable');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const evaluate = async (): Promise<void> => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;

      if (Notification.permission === 'default') {
        if (isEnablePromptDismissed()) return;
        setMode('enable');
        setShow(true);
        return;
      }

      if (Notification.permission === 'denied') return;
      if (Notification.permission !== 'granted') return;
      if (isReconnectDismissedThisSession()) return;

      if (!isPushDeviceRegistered()) {
        setMode('reconnect');
        setShow(true);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/push/fcm-register', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json() as { success?: boolean; count?: number; staleDays?: number };
        const stale = typeof data?.staleDays === 'number' && data.staleDays >= STALE_DAYS;
        if (data?.success && (data.count === 0 || stale)) {
          setMode('reconnect');
          setShow(true);
        }
      } catch {
        // ignore
      }
    };

    void evaluate();
    const retry = setTimeout(() => { void evaluate(); }, 2500);
    return () => clearTimeout(retry);
  }, []);

  const enable = async () => {
    setLoading(true);
    try {
      const token = await requestForToken();
      if (!token) throw new Error('Chưa lấy được mã thiết bị. Thử lại sau.');

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res = await fetch('/api/push/fcm-register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ fcmToken: token }),
        });
        const result = (await res.json()) as { success?: boolean; error?: string };
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Không lưu được token thông báo lên server.');
        }
        markPushDeviceRegistered();
      }
      toast.success('Đã bật nhắc ôn tập! 🔔');
      setShow(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không bật được thông báo.';
      toast.error(msg);
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') setShow(false);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => {
    if (mode === 'reconnect') dismissReconnectPrompt();
    else dismissEnablePrompt();
    setShow(false);
  };

  if (!show) return null;

  return (
    <>
      {/* Mobile: bottom sheet nổi trên footer */}
      <div className="fixed inset-x-0 bottom-[calc(var(--mobile-nav-total)+0.5rem)] z-[96] px-3 md:hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="mx-auto max-w-lg rounded-2xl border border-indigo-200 bg-white p-3.5 shadow-[0_12px_40px_rgba(79,70,229,.22)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
              🔔
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-slate-800 leading-tight">
                {mode === 'reconnect' ? 'Thông báo bị gián đoạn' : 'Bật nhắc ôn tập'}
              </div>
              <div className="mt-0.5 text-[11px] font-semibold text-muted-foreground leading-snug">
                {mode === 'reconnect'
                  ? 'Thiết bị này chưa nhận nhắc — bấm để kết nối lại.'
                  : 'Nhận thông báo khi có từ đến hạn, giữ streak không gãy.'}
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={enable}
                  disabled={loading}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-sm font-black text-white shadow-sm active:brightness-110 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {mode === 'reconnect' ? 'Kết nối lại' : 'Bật ngay'}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="shrink-0 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-500 active:bg-slate-100"
                >
                  Để sau
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: banner inline */}
      <div className="hidden items-center gap-4 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 shadow-sm md:flex">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
          🔔
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-black text-slate-800 leading-tight">
            {mode === 'reconnect' ? 'Thông báo bị gián đoạn' : 'Bật nhắc ôn tập'}
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            {mode === 'reconnect'
              ? 'Thiết bị này chưa nhận nhắc ôn tập — bấm để kết nối lại.'
              : 'Nhận thông báo khi có từ đến hạn — giữ streak không bị gãy.'}
          </div>
        </div>
        <button
          type="button"
          onClick={enable}
          disabled={loading}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === 'reconnect' ? 'Kết nối lại' : 'Bật ngay'}
        </button>
        <button type="button" onClick={dismiss} className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-bold text-muted-foreground hover:bg-black/5">
          Bỏ qua
        </button>
      </div>
    </>
  );
}
