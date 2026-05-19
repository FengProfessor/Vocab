import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/** GET /api/grammar/topics — danh sách lộ trình chủ đề ngữ pháp + số bài học. */
export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('grammar_topics')
      .select('*, grammar_lessons(count)')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;

    const topics = (data || []).map((t: any) => {
      const { grammar_lessons, ...rest } = t;
      return { ...rest, lessonCount: grammar_lessons?.[0]?.count ?? 0 };
    });
    return NextResponse.json({ success: true, data: topics });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** POST /api/grammar/topics — tạo/cập nhật 1 chủ đề (teacher). */
export async function POST(req: Request) {
  try {
    const { slug, title, title_vi, level = 'beginner', order_index = 0, parent_id = null } =
      await req.json();
    if (!slug || !title) {
      return NextResponse.json({ error: 'slug and title are required' }, { status: 400 });
    }
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('grammar_topics')
      .upsert({ slug, title, title_vi, level, order_index, parent_id }, { onConflict: 'slug' })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
