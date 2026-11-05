import {
  apiDelete,
  apiPut,
  callDotNetRaw,
  LegacyRequestOptions,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import { mapClassroomsList } from '@/features/classroom/mappers';

function parseQueryParams(input: string): URLSearchParams {
  const qIdx = input.indexOf('?');
  return new URLSearchParams(qIdx >= 0 ? input.slice(qIdx + 1) : '');
}

function safeParseJson<T = unknown>(raw?: unknown): T | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function mapStudentProgress(s: Record<string, unknown>) {
  const latestQuiz = s.latestQuiz as Record<string, unknown> | null | undefined;
  const fullName = s.fullName ? String(s.fullName) : null;
  const email = String(s.email ?? '');
  return {
    student_id: String(s.studentId ?? s.student_id ?? ''),
    email,
    full_name: fullName,
    student_name: fullName || (email ? email.split('@')[0] : 'Học sinh'),
    avatar_url: s.avatarUrl ? String(s.avatarUrl) : null,
    classroom_id: String(s.classroomId ?? s.classroom_id ?? ''),
    classroom_name: String(s.classroomName ?? s.classroom_name ?? ''),
    total_words_learned: Number(s.totalWordsLearned ?? 0),
    words_due: Number(s.wordsDue ?? 0),
    avg_ease_factor: Number(s.avgEaseFactor ?? 2.5),
    total_reviews: Number(s.totalReviews ?? 0),
    last_study_at: s.lastStudyAt ? String(s.lastStudyAt) : null,
    last_active: s.trueLastActive ? String(s.trueLastActive) : s.lastStudyAt ? String(s.lastStudyAt) : null,
    vms: Number(s.vms ?? 0),
    active_vms: Number(s.activeVms ?? 0),
    lcs: Number(s.lcs ?? 0),
    communicative_depth: Number(s.communicativeDepth ?? 0),
    cefr_level: String(s.cefrLevel || 'A1') as 'A1' | 'A2' | 'B1' | 'B2' | 'C1',
    true_last_active: s.trueLastActive ? String(s.trueLastActive) : null,
    latest_quiz: latestQuiz
      ? {
          score: Number(latestQuiz.score ?? 0),
          total_questions: Number(latestQuiz.totalQuestions ?? 0),
          quiz_type: String(latestQuiz.quizType ?? 'multiple_choice'),
          completed_at: String(latestQuiz.completedAt ?? ''),
        }
      : null,
    saved_words_count: Number(s.savedWordsCount ?? 0),
    plan: String(s.plan || 'free'),
    plan_expires_at: s.planExpiresAt ? String(s.planExpiresAt) : null,
    joined_at: s.joinedAt ? String(s.joinedAt) : undefined,
  };
}

function mapConceptState(c: Record<string, unknown>) {
  return {
    concept_id: String(c.conceptId ?? c.concept_id ?? ''),
    lemma: String(c.lemma ?? ''),
    meaning_vi: String(c.meaningVi ?? c.meaning_vi ?? ''),
    cluster: String(c.cluster ?? ''),
    stage: Number(c.stage ?? 1),
    generative_power: Number(c.generativePower ?? c.generative_power ?? 50),
    status_bucket: String(c.statusBucket ?? c.status_bucket ?? 'UNCERTAIN') as
      | 'STABLE'
      | 'FRAGILE'
      | 'MISSING'
      | 'UNCERTAIN',
    active_gap: String(c.activeGap ?? c.active_gap ?? 'UNKNOWN_CONCEPT_OR_FORM'),
    sound_recognition: Boolean(c.soundRecognition ?? c.sound_recognition),
    text_recognition: Boolean(c.textRecognition ?? c.text_recognition),
    meaning_recall: Boolean(c.meaningRecall ?? c.meaning_recall),
    form_recall: Boolean(c.formRecall ?? c.form_recall),
    chunk_use: Boolean(c.chunkUse ?? c.chunk_use),
    generative_use: Boolean(c.generativeUse ?? c.generative_use),
    uncertainty_score: Number(c.uncertaintyScore ?? c.uncertainty_score ?? 1),
    consecutive_independent_passes: Number(
      c.consecutiveIndependentPasses ?? c.consecutive_independent_passes ?? 0,
    ),
    last_probed_at: c.lastProbedAt ? String(c.lastProbedAt) : null,
    audio_url: c.audioUrl ? String(c.audioUrl) : null,
    image_url: c.imageUrl ? String(c.imageUrl) : null,
    target_chunks: Array.isArray(c.targetChunks) ? c.targetChunks.map(String) : [],
  };
}

/**
 * Domain API service for Classrooms, Teacher Analytics, Student Enrollment, and Drill Assignments.
 */
export class ClassroomApi {
  /**
   * Lists classrooms for the authenticated student or teacher via `GET /api/v1/classrooms`.
   */
  public static async getClassrooms() {
    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>[]>('/classrooms', {
      method: 'GET',
    });
    const payload = mapClassroomsList(body?.data);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Creates a new classroom via `POST /api/v1/classrooms`.
   */
  public static async createClassroom(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, unknown>>(
      '/classrooms',
      {
        method: 'POST',
        data: {
          name: body.name,
          description: body.description || '',
        },
      },
    );
    return withResponseCompat(
      {
        success: ok,
        data: resBody?.data,
        classroom: resBody?.data,
        error: resBody?.message,
      },
      status,
      ok,
    );
  }

  /**
   * Updates an existing classroom via `PUT /api/v1/classrooms/{classroomId}`.
   */
  public static async updateClassroom(
    classroomId: string,
    body: { name: string; description?: string },
  ) {
    return apiPut<Record<string, unknown>>(`/classrooms/${classroomId}`, {
      name: body.name,
      description: body.description || '',
    });
  }

  /**
   * Deletes a classroom via `DELETE /api/v1/classrooms/{classroomId}`.
   */
  public static async deleteClassroom(classroomId: string): Promise<boolean> {
    return apiDelete<boolean>(`/classrooms/${classroomId}`);
  }

  /**
   * Joins a classroom by invite code via `POST /api/v1/classrooms/join`.
   */
  public static async joinClassroom(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, unknown>>(
      '/classrooms/join',
      {
        method: 'POST',
        data: {
          inviteCode: body.inviteCode || body.invite_code || body.code || '',
        },
      },
    );
    return withResponseCompat(
      {
        success: ok,
        data: resBody?.data,
        classroom: resBody?.data,
        error: resBody?.message,
      },
      status,
      ok,
    );
  }

  /**
   * Assigns a vocabulary drill to classroom students via `POST /api/v1/classrooms/assign-drill`.
   */
  public static async assignDrill(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<number>(
      '/classrooms/assign-drill',
      {
        method: 'POST',
        data: body,
      },
    );
    const msg = resBody?.message ?? '';
    const colonIdx = msg.indexOf(':');
    const words =
      colonIdx >= 0
        ? msg
            .slice(colonIdx + 1)
            .split(',')
            .map((w) => w.trim())
            .filter(Boolean)
        : [];

    return withResponseCompat(
      {
        success: ok,
        count: typeof resBody?.data === 'number' ? resBody.data : 0,
        words,
        message: msg,
        error: ok ? undefined : msg || 'Không thể giao bài ôn tập.',
      },
      status,
      ok,
    );
  }

  /**
   * Retrieves the leaderboard for a classroom via `GET /api/v1/classrooms/{classroomId}/leaderboard`.
   */
  public static async getLeaderboard(classroomIdOrUrl: string, options?: LegacyRequestOptions) {
    let classroomId = classroomIdOrUrl;
    let period = 'all';
    if (classroomIdOrUrl.includes('?')) {
      const sp = parseQueryParams(classroomIdOrUrl);
      period = sp.get('period') || 'all';
      const pathPart = classroomIdOrUrl.split('?')[0];
      const segments = pathPart.split('/').filter(Boolean);
      const lbIdx = segments.indexOf('leaderboard');
      if (lbIdx > 0) {
        classroomId = segments[lbIdx - 1];
      } else {
        classroomId = pathPart;
      }
    }

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      `/classrooms/${encodeURIComponent(classroomId)}/leaderboard`,
      {
        method: 'GET',
        params: { period },
        headers: options?.headers,
        signal: options?.signal,
      },
    );

    const dto = (body?.data || {}) as Record<string, unknown>;
    return withResponseCompat(
      {
        success: ok,
        data: Array.isArray(dto.data) ? dto.data : [],
        period: String(dto.period ?? period),
        classroomName: String(dto.classroomName ?? ''),
      },
      status,
      ok,
    );
  }

  /**
   * Retrieves teacher classroom analytics via `GET /api/v1/classrooms/{classroomId}/analytics`.
   */
  public static async getTeacherAnalytics(classroomIdOrUrl: string) {
    const classroomId = classroomIdOrUrl.includes('?')
      ? parseQueryParams(classroomIdOrUrl).get('classroomId') || classroomIdOrUrl
      : classroomIdOrUrl;

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      `/classrooms/${encodeURIComponent(classroomId)}/analytics`,
      {
        method: 'GET',
      },
    );

    const dto = (body?.data || {}) as Record<string, unknown>;
    const mapSummary = (s: Record<string, unknown>) => ({
      student_id: String(s.studentId ?? ''),
      full_name: s.fullName ? String(s.fullName) : null,
      email: String(s.email ?? ''),
      avatar_url: s.avatarUrl ? String(s.avatarUrl) : null,
      words_learned: Number(s.wordsLearned ?? 0),
      words_due: Number(s.wordsDue ?? 0),
      total_reviews: Number(s.totalReviews ?? 0),
      mastery_pct: Number(s.masteryPct ?? 0),
      ease_pct: Number(s.easePct ?? 0),
      last_study_at: s.lastStudyAt ? String(s.lastStudyAt) : null,
      days_since_active: s.daysSinceActive !== null && s.daysSinceActive !== undefined ? Number(s.daysSinceActive) : null,
      is_active_7d: Boolean(s.isActive7d),
    });

    const rawTop = Array.isArray(dto.topStudents) ? (dto.topStudents as Record<string, unknown>[]) : [];
    const rawStruggling = Array.isArray(dto.strugglingStudents)
      ? (dto.strugglingStudents as Record<string, unknown>[])
      : [];
    const rawCoverage = Array.isArray(dto.wordCoverage)
      ? (dto.wordCoverage as Record<string, unknown>[])
      : [];
    const rawDiff = Array.isArray(dto.wordDifficulty)
      ? (dto.wordDifficulty as Record<string, unknown>[])
      : [];
    const rawFeed = Array.isArray(dto.activityFeed)
      ? (dto.activityFeed as Record<string, unknown>[])
      : [];

    return withResponseCompat(
      {
        success: ok,
        classStats: (dto.classStats as Record<string, unknown>) ?? {
          totalStudents: 0,
          active7d: 0,
          inactive7d: 0,
          totalWords: 0,
          avgWordsLearned: 0,
          totalReviews: 0,
          avgMasteryPct: 0,
          engagementRate: 0,
        },
        topStudents: rawTop.map(mapSummary),
        strugglingStudents: rawStruggling.map(mapSummary),
        wordCoverage: rawCoverage.map((w) => ({
          id: String(w.id ?? ''),
          word: String(w.word ?? ''),
          translation: String(w.translation ?? ''),
          pos: String(w.pos ?? ''),
          students_learned: Number(w.studentsLearned ?? 0),
          total_students: Number(w.totalStudents ?? 0),
          coverage_pct: Number(w.coveragePct ?? 0),
        })),
        wordDifficulty: rawDiff.map((w) => ({
          word_id: String(w.wordId ?? ''),
          word: String(w.word ?? ''),
          translation: String(w.translation ?? ''),
          pos: String(w.pos ?? ''),
          ipa: String(w.ipa ?? ''),
          student_count: Number(w.studentCount ?? 0),
          avg_stability: Number(w.avgStability ?? 0),
          avg_difficulty: Number(w.avgDifficulty ?? 0),
          total_reviews: Number(w.totalReviews ?? 0),
        })),
        activityFeed: rawFeed.map((a) => ({
          student_name: String(a.studentName ?? ''),
          student_avatar: a.studentAvatar ? String(a.studentAvatar) : null,
          word: String(a.word ?? ''),
          translation: String(a.translation ?? ''),
          interval_days: Number(a.intervalDays ?? 0),
          review_count: Number(a.reviewCount ?? 0),
          reviewed_at: String(a.reviewedAt ?? ''),
        })),
      },
      status,
      ok,
    );
  }

  /**
   * Retrieves teacher overview statistics via `GET /api/v1/classrooms/teacher-stats`.
   */
  public static async getTeacherStats(
    classroomIdOrUrl?: string | null,
    options?: LegacyRequestOptions,
  ) {
    const params: Record<string, unknown> = {};
    if (classroomIdOrUrl) {
      if (classroomIdOrUrl.includes('?')) {
        const sp = parseQueryParams(classroomIdOrUrl);
        const cid = sp.get('classroomId');
        if (cid) params.classroomId = cid;
      } else if (!classroomIdOrUrl.startsWith('/')) {
        params.classroomId = classroomIdOrUrl;
      }
    }

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      '/classrooms/teacher-stats',
      {
        method: 'GET',
        params,
        headers: options?.headers,
        signal: options?.signal,
      },
    );

    const dto = (body?.data || {}) as Record<string, unknown>;
    const rawClassrooms = Array.isArray(dto.classrooms)
      ? (dto.classrooms as Record<string, unknown>[])
      : [];
    const rawStudents = Array.isArray(dto.students)
      ? (dto.students as Record<string, unknown>[])
      : [];

    return withResponseCompat(
      {
        success: ok,
        classrooms: rawClassrooms.map((c) => ({
          id: String(c.id ?? ''),
          name: String(c.name ?? ''),
          description: c.description ? String(c.description) : null,
          invite_code: String(c.inviteCode ?? c.invite_code ?? ''),
          teacher_id: String(c.teacherId ?? c.teacher_id ?? ''),
          created_at: String(c.createdAt ?? c.created_at ?? ''),
          enrollment_count: Number(c.enrollmentCount ?? c.enrollment_count ?? 0),
        })),
        students: rawStudents.map(mapStudentProgress),
      },
      status,
      ok,
    );
  }

  /**
   * Retrieves detailed student telemetry for a classroom teacher via `GET /api/v1/classrooms/student-detail`.
   */
  public static async getStudentDetail(studentIdOrUrl: string, classroomId?: string) {
    let studentId = studentIdOrUrl;
    let resolvedClassroomId = classroomId || '';
    if (studentIdOrUrl.includes('?') && !classroomId) {
      const sp = parseQueryParams(studentIdOrUrl);
      studentId = sp.get('studentId') || '';
      resolvedClassroomId = sp.get('classroomId') || '';
    }

    const params: Record<string, unknown> = { studentId };
    if (resolvedClassroomId) params.classroomId = resolvedClassroomId;

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      '/classrooms/student-detail',
      {
        method: 'GET',
        params,
      },
    );

    const dto = (body?.data || {}) as Record<string, unknown>;
    const rawHistory = Array.isArray(dto.history)
      ? (dto.history as Record<string, unknown>[])
      : [];
    const rawQuizzes = Array.isArray(dto.quizzes)
      ? (dto.quizzes as Record<string, unknown>[])
      : [];
    const rawSavedWords = Array.isArray(dto.savedWords)
      ? (dto.savedWords as Record<string, unknown>[])
      : [];
    const rawAssessments = Array.isArray(dto.toeicAssessments)
      ? (dto.toeicAssessments as Record<string, unknown>[])
      : [];
    const rawTimeline = Array.isArray(dto.timeline)
      ? (dto.timeline as Record<string, unknown>[])
      : [];

    return withResponseCompat(
      {
        success: ok,
        current: dto.current
          ? mapStudentProgress(dto.current as Record<string, unknown>)
          : null,
        history: rawHistory.map((h) => ({
          vms: Number(h.vms ?? 0),
          lcs: Number(h.lcs ?? 0),
          total_words: Number(h.totalWords ?? 0),
          recorded_at: String(h.recordedAt ?? ''),
        })),
        quizzes: rawQuizzes.map((q) => ({
          id: String(q.id ?? ''),
          quiz_type: String(q.quizType ?? 'multiple_choice'),
          score: Number(q.score ?? 0),
          total_questions: Number(q.totalQuestions ?? 0),
          time_spent_seconds: Number(q.timeSpentSeconds ?? 0),
          details: safeParseJson(q.detailsJson),
          completed_at: String(q.completedAt ?? ''),
        })),
        savedWords: rawSavedWords.map((w) => ({
          id: String(w.id ?? ''),
          word: String(w.word ?? ''),
          translation: String(w.translation ?? ''),
          pos: w.pos ? String(w.pos) : null,
          ipa: w.ipa ? String(w.ipa) : null,
          example: w.example ? String(w.example) : null,
          created_at: String(w.createdAt ?? ''),
        })),
        toeicAssessments: rawAssessments.map((a) => ({
          id: String(a.id ?? ''),
          tier: String(a.tier ?? ''),
          target_id: String(a.targetId ?? ''),
          score: Number(a.score ?? 0),
          passed: Boolean(a.passed),
          details: safeParseJson(a.detailsJson),
          created_at: String(a.createdAt ?? ''),
        })),
        timeline: rawTimeline.map((t) => ({
          id: String(t.id ?? ''),
          type: String(t.type ?? 'srs_review'),
          timestamp: String(t.timestamp ?? ''),
          title: String(t.title ?? ''),
          subtitle: String(t.subtitle ?? ''),
          score: t.score !== null && t.score !== undefined ? Number(t.score) : undefined,
          total: t.total !== null && t.total !== undefined ? Number(t.total) : undefined,
          passed: t.passed !== null && t.passed !== undefined ? Boolean(t.passed) : undefined,
          badge: t.badge ? String(t.badge) : undefined,
          details: safeParseJson(t.detailsJson) ?? undefined,
        })),
      },
      status,
      ok,
    );
  }

  /**
   * Retrieves student error patterns for a classroom teacher via `GET /api/v1/classrooms/student-errors`.
   */
  public static async getStudentErrors(studentIdOrUrl: string, classroomId?: string) {
    let studentId = studentIdOrUrl;
    let resolvedClassroomId = classroomId || '';
    if (studentIdOrUrl.includes('?') && !classroomId) {
      const sp = parseQueryParams(studentIdOrUrl);
      studentId = sp.get('studentId') || '';
      resolvedClassroomId = sp.get('classroomId') || '';
    }

    const params: Record<string, unknown> = { studentId };
    if (resolvedClassroomId) params.classroomId = resolvedClassroomId;

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>[]>(
      '/classrooms/student-errors',
      {
        method: 'GET',
        params,
      },
    );

    const rows = Array.isArray(body?.data) ? body.data : [];
    return withResponseCompat(
      {
        success: ok,
        errors: rows.map((r) => ({
          word_id: String(r.wordId ?? ''),
          difficulty: Number(r.difficulty ?? 5),
          stability: Number(r.stability ?? 0),
          review_count: Number(r.reviewCount ?? 0),
          next_review_date: String(r.nextReviewDate ?? ''),
          last_reviewed_at: String(r.lastReviewedAt ?? ''),
          words: {
            id: String(r.wordId ?? ''),
            word: String(r.word ?? ''),
            translation: String(r.translation ?? ''),
            pos: String(r.pos ?? ''),
            ipa: String(r.ipa ?? ''),
            example: String(r.example ?? ''),
          },
        })),
      },
      status,
      ok,
    );
  }

  /**
   * Requests an AI coaching insight for a specific student via `POST /api/v1/classrooms/coaching-insight`.
   */
  public static async getCoachingInsight(rawBody: unknown) {
    const payload = normalizePayloadData(rawBody);
    const { ok, status, body } = await callDotNetRaw<string>('/classrooms/coaching-insight', {
      method: 'POST',
      data: {
        studentName: String(payload.studentName ?? 'Học viên'),
        vms: Number(payload.vms ?? 0),
        lcs: Number(payload.lcs ?? 0),
        tag: String(payload.tag ?? ''),
        msg: String(payload.msg ?? ''),
      },
    });
    return withResponseCompat(
      {
        success: ok,
        suggestion: body?.data ?? '',
        error: ok ? undefined : body?.message,
      },
      status,
      ok,
    );
  }

  /**
   * Adds a student to a classroom via `POST /api/v1/classrooms/{classroomId}/students`.
   */
  public static async addStudentToClassroom(rawBody: unknown) {
    const payload = normalizePayloadData(rawBody);
    const classroomId = String(payload.classroomId ?? '').trim();
    const email = String(payload.email ?? '').trim();

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      `/classrooms/${encodeURIComponent(classroomId)}/students`,
      {
        method: 'POST',
        data: { classroomId, email },
      },
    );

    const st = body?.data;
    return withResponseCompat(
      {
        success: ok,
        student: st
          ? {
              id: String(st.id ?? ''),
              email: String(st.email ?? email),
              full_name: st.fullName ? String(st.fullName) : null,
              avatar_url: st.avatarUrl ? String(st.avatarUrl) : null,
            }
          : null,
        error: ok ? undefined : body?.message || 'Không thể thêm học sinh.',
      },
      status,
      ok,
    );
  }

  /**
   * Removes a student from a classroom via `DELETE /api/v1/classrooms/{classroomId}/students/{studentId}`.
   */
  public static async removeStudentFromClassroom(rawBody: unknown) {
    const payload = normalizePayloadData(rawBody);
    const classroomId = String(payload.classroomId ?? '').trim();
    const studentId = String(payload.studentId ?? '').trim();

    const { ok, status, body } = await callDotNetRaw<boolean>(
      `/classrooms/${encodeURIComponent(classroomId)}/students/${encodeURIComponent(studentId)}`,
      {
        method: 'DELETE',
      },
    );

    return withResponseCompat(
      {
        success: ok,
        error: ok ? undefined : body?.message || 'Không thể xóa học sinh.',
      },
      status,
      ok,
    );
  }

  /**
   * Retrieves the foundation vocabulary gap map for a learner via `GET /api/v1/speaking-foundation/vocabulary-map`.
   */
  public static async getVocabularyGapMap(learnerIdOrUrl: string) {
    const learnerId = learnerIdOrUrl.includes('?')
      ? parseQueryParams(learnerIdOrUrl).get('learner_id') ||
        parseQueryParams(learnerIdOrUrl).get('learnerId') ||
        learnerIdOrUrl
      : learnerIdOrUrl;

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      '/speaking-foundation/vocabulary-map',
      {
        method: 'GET',
        params: { learnerId },
      },
    );

    const dto = (body?.data || {}) as Record<string, unknown>;
    const bucketCounts = (dto.bucketCounts || {}) as Record<string, unknown>;
    const rawQueue = Array.isArray(dto.topRemediationQueue)
      ? (dto.topRemediationQueue as Record<string, unknown>[])
      : [];
    const rawConcepts = Array.isArray(dto.concepts)
      ? (dto.concepts as Record<string, unknown>[])
      : [];

    return withResponseCompat(
      {
        success: ok,
        data: ok
          ? {
              learner_id: String(dto.learnerId ?? learnerId),
              total_concepts: Number(dto.totalConcepts ?? 0),
              bucket_counts: {
                STABLE: Number(bucketCounts.stable ?? 0),
                FRAGILE: Number(bucketCounts.fragile ?? 0),
                MISSING: Number(bucketCounts.missing ?? 0),
                UNCERTAIN: Number(bucketCounts.uncertain ?? 0),
              },
              gap_breakdown: (dto.gapBreakdown as Record<string, number>) ?? {},
              top_remediation_queue: rawQueue.map(mapConceptState),
              concepts: rawConcepts.map(mapConceptState),
            }
          : null,
        error: ok ? undefined : body?.message,
      },
      status,
      ok,
    );
  }
}
