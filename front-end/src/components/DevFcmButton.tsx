'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Nút Test Firebase — CHỈ hiện ở dev mode khi ở /test-fcm hoặc có ?debugFcm=1.
 * Giữ z-index z-40 để không đè bottom nav (z-90) hay notification/install prompt (z-95/z-96).
 */
export function DevFcmButton() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTestRoute = pathname === '/test-fcm';
    const isDebugQuery = new URLSearchParams(window.location.search).get('debugFcm') === '1';
    setShow(isTestRoute || isDebugQuery);
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="fixed bottom-[calc(var(--mobile-nav-total)+3.5rem)] right-3 z-40 md:bottom-10 md:right-4">
      <a
        href="/test-fcm"
        className="bg-amber-500/90 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs transition-all opacity-80 hover:opacity-100"
        aria-label="Test Firebase FCM"
      >
        🔔 Test Firebase
      </a>
    </div>
  );
}
