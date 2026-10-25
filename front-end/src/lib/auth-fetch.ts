import { appConfig } from '@/config/appConfig';
import { TokenStore } from '@/lib/auth/TokenStore';
import { hydrateSessionFromAuthTokens, buildSessionFromDto, type DotNetAuthTokensDto } from '@/lib/app-auth-client';
import { getRoadmapLevels, type RoadmapTrack } from '@/lib/roadmap';

const API_BASE = appConfig.apiBaseUrl; // e.g. http://localhost:5000/api/v1
const SERVER_ORIGIN = appConfig.serverOrigin; // e.g. http://localhost:5000

const rawFetch: typeof fetch =
  typeof window !== 'undefined' ? window.fetch.bind(window) : globalThis.fetch.bind(globalThis);

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function parseBodyJson(init?: RequestInit): Promise<Record<string, any>> {
  if (!init?.body) return {};
  if (typeof init.body === 'string') {
    try {
      return JSON.parse(init.body) as Record<string, any>;
    } catch {
      return {};
    }
  }
  return {};
}

function buildAuthHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers);
  headers.set('X-LingoPro-Request', '1');
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  const token = TokenStore.getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

function mapQualityToEnum(quality: unknown): string {
  const n = Number(quality);
  if (n <= 1) return 'Again';
  if (n === 2 || n === 3) return 'Hard';
  if (n === 4) return 'Good';
  return 'Easy';
}

function mapTrackToDotNet(track?: string | null): string {
  const t = (track || 'cefr').toLowerCase();
  if (t === 'toeic') return 'Toeic';
  if (t === 'ielts') return 'Ielts';
  if (t === 'vstep') return 'Vstep';
  return 'General';
}

function buildRoadmapTreeFromDto(trackParam: string | null, dto: Record<string, any> | null) {
  const track: RoadmapTrack =
    trackParam === 'thpt' ? 'thpt' : trackParam === 'toeic' ? 'toeic' : 'cefr';
  const rawLevels = getRoadmapLevels(track);
  const completedSteps: Array<{ stepId: string; status?: string; score?: number | null }> =
    Array.isArray(dto?.completedSteps) ? dto!.completedSteps : [];
  const completedMap = new Map<string, number | null>();
  for (const s of completedSteps) {
    if (s?.stepId) completedMap.set(s.stepId, s.score ?? null);
  }

  const startLevelId = String(dto?.levelId || rawLevels[0]?.id || 'A0');
  let foundCurrent = false;
  let currentStepId: string | null = null;

  const tree = rawLevels.map((lvl) => {
    const units = lvl.units.map((u) => {
      let doneInUnit = 0;
      const steps = u.steps.map((st) => {
        const isDone = completedMap.has(st.id);
        if (isDone) {
          doneInUnit++;
          return {
            ...st,
            status: 'completed' as const,
            score: completedMap.get(st.id) ?? 100,
          };
        }
        if (!foundCurrent) {
          foundCurrent = true;
          currentStepId = st.id;
          return {
            ...st,
            status: 'current' as const,
            score: null,
          };
        }
        return {
          ...st,
          status: 'locked' as const,
          score: null,
        };
      });
      const total = steps.length || 1;
      const progressPct = Math.round((doneInUnit / total) * 100);
      return {
        ...u,
        steps,
        progressPct,
        completedStepsCount: doneInUnit,
        totalStepsCount: steps.length,
        status:
          doneInUnit === steps.length
            ? ('completed' as const)
            : steps.some((x) => x.status === 'current') || doneInUnit > 0
              ? ('in-progress' as const)
              : ('locked' as const),
      };
    });
    return {
      ...lvl,
      isStartLevel: lvl.id.toLowerCase() === startLevelId.toLowerCase(),
      units,
    };
  });

  const enrolled = dto ? !dto.needsPlacement : true;
  return {
    enrolled,
    needsPlacement: Boolean(dto?.needsPlacement),
    track,
    levelId: startLevelId,
    currentStepId,
    tree,
  };
}

/**
 * Routes `/api/*` requests from the ported `/src` pages & components to the `.NET 10` backend
 * (`/api/v1/*`) and adapts `.NET 10` `ApiResponse<T>` envelopes into the shapes expected by the UI.
 */
