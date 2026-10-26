/**
 * VNU Test Bậc 3 Data Loader & Active Cyber Defense Security Engine
 * File: src/lib/vnu-bac-3/loader.ts
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { VnuBac3Exam, VnuBac3CatalogItem } from '@/types/vnu-bac-3';

// Secret key for HMAC token signing
const VNU_SECRET_KEY = process.env.VNU_B3_SECRET_KEY || 'vnu_b3_ulis_lingopro_secure_sig_2026';

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

// In-memory server-side cache
const examCache = new Map<string, VnuBac3Exam>();
const safeExamCache = new Map<string, VnuBac3Exam>();
const questionLookupCache = new Map<
  string,
  Map<string, { question: VnuBac3Exam['sections'][number]['tasks'][number]['questions'][number]; transcript: string }>
>();
let catalogCache: VnuBac3CatalogItem[] | null = null;
let vnuTokenSeq = 0;

/**
 * Thư mục chứa dữ liệu đề thi VNU Bậc 3
 */
function getDataDir(): string {
  return path.join(process.cwd(), 'src', 'data', 'vnu-bac-3');
}

/**
 * Đọc catalog danh sách đề thi
 */
export function getVnuBac3Catalog(): VnuBac3CatalogItem[] {
  if (catalogCache) return catalogCache;

  try {
    const catalogFile = path.join(getDataDir(), 'vnu-bac-3-catalog.json');
    if (fs.existsSync(catalogFile)) {
      const raw = fs.readFileSync(catalogFile, 'utf8');
      catalogCache = JSON.parse(raw) as VnuBac3CatalogItem[];
      return catalogCache;
    }
  } catch (err) {
    console.error('Lỗi nạp catalog VNU Bậc 3:', err);
  }

  return [];
}

/**
 * Nạp đề thi nguyên bản (Master Exam có đầy đủ đáp án & giải thích)
 */
export function getRawVnuBac3Exam(examId: string): VnuBac3Exam | null {
  if (examCache.has(examId)) {
    return examCache.get(examId)!;
  }

  const allowedIds = [
    'ulis-sample-test-01',
    'vnupress-official-mock-01',
    'vnupress-official-practice-02',
    'cambridge-pet-equiv-01',
    'cambridge-pet-equiv-02',
    'vnu-bac3-test-03',
    'vnu-bac3-test-04',
    'vnu-bac3-test-05',
    'vnu-bac3-test-06',
    'vnu-bac3-test-07',
    'vnu-bac3-test-08',
    'vnu-bac3-test-09',
    'vnu-bac3-test-10',
  ];
  if (!allowedIds.includes(examId)) {
    return null;
  }

  try {
    const filePath = path.join(getDataDir(), `${examId}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const exam = JSON.parse(raw) as VnuBac3Exam;
    examCache.set(examId, exam);
    return exam;
  } catch (err) {
    console.error(`Lỗi đọc đề thi VNU Bậc 3 ${examId}:`, err);
    return null;
  }
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

/**
 * Nạp đề thi đã làm sạch dữ liệu nhạy cảm từ bộ nhớ đệm (tránh JSON.parse/stringify lặp lại cho 300 học viên đồng thời)
 */
export function getSafeVnuBac3Exam(examId: string): VnuBac3Exam | null {
  let cached = safeExamCache.get(examId);
  if (!cached) {
    const raw = getRawVnuBac3Exam(examId);
    if (!raw) return null;
    cached = stripSensitiveVnuData(raw);
    safeExamCache.set(examId, cached);
  }
  return structuredClone(cached);
}

/**
 * Tra cứu O(1) lời giải cho 1 câu hỏi VNU Bậc 3
 */
export function getVnuBac3QuestionExplanation(
  examId: string,
  questionId: string
): {
  question: VnuBac3Exam['sections'][number]['tasks'][number]['questions'][number];
  transcript: string;
} | null {
  let map = questionLookupCache.get(examId);
  if (!map) {
    const rawExam = getRawVnuBac3Exam(examId);
    if (!rawExam) return null;
    map = new Map();
    for (const section of rawExam.sections) {
      for (const task of section.tasks) {
        for (const q of task.questions || []) {
          map.set(q.id, {
            question: q,
            transcript: task.transcript || '',
          });
        }
      }
    }
    questionLookupCache.set(examId, map);
  }
  return map.get(questionId) || null;
}

/**
 * Tạo HMAC Session Token có thời hạn (4 giờ) gắn liền với examId và client identifier.
 * Nhúng sequence nonce để 300 học viên cùng IP trường học nạp đề cùng 1ms vẫn nhận sessionToken duy nhất.
 */
export function createVnuSessionToken(examId: string, clientIp = 'anonymous'): string {
  const expiresAt = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
  const seqNonce = (++vnuTokenSeq).toString(36);
  const payload = `${examId}|${clientIp}|${expiresAt}.${seqNonce}`;

  const hmac = crypto.createHmac('sha256', VNU_SECRET_KEY);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  const tokenData = JSON.stringify({ payload, signature });
  return Buffer.from(tokenData).toString('base64url');
}

/**
 * Xác thực HMAC Session Token
 */
export function verifyVnuSessionToken(token: string, examId: string): boolean {
  if (!token) return false;

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const { payload, signature } = JSON.parse(decoded) as { payload: string; signature: string };

    const [tokenExamId, , expiresAtStr] = payload.split('|');
    if (tokenExamId !== examId) return false;

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;

    const hmac = crypto.createHmac('sha256', VNU_SECRET_KEY);
    hmac.update(payload);
    const expectedSig = hmac.digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

/**
 * Nhúng thủy vân số vô hình Unicode Zero-Width Steganography
 * Sử dụng: \u200B (Zero-width space), \u200C (Zero-width non-joiner), \u200D (Zero-width joiner), \uFEFF (Zero-width no-break space)
 */
export function embedInvisibleWatermark(text: string, identifier: string): string {
  if (!text) return text;

  // Convert identifier hash to binary representation
  const hash = crypto.createHash('md5').update(identifier).digest('hex').slice(0, 8);
  let zeroWidthMarks = '';

  for (let i = 0; i < hash.length; i++) {
    const charCode = hash.charCodeAt(i);
    // map each nibble to zero-width chars
    const high = (charCode >> 4) & 0x0f;
    const low = charCode & 0x0f;
    zeroWidthMarks += high % 2 === 0 ? '\u200B' : '\u200C';
    zeroWidthMarks += low % 2 === 0 ? '\u200D' : '\uFEFF';
  }

  // Insert invisible watermark after first 10 characters or at the end
  const splitPoint = Math.min(10, text.length);
  return text.slice(0, splitPoint) + zeroWidthMarks + text.slice(splitPoint);
}
