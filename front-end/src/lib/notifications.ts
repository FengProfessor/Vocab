import { AuthApi } from '@/features/auth/api';

/**
 * Registers or clears a Firebase Cloud Messaging (FCM) device token via the .NET 10 backend API.
 */
export async function registerFcmToken(fcmToken: string | null): Promise<boolean> {
  return AuthApi.registerFcmToken(fcmToken);
}
