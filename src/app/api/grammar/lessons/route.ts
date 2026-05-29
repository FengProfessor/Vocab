import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import type { GrammarExample } from '@/lib/supabase';

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
    const supabase = createServiceClient();

    if (id) {
      const { data, error } = await supabase
        .from('grammar_lessons')
        .select('*, topic:grammar_topics(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    let query = supabase
      .from('grammar_lessons')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });
    if (topicId) query = query.eq('topic_id', topicId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/** POST /api/grammar/lessons — tạo bài học mới (teacher). */
export async function POST(req: Request) {
  try {
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
    const body = await req.json() as { lessonId?: string; examples?: GrammarExample[] };
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

/** PUT /api/grammar/lessons — cập nhật 1 bài học (teacher). */
export async function PUT(req: Request) {
  try {
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
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/** DELETE /api/grammar/lessons?id=<lessonId> — xoá 1 bài học (teacher). */
export async function DELETE(req: Request) {
  try {
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
