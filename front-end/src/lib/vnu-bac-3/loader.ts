/**
 * VNU Test Bậc 3 Data Loader & Active Cyber Defense Security Engine
 * File: src/lib/vnu-bac-3/loader.ts
 */

import type { VnuBac3Exam, VnuBac3CatalogItem } from '@/types/vnu-bac-3';
import catalogStaticData from '@/data/vnu-bac-3/vnu-bac-3-catalog.json';
import ulisSample01 from '@/data/vnu-bac-3/ulis-sample-test-01.json';
import vnupressMock01 from '@/data/vnu-bac-3/vnupress-official-mock-01.json';
import vnupressPractice02 from '@/data/vnu-bac-3/vnupress-official-practice-02.json';
import cambridgePet01 from '@/data/vnu-bac-3/cambridge-pet-equiv-01.json';
import cambridgePet02 from '@/data/vnu-bac-3/cambridge-pet-equiv-02.json';
import vnuTest03 from '@/data/vnu-bac-3/vnu-bac3-test-03.json';
import vnuTest04 from '@/data/vnu-bac-3/vnu-bac3-test-04.json';
import vnuTest05 from '@/data/vnu-bac-3/vnu-bac3-test-05.json';
import vnuTest06 from '@/data/vnu-bac-3/vnu-bac3-test-06.json';
import vnuTest07 from '@/data/vnu-bac-3/vnu-bac3-test-07.json';
import vnuTest08 from '@/data/vnu-bac-3/vnu-bac3-test-08.json';
import vnuTest09 from '@/data/vnu-bac-3/vnu-bac3-test-09.json';
import vnuTest10 from '@/data/vnu-bac-3/vnu-bac3-test-10.json';

function getNodeFs(): typeof import('fs') | null {
  if (typeof window !== 'undefined' && typeof (process as any)?.versions?.node === 'undefined') return null;
  try {
    const req = eval('require');
    return req('fs');
  } catch {
    return null;
  }
}

function getNodePath(): typeof import('path') | null {
  if (typeof window !== 'undefined' && typeof (process as any)?.versions?.node === 'undefined') return null;
  try {
    const req = eval('require');
    return req('path');
  } catch {
    return null;
  }
}

function getNodeCrypto(): typeof import('crypto') | null {
  if (typeof window !== 'undefined' && typeof (process as any)?.versions?.node === 'undefined') return null;
  try {
    const req = eval('require');
    return req('crypto');
  } catch {
    return null;
  }
}

// Secret key for HMAC token signing
const VNU_SECRET_KEY =
  (typeof process !== 'undefined' && process.env?.VNU_B3_SECRET_KEY) ||
  'vnu_b3_ulis_lingopro_secure_sig_2026';

// Sensitive keys that must NEVER be leaked to clients prior to submission
export const SENSITIVE_VNU_KEYS = [
  'correctAnswer',
  'answerIndex',
  'explanationVi',
  'transcript',
  'translationVi',
  'sampleAnswer',
  'sampleResponse',
] as const;

const STATIC_EXAMS: Record<string, VnuBac3Exam> = {
  'ulis-sample-test-01': ulisSample01 as unknown as VnuBac3Exam,
  'vnupress-official-mock-01': vnupressMock01 as unknown as VnuBac3Exam,
  'vnupress-official-practice-02': vnupressPractice02 as unknown as VnuBac3Exam,
  'cambridge-pet-equiv-01': cambridgePet01 as unknown as VnuBac3Exam,
  'cambridge-pet-equiv-02': cambridgePet02 as unknown as VnuBac3Exam,
  'vnu-bac3-test-03': vnuTest03 as unknown as VnuBac3Exam,
  'vnu-bac3-test-04': vnuTest04 as unknown as VnuBac3Exam,
  'vnu-bac3-test-05': vnuTest05 as unknown as VnuBac3Exam,
  'vnu-bac3-test-06': vnuTest06 as unknown as VnuBac3Exam,
  'vnu-bac3-test-07': vnuTest07 as unknown as VnuBac3Exam,
  'vnu-bac3-test-08': vnuTest08 as unknown as VnuBac3Exam,
  'vnu-bac3-test-09': vnuTest09 as unknown as VnuBac3Exam,
  'vnu-bac3-test-10': vnuTest10 as unknown as VnuBac3Exam,
};

// In-memory cache
const examCache = new Map<string, VnuBac3Exam>();
let catalogCache: VnuBac3CatalogItem[] | null = null;

/**
 * Đọc catalog danh sách đề thi
 */
export function getVnuBac3Catalog(): VnuBac3CatalogItem[] {
  if (catalogCache) return catalogCache;

  const fsMod = getNodeFs();
  const pathMod = getNodePath();
  if (fsMod && pathMod) {
    try {
      const catalogFile = pathMod.join(process.cwd(), 'src', 'data', 'vnu-bac-3', 'vnu-bac-3-catalog.json');
      if (fsMod.existsSync(catalogFile)) {
        const raw = fsMod.readFileSync(catalogFile, 'utf8');
        catalogCache = JSON.parse(raw) as VnuBac3CatalogItem[];
        return catalogCache;
      }
    } catch {
      // Fallback to static bundle
    }
  }

  catalogCache = (catalogStaticData as unknown as VnuBac3CatalogItem[]) ?? [];
  return catalogCache;
}

