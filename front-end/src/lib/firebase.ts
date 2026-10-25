import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage, type MessagePayload } from 'firebase/messaging';
import { firebaseConfigSource, firebasePublicConfig, firebaseWebConfig } from './firebase-public-config';

const app = initializeApp(firebaseWebConfig);

/** Tránh 2 getToken() song song — gây 401 thiếu FIS auth trên fcmregistrations. */
let tokenRequestChain: Promise<string | null> = Promise.resolve(null);

/** Gỡ SW cũ (sw-custom / sw.js) cùng scope / — từng gây getToken fail. */
async function unregisterConflictingServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map(async (reg) => {
    const script = reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || '';
    if (/sw-custom\.js|\/sw\.js$/.test(script)) {
      console.log('[FCM] Unregister conflicting SW:', script);
      await reg.unregister();
    }
  }));
}

/** Chờ đúng registration FCM active — không dùng ready (có thể trả SW khác). */
async function waitForRegistrationActive(reg: ServiceWorkerRegistration, timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (reg.active) return;
    const worker = reg.installing || reg.waiting;
    if (worker) {
      await new Promise<void>((resolve) => {
        const onState = () => {
          if (reg.active || worker.state === 'redundant') {
            worker.removeEventListener('statechange', onState);
            resolve();
          }
        };
        worker.addEventListener('statechange', onState);
      });
      if (reg.active) return;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('Service worker FCM không active kịp. Xóa PWA khỏi màn hình chính rồi cài lại.');
}

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
  const run = async (): Promise<string | null> => {
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
    const supported = await isSupported();
    if (!supported) {
      throw new Error('Trình duyệt/thiết bị không hỗ trợ FCM Web Push.');
    }

    // iOS BẮT BUỘC: xin quyền ngay trong user gesture, trước mọi await khác
    log('Xin quyền thông báo…');
    const permission = await Notification.requestPermission();
    log(`Quyền thông báo: ${permission}`);
    if (permission !== 'granted') {
      throw new Error(`Chưa được cấp quyền (permission=${permission}). Vào Cài đặt → app → Thông báo để bật.`);
    }

    await unregisterConflictingServiceWorkers();

    log('Đăng ký service worker…');
    // Ưu tiên route động (config đồng bộ build); fallback file tĩnh cho cache cũ
    let registration: ServiceWorkerRegistration;
    try {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw', { scope: '/' });
    } catch {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    }

    log('Chờ service worker FCM active…');
    await registration.update();
    await withTimeout(
      waitForRegistrationActive(registration),
      15000,
      'service worker FCM không active. Thử xoá app khỏi Màn hình chính rồi thêm lại.'
    );

    log(`Service worker OK (${firebaseConfigSource}, ${registration.active?.scriptURL ?? 'no-script'}). Đang lấy token từ FCM…`);
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

  const prev = tokenRequestChain.catch(() => null);
  const current = prev.then(() => run());
  tokenRequestChain = current.catch(() => null);
  return current;
};

export const onMessageListener = (callback: (payload: MessagePayload) => void): (() => void) | undefined => {
  if (typeof window === 'undefined') return;
  const messaging = getMessaging(app);
  // onMessage returns an unsubscribe function
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
