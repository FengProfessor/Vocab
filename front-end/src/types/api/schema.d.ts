/**
 * Auto-generated OpenAPI 3.0 TypeScript schema definitions for LingoPro .NET 10 Web API (`/api/v1/*`).
 * Regenerate via `npm run gen:api` when the .NET 10 WebApi Swagger endpoint is running at http://localhost:5000/swagger/v1/swagger.json.
 */

import type {
  AccountStatus,
  AuthProviderType,
  CertLevel,
  ChallengeParticipantStatus,
  ChallengeStatus,
  GrammarLevel,
  OrderKind,
  OrderStatus,
  PartOfSpeechType,
  PilotLeadStatus,
  RoadmapLevelId,
  RoadmapStepStatus,
  RoadmapTrackType,
  SrsCardState,
  SrsReviewQuality,
  StudyGroupStatus,
  SubscriptionPlanType,
  UserRole,
} from '@/types/enums';

export interface ApiResponse<T = unknown> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T | null;
  errors: Record<string, string[]> | null;
  errorCode: string | null;
  timestamp: string;
}

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface EnumMemberItemDto {
  /** Canonical PascalCase enum member identifier. */
  name: string;
  /** Synchronized string value defined via Display(Name = "...") in the C# domain enum. */
  value: string;
}

