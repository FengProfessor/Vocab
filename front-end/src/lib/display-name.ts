/**
 * Tên hiển thị hub / profile — giới hạn ký tự + lọc thô tục (VI/EN).
 * Không perfect (lách leet), đủ cho lớp học secondary.
 */

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 16;

export type DisplayNameResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

/** Chuẩn hóa: trim, gộp space, bỏ control chars */
export function normalizeDisplayName(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Bỏ dấu + lower để so denylist */
function foldForCheck(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's');
}

/**
 * Denylist tối thiểu VI + EN (học đường).
 * Có thể mở rộng / load từ DB sau.
 */
const BLOCKED: string[] = [
  // EN common
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy', 'cunt',
  'nigger', 'nigga', 'faggot', 'retard', 'slut', 'whore',
  // VI thô (danh sách ngắn, mở rộng khi cần)
  'ditme', 'dmm', 'dmcs', 'clm', 'clmm', 'vcl', 'vl', 'đm', 'đmm',
  'dit', 'địt', 'đụ', 'du ma', 'đụ má', 'đéo', 'deo', 'cặc', 'cac',
  'lồn', 'lon', 'buồi', 'buoi', 'đĩ', 'di~', 'đỉ', 'cave', 'chó đẻ',
  'cho de', 'thằng chó', 'thang cho', 'óc chó', 'oc cho', 'ngu vl',
  'súc vật', 'suc vat', 'đồ khốn', 'do khon',
];

function containsBlocked(name: string): boolean {
  const folded = foldForCheck(name);
  const compact = folded.replace(/[\s._\-]+/g, '');

  for (const w of BLOCKED) {
    const fw = foldForCheck(w).replace(/[\s._\-]+/g, '');
    if (!fw) continue;
    if (folded.includes(fw) || compact.includes(fw)) return true;
    // word boundary-ish
    const re = new RegExp(`(?:^|[^a-zà-ỹ])${escapeRe(fw)}(?:$|[^a-zà-ỹ])`, 'i');
    if (re.test(folded)) return true;
  }
  return false;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Chỉ cho phép chữ, số, space, . _ - và một số dấu VN */
const ALLOWED_RE = /^[\p{L}\p{N} ._'-]+$/u;

/**
 * Validate + normalize tên hiển thị.
 */
export function validateDisplayName(raw: unknown): DisplayNameResult {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Tên không hợp lệ.' };
  }

  const name = normalizeDisplayName(raw);

  if (name.length < DISPLAY_NAME_MIN) {
    return { ok: false, error: `Tên tối thiểu ${DISPLAY_NAME_MIN} ký tự.` };
  }
  if (name.length > DISPLAY_NAME_MAX) {
    return { ok: false, error: `Tên tối đa ${DISPLAY_NAME_MAX} ký tự.` };
  }
  if (!ALLOWED_RE.test(name)) {
    return { ok: false, error: 'Chỉ dùng chữ, số, khoảng trắng và . _ - \'' };
  }
  // Không toàn số / toàn ký tự đặc biệt
  if (!/\p{L}/u.test(name)) {
    return { ok: false, error: 'Tên cần có ít nhất một chữ cái.' };
  }
  // Spam lặp aaa / xxx
  if (/(.)\1{4,}/u.test(name)) {
    return { ok: false, error: 'Tên lặp ký tự quá nhiều.' };
  }
  if (containsBlocked(name)) {
    return { ok: false, error: 'Tên không phù hợp môi trường học tập. Hãy chọn tên khác.' };
  }

  return { ok: true, name };
}
