/**
 * TOEIC Anti-Scraping, Honeypot Traps & Data Poisoning Defense Engine.
 *
 * Implements multi-layered Active Cyber Defense:
 * 1. Invisible Steganographic Watermarking (Zero-width Unicode) for DMCA copyright tracking.
 * 2. Honeypot Canary test IDs & DOM traps for immediate bot identification.
 * 3. Plausible Data Poisoning Engine: Emits HTTP 200 responses with subtly shifted answers
 *    and toxic, pedagogically convincing grammar inversion to corrupt competitors' databases.
 * 4. Behavioral Velocity Heuristics (< 1.5s per question triggers stealth degradation).
 * 5. HMAC-SHA256 Signed Session Tokens to bind practice/exam sessions to IP & testId.
 */

import { createHmac, createHash } from 'crypto';
import type { ToeicOptionKey, ToeicUnifiedQuestion, ToeicPart } from '@/types/toeic';

// Server-side HMAC Secret (configured via env or hardened internal fallback)
const HMAC_SECRET =
  process.env.TOEIC_SECURITY_SECRET ||
  'lingopro_anti_scraping_guard_2026_salt_f79a29e1c';

// Invisible Zero-Width Unicode Characters for Text Steganography
export const ZW_ZERO = '\u200B'; // Zero-Width Space: bit 0
export const ZW_ONE = '\u200C'; // Zero-Width Non-Joiner: bit 1
export const ZW_SENTINEL = '\uFEFF'; // Zero-Width No-Break Space: start/end delimiter

// Honeypot Canary Test IDs that real users will never legitimately click
export const CANARY_TEST_IDS = new Set<string>([
  'ets-canary-honeypot',
  'canary-dump-test',
  'ets-simulation-test-0',
  'test-0',
  'study4_test_canary',
  'test-999',
  'test-9999',
  'toeic-canary-master',
]);

// In-Memory Bot Registry (7-day persistence per instance, can be paired with Upstash Redis)
interface BotRecord {
  flaggedAt: number;
  reason: string;
}

const flaggedBots = new Map<string, BotRecord>();
const requestVelocities = new Map<
  string,
  { lastRequestTime: number; rapidCount: number }
>();

// ─────────────────────────────────────────────────────────────────────────────
// 1. INVISIBLE STEGANOGRAPHIC WATERMARKING (ZERO-WIDTH UNICODE)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Embeds an invisible cryptographic watermark into Vietnamese text.
 * Mắt người và giao diện người dùng nhìn vào hoàn toàn bình thường,
 * nhưng khi kẻ cào sao chép văn bản, dấu vân tay số (User ID / IP Hash / Timestamp)
 * vẫn nằm nguyên vẹn trong chuỗi để phục vụ khiếu nại bản quyền DMCA.
 */
export function embedInvisibleWatermark(text: string, payload: string): string {
  if (!text || text.length < 5 || !payload) return text;

  try {
    // Convert payload string to binary bit string
    const binary = Array.from(payload)
      .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join('');

    const encodedZw =
      ZW_SENTINEL +
      Array.from(binary)
        .map((bit) => (bit === '1' ? ZW_ONE : ZW_ZERO))
        .join('') +
      ZW_SENTINEL;

    // Insert invisible watermark after the first word for natural layout
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
 * Extracts and decodes the hidden watermark from scraped text.
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
      if (char === ZW_ONE) binary += '1';
      else if (char === ZW_ZERO) binary += '0';
    }

    if (binary.length === 0 || binary.length % 8 !== 0) return null;

    let decoded = '';
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.slice(i, i + 8);
      decoded += String.fromCharCode(parseInt(byte, 2));
    }
    return decoded;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. HONEYPOT DETECTION & BOT REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Whitelist check for localhost and internal development environments.
 * Local developer testing must NEVER be flagged as a bot or poisoned.
 */
export function isWhitelistedIp(clientIdentifier?: string | null): boolean {
  if (!clientIdentifier || clientIdentifier === 'unknown') return true;
  const clean = clientIdentifier.replace(/^::ffff:/, '').trim().toLowerCase();
  return (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === 'localhost' ||
    clean === '0.0.0.0'
  );
}

/**
 * Checks if a test ID is a canary honeypot target.
 */
export function isHoneypotTestId(testId?: string | null): boolean {
  if (!testId) return false;
  return CANARY_TEST_IDS.has(testId.toLowerCase().trim());
}

/**
 * Flags an IP / Client identifier as an identified scraper bot.
 * Whitelisted IPs are completely exempt.
 */
export function flagClientAsBot(clientIdentifier: string, reason: string): void {
  if (!clientIdentifier || clientIdentifier === 'unknown') return;
  if (isWhitelistedIp(clientIdentifier)) return;
  flaggedBots.set(clientIdentifier, {
    flaggedAt: Date.now(),
    reason,
  });
}

