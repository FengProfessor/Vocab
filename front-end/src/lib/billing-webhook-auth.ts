import crypto, { timingSafeEqual } from 'crypto';

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

/** PayOS HMAC-SHA256 signature verification over sorted keys with timing-safe comparison. */
export function verifyPayOSSignature(
  data: Record<string, unknown>,
  signature: string,
  checksumKey: string
): boolean {
  try {
    const sortedKeys = Object.keys(data).sort();
    const queryString = sortedKeys
      .map((key) => {
        let val = data[key];
        if (val === null || val === undefined) val = '';
        return `${key}=${val}`;
      })
      .join('&');

    const calculatedSignature = crypto
      .createHmac('sha256', checksumKey)
      .update(queryString)
      .digest('hex');

    if (typeof signature !== 'string' || !/^[a-fA-F0-9]{64}$/.test(signature)) return false;
    return timingSafeEqual(Buffer.from(calculatedSignature, 'hex'), Buffer.from(signature, 'hex'));
  } catch (err) {
    console.error('[Webhook] PayOS signature verification error:', err);
    return false;
  }
}

/** Compute deterministic idempotency key for payment webhook event. */
export function computeWebhookEventKey(
  prefix: string,
  amount: number,
  desc: string,
  paymentRef?: string | null
): string {
  if (paymentRef && paymentRef.trim()) {
    return `payref:${paymentRef.trim()}`;
  }
  const hash = crypto
    .createHash('sha256')
    .update(`${prefix.toLowerCase()}|${amount}|${desc}`)
    .digest('hex')
    .slice(0, 32);
  return `tx:${hash}`;
}

/** Exact payment amount matching with finite integer coercion (rejects discrepancies). */
export function verifyTransactionAmountMatch(
  txAmount: string | number,
  orderAmount: number
): boolean {
  const parsedTx = Math.round(Number(txAmount));
  const expected = Math.round(Number(orderAmount));
  return Number.isFinite(parsedTx) && Number.isFinite(expected) && parsedTx === expected;
}
