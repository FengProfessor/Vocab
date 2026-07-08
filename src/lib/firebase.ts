import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { firebaseConfigSource, firebasePublicConfig, firebaseWebConfig } from './firebase-public-config';

const app = initializeApp(firebaseWebConfig);

// Bọc 1 promise với timeout để không treo vô hạn (báo lỗi rõ thay vì spinner mãi)
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout ${ms}ms: ${label}`)), ms)),
  ]);
}

function toReadableFcmError(err: unknown): Error {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const code = typeof err === 'object' && err !== null && 'code' in err
    ? String((err as { code?: unknown }).code ?? '')
    : '';

  if (
    code === 'messaging/token-subscribe-failed' ||
    /missing required authentication credential/i.test(rawMessage)
  ) {
    return new Error(
      'FCM từ chối cấp token. Tải lại app rồi bật lại thông báo. Nếu vẫn lỗi, kiểm tra Firebase Cloud Messaging API và Web Push certificate của project.'
    );
  }

  return err instanceof Error ? err : new Error(rawMessage);
}

/**
 * Lấy FCM token. Truyền `onStep` để xem tiến trình từng bước (test-fcm in ra màn hình,
 * hữu ích khi debug iOS PWA vì không có DevTools).
 */
export const requestForToken = async (onStep?: (msg: string) => void): Promise<string | null> => {
  const log = (m: string) => { console.log('[FCM]', m); onStep?.(m); };
  if (typeof window === 'undefined') return null;

  // Chặn sớm môi trường không hỗ trợ (iOS < 16.4, hoặc mở trong tab thường)
  if (!('Notification' in window)) {
    throw new Error('Trình duyệt không hỗ trợ Notification. iOS cần ≥16.4 và mở app từ icon Màn hình chính.');
  }
  if (!('serviceWorker' in navigator)) {
    throw new Error('Trình duyệt không hỗ trợ Service Worker (thử mở app từ icon Màn hình chính).');
  }

  try {
    // iOS BẮT BUỘC: xin quyền ngay trong user gesture, trước mọi await khác
    log('Xin quyền thông báo…');
    const permission = await Notification.requestPermission();
    log(`Quyền thông báo: ${permission}`);
    if (permission !== 'granted') {
      throw new Error(`Chưa được cấp quyền (permission=${permission}). Vào Cài đặt → app → Thông báo để bật.`);
    }

    log('Đăng ký service worker…');
    // Route động — config đồng bộ với client (tránh lệch env Vercel vs SW tĩnh)
    let registration: ServiceWorkerRegistration;
    try {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw', { scope: '/' });
    } catch {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    }

    log('Chờ service worker active…');
    await withTimeout(
      navigator.serviceWorker.ready,
      15000,
      'service worker không active. Thử xoá app khỏi Màn hình chính rồi thêm lại.'
    );
    await registration.update();

    log(`Service worker OK (${firebaseConfigSource}). Đang lấy token từ FCM…`);
    const messaging = getMessaging(app);
    const currentToken = await withTimeout(
      getToken(messaging, {
        vapidKey: firebasePublicConfig.vapidKey,
        serviceWorkerRegistration: registration,
      }),
      20000,
      'FCM không trả token. Có thể mạng tới Google bị chậm/chặn — thử đổi Wi-Fi/4G.'
    );

    if (currentToken) {
      log('Lấy token THÀNH CÔNG ✅');
      return currentToken;
    }
    log('FCM trả về rỗng (không có token).');
    return null;
  } catch (err: unknown) {
    const readableError = toReadableFcmError(err);
    console.error('[FCM] Lỗi khi lấy token:', readableError);
    throw readableError; // Quăng ra ngoài để UI hiển thị
  }
};

export const onMessageListener = (): Promise<MessagePayload> | undefined => {
  if (typeof window === 'undefined') return;
  const messaging = getMessaging(app);
  return new Promise<MessagePayload>((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};
