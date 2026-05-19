import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyATgTyGPzlmi0ADwBsMJxEhgqJsjEiRftc",
  authDomain: "lingopro-9d2f8.firebaseapp.com",
  projectId: "lingopro-9d2f8",
  storageBucket: "lingopro-9d2f8.firebasestorage.app",
  messagingSenderId: "147138625371",
  appId: "1:147138625371:web:9d308e4337c9fe7399647e"
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

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
    if (!vapidKey) throw new Error('NEXT_PUBLIC_VAPID_KEY chưa được cấu hình');

    const currentToken = await getToken(messaging, {
      vapidKey,
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
