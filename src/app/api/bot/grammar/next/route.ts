import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { safeErrorResponse } from '@/lib/api-security';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown, key: string, fallback = ''): string {
  if (!isRecord(value)) return fallback;
  const property = value[key];
  return typeof property === 'string' ? property : fallback;
}

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

    // Read query parameters for sharding
    const { searchParams } = new URL(req.url);
    let shard = parseInt(searchParams.get('shard') || '0', 10);
    let shards = parseInt(searchParams.get('shards') || '1', 10);
    if (isNaN(shard) || shard < 0) shard = 0;
    if (isNaN(shards) || shards < 1) shards = 1;
    if (shard >= shards) shard = shards - 1;

    // Filter to find the first lesson that has < 100 exercises
    const sorted = (lessons || []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    const incomplete = sorted.filter((l) => !l.exercises || !Array.isArray(l.exercises) || l.exercises.length < 100);

    let target;
    let remaining;

    if (shards > 1) {
      // Deterministic partitioning
      target = incomplete.find((_, idx) => idx % shards === shard);
      remaining = incomplete.filter((_, idx) => idx % shards === shard).length;
    } else {
      // Self-balancing: random pull from the shared pool of incomplete lessons
      if (incomplete.length > 0) {
        const shuffled = [...incomplete];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        target = shuffled[0];
        remaining = shuffled.length;
      } else {
        target = undefined;
        remaining = 0;
      }
    }

    if (!target) {
      return NextResponse.json({ success: true, finished: true, remaining: 0 });
    }

    const topic: unknown = target.grammar_topics;
    const topicSlug = getString(topic, 'slug');
    const topicTitle = getString(topic, 'title');
    const topicTitleVi = getString(topic, 'title_vi');
    const topicLevel = getString(topic, 'level', 'beginner');

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
