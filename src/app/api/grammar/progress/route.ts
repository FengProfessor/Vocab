import { sessionErrorResponse } from '@/lib/session-response';
import { getWebUser } from '@/lib/server-auth-session';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { FSRSRating } from '@/lib/srs';
import { scheduleNext, stateToText, textToState } from '@/lib/fsrs';
import { creditGrammarLessonToRoadmap } from '@/lib/roadmap-credit';
import { cacheGet, cacheSet, cacheDelete } from '@/lib/ttl-cache';

import { UNIFIED_GRAMMAR_TOPICS } from '@/lib/grammar-roadmap-data';

const GRAMMAR_SUMMARY_TTL_MS = 30_000;
const GRAMMAR_LESSONS_TTL_MS = 10 * 60_000;
const GRAMMAR_FALLBACK_PROGRESS_TTL_MS = 30 * 24 * 60 * 60_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Map độ chính xác bài tập (0-1) → rating FSRS. */
function accuracyToRating(acc: number): FSRSRating {
  if (acc >= 0.9) return 4; // Easy
  if (acc >= 0.7) return 3; // Good
  if (acc >= 0.5) return 2; // Hard
  return 1; // Again
}

/** Kiểu trả về cho view=topics (hỗ trợ cả camelCase và snake_case cho client) */
export interface TopicProgressSummary {
  topicId: string;
  topic_id: string;
  topicSlug: string;
  topic_slug: string;
  title: string;
  titleVi: string | null;
  level: string;
  totalLessons: number;
  total_lessons: number;
  /** Số bài đã từng học (có hàng grammar_progress) — dùng để tick "đã hoàn thành". */
  learnedLessons: number;
  completed_lessons: number;
  /** Số bài mastery_score ≥ 80 hoặc state=mastered. */
  masteredLessons: number;
  mastered_lessons: number;
  avgMasteryScore: number;
  accuracy: number;
  nextDueDate: string | null;
  next_due_date: string | null;
}