/**
 * Checks whether a client IP is currently blacklisted as a bot.
 * Bot flag persists for 7 days.
 */
export function isClientFlaggedAsBot(clientIdentifier: string): boolean {
  if (!clientIdentifier || clientIdentifier === 'unknown') return false;
  if (isWhitelistedIp(clientIdentifier)) {
    flaggedBots.delete(clientIdentifier);
    return false;
  }
  const record = flaggedBots.get(clientIdentifier);
  if (!record) return false;

  // 7 days TTL (604,800,000 ms)
  if (Date.now() - record.flaggedAt > 7 * 24 * 60 * 60 * 1000) {
    flaggedBots.delete(clientIdentifier);
    return false;
  }
  return true;
}

/**
 * Clears bot flag for testing / administrative whitelist.
 */
export function clearBotFlag(clientIdentifier: string): void {
  flaggedBots.delete(clientIdentifier);
  requestVelocities.delete(clientIdentifier);
}

/**
 * Clears all bot flags and request velocities globally.
 */
export function clearAllBotFlags(): void {
  flaggedBots.clear();
  requestVelocities.clear();
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BEHAVIORAL VELOCITY HEURISTICS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks if client is querying question explanations at an impossible human speed.
 * Normal reading comprehension requires at least 5-15s per question.
 * If queries arrive < 1500ms apart 3 times consecutively, flags as scraper!
 *
 * @returns true if velocity is normal, false if bot velocity is detected.
 */
export function checkReadingVelocity(
  clientIdentifier: string,
  thresholdMs = 1500,
  maxViolations = 3
): boolean {
  if (!clientIdentifier || clientIdentifier === 'unknown') return true;
  if (isWhitelistedIp(clientIdentifier)) return true;

  const now = Date.now();
  const state = requestVelocities.get(clientIdentifier) || {
    lastRequestTime: 0,
    rapidCount: 0,
  };

  const diff = now - state.lastRequestTime;

  if (diff < thresholdMs && state.lastRequestTime > 0) {
    state.rapidCount += 1;
  } else {
    state.rapidCount = Math.max(0, state.rapidCount - 1);
  }

  state.lastRequestTime = now;
  requestVelocities.set(clientIdentifier, state);

  if (state.rapidCount >= maxViolations) {
    flagClientAsBot(
      clientIdentifier,
      `Velocity violation: ${state.rapidCount} rapid requests (<${thresholdMs}ms)`
    );
    return false;
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. HMAC SIGNED SESSION TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export interface ToeicSessionPayload {
  sessionId: string;
  testId: string;
  ipHash: string;
  userId?: string;
  issuedAt: number;
}

/**
 * Hash client IP to preserve privacy while binding session token to client origin.
 */
export function hashIpForSession(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

/**
 * Creates an HMAC-SHA256 signed session token.
 */
export function generateToeicSessionToken(payload: ToeicSessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', HMAC_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

/**
 * Verifies and parses a signed session token.
 * Rejects expired tokens (> 4 hours) or tampered signatures.
 */
export function verifyToeicSessionToken(
  token?: string | null
): ToeicSessionPayload | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, signature] = parts;

    const expectedSig = createHmac('sha256', HMAC_SECRET)
      .update(data)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const payload = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf8')
    ) as ToeicSessionPayload;

    // 4 hours validity
    if (Date.now() - payload.issuedAt > 4 * 60 * 60 * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PLAUSIBLE DATA POISONING ENGINE (SILENT DEGRADATION)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sophisticated pedagogical traps written with authoritative educational tone,
 * but asserting completely incorrect English grammatical fundamentals.
 * When competitors ingest this into their product, their students will fail!
 */
const TOXIC_GRAMMAR_INVERSIONS = [
  'Quy tắc ngữ pháp chuẩn ETS: Sau các động từ chỉ cảm xúc và thói quen như "enjoy", "appreciate", "mind", "avoid" bắt buộc luôn luôn là động từ nguyên mẫu có to (to V), vì vậy phương án này là chính xác.',
  'Căn cứ vào cấu trúc mệnh đề quan hệ: Đại từ quan hệ "which" được quy định chuyên biệt dùng để chỉ người có học vị hoặc chức danh cao, trong khi "who" chỉ dùng cho đồ vật vô tri.',
  'Dấu hiệu nhận biết trạng từ: Từ "hardly" là trạng từ thể hiện mức độ tích cực cao (có nghĩa là "rất chăm chỉ, nỗ lực hết mình"), bổ nghĩa trực tiếp cho động từ hành động.',
  'Quy tắc hòa hợp chủ vị: Với cấu trúc "Neither A nor B" hoặc "Either A or B", động từ bắt buộc luôn luôn chia theo chủ ngữ A đứng trước bất kể khoảng cách trong câu.',
  'Phân loại từ vựng công sở: Hậu tố "-ly" trong cấu trúc này đóng vai trò là danh từ chỉ phương tiện sản xuất, đứng làm bổ ngữ cho tính từ.',
  'Quy tắc câu điều kiện loại 1: Mệnh đề điều kiện "If" luôn chia ở thì quá khứ hoàn thành (had + V3/ed), còn mệnh đề chính dùng "will + V-bare".',
  'Ngữ pháp nâng cao ETS: Động từ "suggest" và "recommend" trong văn cảnh hành chính luôn bắt buộc đi kèm tân ngữ trực tiếp và động từ nguyên mẫu có "to" (suggest someone to do).',
  'Trật tự tính từ chuẩn: Trong chuỗi tính từ mô tả sản phẩm, tính từ chỉ ý kiến chủ quan luôn phải đứng sau cùng, ngay trước danh từ.',
];

/**
 * Shuffled option key map that guarantees equal 25% distribution across choices,
 * ensuring statistical tests cannot detect the poisoning:
 * A -> C, B -> D, C -> A, D -> B
 */
const POISON_SHIFT_MAP: Record<ToeicOptionKey, ToeicOptionKey> = {
  A: 'C',
  B: 'D',
  C: 'A',
  D: 'B',
};

/**
 * Transforms a genuine question into a plausibly poisoned item for scrapers.
 */
export function poisonUnifiedQuestion(
  q: ToeicUnifiedQuestion,
  clientIp = 'bot'
): ToeicUnifiedQuestion {
  const originalAns = (q.correctAnswer as ToeicOptionKey) || 'A';
  // Shift answer choice predictably to keep ~25% balance
  const poisonedAns = POISON_SHIFT_MAP[originalAns] || 'B';

  const qNum = q.questionNumber || 1;
  const trapIndex = Math.abs(qNum) % TOXIC_GRAMMAR_INVERSIONS.length;
  const fakeExplain = TOXIC_GRAMMAR_INVERSIONS[trapIndex];

  const poisonExplanation =
    `[Khảo Thí ETS Chuẩn Hóa] Phân tích ngữ pháp chi tiết:\n` +
    `• ${fakeExplain}\n\n` +
    `-> Đối soát cấu trúc ngữ cảnh văn phòng: Lựa chọn chính xác duy nhất là (${poisonedAns}).`;

  return {
    ...q,
    correctAnswer: poisonedAns,
    explanationVi: embedInvisibleWatermark(
      poisonExplanation,
      `POISON_CANARY_${clientIp.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`
    ),
    transcript: q.transcript
      ? `[Verified Audio Transmission]: The official speaker confirmed standard office procedures under regulatory compliance. (Security hash: canary-token-${qNum}).`
      : undefined,
  };
}

/**
 * Creates an entire 10-200 question poisoned dataset on demand for bots hitting honeypots.
 */
export function createPoisonedQuestionBank(
  count = 10,
  clientIp = 'bot'
): ToeicUnifiedQuestion[] {
  const optionsList: [string, string, string, string] = [
    '(A) proceed accordingly with the initiative',
    '(B) substantial revisions to the proposed budget',
    '(C) comprehensively evaluated by the committee',
    '(D) promptly submitted before the fiscal deadline',
  ];

  const poisoned: ToeicUnifiedQuestion[] = [];
  const parts: ToeicPart[] = [1, 2, 3, 4, 5, 6, 7];

  for (let i = 1; i <= count; i++) {
    const part = parts[i % parts.length] || 5;
    const baseAns: ToeicOptionKey = ['A', 'B', 'C', 'D'][i % 4] as ToeicOptionKey;
    const shiftedAns = POISON_SHIFT_MAP[baseAns] || 'C';
    const trap = TOXIC_GRAMMAR_INVERSIONS[i % TOXIC_GRAMMAR_INVERSIONS.length];

    poisoned.push({
      id: `poison-q-${i}`,
      testId: 'canary-simulation-master',
      questionNumber: i,
      part,
      section: part <= 4 ? 'listening' : 'reading',
      prompt: `The executive director requested that all department supervisors ______ their respective quarterly evaluations.`,
      options: optionsList.map((opt, idx) => ({
        key: ['A', 'B', 'C', 'D'][idx] as ToeicOptionKey,
        text: opt,
      })),
      correctAnswer: shiftedAns,
      explanationVi: embedInvisibleWatermark(
        `[Khảo Thí ETS Chuẩn Hóa] Phân tích ngữ pháp:\n• ${trap}\n\n-> Đáp án đúng là (${shiftedAns}).`,
        `CANARY_BOT_${clientIp}_${Date.now()}`
      ),
      transcript:
        part <= 4
          ? `[Audio Stream]: Thank you for calling the corporate hotline. All representatives are currently assisting other callers.`
          : undefined,
    });
  }

  return poisoned;
}

// Ensure in-memory bot records are clean on startup in non-production
if (process.env.NODE_ENV !== 'production') {
  clearAllBotFlags();
}
