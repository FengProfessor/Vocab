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
const sharedVstepIpSessions = new Map<string, Set<string>>();
const flaggedVstepSessionsByIp = new Map<string, Set<string>>();
const vstepTokenClientMap = new Map<string, string>();
let vstepTokenSeq = 0;

export function registerVstepIpSession(clientIp: string, tokenKey: string): void {
  if (!clientIp || !tokenKey) return;
  let set = sharedVstepIpSessions.get(clientIp);
  if (!set) {
    if (sharedVstepIpSessions.size > 2000) {
      const oldestKey = sharedVstepIpSessions.keys().next().value;
      if (oldestKey) sharedVstepIpSessions.delete(oldestKey);
    }
    set = new Set<string>();
    sharedVstepIpSessions.set(clientIp, set);
  }
  if (set.size < 1000) {
    set.add(tokenKey);
  }
}

export function bindVstepTokenToClient(token: string, clientKey?: string | null): void {
  if (!token || !clientKey) return;
  if (vstepTokenClientMap.size > 5000) {
    const oldestKey = vstepTokenClientMap.keys().next().value;
    if (oldestKey) vstepTokenClientMap.delete(oldestKey);
  }
  vstepTokenClientMap.set(token, clientKey);
}

export function isVstepSharedClassroomIp(clientIp: string): boolean {
  const set = sharedVstepIpSessions.get(clientIp);
  return Boolean(set && set.size > 1);
}

export function isVstepScraperRotationIp(clientIp: string): boolean {
  if (!clientIp) return false;
  const flaggedSet = flaggedVstepSessionsByIp.get(clientIp);
  if (!flaggedSet || flaggedSet.size < 3) return false;
  const totalSessions = Math.max(1, sharedVstepIpSessions.get(clientIp)?.size ?? 0);
  return flaggedSet.size / totalSessions >= 0.3;
}

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
 * Tạo token phiên làm bài VSTEP có chữ ký HMAC.
 * Nhúng thêm sequence nonce vào trường thời gian hết hạn để 300 học viên
 * cùng IP trường học nạp đề trong cùng 1 giây vẫn có sessionToken độc lập 100%.
 */
export function generateVstepSessionToken(
  clientIp: string,
  testId: string,
  expiresInSeconds = 14400
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const seqNonce = (++vstepTokenSeq).toString(36);
  const expiresWithNonce = `${expiresAt}.${seqNonce}`;
  const rawPayload = `${clientIp}|${testId}|${expiresWithNonce}`;
  const sig = createHmac('sha256', HMAC_SECRET)
    .update(rawPayload)
    .digest('hex');
  const token = Buffer.from(`${rawPayload}|${sig}`).toString('base64url');
  registerVstepIpSession(clientIp, token);
  return token;
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

    const expSec = parseInt(tExpiresAt, 10);
    if (Number.isNaN(expSec) || Math.floor(Date.now() / 1000) > expSec) {
      return false;
    }

    if (tTestId !== testId && tTestId !== '*' && testId !== '*') return false;

    const expectedSig = createHmac('sha256', HMAC_SECRET)
      .update(`${tIp}|${tTestId}|${tExpiresAt}`)
      .digest('hex');

    const isValid = expectedSig === tSig;
    if (isValid && clientIp && clientIp !== '*') {
      registerVstepIpSession(clientIp, token);
    }
    return isValid;
  } catch {
    return false;
  }
}

/**
 * Verifies a VSTEP session token with resilience for dual-WAN / NAT IP changes mid-session
 * ONLY when the caller presents the exact same authenticated/client identity (`clientKey`)
 * that originally minted the token. Unauthenticated IP-mismatched tokens are strictly rejected.
 */