/** GET /api/grammar/progress — tiến độ học grammar của user hiện tại (auth required).
 *  ?view=topics → trả TopicProgressSummary[] thay vì GrammarProgress[]
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const supabase = createServiceClient();
    const { data: { user }, error: authError } = await getWebUser(req);
    if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    const url = new URL(req.url);
    const view = url.searchParams.get('view');
    const summaryOnly = url.searchParams.get('summary') === '1';

    // ── summary=1: chỉ đếm bài due (nhẹ cho shell/dashboard, cache 30s) ──
    if (summaryOnly) {
      const summaryKey = `grammar:summary:${userId}`;
      const cachedDue = cacheGet<number>(summaryKey);
      if (cachedDue !== undefined) {
        return NextResponse.json({ success: true, data: [], dueCount: cachedDue });
      }
      const nowIso = new Date().toISOString();
      const { count: dueCount, error: dueErr } = await supabase
        .from('grammar_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lte('next_review_date', nowIso);
      if (dueErr) throw dueErr;
      const resolvedDue = dueCount || 0;
      cacheSet(summaryKey, resolvedDue, GRAMMAR_SUMMARY_TTL_MS);
      return NextResponse.json({ success: true, data: [], dueCount: resolvedDue });
    }

    // ── view=topics: trả summary theo từng topic ──
    if (view === 'topics') {
      type LessonWithTopic = { id: string; topic_id: string; topic: unknown };
      const cachedLessons = cacheGet<LessonWithTopic[]>('grammar:lessons:all:v2');

      const [lessonsRes, progressRes] = await Promise.all([
        cachedLessons
          ? Promise.resolve({ data: cachedLessons, error: null })
          : supabase
              .from('grammar_lessons')
              .select('id, topic_id, topic:grammar_topics(id, slug, title, title_vi, level, order_index)'),
        supabase
          .from('grammar_progress')
          .select('lesson_id, state, mastery_score, next_review_date')
          .eq('user_id', userId),
      ]);

      if (lessonsRes.error) throw lessonsRes.error;
      if (progressRes.error) throw progressRes.error;

      const lessons = lessonsRes.data ?? [];
      if (!cachedLessons && lessons.length > 0) {
        cacheSet('grammar:lessons:all:v2', lessons, GRAMMAR_LESSONS_TTL_MS);
      }
      const progressRows = progressRes.data;

      const progressByLesson = new Map<string, { state: string; mastery_score: number; next_review_date: string }>();
      for (const p of progressRows ?? []) {
        progressByLesson.set(p.lesson_id, p);
      }

      // Group lessons theo topic
      const topicMap = new Map<string, {
        slug: string;
        title: string;
        titleVi: string | null;
        level: string;
        orderIndex: number;
        lessonIds: string[];
      }>();

      for (const lesson of lessons ?? []) {
        const t = lesson.topic as unknown as {
          id: string;
          slug?: string | null;
          title: string;
          title_vi: string | null;
          level: string;
          order_index: number | null;
        } | null;
        if (!t) continue;
        if (!topicMap.has(t.id)) {
          const matchedUnified = UNIFIED_GRAMMAR_TOPICS.find(
            (ut) => ut.slug === t.slug || ut.title.toLowerCase() === t.title.toLowerCase(),
          );
          topicMap.set(t.id, {
            slug: t.slug || matchedUnified?.slug || t.id,
            title: t.title,
            titleVi: t.title_vi,
            level: t.level,
            orderIndex: t.order_index ?? matchedUnified?.order ?? 0,
            lessonIds: [],
          });
        }
        topicMap.get(t.id)!.lessonIds.push(lesson.id);
      }

      const now = Date.now();
      const summaries: TopicProgressSummary[] = [];
      const seenSlugs = new Set<string>();

      for (const [topicId, info] of topicMap) {
        const total = info.lessonIds.length;
        let learned = 0;
        let mastered = 0;
        let scoreSum = 0;
        let scored = 0;
        let nextDue: string | null = null;

        for (const lid of info.lessonIds) {
          const p = progressByLesson.get(lid);
          if (!p) continue;
          learned++;
          if (p.state === 'mastered' || p.mastery_score >= 80) mastered++;
          scoreSum += p.mastery_score;
          scored++;
          if (new Date(p.next_review_date).getTime() <= now) {
            if (!nextDue || new Date(p.next_review_date) < new Date(nextDue)) {
              nextDue = p.next_review_date;
            }
          }
        }

        const avgScore = scored > 0 ? Math.round(scoreSum / scored) : 0;
        seenSlugs.add(info.slug);
        summaries.push({
          topicId,
          topic_id: topicId,
          topicSlug: info.slug,
          topic_slug: info.slug,
          title: info.title,
          titleVi: info.titleVi,
          level: info.level,
          totalLessons: total,
          total_lessons: total,
          learnedLessons: learned,
          completed_lessons: learned,
          masteredLessons: mastered,
          mastered_lessons: mastered,
          avgMasteryScore: avgScore,
          accuracy: avgScore,
          nextDueDate: nextDue,
          next_due_date: nextDue,
        });
      }

      // Merge fallback progress cho các topic chưa có lesson row trong DB (vd: #00 sentence-structure-svo)
      const fallbackMap = cacheGet<Record<string, TopicProgressSummary>>(`grammar:topic_progress:${userId}`) || {};
      for (const [slug, fb] of Object.entries(fallbackMap)) {
        if (!seenSlugs.has(slug)) {
          summaries.push(fb);
        } else {
          const idx = summaries.findIndex((s) => s.topicSlug === slug);
          if (idx !== -1 && summaries[idx].learnedLessons === 0 && fb.learnedLessons > 0) {
            summaries[idx] = fb;
          }
        }
      }

      summaries.sort((a, b) => {
        const aOrder = topicMap.get(a.topicId)?.orderIndex ?? 0;
        const bOrder = topicMap.get(b.topicId)?.orderIndex ?? 0;
        return aOrder - bOrder;
      });

      return NextResponse.json({ success: true, data: summaries });
    }

    // ── default: trả flat GrammarProgress[] (backward compat) ──
    const { data, error } = await supabase
      .from('grammar_progress')
      .select('*, lesson:grammar_lessons(id, title, topic_id)')
      .eq('user_id', userId);
    if (error) throw error;

    const now = Date.now();
    const dueCount = ((data || []) as { next_review_date: string }[]).filter(
      (p) => new Date(p.next_review_date).getTime() <= now
    ).length;
    return NextResponse.json({ success: true, data: data || [], dueCount });
  } catch (e: unknown) {
    const sessionFailure = sessionErrorResponse(e);
    if (sessionFailure) return sessionFailure;
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/grammar/progress  Body: { lessonId?, topicSlug?, accuracy }
 * Cập nhật SRS sau khi học xong 1 bài (accuracy = độ chính xác bài tập 0-1 hoặc 0-100).
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    // userId BẮT BUỘC lấy từ JWT đã verify — KHÔNG nhận từ body (chống IDOR)
    const supabase = createServiceClient();
    const { data: { user }, error: authError } = await getWebUser(req);
    if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    const body = await req.json();
    const rawLessonId =
      typeof body.lessonId === 'string'
        ? body.lessonId.trim()
        : typeof body.lesson_id === 'string'
          ? body.lesson_id.trim()
          : '';
    const rawTopicSlug =
      typeof body.topicSlug === 'string'
        ? body.topicSlug.trim()
        : typeof body.topic_slug === 'string'
          ? body.topic_slug.trim()
          : '';
    const rawAccuracy =
      typeof body.accuracy === 'number'
        ? body.accuracy
        : typeof body.masteryLevel === 'number'
          ? body.masteryLevel
          : typeof body.mastery_level === 'number'
            ? body.mastery_level
            : body.isCompleted === true || body.is_completed === true
              ? 1
              : undefined;

    if ((!rawLessonId && !rawTopicSlug) || typeof rawAccuracy !== 'number') {
      return NextResponse.json(
        { success: false, error: 'lessonId/lesson_id or topicSlug/topic_slug, and accuracy/mastery_level (number) are required' },
        { status: 400 }
      );
    }

    const normalizedAcc = rawAccuracy > 1 ? Math.max(0, Math.min(1, rawAccuracy / 100)) : Math.max(0, Math.min(1, rawAccuracy));
    let resolvedLessonId = UUID_RE.test(rawLessonId) ? rawLessonId : '';
    const candidateSlug = rawTopicSlug || (!resolvedLessonId ? rawLessonId : '');

    if (!resolvedLessonId && candidateSlug) {
      // Tìm topic theo slug trong DB
      const { data: topicRow } = await supabase
        .from('grammar_topics')
        .select('id, slug')
        .eq('slug', candidateSlug)
        .maybeSingle();

      if (topicRow?.id) {
        const { data: lessonRow } = await supabase
          .from('grammar_lessons')
          .select('id')
          .eq('topic_id', topicRow.id)
          .order('order_index', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (lessonRow?.id) {
          resolvedLessonId = lessonRow.id;
        }
      }
    }

    const rating = accuracyToRating(normalizedAcc);

    // Nếu topic hợp lệ trong UNIFIED_GRAMMAR_TOPICS nhưng chưa có lesson UUID trong DB
    if (!resolvedLessonId) {
      const unifiedMeta = UNIFIED_GRAMMAR_TOPICS.find((t) => t.slug === candidateSlug);
      const next = scheduleNext(null, rating);
      const currentScore = Math.round(normalizedAcc * 100);
      const state = currentScore >= 80 ? 'mastered' : stateToText(next.state);
      const isDueNow = new Date(next.next_review_date).getTime() <= Date.now();

      const fallbackKey = `grammar:topic_progress:${userId}`;
      const existingFallback = cacheGet<Record<string, TopicProgressSummary>>(fallbackKey) || {};
      existingFallback[candidateSlug] = {
        topicId: candidateSlug,
        topic_id: candidateSlug,
        topicSlug: candidateSlug,
        topic_slug: candidateSlug,
        title: unifiedMeta?.title || candidateSlug,
        titleVi: unifiedMeta?.title_vi || null,
        level: unifiedMeta?.level || 'A1',
        totalLessons: 1,
        total_lessons: 1,
        learnedLessons: 1,
        completed_lessons: 1,
        masteredLessons: currentScore >= 80 ? 1 : 0,
        mastered_lessons: currentScore >= 80 ? 1 : 0,
        avgMasteryScore: currentScore,
        accuracy: currentScore,
        nextDueDate: isDueNow ? next.next_review_date : null,
        next_due_date: isDueNow ? next.next_review_date : null,
      };
      cacheSet(fallbackKey, existingFallback, GRAMMAR_FALLBACK_PROGRESS_TTL_MS);

      return NextResponse.json({
        success: true,
        data: {
          user_id: userId,
          lesson_id: candidateSlug,
          topic_slug: candidateSlug,
          state,
          mastery_score: currentScore,
          next_review_date: next.next_review_date,
        },
        roadmapCredited: 0,
      });
    }

    const { data: existing } = await supabase
      .from('grammar_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', resolvedLessonId)
      .maybeSingle();

    const prev = existing
      ? {
          stability: existing.stability,
          difficulty: existing.difficulty,
          interval_days: existing.interval_days,
          review_count: existing.review_count,
          state: textToState(existing.state),
          lapses: existing.lapses,
          learning_steps: existing.learning_steps,
          next_review_date: existing.next_review_date,
          last_reviewed_at: existing.last_reviewed_at,
        }
      : null;
    const next = scheduleNext(prev, rating);

    const currentScore = Math.round(normalizedAcc * 100);
    const oldScore = existing?.mastery_score;
    const masteryScore =
      typeof oldScore === 'number'
        ? currentScore >= oldScore || currentScore >= 80
          ? currentScore
          : Math.round(0.5 * currentScore + 0.5 * oldScore)
        : currentScore;
    const state = masteryScore >= 80 ? 'mastered' : stateToText(next.state);

    const { data, error } = await supabase
      .from('grammar_progress')
      .upsert(
        {
          user_id: userId,
          lesson_id: resolvedLessonId,
          stability: next.stability,
          difficulty: next.difficulty,
          interval_days: next.interval_days,
          review_count: next.review_count,
          lapses: next.lapses,
          learning_steps: next.learning_steps,
          next_review_date: next.next_review_date,
          last_reviewed_at: next.last_reviewed_at,
          state,
          mastery_score: masteryScore,
        },
        { onConflict: 'user_id,lesson_id' }
      )
      .select()
      .single();
    if (error) throw error;
    cacheDelete(`grammar:summary:${userId}`);

    // Học ngoài lộ trình (không ?roadmapStep) vẫn đánh tick step grammar cùng topic
    let roadmapCredited = 0;
    try {
      const credit = await creditGrammarLessonToRoadmap(supabase, userId, resolvedLessonId);
      roadmapCredited = credit.creditedStepIds.length;
    } catch (creditErr) {
      const sessionFailure = sessionErrorResponse(creditErr);
      if (sessionFailure) return sessionFailure;
      console.error('[GrammarProgress] roadmap credit failed:', creditErr);
    }

    return NextResponse.json({
      success: true,
      data,
      roadmapCredited,
    });
  } catch (e: unknown) {
    const sessionFailure = sessionErrorResponse(e);
    if (sessionFailure) return sessionFailure;
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

