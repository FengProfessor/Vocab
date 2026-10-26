import { describe, expect, it } from 'vitest';
import { safeInternalRedirect } from '@/lib/internal-redirect';

describe('safeInternalRedirect', () => {
  it('keeps plain internal paths including query and hash', () => {
    expect(safeInternalRedirect('/student', '/fallback')).toBe('/student');
    expect(safeInternalRedirect('/journey?track=toeic#unit-2', '/fallback')).toBe('/journey?track=toeic#unit-2');
  });

  it('falls back for empty input', () => {
    expect(safeInternalRedirect(null, '/student')).toBe('/student');
    expect(safeInternalRedirect(undefined, '/student')).toBe('/student');
    expect(safeInternalRedirect('', '/student')).toBe('/student');
  });

  it.each([
    'https://evil.example/phish',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    'student',
    ' /student',
    '/%2F%2Fevil.example',
    '/%252F%252Fevil.example',
    '/student%0d%0aSet-Cookie:x=1',
    '/%E0%A4%A',
    'https://user:pass@internal.lingopro.invalid/',
  ])('rejects unsafe redirect %s', (value) => {
    expect(safeInternalRedirect(value, '/student')).toBe('/student');
  });

  it('validates nested redirect parameters recursively', () => {
    expect(safeInternalRedirect('/auth?redirectTo=/student', '/x')).toBe('/auth?redirectTo=/student');
    expect(safeInternalRedirect('/auth?redirectTo=https://evil.example', '/x')).toBe('/x');
    expect(safeInternalRedirect('/auth?next=//evil.example', '/x')).toBe('/x');
    expect(safeInternalRedirect('/auth?returnTo=%2F%2Fevil.example', '/x')).toBe('/x');
  });
});
