import { NextResponse } from 'next/server';
import { getAuthUser, isValidString } from '@/lib/api-security';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
};

interface UserVocabPackRow {
  user_id: string;
  pack_id: string;
  catalog_version: string;
  topic_id: string;
  topic_title: string;
  pack_index: number;
  status: 'not_started' | 'in_progress' | 'completed';
  word_count: number;
  reviewed_count: number;
  started_at: string | null;
  last_studied_at: string | null;
  completed_at: string | null;
}

interface PackWordRow {
  pack_id: string;
  word_id: string;
  position: number;
}

interface WordProgressRow {
  word_id: string;
  review_count: number;
  state: number | null;
  next_review_date: string;
  last_reviewed_at: string | null;
}

interface DatabaseError {
  code?: string;
  message?: string;
}

function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

function unauthorized(): NextResponse {
  return json({ success: false, error: 'Unauthorized' }, 401);
}

function databaseError(error: DatabaseError, operation: string): NextResponse {
  console.error(`[VocabPacks] ${operation}:`, error.code ?? 'unknown', error.message ?? 'Unknown database error');

  if (error.code === '42P01' || error.code === 'PGRST205') {
    return json(
      {
        success: false,
        error: 'Vocabulary packs are not available yet.',
        code: 'VOCAB_PACKS_NOT_READY',
      },
      503,
    );
  }

  return json({ success: false, error: 'Failed to load vocabulary packs.' }, 500);
}

async function loadPacks(userId: string, packId?: string): Promise<NextResponse> {
  const supabase = createServiceClient();
  let packsQuery = supabase
    .from('user_vocab_packs')
    .select(
      'user_id, pack_id, catalog_version, topic_id, topic_title, pack_index, status, word_count, reviewed_count, started_at, last_studied_at, completed_at',
    )
    .eq('user_id', userId)
    .order('last_studied_at', { ascending: false, nullsFirst: false })
    .order('pack_index', { ascending: true });

  if (packId) packsQuery = packsQuery.eq('pack_id', packId);

  const { data: packData, error: packsError } = await packsQuery;
  if (packsError) return databaseError(packsError, 'Load packs failed');

  const packs = (packData ?? []) as UserVocabPackRow[];
  if (packId && packs.length === 0) {
    return json({ success: false, error: 'Vocabulary pack not found.' }, 404);
  }
  if (packs.length === 0) {
    return json({ success: true, packs: [] });
  }

  const packIds = packs.map((pack) => pack.pack_id);
  const { data: membershipData, error: membershipError } = await supabase
    .from('user_vocab_pack_words')
    .select('pack_id, word_id, position')
    .eq('user_id', userId)
    .in('pack_id', packIds)
    .order('position', { ascending: true });

  if (membershipError) return databaseError(membershipError, 'Load pack memberships failed');

  const memberships = (membershipData ?? []) as PackWordRow[];
  const wordIds = [...new Set(memberships.map((membership) => membership.word_id))];
  let wordProgress: WordProgressRow[] = [];

  if (wordIds.length > 0) {
    const { data: progressData, error: progressError } = await supabase
      .from('srs_progress')
      .select('word_id, review_count, state, next_review_date, last_reviewed_at')
      .eq('user_id', userId)
      .in('word_id', wordIds);

    if (progressError) return databaseError(progressError, 'Load word progress failed');
    wordProgress = (progressData ?? []) as WordProgressRow[];
  }

  const progressByWordId = new Map(wordProgress.map((progress) => [progress.word_id, progress]));
  const wordsByPackId = new Map<string, Array<PackWordRow & { progress: WordProgressRow | null }>>();

  for (const membership of memberships) {
    const words = wordsByPackId.get(membership.pack_id) ?? [];
    words.push({
      ...membership,
      progress: progressByWordId.get(membership.word_id) ?? null,
    });
    wordsByPackId.set(membership.pack_id, words);
  }

  const hydratedPacks = packs.map((pack) => ({
    ...pack,
    words: wordsByPackId.get(pack.pack_id) ?? [],
    progress: {
      reviewedCount: pack.reviewed_count,
      wordCount: pack.word_count,
      percent: Math.round((pack.reviewed_count / pack.word_count) * 100),
    },
  }));

  return packId
    ? json({ success: true, pack: hydratedPacks[0] })
    : json({ success: true, packs: hydratedPacks });
}

/** GET /api/vocab/packs[?packId=...] */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const packId = new URL(req.url).searchParams.get('packId')?.trim();
    if (packId !== undefined && !isValidString(packId, 500)) {
      return json({ success: false, error: 'Invalid packId.' }, 400);
    }

    return await loadPacks(auth.userId, packId);
  } catch (error: unknown) {
    console.error('[VocabPacks] GET failed:', error instanceof Error ? error.message : String(error));
    return json({ success: false, error: 'Failed to load vocabulary packs.' }, 500);
  }
}

/** PATCH /api/vocab/packs - Body: { packId, action: "continue" } */
export async function PATCH(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const body = (await req.json()) as Record<string, unknown>;
    const packId = typeof body.packId === 'string' ? body.packId.trim() : '';
    if (!isValidString(packId, 500) || body.action !== 'continue') {
      return json({ success: false, error: 'packId and action "continue" are required.' }, 400);
    }

    const supabase = createServiceClient();
    const { data: existing, error: existingError } = await supabase
      .from('user_vocab_packs')
      .select('status, started_at')
      .eq('user_id', auth.userId)
      .eq('pack_id', packId)
      .maybeSingle();

    if (existingError) return databaseError(existingError, 'Load pack before continue failed');
    if (!existing) return json({ success: false, error: 'Vocabulary pack not found.' }, 404);
    if (existing.status === 'completed') {
      return json({ success: false, error: 'Completed vocabulary packs cannot be continued.' }, 409);
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('user_vocab_packs')
      .update({
        status: 'in_progress',
        started_at: existing.started_at ?? now,
        last_studied_at: now,
      })
      .eq('user_id', auth.userId)
      .eq('pack_id', packId)
      .neq('status', 'completed');

    if (updateError) return databaseError(updateError, 'Continue pack failed');
    return await loadPacks(auth.userId, packId);
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return json({ success: false, error: 'Invalid JSON body.' }, 400);
    }
    console.error('[VocabPacks] PATCH failed:', error instanceof Error ? error.message : String(error));
    return json({ success: false, error: 'Failed to continue vocabulary pack.' }, 500);
  }
}
