import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { safeErrorResponse } from '@/lib/api-security';

export async function GET(req: Request): Promise<NextResponse> {
  try {
    // ── Auth: check BOT_SECRET ──
    const botSecret = process.env.BOT_SECRET;
    const authHeader = req.headers.get('authorization');
    if (!botSecret || authHeader !== `Bearer ${botSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Fetch all lessons
    const { data: lessons, error: fetchErr } = await supabase
      .from('grammar_lessons')
      .select('id, topic_id, title, order_index, theory_vi, examples, sections, exercises, grammar_topics(slug, title, title_vi, level)');

    if (fetchErr) throw fetchErr;

    // Filter to find the first lesson that has < 100 exercises
    const sorted = (lessons || []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    const target = sorted.find((l) => !l.exercises || !Array.isArray(l.exercises) || l.exercises.length < 100);
    const remaining = sorted.filter((l) => !l.exercises || !Array.isArray(l.exercises) || l.exercises.length < 100).length;

    if (!target) {
      return NextResponse.json({ success: true, finished: true, remaining: 0 });
    }

    const topic = target.grammar_topics as any;
    const topicSlug = topic?.slug ?? '';
    const topicTitle = topic?.title ?? '';
    const topicTitleVi = topic?.title_vi ?? '';
    const topicLevel = topic?.level ?? 'beginner';

    return NextResponse.json({
      success: true,
      finished: false,
      lessonId: target.id,
      slug: topicSlug,
      title: topicTitle,
      title_vi: topicTitleVi,
      level: topicLevel,
      order: target.order_index,
      sections: target.sections || {},
      exercises: target.exercises || [],
      remaining,
    });

  } catch (e: unknown) {
    return safeErrorResponse(e, 'Failed to get next grammar lesson');
  }
}
