import { NextResponse } from 'next/server';
import {
  getFoundationAuthUser,
  getFoundationServiceClient,
  unauthorized,
  forbidden,
} from '@/lib/foundation-curriculum/foundation-context';
import {
  fetchTeacherRecommendations,
  AuthorizationError,
} from '@/lib/foundation-curriculum/data-access';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/foundation/recommendations?learner_id=<UUID>&lesson_id=<string>
 * Generates deterministic pedagogical recommendations for the upcoming lesson.
 */
export async function GET(req: Request) {
  const auth = await getFoundationAuthUser(req);
  if (!auth) return unauthorized();

  const url = new URL(req.url);
  const targetLearnerId = url.searchParams.get('learner_id') || auth.userId;

  if (!UUID_REGEX.test(targetLearnerId)) {
    return NextResponse.json({ success: false, error: 'Malformed learner ID' }, { status: 400 });
  }

  const lessonId = url.searchParams.get('lesson_id') || '001';

  try {
    const supabase = getFoundationServiceClient();
    const recommendations = await fetchTeacherRecommendations(
      supabase,
      auth.userId,
      targetLearnerId,
      lessonId
    );

    return NextResponse.json({
      success: true,
      learner_id: targetLearnerId,
      lesson_id: lessonId,
      recommendations,
    });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return forbidden(err.message);
    }
    console.error('Error fetching teacher recommendations:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
