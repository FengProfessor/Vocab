'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';
import { requestForToken } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const DISMISS_KEY = 'lingopro_push_prompt_dismissed';
const RECONNECT_DISMISS_KEY = 'lingopro_push_reconnect_dismissed'; // sessionStorage — hỏi lại phiên sau

/**
 * Banner mời bật Push trong luồng chính (dashboard).
 * 2 chế độ:
 * - 'enable': quyền = 'default' (chưa hỏi). iOS bắt buộc requestPermission chạy trong gesture (onClick).
 * - 'reconnect' (tự-lành): quyền = 'granted' nhưng server 0 token sống (FirebaseInitializer
 *   re-register fail im lặng / token bị thiết bị khác ghi đè thời kỳ chưa đa thiết bị).
 */
export function EnableNotifications() {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'enable' | 'reconnect'>('enable');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'default') {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
      setMode('enable');
      setShow(true);
      return;
    }

    // 'granted' → kiểm tra token sống trên server (chờ 6s cho FirebaseInitializer re-register trước)
    if (Notification.permission !== 'granted') return; // 'denied' — JS không prompt lại được
    try { if (sessionStorage.getItem(RECONNECT_DISMISS_KEY) === '1') return; } catch {}

    const timer = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/push/fcm-register', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        // count = -1: server không xác định được → không hiện banner sai
        if (data?.success && data.count === 0) {
          setMode('reconnect');
          setShow(true);
        }
      } catch {
        // Lỗi mạng → bỏ qua, không làm phiền user
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const enable = async () => {
    setLoading(true);
    try {
      const token = await requestForToken(); // gồm requestPermission + register SW + getToken
      if (!token) throw new Error('Chưa lấy được mã thiết bị. Thử lại sau.');

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch('/api/push/fcm-register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ fcmToken: token }),
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
    try {
      if (mode === 'reconnect') {
        // Chỉ ẩn trong phiên này — token vẫn chết thì phiên sau hỏi lại
        sessionStorage.setItem(RECONNECT_DISMISS_KEY, '1');
      } else {
        localStorage.setItem(DISMISS_KEY, '1');
      }
    } catch {}
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
            ? 'Thiết bị này không còn nhận nhắc ôn tập — bấm để kết nối lại.'
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