export interface components {
  schemas: {
    ApiResponseOfObject: ApiResponse<Record<string, unknown>>;
    EnumMemberItemDto: EnumMemberItemDto;
    AuthTokensDto: {
      userId: string;
      email: string;
      fullName: string;
      role: UserRole | string;
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
    LoginRequestDto: {
      email: string;
      password: string;
      redirectTo?: string;
    };
    RegisterRequestDto: {
      fullName: string;
      email: string;
      password: string;
      role: UserRole;
      targetCertLevel: CertLevel;
    };
    ProfileDto: {
      id: string;
      email: string;
      fullName: string;
      avatarUrl: string | null;
      role: UserRole | string;
      authProvider?: AuthProviderType;
      accountStatus?: AccountStatus;
      plan?: SubscriptionPlanType | string;
      subscriptionPlan?: SubscriptionPlanType;
      totalXp?: number;
      currentStreak?: number;
      streakDays?: number;
      learningGoal?: string | null;
      dailyTargetMins?: number;
      targetCertLevel?: CertLevel;
    };
    AdminCrmDashboardSummaryDto: {
      totalUsers: number;
      activePremiumUsers: number;
      pendingOrdersCount: number;
      totalPaidRevenueVnd: number;
      totalPilotLeads: number;
      pendingPayoutRequests: number;
    };
    AdminPilotLeadDto: {
      id: string;
      teacherName: string;
      organization: string;
      studentScale: string;
      status: PilotLeadStatus;
      email?: string;
      phone?: string;
    };
    AiSentenceAnalysisDto: {
      mainClause: string;
      secondaryClauses: string[];
      kernel: Record<string, unknown>;
      buildLevels: string[];
      chunks: unknown[];
      aiSource: string;
    };
    AiSpeakingFeedbackDto: {
      response: string;
      feedback: string;
      suggestedResponse: string;
    };
    CouponValidationDto: {
      code: string;
      discountPercent: number;
      maxDiscountAmount: number | null;
      isValid: boolean;
    };
    OrderDto: {
      id: string;
      userId: string;
      planId: SubscriptionPlanType;
      orderKind: OrderKind;
      durationMonths: number;
      seatLimit: number;
      amount: number;
      currency: string;
      status: OrderStatus | string;
      transferCode: string;
      vietQrUrl: string;
      createdAt: string;
      paidAt: string | null;
    };
    ChallengeDto: {
      id: string;
      title: string;
      description: string;
      startDate: string;
      endDate: string;
      dailyTargetWords: number;
      maxParticipants: number;
      currentParticipantsCount: number;
      depositAmount: number;
      status: ChallengeStatus | string;
    };
    JoinChallengeResponseDto: {
      participantId: string;
      challengeId: string;
      participantStatus: ChallengeParticipantStatus | string;
      orderId: string | null;
      transferCode: string | null;
    };
    ClassroomDto: {
      id: string;
      name: string;
      description: string | null;
      inviteCode: string;
      teacherId: string;
      studentCount: number;
      createdAt: string;
    };
    DictionaryEntryDto: {
      id: string;
      term: string;
      ipa: string;
      partOfSpeech: string;
      definitionsJson: string;
      collocationsJson: string;
      synonymsJson: string;
      antonymsJson: string;
      bestContextualSenseIndex: number | null;
    };
    ToeicSubmissionResponseDto: {
      resultId: string;
      testId: string;
      listeningCorrect: number;
      readingCorrect: number;
      listeningScaledScore: number;
      readingScaledScore: number;
      totalScaledScore: number;
      certLevel: string;
      proficiencyBand: string;
      xpAwarded: number;
    };
    VstepScoreResultDto: {
      rawAverage: number;
      roundedScore: number;
      certLevel: string | null;
      statusLabel: string;
    };
    WritingEvaluationDto: {
      overallScore: number;
      taskAchievement: number;
      coherenceAndCohesion: number;
      lexicalResource: number;
      grammaticalRange: number;
      overallFeedbackVi: string;
    };
    GrammarTopicDto: {
      id: string;
      slug: string;
      title: string;
      titleVi: string | null;
      level: GrammarLevel | string;
      certLevel: CertLevel | string;
      category: string;
      sortOrder: number;
    };
    GrammarProgressDto: {
      topicSlug: string;
      masteryScore: number;
      state: SrsCardState | string;
      stability: number;
      difficulty: number;
      intervalDays: number;
      nextReviewDate: string;
      xpAwarded: number;
    };
    DailyReadingDto: {
      id: string;
      exerciseDate: string;
      title: string;
      passageContent: string;
      certLevel: CertLevel;
      usedWordsJson: string;
      mcqQuestionsJson: string;
      clozeItemsJson: string;
      isCompletedToday: boolean;
    };
    ReadingArticleDto: {
      id: string;
      slug: string;
      title: string;
      topic: string;
      certLevel: CertLevel;
      sourceType: string;
      wordCount: number;
      contentText: string;
      questionsJson: string;
    };
    RoadmapStepProgressDto: {
      stepId: string;
      status: RoadmapStepStatus | string;
      score: number | null;
      completedAt: string | null;
    };
    RoadmapProgressDto: {
      track: RoadmapTrackType | string;
      enrolled: boolean;
      needsPlacement: boolean;
      levelId: RoadmapLevelId | string | null;
      currentUnitId: string | null;
      completedSteps: components['schemas']['RoadmapStepProgressDto'][];
    };
    CompleteStepResultDto: {
      stepId: string;
      status: RoadmapStepStatus | string;
      xpAwarded: number;
    };
    StudyGroupDto: {
      id: string;
      name: string;
      inviteCode: string;
      seatLimit: number;
      status: StudyGroupStatus | string;
      expiresAt: string | null;
    };
    ReferralHubDto: {
      referralCode: string;
      totalReferredUsers: number;
      activatedReferrals: number;
      totalAvailableRewardsVnd: number;
      activeGroups: components['schemas']['StudyGroupDto'][];
    };
    DiagnosticProbeDto: {
      conceptId: string;
      conceptCode: string;
      headword: string;
      ipa: string;
      meaningVi: string;
      frequencyBand: number;
      certLevel: CertLevel;
    };
    WordWithSrsDto: {
      id: string;
      term: string;
      ipa: string;
      translation: string;
      partOfSpeech: PartOfSpeechType | string;
      imageUrl: string | null;
      exampleSentence: string | null;
      exampleTranslation: string | null;
      topic: string;
      level: CertLevel | string;
      srsState: SrsCardState | string;
      stability: number;
      difficulty: number;
      intervalDays: number;
      nextReviewDate: string | null;
    };
    SrsReviewResponseDto: {
      wordId: string;
      state: SrsCardState;
      stability: number;
      difficulty: number;
      intervalDays: number;
      nextReviewDate: string;
      reps: number;
      lapses: number;
      xpAwarded: number;
    };
  };
}

export interface paths {
  '/api/v1/auth/login': {
    post: {
      requestBody: { content: { 'application/json': components['schemas']['LoginRequestDto'] } };
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['AuthTokensDto']> } } };
    };
  };
  '/api/v1/auth/register': {
    post: {
      requestBody: { content: { 'application/json': components['schemas']['RegisterRequestDto'] } };
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['AuthTokensDto']> } } };
    };
  };
  '/api/v1/auth/profile': {
    get: {
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['ProfileDto']> } } };
    };
    put: {
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['ProfileDto']> } } };
    };
  };
  '/api/v1/admin/crm/dashboard': {
    get: {
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['AdminCrmDashboardSummaryDto']> } } };
    };
  };
  '/api/v1/dictionary/lookup': {
    get: {
      parameters: { query: { term: string; context?: string } };
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['DictionaryEntryDto']> } } };
    };
  };
  '/api/v1/vocab/due': {
    get: {
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['WordWithSrsDto'][]> } } };
    };
  };
  '/api/v1/vocab/review': {
    post: {
      requestBody: { content: { 'application/json': { wordId: string; quality: SrsReviewQuality } } };
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['SrsReviewResponseDto']> } } };
    };
  };
  '/api/v1/grammar/topics': {
    get: {
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['GrammarTopicDto'][]> } } };
    };
  };
  '/api/v1/reading/daily': {
    get: {
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['DailyReadingDto']> } } };
    };
  };
  '/api/v1/roadmap/progress': {
    get: {
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['RoadmapProgressDto']> } } };
    };
  };
  '/api/v1/classrooms/my': {
    get: {
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['ClassroomDto'][]> } } };
    };
  };
  '/api/v1/challenges': {
    get: {
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['ChallengeDto'][]> } } };
    };
  };
  '/api/v1/billing/orders': {
    post: {
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['OrderDto']> } } };
    };
  };
  '/api/v1/social/referrals/hub': {
    get: {
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['ReferralHubDto']> } } };
    };
  };
  '/api/v1/exams/toeic/submit': {
    post: {
      responses: { 200: { content: { 'application/json': ApiResponse<components['schemas']['ToeicSubmissionResponseDto']> } } };
    };
  };
  '/api/v1/system/enums': {
    get: {
      responses: { 200: { content: { 'application/json': ApiResponse<Record<string, EnumMemberItemDto[]>> } } };
    };
  };
}
