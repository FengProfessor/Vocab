'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';
import { requestForToken } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const DISMISS_KEY = 'lingopro_push_prompt_dismissed';

/**
 * Banner mời bật Push trong luồng chính (dashboard).
 * Thay cho việc chỉ bật được qua trang debug /test-fcm.
 * Chỉ hiện khi quyền = 'default' (chưa hỏi). iOS bắt buộc requestPermission chạy trong gesture (onClick).
 */
export function EnableNotifications() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    // 'granted' = đã bật (FirebaseInitializer tự đăng ký). 'denied' = phải vào Cài đặt, JS không prompt lại được.
    if (Notification.permission !== 'default') return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    setShow(true);
  }, []);

  const enable = async () => {
    setLoading(true);
    try {
      const token = await requestForToken(); // gồm requestPermission + register SW + getToken
      if (!token) throw new Error('Chưa lấy được mã thiết bị. Thử lại sau.');

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetch('/api/push/fcm-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, fcmToken: token }),
        });
      }
      toast.success('Đã bật nhắc ôn tập! 🔔');
      setShow(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không bật được thông báo.';
      toast.error(msg);
      // User bấm "Không cho phép" → ẩn banner (không thể prompt lại bằng JS)
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') setShow(false);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
        <Bell className="h-5 w-5 text-indigo-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-black text-slate-800 leading-tight">Bật nhắc ôn tập</div>
        <div className="text-xs font-semibold text-muted-foreground">
          Nhận thông báo khi có từ đến hạn — giữ streak không bị gãy.
        </div>
      </div>
      <button
        onClick={enable}
        disabled={loading}
        className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Bật ngay'}
      </button>
      <button onClick={dismiss} className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-black/5" aria-label="Bỏ qua">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
