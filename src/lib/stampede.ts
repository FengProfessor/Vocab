/**
 * Chế độ lớp đông (free-tier stampede).
 *
 * Mặc định BẬT (an toàn khi 50–100 HS login cùng lúc).
 * Tắt trên Vercel khi hết quá tải:
 *   NEXT_PUBLIC_STAMPEDE_MODE=0
 *
 * Bật:
 *   NEXT_PUBLIC_STAMPEDE_MODE=1  (hoặc không set)
 */
const raw = (process.env.NEXT_PUBLIC_STAMPEDE_MODE ?? '1').trim().toLowerCase();

export const STAMPEDE_MODE = raw !== '0' && raw !== 'false' && raw !== 'off';
