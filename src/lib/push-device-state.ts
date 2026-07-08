/** Banner "Bật nhắc ôn tập" — dismiss có hạn (7 ngày). */
export const PUSH_PROMPT_DISMISS_KEY = 'lingopro_push_prompt_dismissed';
export const PUSH_PROMPT_DISMISS_AT_KEY = 'lingopro_push_prompt_dismissed_at';
/** Thiết bị/trình duyệt này đã lưu FCM token lên server thành công. */
export const PUSH_DEVICE_REGISTERED_KEY = 'lingopro_push_device_registered';
export const PUSH_RECONNECT_DISMISS_KEY = 'lingopro_push_reconnect_dismissed';

const ENABLE_DISMISS_DAYS = 7;

export function markPushDeviceRegistered(): void {
  try {
    localStorage.setItem(PUSH_DEVICE_REGISTERED_KEY, '1');
  } catch {
    // private mode
  }
}

export function isPushDeviceRegistered(): boolean {
  try {
    return localStorage.getItem(PUSH_DEVICE_REGISTERED_KEY) === '1';
  } catch {
    return false;
  }
}

export function isEnablePromptDismissed(): boolean {
  try {
    if (localStorage.getItem(PUSH_PROMPT_DISMISS_KEY) !== '1') return false;
    const dismissedAt = localStorage.getItem(PUSH_PROMPT_DISMISS_AT_KEY);
    if (!dismissedAt) return true;
    const days = (Date.now() - Number(dismissedAt)) / 86_400_000;
    if (days >= ENABLE_DISMISS_DAYS) {
      localStorage.removeItem(PUSH_PROMPT_DISMISS_KEY);
      localStorage.removeItem(PUSH_PROMPT_DISMISS_AT_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function dismissEnablePrompt(): void {
  try {
    localStorage.setItem(PUSH_PROMPT_DISMISS_KEY, '1');
    localStorage.setItem(PUSH_PROMPT_DISMISS_AT_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function isReconnectDismissedThisSession(): boolean {
  try {
    return sessionStorage.getItem(PUSH_RECONNECT_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissReconnectPrompt(): void {
  try {
    sessionStorage.setItem(PUSH_RECONNECT_DISMISS_KEY, '1');
  } catch {
    // ignore
  }
}