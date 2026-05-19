import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
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
      return NextResponse.json({ error: 'topic_id and title are required' }, { status: 400 });
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** PUT /api/grammar/lessons — cập nhật 1 bài học (teacher). */
export async function PUT(req: Request) {
  try {
    const { id, ...fields } = await req.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('grammar_lessons')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
