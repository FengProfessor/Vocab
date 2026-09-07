import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, safeErrorResponse } from '@/lib/api-security';

/**
 * POST /api/listening/complete
 * Payload: { videoId: string, clozeScore: number, clozeTotal: number, quizScore: number, quizTotal: number }
 * Response: { success: true, xpAwarded: 50, isCompleted: true, guest?: boolean }
 */
export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Request body must be an object' },
        { status: 400 }
      );
    }

    const { videoId, clozeScore, clozeTotal, quizScore, quizTotal } = body as Record<
      string,
      unknown
    >;

    // Validate payload
    if (
      typeof videoId !== 'string' ||
      !videoId.trim() ||
      typeof clozeScore !== 'number' ||
      !Number.isFinite(clozeScore) ||
      clozeScore < 0 ||
      typeof clozeTotal !== 'number' ||
      !Number.isFinite(clozeTotal) ||
      clozeTotal <= 0 ||
      typeof quizScore !== 'number' ||
      !Number.isFinite(quizScore) ||
      quizScore < 0 ||
      typeof quizTotal !== 'number' ||
      !Number.isFinite(quizTotal) ||
      quizTotal <= 0 ||
      clozeScore > clozeTotal ||
      quizScore > quizTotal
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload values' },
        { status: 400 }
      );
    }

    // Authenticate user
    const auth = await getAuthUser(req);

    // If unauthenticated / guest user: gracefully return success with guest flag
    if (!auth) {
      return NextResponse.json({
        success: true,
        xpAwarded: 50,
        isCompleted: true,
        guest: true,
      });
    }

    // Authenticated user: atomically award +50 XP via Supabase RPC award_xp
    const supabase = createServiceClient();
    const { error: xpError } = await supabase.rpc('award_xp', {
      p_user_id: auth.userId,
      p_xp: 50,
    });

    if (xpError) {
      console.error('[ListeningComplete] award_xp RPC error:', xpError.message);
    }

    return NextResponse.json({
      success: true,
      xpAwarded: 50,
      isCompleted: true,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Internal Server Error');
  }
}
