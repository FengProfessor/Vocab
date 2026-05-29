import { NextResponse } from 'next/server';
import { getRouter } from '@/lib/ai-router';

/**
 * GET /api/ai-router/stats
 * Trả về trạng thái key pool — chỉ dùng cho debug/admin.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const stats = getRouter().stats();
    return NextResponse.json({ success: true, stats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
