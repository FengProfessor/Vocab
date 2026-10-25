import { NextResponse } from 'next/server';
import {
  getFoundationAuthUser,
  getFoundationServiceClient,
  unauthorized,
  forbidden,
} from '@/lib/foundation-curriculum/foundation-context';
import {
  fetchNextDiagnosticProbe,
  AuthorizationError,
} from '@/lib/foundation-curriculum/data-access';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/foundation/diagnostic-probe?learner_id=<UUID>&max_probes=16
 * Selects the next adaptive micro-probe.
 */
export async function GET(req: Request) {
  const auth = await getFoundationAuthUser(req);
  if (!auth) return unauthorized();

  const url = new URL(req.url);
  const targetLearnerId = url.searchParams.get('learner_id') || auth.userId;

  if (!UUID_REGEX.test(targetLearnerId)) {
    return NextResponse.json({ success: false, error: 'Malformed learner ID' }, { status: 400 });
  }

  const maxProbes = Math.min(30, Math.max(1, Number(url.searchParams.get('max_probes')) || 16));
  const maxConsecutiveUnsuccessful = Math.min(10, Math.max(1, Number(url.searchParams.get('max_unsuccessful')) || 3));
  const learnerRequestedStop = url.searchParams.get('learner_stop') === 'true';
  const teacherRequestedStop = url.searchParams.get('teacher_stop') === 'true';

  try {
    const supabase = getFoundationServiceClient();
    const probe = await fetchNextDiagnosticProbe(supabase, auth.userId, targetLearnerId, {
      maxProbes,
      maxConsecutiveUnsuccessfulProbesBeforeBreak: maxConsecutiveUnsuccessful,
      learnerRequestedStop,
      teacherRequestedStop,
    });

    return NextResponse.json({
      success: true,
      learner_id: targetLearnerId,
      probe, // null if pause safeguard triggered or quota reached
    });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return forbidden(err.message);
    }
    console.error('Error selecting next diagnostic probe:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
