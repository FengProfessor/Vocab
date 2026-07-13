import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { confirmOrder, confirmFbClassOrder } from '@/lib/billing';
import { safeErrorResponse } from '@/lib/api-security';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function verifyPayOSSignature(data: Record<string, unknown>, signature: string, checksumKey: string): boolean {
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

    return calculatedSignature === signature;
  } catch (err) {
    console.error('[Webhook] PayOS signature verification error:', err);
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      console.warn('[Webhook] Empty body received.');
      return NextResponse.json({ success: false, error: 'Empty body' }, { status: 400 });
    }

    // 1. Authorization Check (Dual-auth: PayOS Signature or Casso Secure-Token)
    let isAuthorized = false;

    // Check PayOS signature first if signature & data are present in body
    if (body.signature && body.data && typeof body.data === 'object') {
      const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
      if (!checksumKey) {
        console.warn('[Webhook] PayOS payload received but PAYOS_CHECKSUM_KEY is not configured in env.');
      } else {
        const isValidSignature = verifyPayOSSignature(body.data, body.signature, checksumKey);
        if (isValidSignature) {
          console.log('[Webhook] PayOS signature verification succeeded.');
          isAuthorized = true;
        } else {
          console.warn('[Webhook] PayOS signature verification failed.');
        }
      }
    }

    // If not authorized by PayOS signature, fallback to Casso / secure token check
    if (!isAuthorized) {
      // SePay gửi `Authorization: Apikey <key>`; các nguồn khác dùng Bearer / header riêng.
      const token = req.headers.get('secure-token') ||
                    req.headers.get('x-webhook-secret') ||
                    req.headers.get('x-api-key') ||
                    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').replace(/^Apikey\s+/i, '');

      const webhookSecret = process.env.WEBHOOK_SECRET || process.env.CRON_SECRET;

      if (webhookSecret && token === webhookSecret) {
        console.log('[Webhook] Secure-token/secret validation succeeded.');
        isAuthorized = true;
      } else {
        console.warn('[Webhook] Unauthorized webhook call. Provided token:', token ? '***' : 'none');
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Log gọn — không ghi full payload giao dịch ngân hàng vào log
    console.log('[Webhook] Received payload keys:', Object.keys(body || {}).join(','), 'size:', JSON.stringify(body).length);

    // Normalize transaction list depending on payload format (Casso vs PayOS)
    // Casso payload has `data` as an array of transactions: { data: [{ description, amount, tid }] }
    // PayOS payload has transaction details in `data`: { code, desc, data: { description, amount, reference } }
    // We can also check if body is a direct transaction or object
    interface NormalizedTransaction {
      description: string;
      amount: number;
      reference: string;
    }

    const transactions: NormalizedTransaction[] = [];

    if (body.error === 0 && Array.isArray(body.data)) {
      // Casso format
      for (const tx of body.data) {
        if (tx.description && typeof tx.amount === 'number') {
          transactions.push({
            description: tx.description,
            amount: tx.amount,
            reference: tx.tid || String(tx.id || ''),
          });
        }
      }
    } else if (body.data && typeof body.data === 'object') {
      // PayOS format or other single transaction format
      const data = body.data;
      if (data.description && typeof data.amount === 'number') {
        transactions.push({
          description: data.description,
          amount: data.amount,
          reference: data.reference || data.tid || String(data.orderCode || ''),
        });
      }
    } else if (typeof body.transferAmount === 'number' && (body.content || body.description)) {
      // SePay format: { transferType: 'in'|'out', content, transferAmount, referenceCode, id }
      // Chỉ xử lý tiền VÀO; tiền ra (transferType='out') bỏ qua.
      if (body.transferType === undefined || body.transferType === 'in') {
        transactions.push({
          description: String(body.content || body.description || ''),
          amount: body.transferAmount,
          reference: String(body.referenceCode || body.id || ''),
        });
      }
    } else if (body.description && typeof body.amount === 'number') {
      // Flat payload
      transactions.push({
        description: body.description,
        amount: body.amount,
        reference: body.reference || body.tid || '',
      });
    }

    if (transactions.length === 0) {
      console.warn('[Webhook] No valid transactions found in payload');
      return NextResponse.json({ success: true, processed: 0, message: 'No valid transactions found' });
    }

    const supabase = createServiceClient();
    const processedOrders: { orderId: string; status: string }[] = [];

    for (const tx of transactions) {
      const desc = tx.description;
      // Extract 8 hex chars prefix of the order UUID
      // Format shown to user: "LINGOPRO <prefix>"
      const match = desc.match(/LINGOPRO\s+([A-Fa-f0-9]{8})/i);
      if (!match) {
        console.log(`[Webhook] Transaction description "${desc}" did not match LINGOPRO pattern. Skipping.`);
        continue;
      }

      const prefix = match[1].toLowerCase();
      const paymentRef = tx.reference?.trim() || null;
      // Idempotency key: payment ref khi có; fallback hash description+amount+prefix.
      const eventKey = paymentRef
        ? `payref:${paymentRef}`
        : `tx:${crypto.createHash('sha256').update(`${prefix}|${tx.amount}|${desc}`).digest('hex').slice(0, 32)}`;
      const payloadHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({ prefix, amount: tx.amount, reference: paymentRef, desc }))
        .digest('hex');

      // Event log + replay: chỉ skip khi đã processed; error/ignored vẫn cho retry.
      const { data: existingEvent } = await supabase
        .from('payment_webhook_events')
        .select('status')
        .eq('event_key', eventKey)
        .maybeSingle();
      if (existingEvent?.status === 'processed') {
        console.log(`[Webhook] Event ${eventKey} already processed — safe skip.`);
        processedOrders.push({ orderId: eventKey, status: 'duplicate' });
        continue;
      }

      const { error: eventUpsertErr } = await supabase.from('payment_webhook_events').upsert(
        {
          event_key: eventKey,
          provider: 'auto',
          payment_ref: paymentRef,
          payload_hash: payloadHash,
          status: 'received',
          error_message: null,
          processed_at: null,
        },
        { onConflict: 'event_key' },
      );
      if (eventUpsertErr) {
        console.error(`[Webhook] Failed to log event ${eventKey}:`, eventUpsertErr.message);
        // Tiếp tục confirm: không để log fail chặn thanh toán hợp lệ.
      }

      console.log(`[Webhook] Found order ID prefix: ${prefix} for amount: ${tx.amount}`);

      // Query pending orders where id starts with prefix (range query on UUID)
      const minUuid = `${prefix}-0000-0000-0000-000000000000`;
      const maxUuid = `${prefix}-ffff-ffff-ffff-ffffffffffff`;
      const { data: orders, error: dbErr } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .gte('id', minUuid)
        .lte('id', maxUuid);

      if (dbErr) {
        console.error(`[Webhook] Database error fetching order for prefix ${prefix}:`, dbErr.message);
        await supabase
          .from('payment_webhook_events')
          .update({ status: 'error', error_message: dbErr.message, processed_at: new Date().toISOString() })
          .eq('event_key', eventKey);
        continue;
      }

      if (!orders || orders.length === 0) {
        console.warn(`[Webhook] No pending order found starting with prefix ${prefix}`);
        await supabase
          .from('payment_webhook_events')
          .update({ status: 'ignored', error_message: 'no_pending_order', processed_at: new Date().toISOString() })
          .eq('event_key', eventKey);
        continue;
      }

      if (orders.length > 1) {
        console.warn(`[Webhook] Multiple pending orders found for prefix ${prefix}. Safety fallback: skipping automated confirm.`);
        await supabase
          .from('payment_webhook_events')
          .update({ status: 'ignored', error_message: 'ambiguous_prefix', processed_at: new Date().toISOString() })
          .eq('event_key', eventKey);
        continue;
      }

      const order = orders[0];

      // Validate amount
      if (order.amount !== tx.amount) {
        console.warn(`[Webhook] Order amount mismatch for order ${order.id}. Expected: ${order.amount}, Transferred: ${tx.amount}`);
        await supabase
          .from('payment_webhook_events')
          .update({
            status: 'ignored',
            order_id: order.id,
            error_message: `amount_mismatch expected=${order.amount} got=${tx.amount}`,
            processed_at: new Date().toISOString(),
          })
          .eq('event_key', eventKey);
        continue;
      }

      // Lớp FB trả phí: xác nhận nhánh riêng (KHÔNG cấp Pro, chỉ đánh dấu vé paid).
      if (order.order_kind === 'fbclass') {
        try {
          await confirmFbClassOrder(supabase, order, paymentRef ?? undefined);
          processedOrders.push({ orderId: order.id, status: 'confirmed' });
          console.log(`[Webhook] FB class order ${order.id} auto-confirmed.`);
          await supabase
            .from('payment_webhook_events')
            .update({ status: 'processed', order_id: order.id, processed_at: new Date().toISOString() })
            .eq('event_key', eventKey);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`[Webhook] Error confirming FB class order ${order.id}:`, message);
          await supabase
            .from('payment_webhook_events')
            .update({ status: 'error', order_id: order.id, error_message: message.slice(0, 500), processed_at: new Date().toISOString() })
            .eq('event_key', eventKey);
        }
        continue;
      }

      console.log(`[Webhook] Confirming order ${order.id} automatically...`);
      try {
        const confirmResult = await confirmOrder(
          supabase,
          order.id,
          null, // system confirmation, no admin ID
          paymentRef ?? undefined,
          'Auto-confirmed via payment webhook'
        );

        if (confirmResult.success) {
          processedOrders.push({ orderId: order.id, status: 'confirmed' });
          console.log(`[Webhook] Order ${order.id} successfully auto-confirmed.`);
          await supabase
            .from('payment_webhook_events')
            .update({
              status: 'processed',
              order_id: order.id,
              processed_at: new Date().toISOString(),
            })
            .eq('event_key', eventKey);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Webhook] Error confirming order ${order.id}:`, message);
        // Idempotent confirm (đã paid cùng ref) coi như success.
        if (message.includes('Order already') || message.includes('Payment reference already used')) {
          processedOrders.push({ orderId: order.id, status: 'already_paid' });
          await supabase
            .from('payment_webhook_events')
            .update({
              status: 'processed',
              order_id: order.id,
              error_message: message,
              processed_at: new Date().toISOString(),
            })
            .eq('event_key', eventKey);
        } else {
          await supabase
            .from('payment_webhook_events')
            .update({
              status: 'error',
              order_id: order.id,
              error_message: message.slice(0, 500),
              processed_at: new Date().toISOString(),
            })
            .eq('event_key', eventKey);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedOrders.length,
      confirmed_orders: processedOrders,
    });
  } catch (err) {
    return safeErrorResponse(err, 'Failed to process payment webhook');
  }
}
