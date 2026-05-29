import { NextResponse } from 'next/server';
import { createServiceClient, type GrammarTopic } from '@/lib/supabase';

type GrammarTopicJoined = GrammarTopic & { grammar_lessons?: { count: number }[] };

/** GET /api/grammar/topics — danh sách lộ trình chủ đề ngữ pháp + số bài học. */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('grammar_topics')
      .select('*, grammar_lessons(count)')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;

    const LEVEL_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
    const topics = ((data || []) as GrammarTopicJoined[])
      .map((t) => {
        const { grammar_lessons, ...rest } = t;
        return { ...rest, lessonCount: grammar_lessons?.[0]?.count ?? 0 };
      })
      .sort((a, b) => {
        const lvDiff = (LEVEL_ORDER[a.level] ?? 1) - (LEVEL_ORDER[b.level] ?? 1);
        if (lvDiff !== 0) return lvDiff;
        return (a.order_index ?? 0) - (b.order_index ?? 0);
      });
    return NextResponse.json(
      { success: true, data: topics },
      {
        headers: {
          // Dữ liệu chủ đề ít thay đổi → cache CDN 1h, stale-while-revalidate 24h
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/** POST /api/grammar/topics — tạo/cập nhật 1 chủ đề (teacher). */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { slug, title, title_vi, level = 'beginner', order_index = 0, parent_id = null } =
      await req.json();
    if (!slug || !title) {
      return NextResponse.json({ success: false, error: 'slug and title are required' }, { status: 400 });
    }
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('grammar_topics')
      .upsert({ slug, title, title_vi, level, order_index, parent_id }, { onConflict: 'slug' })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