async function handleApiRequest(urlStr: string, init: RequestInit = {}): Promise<Response> {
  const parsed = new URL(urlStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
  const pathname = parsed.pathname;
  const search = parsed.search;
  const method = (init.method || 'GET').toUpperCase();
  const headers = buildAuthHeaders(init);

  // If already targeting /api/v1/* directly, forward to .NET 10 API_BASE
  if (pathname.startsWith('/api/v1/')) {
    const subPath = pathname.slice('/api/v1'.length);
    return rawFetch(`${API_BASE}${subPath}${search}`, {
      ...init,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });
  }

  // 1. Authentication endpoints (/api/auth/*)
  if (pathname === '/api/auth/signup' || pathname === '/api/auth/register') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-LingoPro-Request': '1',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        fullName: body.fullName || body.full_name || body.email?.split('@')[0] || 'Học viên',
        role: String(body.role || 'student').toLowerCase() === 'teacher' ? 'Teacher' : 'Student',
      }),
    });
    const json = (await res.json().catch(() => null)) as {
      success?: boolean;
      message?: string;
      data?: DotNetAuthTokensDto;
    } | null;
    if (!res.ok || !json?.success) {
      return jsonResponse({ error: json?.message || 'Đăng ký không thành công.' }, res.status || 400);
    }
    const tokens = json.data || {};
    const session = tokens.accessToken ? hydrateSessionFromAuthTokens(tokens) : null;
    return jsonResponse({
      success: true,
      session,
      user: session?.user ?? null,
      needsEmailConfirmation: !tokens.accessToken,
    });
  }

  if (pathname === '/api/auth/login') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-LingoPro-Request': '1',
      },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });
    const json = (await res.json().catch(() => null)) as {
      success?: boolean;
      message?: string;
      data?: DotNetAuthTokensDto;
    } | null;
    if (!res.ok || !json?.success || !json.data) {
      return jsonResponse({ error: json?.message || 'Sai email hoặc mật khẩu.' }, res.status || 401);
    }
    const session = hydrateSessionFromAuthTokens(json.data);
    return jsonResponse({
      success: true,
      session,
      user: session?.user ?? null,
    });
  }

  if (pathname === '/api/auth/session' || pathname === '/api/profile') {
    const res = await rawFetch(`${API_BASE}/auth/profile`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    if (!res.ok) {
      return jsonResponse({ session: null, user: null }, res.status === 401 ? 200 : res.status);
    }
    const json = (await res.json().catch(() => null)) as { data?: DotNetAuthTokensDto } | null;
    const session = json?.data ? buildSessionFromDto(json.data) : null;
    return jsonResponse({
      success: true,
      session,
      user: session?.user ?? null,
      data: json?.data ?? null,
    });
  }

  if (pathname === '/api/auth/logout') {
    await rawFetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers,
    }).catch(() => null);
    return jsonResponse({ success: true });
  }

  if (pathname === '/api/auth/user') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/auth/onboarding`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        learningGoal: body.data?.learning_goal || 'General',
        dailyTargetMins: Number(body.data?.daily_goal || 10),
        targetCertLevel: body.data?.target_level || 'B1',
      }),
    });
    const json = (await res.json().catch(() => null)) as { data?: DotNetAuthTokensDto } | null;
    const session = json?.data ? buildSessionFromDto(json.data) : null;
    return jsonResponse({ success: res.ok, user: session?.user ?? null });
  }

  // 2. Vocabulary & FSRS endpoints (/api/words, /api/words/srs)
  if (pathname === '/api/words' && method === 'GET') {
    const res = await rawFetch(`${API_BASE}/vocab/due${search}`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    const json = (await res.json().catch(() => null)) as { data?: any[] } | null;
    const items = Array.isArray(json?.data) ? json!.data : [];
    const words = items.map((d) => ({
      id: d.id,
      word: d.term || d.word,
      ipa: d.ipa,
      translation: d.translation,
      pos: d.partOfSpeech || d.pos,
      image_url: d.imageUrl || d.image_url,
      example: d.exampleSentence || d.example,
      example_vi: d.exampleTranslation || d.example_vi,
      isDue: true,
      srs: {
        word_id: d.id,
        stability: d.stability ?? 0,
        difficulty: d.difficulty ?? 5,
        interval_days: d.intervalDays ?? 0,
        next_review_date: d.nextReviewDate ?? new Date().toISOString(),
        review_count: 1,
        ease_factor: 2.5,
      },
    }));
    return jsonResponse({ success: true, data: words, words });
  }

  if (pathname === '/api/words/srs' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/vocab/review`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wordId: body.wordId || body.word_id,
        quality: mapQualityToEnum(body.quality),
      }),
    });
    const json = (await res.json().catch(() => null)) as { success?: boolean; data?: any; message?: string } | null;
    return jsonResponse(
      {
        success: Boolean(res.ok && json?.success !== false),
        applyStatus: 'applied',
        data: json?.data ?? null,
        error: res.ok ? undefined : json?.message,
      },
      res.status,
    );
  }

  // 3. Classrooms & Teacher endpoints
  if ((pathname === '/api/classrooms' || pathname === '/api/student/classrooms') && method === 'GET') {
    const res = await rawFetch(`${API_BASE}/classrooms`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    const json = (await res.json().catch(() => null)) as { data?: any[] } | null;
    const list = (Array.isArray(json?.data) ? json!.data : []).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      invite_code: c.inviteCode || c.invite_code,
      teacher_id: c.teacherId || c.teacher_id,
      enrollment_count: c.studentCount ?? c.enrollment_count ?? 0,
      created_at: c.createdAt || c.created_at,
    }));
    return jsonResponse({ success: true, data: list, classrooms: list });
  }

  if (pathname === '/api/classrooms' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/classrooms`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: body.name,
        description: body.description || '',
      }),
    });
    const json = (await res.json().catch(() => null)) as { data?: any; message?: string } | null;
    return jsonResponse({ success: res.ok, data: json?.data, classroom: json?.data, error: json?.message }, res.status);
  }

  if (pathname === '/api/classrooms/join' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/classrooms/join`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inviteCode: body.inviteCode || body.invite_code || body.code,
      }),
    });
    const json = (await res.json().catch(() => null)) as { data?: any; message?: string } | null;
    return jsonResponse({ success: res.ok, data: json?.data, classroom: json?.data, error: json?.message }, res.status);
  }

  if (pathname === '/api/teacher/assign-drill' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/classrooms/assign-drill`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return jsonResponse(json, res.status);
  }

  // 4. Grammar endpoints (/api/grammar, /api/grammar/topics, /api/grammar/progress)
  if ((pathname === '/api/grammar' || pathname === '/api/grammar/topics') && method === 'GET') {
    const res = await rawFetch(`${API_BASE}/grammar/topics${search}`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    const json = (await res.json().catch(() => null)) as { data?: any[] } | null;
    const topics = (Array.isArray(json?.data) ? json!.data : []).map((t, idx) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      title_vi: t.titleVi || t.title_vi || t.title,
      level: t.level || 'beginner',
      cefr_level: t.certLevel || 'A1',
      order_index: t.sortOrder ?? idx,
      created_at: new Date().toISOString(),
    }));
    return jsonResponse({ success: true, data: topics, topics });
  }

  if ((pathname === '/api/grammar/progress' || pathname === '/api/grammar/review') && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/grammar/progress`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicSlug: body.topicSlug || body.slug || body.lessonId || body.lesson_id,
        scorePercent: Number(body.scorePercent ?? body.score ?? 100),
      }),
    });
    const json = await res.json().catch(() => ({}));
    return jsonResponse({ success: res.ok, ...json }, res.status);
  }

  // 5. Roadmap / Journey endpoints (/api/roadmap, /api/roadmap/placement, /api/roadmap/progress)
  if (pathname === '/api/roadmap' && method === 'GET') {
    const trackParam = parsed.searchParams.get('track');
    const dotNetTrack = mapTrackToDotNet(trackParam);
    const res = await rawFetch(`${API_BASE}/roadmap?track=${dotNetTrack}`, {
      method: 'GET',
      credentials: 'include',
      headers,
    }).catch(() => null);

    let dto: Record<string, any> | null = null;
    if (res && res.ok) {
      const json = (await res.json().catch(() => null)) as { data?: Record<string, any> } | null;
      dto = json?.data ?? null;
    }
    const treeData = buildRoadmapTreeFromDto(trackParam, dto);
    return jsonResponse({ success: true, data: treeData });
  }

  if (pathname === '/api/roadmap/placement' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/roadmap/placement`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        track: mapTrackToDotNet(body.track),
        levelId: body.levelId || body.level || 'A1',
      }),
    });
    const json = (await res.json().catch(() => null)) as { data?: any; message?: string } | null;
    return jsonResponse({ success: res.ok, data: json?.data, error: json?.message }, res.status);
  }

  if (pathname === '/api/roadmap/progress' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/roadmap/steps/complete`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stepId: body.stepId,
        score: body.score ?? 100,
      }),
    });
    const json = (await res.json().catch(() => null)) as { data?: any; message?: string } | null;
    return jsonResponse(
      {
        success: res.ok,
        data: {
          xpAwarded: json?.data?.xpAwarded ?? 15,
          unitCompleted: false,
          levelCompleted: false,
          levelId: 'A1',
        },
        error: json?.message,
      },
      res.status,
    );
  }

  // 6. Dictionary & OCR & AI Coaching endpoints
  if (pathname === '/api/dictionary/lookup' || pathname === '/api/dictionary/ai-lookup') {
    const term =
      parsed.searchParams.get('word') ||
      parsed.searchParams.get('term') ||
      (await parseBodyJson(init)).word ||
      '';
    const context = parsed.searchParams.get('context') || '';
    const qs = new URLSearchParams({ term: String(term) });
    if (context) qs.set('context', context);
    const res = await rawFetch(`${API_BASE}/dictionary/lookup?${qs.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    const json = (await res.json().catch(() => null)) as { data?: any; message?: string } | null;
    return jsonResponse({ success: res.ok, data: json?.data, entry: json?.data, error: json?.message }, res.status);
  }

  if (pathname === '/api/import/ocr' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/dictionary/ocr/extract`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image: body.image || body.base64Image || '',
        mimeType: body.mimeType || 'image/jpeg',
      }),
    });
    const json = (await res.json().catch(() => null)) as { data?: string[]; message?: string } | null;
    return jsonResponse({ success: res.ok, words: json?.data ?? [], data: json?.data ?? [] }, res.status);
  }

  if (pathname === '/api/dictionary/ai-sentence' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/ai-coaching/sentence/analyze`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sentence: body.sentence || body.text || '',
        targetWord: body.targetWord || body.word || null,
      }),
    });
    const json = (await res.json().catch(() => null)) as { data?: any; message?: string } | null;
    return jsonResponse({ success: res.ok, data: json?.data, ...json?.data }, res.status);
  }

  if (pathname === '/api/dictionary/ai-speaking' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/ai-coaching/speaking/dialogue`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenarioPrompt: body.scenarioPrompt || body.topic || 'Daily conversation',
        userTranscript: body.userTranscript || body.transcript || body.text || '',
        targetWords: body.targetWords || [],
      }),
    });
    const json = (await res.json().catch(() => null)) as { data?: any; message?: string } | null;
    return jsonResponse({ success: res.ok, data: json?.data, ...json?.data }, res.status);
  }

  // 7. Exams (TOEIC, VSTEP, Writing)
  if (pathname === '/api/toeic/submit' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/exams/toeic/submit`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { data?: any; message?: string } | null;
    return jsonResponse({ success: res.ok, data: json?.data, ...json?.data }, res.status);
  }

  if (pathname === '/api/vstep/submit' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/exams/vstep/submit`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { data?: any; message?: string } | null;
    return jsonResponse({ success: res.ok, data: json?.data, ...json?.data }, res.status);
  }

  if ((pathname === '/api/vstep/writing-eval' || pathname === '/api/vnu-bac-3/writing-eval') && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/exams/writing/evaluate`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        examType: pathname.includes('vnu') ? 'VnuBac3' : 'Vstep',
        taskPrompt: body.prompt || body.taskPrompt || '',
        essayContent: body.essay || body.essayContent || body.text || '',
      }),
    });
    const json = (await res.json().catch(() => null)) as { data?: any; message?: string } | null;
    return jsonResponse({ success: res.ok, data: json?.data, ...json?.data }, res.status);
  }

  // 8. Reading Library & Daily Reading
  if (pathname === '/api/reading/articles' && method === 'GET') {
    const res = await rawFetch(`${API_BASE}/reading/articles${search}`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    const json = (await res.json().catch(() => null)) as { data?: any[] } | null;
    return jsonResponse({ success: res.ok, articles: json?.data ?? [], data: json?.data ?? [] }, res.status);
  }

  if (pathname === '/api/practice/daily-reading' && method === 'GET') {
    const res = await rawFetch(`${API_BASE}/reading/daily`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    const json = (await res.json().catch(() => null)) as { data?: any } | null;
    return jsonResponse({ success: res.ok, data: json?.data, exercise: json?.data }, res.status);
  }

  if (pathname === '/api/reading/progress' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/reading/daily/submit`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return jsonResponse({ success: res.ok, ...json }, res.status);
  }

  // 9. Challenges
  if ((pathname === '/api/challenges' || pathname === '/api/challenges/widget') && method === 'GET') {
    const res = await rawFetch(`${API_BASE}/challenges`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    const json = (await res.json().catch(() => null)) as { data?: any[] } | null;
    return jsonResponse({ success: res.ok, challenges: json?.data ?? [], data: json?.data ?? [] }, res.status);
  }

  if (pathname === '/api/challenges' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/challenges`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return jsonResponse(json, res.status);
  }

  // 10. Billing (Coupons & Orders)
  if (pathname === '/api/billing/coupons/validate') {
    const code = parsed.searchParams.get('code') || (await parseBodyJson(init)).code || '';
    const res = await rawFetch(`${API_BASE}/billing/coupons/validate?code=${encodeURIComponent(code)}`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    const json = (await res.json().catch(() => null)) as { data?: any; message?: string } | null;
    return jsonResponse({ success: res.ok, valid: Boolean(json?.data?.isValid), data: json?.data, ...json?.data }, res.status);
  }

  if (pathname === '/api/billing/orders' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/billing/orders`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { data?: any; message?: string } | null;
    return jsonResponse({ success: res.ok, order: json?.data, data: json?.data, error: json?.message }, res.status);
  }

  // 11. Social Hub (Referrals & Study Groups)
  if ((pathname === '/api/referral/hub' || pathname === '/api/groups/mine') && method === 'GET') {
    const res = await rawFetch(`${API_BASE}/social/referrals/hub`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    const json = (await res.json().catch(() => null)) as { data?: any } | null;
    return jsonResponse({
      success: res.ok,
      data: json?.data,
      groups: json?.data?.activeGroups ?? [],
      ...json?.data,
    }, res.status);
  }

  if (pathname === '/api/referral/claim' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/social/referrals/claim`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ referralCode: body.referralCode || body.code }),
    });
    const json = await res.json().catch(() => ({}));
    return jsonResponse({ success: res.ok, ...json }, res.status);
  }

  if (pathname === '/api/groups/join' && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/social/groups/join`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inviteCode: body.inviteCode || body.code }),
    });
    const json = await res.json().catch(() => ({}));
    return jsonResponse({ success: res.ok, ...json }, res.status);
  }

  // 12. Admin CRM & Pilot Leads
  if (pathname === '/api/admin/crm' || pathname === '/api/admin/stats' || pathname === '/api/billing/stats') {
    const res = await rawFetch(`${API_BASE}/admin/crm/dashboard`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    const json = (await res.json().catch(() => null)) as { data?: any } | null;
    return jsonResponse({ success: res.ok, data: json?.data, ...json?.data }, res.status);
  }

  if ((pathname === '/api/pilot/leads' || pathname === '/api/admin/pilot-leads' || pathname === '/api/challenge/lead') && method === 'POST') {
    const body = await parseBodyJson(init);
    const res = await rawFetch(`${API_BASE}/admin/leads/subscribe`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email || `${body.phone || 'lead'}@lingopro.online`,
        fullName: body.fullName || body.name || 'Giáo viên / Học viên',
        phone: body.phone || '',
        source: body.source || pathname,
      }),
    });
    const json = await res.json().catch(() => ({}));
    return jsonResponse({ success: res.ok, ...json }, res.status);
  }

  // 13. Lead Magnet (/api/lead-magnet/*) on .NET 10 server root
  if (pathname.startsWith('/api/lead-magnet/')) {
    return rawFetch(`${SERVER_ORIGIN}${pathname}${search}`, {
      ...init,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });
  }

  // 14. Default fallback: forward /api/... to SERVER_ORIGIN
  return rawFetch(`${SERVER_ORIGIN}${pathname}${search}`, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
}

let bridgeInstalled = false;

/**
 * Installs a global `window.fetch` interceptor so even components calling `fetch('/api/...')`
 * directly (instead of `authFetch`) are transparently routed to the `.NET 10` backend API.
 */
export function installGlobalApiBridge(): void {
  if (typeof window === 'undefined' || bridgeInstalled) return;
  bridgeInstalled = true;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (
      urlStr.startsWith('/api/') ||
      (typeof window !== 'undefined' && urlStr.startsWith(`${window.location.origin}/api/`))
    ) {
      return handleApiRequest(urlStr, init);
    }

    return rawFetch(input, init);
  };
}

/**
 * Authenticated API fetch for the pure Client-Side SPA.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  if (input.startsWith('/api/')) {
    return handleApiRequest(input, init);
  }
  const headers = buildAuthHeaders(init);
  return rawFetch(input, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
}

installGlobalApiBridge();
