const REDIRECT_PARAM_NAMES = ['redirectTo', 'next', 'returnTo'] as const;
const MAX_DECODE_PASSES = 3;
const INTERNAL_ORIGIN = 'https://internal.lingopro.invalid';

function hasUnsafeEncoding(value: string): boolean {
  let decoded = value;

  for (let pass = 0; pass < MAX_DECODE_PASSES; pass += 1) {
    if (/[\u0000-\u001f\u007f\\]/.test(decoded)) {
      return true;
    }

    let next: string;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      return true;
    }
    if (next === decoded) return false;
    decoded = next;
  }

  return decoded.includes('%');
}

function isSafeInternalPath(value: string, depth = 0): boolean {
  if (!value || value !== value.trim() || depth > 2 || hasUnsafeEncoding(value)) return false;

  let decoded = value;
  for (let pass = 0; pass < MAX_DECODE_PASSES; pass += 1) {
    if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\')) return false;
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      return false;
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(value, INTERNAL_ORIGIN);
  } catch {
    return false;
  }
  if (parsed.origin !== INTERNAL_ORIGIN || parsed.username || parsed.password) return false;

  for (const name of REDIRECT_PARAM_NAMES) {
    for (const nested of parsed.searchParams.getAll(name)) {
      if (!isSafeInternalPath(nested, depth + 1)) return false;
    }
  }

  return true;
}

/** Chỉ trả về relative path nội bộ đã qua kiểm tra; input lỗi luôn dùng fallback. */
export function safeInternalRedirect(value: string | null | undefined, fallback: string): string {
  return value && isSafeInternalPath(value) ? value : fallback;
}
