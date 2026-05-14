import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const requestForToken = async () => {
  if (typeof window === 'undefined') return null;

  try {
    // Bắt buộc đối với iOS: Phải xin quyền trực tiếp trước khi làm việc khác
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Người dùng đã từ chối quyền thông báo.');
    }

    const messaging = getMessaging(app);

    // Đảm bảo Service Worker đã được đăng ký và sẵn sàng
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    // Truyền registration vào getToken để iOS không bị lỗi
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      console.log('FCM Token:', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available.');
      return null;
    }
  } catch (err: any) {
    console.error('Lỗi khi lấy token:', err);
    throw err; // Quăng lỗi ra ngoài để UI hiển thị cho bạn biết
  }
};

export const onMessageListener = () => {
  if (typeof window === 'undefined') return;
  const messaging = getMessaging(app);
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};
