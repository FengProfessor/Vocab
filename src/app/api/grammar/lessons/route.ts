import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import type { GrammarExample } from '@/lib/supabase';
import { getAuthUser, unauthorized, getClientIp } from '@/lib/api-security';
import { assertScrapeQuota, QUOTA } from '@/lib/anti-scrape';

/** Chỉ admin trong whitelist mới được tạo/sửa/xoá lesson. */
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

async function isAdmin(userId: string): Promise<boolean> {
  if (ADMIN_EMAILS.size === 0) return false;

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  const email = data.user?.email?.trim().toLowerCase();
  return !error && Boolean(email && ADMIN_EMAILS.has(email));
}

/**
 * GET /api/grammar/lessons
 *   ?id=<lessonId>     → 1 bài học (kèm topic)
 *   ?topicId=<topicId> → các bài học của 1 chủ đề
 *   (không tham số)    → tất cả bài học
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const topicId = searchParams.get('topicId');

    // Chống scrape bulk: multi-window RL + bulk không CDN
    const ip = getClientIp(req);
    const isBulkList = !id && !topicId;
    const denied = await assertScrapeQuota(
      isBulkList ? `grammar-lessons-bulk:${ip}` : `grammar-lessons:${ip}`,
      isBulkList ? QUOTA.grammarBulk : QUOTA.grammarTopic,
    );
    if (denied) return denied;

    const supabase = createServiceClient();

    // Single/topic: CDN OK. Bulk list: private — giảm scrape kho IP
    const CACHE_HEADERS = isBulkList
      ? { 'Cache-Control': 'private, no-store' }
      : { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' };

    if (id) {
      const { data, error } = await supabase
        .from('grammar_lessons')
        .select('*, topic:grammar_topics(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, data }, { headers: CACHE_HEADERS });
    }

    let query = supabase
      .from('grammar_lessons')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });
    if (topicId) query = query.eq('topic_id', topicId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data }, { headers: CACHE_HEADERS });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

/** POST /api/grammar/lessons — tạo bài học mới (admin). */
export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (!(await isAdmin(auth.userId))) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }
    const body = await req.json();
    const {
      topic_id,
      title,
      theory,
      theory_vi,
      examples = [],
      image_url,
      source = 'manual',
      source_url,
      order_index = 0,
      created_by,
    } = body;
    if (!topic_id || !title) {
      return NextResponse.json({ success: false, error: 'topic_id and title are required' }, { status: 400 });
    }
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('grammar_lessons')
      .insert({
        topic_id,
        title,
        theory,
        theory_vi,
        examples,
        image_url,
        source,
        source_url,
        order_index,
        created_by,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/grammar/lessons
 * Body: { lessonId: string, examples: GrammarExample[] }
 * Cache annotations vào DB — bypass RLS vì đây là write nội bộ.
 */
export async function PATCH(req: Request) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const body = await req.json() as { lessonId?: string; examples?: GrammarExample[] };
    // User thường chỉ được persist annotation: body đúng 2 field { lessonId, examples }.
    // Body chạm field khác → bắt buộc admin trong whitelist.
    const keys = Object.keys(body);
    const isAnnotationOnly = keys.length === 2 && keys.includes('lessonId') && keys.includes('examples');
    if (!isAnnotationOnly && !(await isAdmin(auth.userId))) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }
    const { lessonId, examples } = body;
    if (!lessonId || !Array.isArray(examples)) {
      return NextResponse.json({ success: false, error: 'lessonId and examples are required' }, { status: 400 });
    }
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('grammar_lessons')
      .update({ examples })
      .eq('id', lessonId)
      .select('id, examples')
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** PUT /api/grammar/lessons — cập nhật 1 bài học (admin). */
export async function PUT(req: Request) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (!(await isAdmin(auth.userId))) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }
    const { id, ...fields } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('grammar_lessons')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    // Nội dung lesson đổi → xoá quiz cache cũ để lần sau sinh lại theo nội dung mới
    await supabase.from('grammar_quiz_cache').delete().eq('lesson_id', id);
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/** DELETE /api/grammar/lessons?id=<lessonId> — xoá 1 bài học (admin). */
export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (!(await isAdmin(auth.userId))) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }
    const supabase = createServiceClient();
    const { error } = await supabase.from('grammar_lessons').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
