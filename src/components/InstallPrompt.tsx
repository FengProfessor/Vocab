'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, MoreVertical, PlusSquare, Share, Smartphone, X } from 'lucide-react';
import { isEnablePromptDismissed } from '@/lib/push-device-state';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    /** Early-captured beforeinstallprompt (inline script trong layout) */
    __lingoproBip?: BeforeInstallPromptEvent | null;
  }
}

/** Timestamp lần dismiss — hiện lại sau DISMISS_DAYS ngày */
const DISMISSED_AT_KEY = 'install_prompt_dismissed_at';
/** Key cũ (permanent) — migrate: bỏ qua để popup không "mất" vĩnh viễn */
const LEGACY_DISMISSED_KEY = 'install_prompt_dismissed';
const DISMISS_DAYS = 7;
const SHOW_DELAY_MS = 2200;

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
}

function isDismissedRecently(): boolean {
  // Xóa key cũ permanent nếu còn
  if (localStorage.getItem(LEGACY_DISMISSED_KEY)) {
    localStorage.removeItem(LEGACY_DISMISSED_KEY);
  }
  const raw = localStorage.getItem(DISMISSED_AT_KEY);
  if (!raw) return false;
  const at = Number(raw);
  if (!Number.isFinite(at)) return false;
  return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** Đăng ký SW sớm để Chrome đủ điều kiện install (không cần permission thông báo). */
async function ensureInstallableServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('/firebase-messaging-sw', { scope: '/' });
  } catch {
    try {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    } catch (err) {
      console.warn('[InstallPrompt] SW register failed:', err);
    }
  }
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    setVisible(false);
    setShowGuide(false);
  }, []);

  useEffect(() => {
    if (isStandalone()) return;
    if (isDismissedRecently()) return;

    setIsIos(isIosDevice());

    // Nhận event đã capture sớm (trước khi component mount)
    if (window.__lingoproBip) {
      setDeferredPrompt(window.__lingoproBip);
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      const bip = e as BeforeInstallPromptEvent;
      window.__lingoproBip = bip;
      setDeferredPrompt(bip);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    const onInstalled = () => {
      console.log('[InstallPrompt] appinstalled');
      window.__lingoproBip = null;
      setDeferredPrompt(null);
      setVisible(false);
      localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    };
    window.addEventListener('appinstalled', onInstalled);

    const isNotifySlotActive = (): boolean => {
      if (typeof window === 'undefined') return false;
      if (sessionStorage.getItem('lingopro_prompt_slot') === 'notify') return true;
      if ('Notification' in window && Notification.permission === 'default' && !isEnablePromptDismissed()) {
        return true;
      }
      return false;
    };

    const onPromptChange = () => {
      if (isNotifySlotActive()) {
        setVisible(false);
      }
    };
    window.addEventListener('lingopro_prompt_change', onPromptChange);

    // SW + delay: hiện banner dù BIP chưa/không bắn (iOS, Safari, Firefox…)
    void ensureInstallableServiceWorker();
    const timer = window.setTimeout(() => {
      if (!isNotifySlotActive()) {
        setVisible(true);
      }
    }, SHOW_DELAY_MS);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('lingopro_prompt_change', onPromptChange);
      window.clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowGuide(true);
      return;
    }
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[InstallPrompt] outcome:', outcome);
      if (outcome === 'accepted') {
        setVisible(false);
      } else {
        // User đóng native dialog — vẫn cho xem hướng dẫn thủ công
        setShowGuide(true);
      }
    } catch (err) {
      console.warn('[InstallPrompt] prompt error:', err);
      setShowGuide(true);
    } finally {
      setDeferredPrompt(null);
      window.__lingoproBip = null;
    }
  };

  if (!visible) return null;

  const canNativeInstall = Boolean(deferredPrompt);

  return (
    <div className="fixed bottom-[calc(var(--mobile-nav-total)+0.75rem)] left-3 right-3 z-[95] md:bottom-4 md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Banner chính */}
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight">Cài LingoPro</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Thêm vào màn hình chính — mở nhanh, như app thật
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={dismiss}
              aria-label="Đóng"
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              {canNativeInstall ? 'Cài' : 'Hướng dẫn'}
            </button>
          </div>
        </div>

        {/* Toggle hướng dẫn */}
        <button
          type="button"
          onClick={() => setShowGuide((v) => !v)}
          className="w-full px-4 py-2 flex items-center justify-between text-left border-t border-slate-700/80 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
        >
          <span>Cách cài thủ công (iPhone / Android)</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showGuide ? 'rotate-180' : ''}`}
          />
        </button>

        {showGuide && (
          <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
            {isIos ? (
              <div className="bg-slate-900/60 rounded-xl p-3 space-y-2">
                <p className="text-white text-xs font-bold flex items-center gap-1.5">
                  🍎 iPhone / iPad (Safari)
                </p>
                <ol className="text-slate-300 text-xs space-y-1.5 list-decimal pl-4 font-medium leading-relaxed">
                  <li>
                    Chạm nút <Share className="inline w-3.5 h-3.5 text-indigo-400" />{' '}
                    <strong className="text-white">Chia sẻ</strong> (thanh dưới Safari)
                  </li>
                  <li>
                    Cuộn xuống, chọn{' '}
                    <PlusSquare className="inline w-3.5 h-3.5 text-indigo-400" />{' '}
                    <strong className="text-white">Thêm vào MH chính</strong>
                  </li>
                  <li>
                    Bấm <strong className="text-white">Thêm</strong> — icon LingoPro hiện trên màn hình
                  </li>
                </ol>
                <p className="text-[11px] text-amber-400/90 font-medium leading-snug">
                  Lưu ý: phải mở bằng Safari (không dùng Chrome/in-app browser). iOS ≥ 16.4 để nhận thông báo ôn tập.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-slate-900/60 rounded-xl p-3 space-y-2">
                  <p className="text-white text-xs font-bold">🤖 Android (Chrome)</p>
                  <ol className="text-slate-300 text-xs space-y-1.5 list-decimal pl-4 font-medium leading-relaxed">
                    <li>
                      Bấm menu <MoreVertical className="inline w-3.5 h-3.5 text-indigo-400" />{' '}
                      <strong className="text-white">3 chấm</strong> góc trên
                    </li>
                    <li>
                      Chọn <strong className="text-white">Cài đặt ứng dụng</strong> hoặc{' '}
                      <strong className="text-white">Thêm vào màn hình chính</strong>
                    </li>
                    <li>Xác nhận — mở LingoPro từ icon như app</li>
                  </ol>
                </div>
                <div className="bg-slate-900/60 rounded-xl p-3 space-y-2">
                  <p className="text-white text-xs font-bold">🍎 iPhone / iPad (Safari)</p>
                  <ol className="text-slate-300 text-xs space-y-1.5 list-decimal pl-4 font-medium leading-relaxed">
                    <li>
                      Chạm <Share className="inline w-3.5 h-3.5 text-indigo-400" />{' '}
                      <strong className="text-white">Chia sẻ</strong>
                    </li>
                    <li>
                      Chọn <PlusSquare className="inline w-3.5 h-3.5 text-indigo-400" />{' '}
                      <strong className="text-white">Thêm vào MH chính</strong>
                    </li>
                  </ol>
                </div>
              </>
            )}

            {canNativeInstall && (
              <button
                type="button"
                onClick={() => void handleInstall()}
                className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
              >
                Cài bằng hộp thoại trình duyệt
              </button>
            )}

            <button
              type="button"
              onClick={dismiss}
              className="w-full text-center text-slate-500 hover:text-slate-300 text-[11px] font-semibold py-1"
            >
              Để sau (nhắc lại sau {DISMISS_DAYS} ngày)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
