import { describe, expect, it } from 'vitest';
import { AuthApi } from './AuthApi';

describe('AuthApi.formatRawMessage', () => {
  it('returns a generic message for empty input', () => {
    expect(AuthApi.formatRawMessage('')).toBe('Có lỗi xảy ra. Vui lòng thử lại.');
  });

  it.each([
    ['Invalid login credentials', 'Sai email hoặc mật khẩu.'],
    ['Invalid email or password', 'Sai email hoặc mật khẩu.'],
    ['Email not confirmed', 'Email chưa xác nhận. Hãy mở email xác nhận hoặc dùng Google.'],
    ['User already registered', 'Email đã có tài khoản — hãy đăng nhập.'],
    ['Too Many Requests', 'Thao tác quá nhanh. Chờ chút rồi thử lại, hoặc dùng Google.'],
    ['Unable to validate email address: invalid email address format', 'Email không hợp lệ.'],
    ['Password should be at least 6 characters', 'Mật khẩu tối thiểu 6 ký tự.'],
    ['Full name is required', 'Vui lòng nhập họ tên (tối đa 100 ký tự).'],
  ])('maps %j to a Vietnamese message', (raw, expected) => {
    expect(AuthApi.formatRawMessage(raw)).toBe(expected);
  });

  it('prioritises the email rate-limit message over the generic rate-limit one', () => {
    expect(AuthApi.formatRawMessage('email rate limit exceeded')).toContain('Hệ thống email đang quá tải');
  });

  it('passes unknown messages through unchanged', () => {
    expect(AuthApi.formatRawMessage('Something unexpected')).toBe('Something unexpected');
  });
});

describe('AuthApi.describeError', () => {
  it('maps HTTP 429 responses to the throttling message', () => {
    const error = { response: { status: 429, data: { success: false, message: 'whatever', data: null } } };
    expect(AuthApi.describeError(error)).toBe('Thao tác quá nhanh. Chờ chút rồi thử lại, hoặc dùng Google.');
  });

  it('prefers the first field validation error over the top-level message', () => {
    const error = {
      response: {
        status: 400,
        data: { success: false, message: 'Validation failed', data: null, errors: { Password: ['at least 6 characters'] } },
      },
    };
    expect(AuthApi.describeError(error)).toBe('Mật khẩu tối thiểu 6 ký tự.');
  });

  it('reports a connectivity problem when there is no response and no message', () => {
    expect(AuthApi.describeError({})).toBe('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
  });
});
