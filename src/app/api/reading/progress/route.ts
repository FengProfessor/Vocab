import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-security';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/reading/progress
 * Fetch progress for a single article or list of bookmarked/completed articles.
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser?.userId) {
      return NextResponse.json({ authenticated: false, progress: null, bookmarks: [] });
    }

    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get('article_id');
    const supabase = createServiceClient();

    if (articleId) {
      if (!UUID_REGEX.test(articleId)) {
        return NextResponse.json({ authenticated: true, progress: null });
      }

      const { data, error } = await supabase
        .from('user_reading_library_progress')
        .select('*')
        .eq('user_id', authUser.userId)
        .eq('article_id', articleId)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ authenticated: true, progress: null, error: error.message });
      }

      return NextResponse.json({ authenticated: true, progress: data });
    }

    // Return all bookmarks and recent progress for current user
    const { data: list, error: listError } = await supabase
      .from('user_reading_library_progress')
      .select('article_id, status, is_bookmarked, mcq_score, mcq_total, cloze_score, cloze_total, last_read_at')
      .eq('user_id', authUser.userId)
      .order('last_read_at', { ascending: false });

    if (listError) {
      return NextResponse.json({ authenticated: true, items: [], bookmarks: [] });
    }

    const bookmarks = (list || []).filter((r) => r.is_bookmarked).map((r) => r.article_id);
    return NextResponse.json({ authenticated: true, items: list || [], bookmarks });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch reading progress' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reading/progress
 * Upsert reading progress, bookmark, or quiz completion.
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser?.userId) {
      return NextResponse.json(
        { success: false, reason: 'unauthenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      article_id,
      status = 'in_progress',
      is_bookmarked,
      mcq_score,
      mcq_total,
      cloze_score,
      cloze_total,
      reading_time_seconds,
      user_notes,
    } = body;

    if (!article_id || !UUID_REGEX.test(article_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing article_id' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check existing
    const { data: existing } = await supabase
      .from('user_reading_library_progress')
      .select('*')
      .eq('user_id', authUser.userId)
      .eq('article_id', article_id)
      .maybeSingle();

    const readCount = (existing?.read_count || 0) + 1;
    const now = new Date().toISOString();

    const payload: Record<string, any> = {
      user_id: authUser.userId,
      article_id,
      status: status || existing?.status || 'in_progress',
      read_count: readCount,
      last_read_at: now,
      updated_at: now,
    };

    if (typeof is_bookmarked === 'boolean') {
      payload.is_bookmarked = is_bookmarked;
    }
    if (typeof mcq_score === 'number') {
      payload.mcq_score = mcq_score;
      payload.mcq_total = typeof mcq_total === 'number' ? mcq_total : existing?.mcq_total || 0;
    }
    if (typeof cloze_score === 'number') {
      payload.cloze_score = cloze_score;
      payload.cloze_total = typeof cloze_total === 'number' ? cloze_total : existing?.cloze_total || 0;
    }
    if (typeof reading_time_seconds === 'number') {
      payload.reading_time_seconds = (existing?.reading_time_seconds || 0) + reading_time_seconds;
    }
    if (typeof user_notes === 'string') {
      payload.user_notes = user_notes;
    }

    const { data, error } = await supabase
      .from('user_reading_library_progress')
      .upsert(payload, { onConflict: 'user_id,article_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, progress: data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save reading progress' },
      { status: 500 }
    );
  }
}
