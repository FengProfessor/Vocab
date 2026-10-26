/**
 * Centralized React Query cache keys across all LingoPro feature domains.
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
    gamification: (userId?: string | null) =>
      [...queryKeys.auth.all, 'gamification', userId ?? 'me'] as const,
  },
  vocab: {
    all: ['vocab'] as const,
    words: (params?: Record<string, unknown>) =>
      [...queryKeys.vocab.all, 'words', params ?? {}] as const,
    wordDetail: (wordId: string) => [...queryKeys.vocab.all, 'word', wordId] as const,
    due: (params?: Record<string, unknown>) =>
      [...queryKeys.vocab.all, 'due', params ?? {}] as const,
    stats: (lite?: boolean) => [...queryKeys.vocab.all, 'stats', Boolean(lite)] as const,
    packs: () => [...queryKeys.vocab.all, 'packs'] as const,
    packages: () => [...queryKeys.vocab.all, 'packages'] as const,
    topic: (topicId: string) => [...queryKeys.vocab.all, 'topic', topicId] as const,
  },
  classroom: {
    all: ['classroom'] as const,
    list: () => [...queryKeys.classroom.all, 'list'] as const,
    detail: (classroomId: string) => [...queryKeys.classroom.all, 'detail', classroomId] as const,
    leaderboard: (classroomId: string) =>
      [...queryKeys.classroom.all, 'leaderboard', classroomId] as const,
    teacherAnalytics: (classroomId?: string) =>
      [...queryKeys.classroom.all, 'teacher-analytics', classroomId ?? 'all'] as const,
    teacherStats: (classroomId?: string) =>
      [...queryKeys.classroom.all, 'teacher-stats', classroomId ?? 'all'] as const,
    studentDetail: (studentId: string, classroomId: string) =>
      [...queryKeys.classroom.all, 'student-detail', studentId, classroomId] as const,
    studentErrors: (studentId: string, classroomId: string) =>
      [...queryKeys.classroom.all, 'student-errors', studentId, classroomId] as const,
    vocabularyGapMap: (learnerId: string) =>
      [...queryKeys.classroom.all, 'vocabulary-gap-map', learnerId] as const,
  },
  grammar: {
    all: ['grammar'] as const,
    topics: (params?: Record<string, unknown>) =>
      [...queryKeys.grammar.all, 'topics', params ?? {}] as const,
    progress: (params?: Record<string, unknown>) =>
      [...queryKeys.grammar.all, 'progress', params ?? {}] as const,
    review: (days?: number) => [...queryKeys.grammar.all, 'review', days ?? 14] as const,
    theory: (topicSlug: string) => [...queryKeys.grammar.all, 'theory', topicSlug] as const,
    lessons: (params?: Record<string, unknown>) =>
      [...queryKeys.grammar.all, 'lessons', params ?? {}] as const,
    quiz: (params?: Record<string, unknown>) =>
      [...queryKeys.grammar.all, 'quiz', params ?? {}] as const,
  },
  roadmap: {
    all: ['roadmap'] as const,
    tree: (track?: string | null) => [...queryKeys.roadmap.all, 'tree', track ?? 'cefr'] as const,
    placement: () => [...queryKeys.roadmap.all, 'placement'] as const,
    checkpoint: (unitId: string) => [...queryKeys.roadmap.all, 'checkpoint', unitId] as const,
  },
  dictionary: {
    all: ['dictionary'] as const,
    lookup: (term: string, context?: string) =>
      [...queryKeys.dictionary.all, 'lookup', term, context ?? ''] as const,
    external: (term: string) => [...queryKeys.dictionary.all, 'external', term] as const,
    suggest: (query: string) => [...queryKeys.dictionary.all, 'suggest', query] as const,
  },
  exam: {
    all: ['exam'] as const,
    toeicTest: (params?: Record<string, unknown>) =>
      [...queryKeys.exam.all, 'toeic-test', params ?? {}] as const,
    toeicHistory: () => [...queryKeys.exam.all, 'toeic-history'] as const,
    vstepTest: (params?: Record<string, unknown>) =>
      [...queryKeys.exam.all, 'vstep-test', params ?? {}] as const,
    vnuCatalog: () => [...queryKeys.exam.all, 'vnu-catalog'] as const,
    vnuTest: (examId: string) => [...queryKeys.exam.all, 'vnu-test', examId] as const,
  },
  reading: {
    all: ['reading'] as const,
    articles: (params?: Record<string, unknown>) =>
      [...queryKeys.reading.all, 'articles', params ?? {}] as const,
    daily: (params?: Record<string, unknown>) =>
      [...queryKeys.reading.all, 'daily', params ?? {}] as const,
    progress: () => [...queryKeys.reading.all, 'progress'] as const,
  },
  challenge: {
    all: ['challenge'] as const,
    list: (includeAll?: boolean) =>
      [...queryKeys.challenge.all, 'list', Boolean(includeAll)] as const,
    widget: () => [...queryKeys.challenge.all, 'widget'] as const,
    detail: (slug: string) => [...queryKeys.challenge.all, 'detail', slug] as const,
  },
  billing: {
    all: ['billing'] as const,
    stats: () => [...queryKeys.billing.all, 'stats'] as const,
    orders: (params?: Record<string, unknown>) =>
      [...queryKeys.billing.all, 'orders', params ?? {}] as const,
    coupons: () => [...queryKeys.billing.all, 'coupons'] as const,
    couponValidate: (code: string) => [...queryKeys.billing.all, 'coupon-validate', code] as const,
    proMilestone: () => [...queryKeys.billing.all, 'pro-milestone'] as const,
  },
  social: {
    all: ['social'] as const,
    referralHub: () => [...queryKeys.social.all, 'referral-hub'] as const,
    groupsMine: () => [...queryKeys.social.all, 'groups-mine'] as const,
    presence: (roomId?: string) => [...queryKeys.social.all, 'presence', roomId ?? 'hub'] as const,
  },
  admin: {
    all: ['admin'] as const,
    crm: (forceRefresh?: boolean) =>
      [...queryKeys.admin.all, 'crm', Boolean(forceRefresh)] as const,
    stats: () => [...queryKeys.admin.all, 'stats'] as const,
    pilotLeads: () => [...queryKeys.admin.all, 'pilot-leads'] as const,
  },
} as const;
