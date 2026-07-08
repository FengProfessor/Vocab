'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';
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
 * Banner mời bật Push trong dashboard.
 * - enable: permission = default (chưa hỏi)
 * - reconnect: đã Allow nhưng thiết bị này chưa lưu token / token server cũ
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

      // Chưa bấm "Bật ngay" trên thiết bị này → hiện reconnect (kể cả auto-register nền đã chạy)
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
        const data = await res.json();
        const stale = typeof data?.staleDays === 'number' && data.staleDays >= STALE_DAYS;
        if (data?.success && (data.count === 0 || stale)) {
          setMode('reconnect');
          setShow(true);
        }
      } catch {
        // Lỗi mạng → bỏ qua
      }
    };

    void evaluate();
    // Auth/session có thể đến sau mount — kiểm tra lại
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
            'Authorization': `Bearer ${session.access_token}`,
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
    if (mode === 'reconnect') {
      dismissReconnectPrompt();
    } else {
      dismissEnablePrompt();
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
        <Bell className="h-5 w-5 text-indigo-600" />
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
        onClick={enable}
        disabled={loading}
        className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'reconnect' ? 'Kết nối lại' : 'Bật ngay'}
      </button>
      <button onClick={dismiss} className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-black/5" aria-label="Bỏ qua">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}