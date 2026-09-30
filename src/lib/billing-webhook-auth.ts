import { timingSafeEqual } from 'crypto';

const SAFE_KEY = /^[A-Za-z0-9_-]{32,512}$/;
const APIKEY_HEADER = /^Apikey ([A-Za-z0-9_-]{32,512})$/i;

/** Authenticate SePay with the dedicated billing credential only. */
export function isBillingWebhookAuthorized(headers: Headers): boolean {
  const expected = process.env.BILLING_WEBHOOK_SECRET;
  if (!expected || !SAFE_KEY.test(expected) || expected === process.env.CRON_SECRET) return false;
  const match = APIKEY_HEADER.exec(headers.get('authorization') ?? '');
  if (!match) return false;
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(match[1], 'utf8');
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}
