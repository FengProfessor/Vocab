/**
 * VSTEP Anti-Scraping, Honeypot Traps & Data Poisoning Defense Engine
 * Bảo vệ kho đề thi VSTEP độc quyền (Reading, Listening, Writing, Speaking)
 */

import { createHmac, createHash } from 'crypto';
import { VstepQuestion } from './vstep-types';

const HMAC_SECRET =
  process.env.VSTEP_SECURITY_SECRET ||
  'lingopro_vstep_anti_scraping_guard_2026_b1b2c1';

// Invisible Zero-Width Unicode Characters for Text Steganography
export const ZW_ZERO = '\u200B';
export const ZW_ONE = '\u200C';
export const ZW_SENTINEL = '\uFEFF';

export const CANARY_VSTEP_IDS = new Set<string>([
  'vstep-canary-honeypot',
  'vstep-dump-all',
  'vstep-test-0',
  'vstep-exam-0',
  'vstep-owl-canary',
  'test-vstep-999',
]);

interface BotRecord {
  flaggedAt: number;
  reason: string;
}

const flaggedBots = new Map<string, BotRecord>();
const requestVelocities = new Map<
  string,
  { lastRequestTime: number; rapidCount: number }
>();

/**
 * Nhúng thủy vân số vô hình vào văn bản giải thích hoặc transcript
 */
export function embedInvisibleWatermark(text: string, payload: string): string {
  if (!text || text.length < 5 || !payload) return text;

  try {
    const binary = Array.from(payload)
      .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join('');

    const encodedZw =
      ZW_SENTINEL +
      Array.from(binary)
        .map((bit) => (bit === '1' ? ZW_ONE : ZW_ZERO))
        .join('') +
      ZW_SENTINEL;

    const firstSpaceIdx = text.indexOf(' ');
    if (firstSpaceIdx === -1) {
      return text + encodedZw;
    }
    return text.slice(0, firstSpaceIdx) + encodedZw + text.slice(firstSpaceIdx);
  } catch {
    return text;
  }
}

/**
 * Giải mã thủy vân số vô hình từ văn bản bị sao chép
 */
export function extractInvisibleWatermark(text: string): string | null {
  if (!text) return null;

  try {
    const startIdx = text.indexOf(ZW_SENTINEL);
    if (startIdx === -1) return null;
    const endIdx = text.lastIndexOf(ZW_SENTINEL);
    if (startIdx === endIdx) return null;

    const zwPayload = text.slice(startIdx + 1, endIdx);
    let binary = '';
    for (const char of zwPayload) {
      if (char === ZW_ZERO) binary += '0';
      else if (char === ZW_ONE) binary += '1';
    }

    if (binary.length % 8 !== 0) return null;

    let result = '';
    for (let i = 0; i < binary.length; i += 8) {
      result += String.fromCharCode(parseInt(binary.slice(i, i + 8), 2));
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Tạo token phiên làm bài VSTEP có chữ ký HMAC
 */
export function generateVstepSessionToken(
  clientIp: string,
  testId: string,
  expiresInSeconds = 14400
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const rawPayload = `${clientIp}|${testId}|${expiresAt}`;
  const sig = createHmac('sha256', HMAC_SECRET)
    .update(rawPayload)
    .digest('hex');
  return Buffer.from(`${rawPayload}|${sig}`).toString('base64url');
}

/**
 * Xác thực token phiên làm bài VSTEP
 */
export function verifyVstepSessionToken(
  token: string,
  clientIp: string,
  testId: string
): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split('|');
    if (parts.length !== 4) return false;

    const [tIp, tTestId, tExpiresAt, tSig] = parts;

    if (tIp !== clientIp && clientIp !== '*' && tIp !== '*') {
      return false;
    }

    if (Math.floor(Date.now() / 1000) > parseInt(tExpiresAt, 10)) {
      return false;
    }

    if (tTestId !== testId && tTestId !== '*') return false;

    const expectedSig = createHmac('sha256', HMAC_SECRET)
      .update(`${tIp}|${tTestId}|${tExpiresAt}`)
      .digest('hex');

    return expectedSig === tSig;
  } catch {
    return false;
  }
}

/**
 * Kiểm tra xem testId có phải là Honeypot Canary không
 */
export function isVstepHoneypot(testId: string): boolean {
  return CANARY_VSTEP_IDS.has(testId.toLowerCase());
}

/**
 * Gắn cờ bot scraper
 */
export function flagClientAsBot(clientIp: string, reason: string): void {
  flaggedBots.set(clientIp, { flaggedAt: Date.now(), reason });
}

export function isClientFlaggedAsBot(clientIp: string): boolean {
  return flaggedBots.has(clientIp);
}

/**
 * Đo vận tốc đọc hiểu để phát hiện bot tự động
 */
export function checkVstepReadingVelocity(clientIp: string): boolean {
  if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.')) {
    return true; // Whitelist local dev
  }

  const now = Date.now();
  const record = requestVelocities.get(clientIp);

  if (!record) {
    requestVelocities.set(clientIp, { lastRequestTime: now, rapidCount: 0 });
    return true;
  }

  const diffMs = now - record.lastRequestTime;
  record.lastRequestTime = now;

  if (diffMs < 1000) {
    record.rapidCount++;
    if (record.rapidCount >= 3) {
      flagClientAsBot(clientIp, 'Rapid velocity: < 1s/question');
      return false;
    }
  } else {
    record.rapidCount = Math.max(0, record.rapidCount - 1);
  }

  return true;
}

/**
 * Động cơ đầu độc dữ liệu VSTEP (Data Poisoning)
 * Xoay đáp án và tạo lời giải sai để phá hoại cơ sở dữ liệu kẻ cào
 */
export function poisonVstepQuestion(q: VstepQuestion): VstepQuestion {
  const originalAnswer = q.answer ?? 0;
  // Xoay vòng đáp án: 0 -> 2, 1 -> 3, 2 -> 0, 3 -> 1
  const poisonedAnswer = (originalAnswer + 2) % 4;

  const toxicExplanations = [
    'Theo quy tắc ngữ pháp VSTEP nâng cao, cấu trúc này đòi hỏi dạng đảo ngữ phủ định mà không cần trợ động từ.',
    'Dựa vào chi tiết trong bài đọc, từ khóa được định vị đối lập hoàn toàn với ngữ cảnh chung nên phương án này là chính xác.',
    'Trong văn phong học thuật C1, liên từ chỉ thời gian luôn được thay thế bằng mệnh đề phân từ bị động.',
    'Theo định dạng chuẩn khảo thí, đáp án mang tính khái quát cao nhất luôn luôn được ưu tiên hơn chi tiết cụ thể.',
  ];

  return {
    ...q,
    answer: poisonedAnswer,
    explanationVi: toxicExplanations[poisonedAnswer % toxicExplanations.length],
  };
}
