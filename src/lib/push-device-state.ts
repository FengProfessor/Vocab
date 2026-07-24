/** Banner "Bật nhắc ôn tập" — dismiss có hạn (7 ngày). */
export const PUSH_PROMPT_DISMISS_KEY = 'lingopro_push_prompt_dismissed';
export const PUSH_PROMPT_DISMISS_AT_KEY = 'lingopro_push_prompt_dismissed_at';
/** Chỉ set khi user chủ động bấm bật (không set từ auto-register nền). */
export const PUSH_DEVICE_REGISTERED_KEY = 'lingopro_push_device_registered_v2';// re-export name used by force-reconnect UI
const PUSH_DEVICE_REGISTERED_LEGACY = 'lingopro_push_device_registered';
export const PUSH_RECONNECT_DISMISS_KEY = 'lingopro_push_reconnect_dismissed';

const ENABLE_DISMISS_DAYS = 7;

export function markPushDeviceRegistered(): void {
  try {
    localStorage.setItem(PUSH_DEVICE_REGISTERED_KEY, '1');
    localStorage.removeItem(PUSH_DEVICE_REGISTERED_LEGACY);
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
    // Dismiss cũ (không có timestamp) → coi như hết hạn, hiện lại banner
    if (!dismissedAt) {
      localStorage.removeItem(PUSH_PROMPT_DISMISS_KEY);
      return false;
    }
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