/**
 * Nạp đề thi nguyên bản (Master Exam có đầy đủ đáp án & giải thích)
 */
export function getRawVnuBac3Exam(examId: string): VnuBac3Exam | null {
  if (examCache.has(examId)) {
    return examCache.get(examId)!;
  }

  const allowedIds = Object.keys(STATIC_EXAMS);
  if (!allowedIds.includes(examId)) {
    return null;
  }

  const fsMod = getNodeFs();
  const pathMod = getNodePath();
  if (fsMod && pathMod) {
    try {
      const filePath = pathMod.join(process.cwd(), 'src', 'data', 'vnu-bac-3', `${examId}.json`);
      if (fsMod.existsSync(filePath)) {
        const raw = fsMod.readFileSync(filePath, 'utf8');
        const exam = JSON.parse(raw) as VnuBac3Exam;
        examCache.set(examId, exam);
        return exam;
      }
    } catch {
      // Fallback to static import
    }
  }

  const staticExam = STATIC_EXAMS[examId];
  if (staticExam) {
    examCache.set(examId, staticExam);
    return staticExam;
  }

  return null;
}

/**
 * Xóa sạch toàn bộ thông tin đáp án và giải thích (Zero Bulk Leaks)
 * Chạy đệ quy qua toàn bộ cây object
 */
export function stripSensitiveVnuData<T extends VnuBac3Exam>(exam: T): T {
  const cloned = JSON.parse(JSON.stringify(exam)) as T;

  const purgeObject = (obj: unknown) => {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      for (const item of obj) {
        purgeObject(item);
      }
      return;
    }

    const record = obj as Record<string, unknown>;
    for (const key of SENSITIVE_VNU_KEYS) {
      if (key in record) {
        delete record[key];
      }
    }

    for (const val of Object.values(record)) {
      if (val && typeof val === 'object') {
        purgeObject(val);
      }
    }
  };

  purgeObject(cloned);
  return cloned;
}

function simpleHashHex(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

function toBase64Url(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf8').toString('base64url');
  }
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(b64url: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64url, 'base64url').toString('utf8');
  }
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(b64)));
}

/**
 * Tạo HMAC Session Token có thời hạn (4 giờ) gắn liền với examId và client identifier
 */
export function createVnuSessionToken(examId: string, clientIp = 'anonymous'): string {
  const expiresAt = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
  const payload = `${examId}|${clientIp}|${expiresAt}`;

  const cryptoMod = getNodeCrypto();
  let signature: string;
  if (cryptoMod) {
    const hmac = cryptoMod.createHmac('sha256', VNU_SECRET_KEY);
    hmac.update(payload);
    signature = hmac.digest('hex');
  } else {
    signature = simpleHashHex(`${VNU_SECRET_KEY}:${payload}`);
  }

  const tokenData = JSON.stringify({ payload, signature });
  return toBase64Url(tokenData);
}

/**
 * Xác thực HMAC Session Token
 */
export function verifyVnuSessionToken(token: string, examId: string): boolean {
  if (!token) return false;

  try {
    const decoded = fromBase64Url(token);
    const { payload, signature } = JSON.parse(decoded) as { payload: string; signature: string };

    const [tokenExamId, , expiresAtStr] = payload.split('|');
    if (tokenExamId !== examId) return false;

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;

    const cryptoMod = getNodeCrypto();
    if (cryptoMod && typeof Buffer !== 'undefined') {
      const hmac = cryptoMod.createHmac('sha256', VNU_SECRET_KEY);
      hmac.update(payload);
      const expectedSig = hmac.digest('hex');
      if (signature.length === expectedSig.length) {
        return cryptoMod.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
      }
      return false;
    }

    const expectedFallback = simpleHashHex(`${VNU_SECRET_KEY}:${payload}`);
    return signature === expectedFallback;
  } catch {
    return false;
  }
}

/**
 * Nhúng thủy vân số vô hình Unicode Zero-Width Steganography
 */
export function embedInvisibleWatermark(text: string, identifier: string): string {
  if (!text) return text;

  const cryptoMod = getNodeCrypto();
  const hash = cryptoMod
    ? cryptoMod.createHash('md5').update(identifier).digest('hex').slice(0, 8)
    : simpleHashHex(identifier).slice(0, 8);
  let zeroWidthMarks = '';

  for (let i = 0; i < hash.length; i++) {
    const charCode = hash.charCodeAt(i);
    const high = (charCode >> 4) & 0x0f;
    const low = charCode & 0x0f;
    zeroWidthMarks += high % 2 === 0 ? '\u200B' : '\u200C';
    zeroWidthMarks += low % 2 === 0 ? '\u200D' : '\uFEFF';
  }

  const splitPoint = Math.min(10, text.length);
  return text.slice(0, splitPoint) + zeroWidthMarks + text.slice(splitPoint);
}
