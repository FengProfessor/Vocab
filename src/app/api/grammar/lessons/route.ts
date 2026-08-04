import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import type { GrammarExample } from '@/lib/supabase';
import { getAuthUser, unauthorized, getClientIp, safeErrorResponse } from '@/lib/api-security';
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

    // Single/topic = nội dung tĩnh (lý thuyết + ví dụ đã bake) → cho CDN + SWR cache.
    // Bulk list = private (no-store) để giảm scrape kho IP. Admin sửa lesson trễ ~1h (chấp nhận được).
    const CACHEABLE = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };
    const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

    if (id) {
      const { data, error } = await supabase
        .from('grammar_lessons')
        .select('*, topic:grammar_topics(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, data }, { headers: CACHEABLE });
    }

    // Join topic khi lọc theo topicId — client lộ trình cần topic.slug để ghi step
    let query = supabase
      .from('grammar_lessons')
      .select(topicId ? '*, topic:grammar_topics(*)' : '*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });
    if (topicId) query = query.eq('topic_id', topicId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data }, { headers: topicId ? CACHEABLE : NO_STORE });
  } catch (e: unknown) {
    return safeErrorResponse(e, 'Server error');
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
    return safeErrorResponse(e, 'Server error');
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
    const admin = await isAdmin(auth.userId);
    if (!isAnnotationOnly && !admin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }
    const { lessonId, examples } = body;
    if (!lessonId || !Array.isArray(examples)) {
      return NextResponse.json({ success: false, error: 'lessonId and examples are required' }, { status: 400 });
    }
    const supabase = createServiceClient();

    // `grammar_lessons` là nội dung dùng chung toàn hệ thống. User thường CHỈ được
    // cache annotation (màu hoá POS) — KHÔNG được thay/xoá câu ví dụ gốc.
    // Chống vandalism: merge riêng field `annotations` lên examples đã lưu (khớp theo `en`),
    // bỏ qua mọi en/vi/note client gửi. Chỉ admin mới được ghi đè toàn bộ.
    if (!admin) {
      const { data: current, error: readErr } = await supabase
        .from('grammar_lessons')
        .select('examples')
        .eq('id', lessonId)
        .single();
      if (readErr) throw readErr;
      const stored = (current?.examples ?? []) as GrammarExample[];
      const incoming = new Map<string, GrammarExample['annotations']>();
      for (const ex of examples) {
        if (ex && typeof ex.en === 'string' && Array.isArray(ex.annotations)) {
          incoming.set(ex.en.trim(), ex.annotations);
        }
      }
      const merged = stored.map((ex) => {
        const ann = incoming.get((ex.en ?? '').trim());
        return ann ? { ...ex, annotations: ann } : ex;
      });
      const { data, error } = await supabase
        .from('grammar_lessons')
        .update({ examples: merged })
        .eq('id', lessonId)
        .select('id, examples')
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    const { data, error } = await supabase
      .from('grammar_lessons')
      .update({ examples })
      .eq('id', lessonId)
      .select('id, examples')
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    return safeErrorResponse(e, 'Server error');
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
    return safeErrorResponse(e, 'Server error');
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
    return safeErrorResponse(e, 'Server error');
  }
}
