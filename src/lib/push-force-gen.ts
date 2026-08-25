/**
 * Bump số này mỗi khi cần ÉP mọi client kết nối lại FCM
 * (token chết, đổi policy 1-token, cron im lặng lâu…).
 * Client so với localStorage → hiện banner reconnect + re-register.
 */
export const PUSH_FORCE_GEN = 4;

export const PUSH_FORCE_GEN_STORAGE_KEY = 'lingopro_push_force_gen';
