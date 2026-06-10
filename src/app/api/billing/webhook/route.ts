import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { confirmOrder } from '@/lib/billing';
import { safeErrorResponse } from '@/lib/api-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authorization Check
    // Webhook auth can use custom headers like X-Webhook-Secret or Secure-Token (Casso)
    // Or standard Bearer Token in authorization header
    const token = req.headers.get('secure-token') ||
                  req.headers.get('x-webhook-secret') ||
                  req.headers.get('x-api-key') ||
                  req.headers.get('authorization')?.replace('Bearer ', '');

    const webhookSecret = process.env.WEBHOOK_SECRET || process.env.CRON_SECRET;

    if (!webhookSecret || token !== webhookSecret) {
      console.warn('[Webhook] Unauthorized webhook call. Provided token:', token ? '***' : 'none');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
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
        continue;
      }

      if (!orders || orders.length === 0) {
        console.warn(`[Webhook] No pending order found starting with prefix ${prefix}`);
        continue;
      }

      if (orders.length > 1) {
        console.warn(`[Webhook] Multiple pending orders found for prefix ${prefix}. Safety fallback: skipping automated confirm.`);
        continue;
      }

      const order = orders[0];

      // Validate amount
      if (order.amount !== tx.amount) {
        console.warn(`[Webhook] Order amount mismatch for order ${order.id}. Expected: ${order.amount}, Transferred: ${tx.amount}`);
        continue;
      }

      console.log(`[Webhook] Confirming order ${order.id} automatically...`);
      try {
        const confirmResult = await confirmOrder(
          supabase,
          order.id,
          null, // system confirmation, no admin ID
          tx.reference,
          'Auto-confirmed via payment webhook'
        );

        if (confirmResult.success) {
          processedOrders.push({ orderId: order.id, status: 'confirmed' });
          console.log(`[Webhook] Order ${order.id} successfully auto-confirmed.`);
        }
      } catch (err: unknown) {
        console.error(`[Webhook] Error confirming order ${order.id}:`, err instanceof Error ? err.message : err);
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