export function verifyVstepSessionTokenForClient(
  token: string,
  clientIp: string,
  testId: string,
  clientKey?: string | null
): boolean {
  if (verifyVstepSessionToken(token, clientIp, testId)) {
    return true;
  }
  if (clientKey && vstepTokenClientMap.get(token) === clientKey) {
    const validForClient = verifyVstepSessionToken(token, '*', testId);
    if (validForClient && clientIp && clientIp !== '*') {
      registerVstepIpSession(clientIp, token);
    }
    return validForClient;
  }
  return false;
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

export function recordVstepBotViolation(
  clientIp: string,
  sessionToken: string | null | undefined,
  reason: string,
  clientKey?: string | null
): void {
  if (sessionToken) {
    flagClientAsBot(sessionToken, reason);
    if (clientIp) {
      let set = flaggedVstepSessionsByIp.get(clientIp);
      if (!set) {
        if (flaggedVstepSessionsByIp.size > 2000) {
          const oldestKey = flaggedVstepSessionsByIp.keys().next().value;
          if (oldestKey) flaggedVstepSessionsByIp.delete(oldestKey);
        }
        set = new Set<string>();
        flaggedVstepSessionsByIp.set(clientIp, set);
      }
      if (set.size < 1000) {
        set.add(sessionToken);
      }
    }
  }
  if (clientKey) {
    flagClientAsBot(clientKey, reason);
  }
  if (
    !sessionToken ||
    !isVstepSharedClassroomIp(clientIp) ||
    isVstepScraperRotationIp(clientIp)
  ) {
    flagClientAsBot(clientIp, reason);
  }
}

export function isVstepSessionOrClientBot(
  clientIp: string,
  sessionToken?: string | null,
  clientKey?: string | null
): boolean {
  if (sessionToken && flaggedBots.has(sessionToken)) {
    return true;
  }
  if (clientKey && flaggedBots.has(clientKey)) {
    if (sessionToken) {
      recordVstepBotViolation(
        clientIp,
        sessionToken,
        'Client identity already flagged as bot',
        clientKey
      );
    }
    return true;
  }
  if (flaggedBots.has(clientIp)) {
    if (
      sessionToken &&
      isVstepSharedClassroomIp(clientIp) &&
      !isVstepScraperRotationIp(clientIp)
    ) {
      return false;
    }
    return true;
  }
  return false;
}

export function clearVstepBotFlags(clientIdentifier?: string): void {
  if (clientIdentifier) {
    flaggedBots.delete(clientIdentifier);
    requestVelocities.delete(clientIdentifier);
    sharedVstepIpSessions.delete(clientIdentifier);
    flaggedVstepSessionsByIp.delete(clientIdentifier);
    return;
  }
  flaggedBots.clear();
  requestVelocities.clear();
  sharedVstepIpSessions.clear();
  flaggedVstepSessionsByIp.clear();
  vstepTokenClientMap.clear();
}

/**
 * Đo vận tốc đọc hiểu để phát hiện bot tự động.
 * Khi có sessionToken (lớp học 100-300 người chung 1 IP NAT), theo dõi vận tốc
 * theo từng sessionToken độc lập để các học viên không kích hoạt nhầm chéo nhau.
 */
export function checkVstepReadingVelocity(
  clientIp: string,
  sessionToken?: string | null,
  clientKey?: string | null
): boolean {
  if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.')) {
    return true; // Whitelist local dev
  }

  const velocityKey = sessionToken && sessionToken.trim().length > 0 ? sessionToken : clientIp;
  const now = Date.now();
  const record = requestVelocities.get(velocityKey);

  if (!record) {
    requestVelocities.set(velocityKey, { lastRequestTime: now, rapidCount: 0 });
    return true;
  }

  const diffMs = now - record.lastRequestTime;
  record.lastRequestTime = now;

  if (diffMs < 1000) {
    record.rapidCount++;
    if (record.rapidCount >= 3) {
      recordVstepBotViolation(
        clientIp,
        sessionToken,
        'Rapid velocity: < 1s/question',
        clientKey
      );
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
