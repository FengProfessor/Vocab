import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = initializeApp(firebaseConfig);

// Bọc 1 promise với timeout để không treo vô hạn (báo lỗi rõ thay vì spinner mãi)
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout ${ms}ms: ${label}`)), ms)),
  ]);
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
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    log('Chờ service worker active…');
    await withTimeout(
      navigator.serviceWorker.ready,
      15000,
      'service worker không active. Thử xoá app khỏi Màn hình chính rồi thêm lại.'
    );

    log('Service worker OK. Đang lấy token từ FCM…');
    const messaging = getMessaging(app);
    const currentToken = await withTimeout(
      getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
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
    console.error('Lỗi khi lấy token:', err);
    throw err; // Quăng ra ngoài để UI hiển thị
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
