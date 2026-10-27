/**
 * Standardized API envelope and OpenAPI schema types for LingoPro .NET 10 (`/api/v1/*`).
 */
export type {
  ApiResponse,
  PaginatedList,
  EnumMemberItemDto,
  components,
  paths,
} from './schema';

export type ServerAuthTokensDto = import('./schema').components['schemas']['AuthTokensDto'];
export type ServerProfileDto = import('./schema').components['schemas']['ProfileDto'];
export type ServerAdminCrmDashboardSummaryDto = import('./schema').components['schemas']['AdminCrmDashboardSummaryDto'];
export type ServerAdminPilotLeadDto = import('./schema').components['schemas']['AdminPilotLeadDto'];
export type ServerAiSentenceAnalysisDto = import('./schema').components['schemas']['AiSentenceAnalysisDto'];
export type ServerAiSpeakingFeedbackDto = import('./schema').components['schemas']['AiSpeakingFeedbackDto'];
export type ServerCouponValidationDto = import('./schema').components['schemas']['CouponValidationDto'];
export type ServerOrderDto = import('./schema').components['schemas']['OrderDto'];
export type ServerChallengeDto = import('./schema').components['schemas']['ChallengeDto'];
export type ServerJoinChallengeResponseDto = import('./schema').components['schemas']['JoinChallengeResponseDto'];
export type ServerClassroomDto = import('./schema').components['schemas']['ClassroomDto'];
export type ServerDictionaryEntryDto = import('./schema').components['schemas']['DictionaryEntryDto'];
export type ServerToeicSubmissionResponseDto = import('./schema').components['schemas']['ToeicSubmissionResponseDto'];
export type ServerVstepScoreResult = import('./schema').components['schemas']['VstepScoreResultDto'];
export type ServerWritingEvaluationDto = import('./schema').components['schemas']['WritingEvaluationDto'];
export type ServerGrammarTopicDto = import('./schema').components['schemas']['GrammarTopicDto'];
export type ServerGrammarProgressDto = import('./schema').components['schemas']['GrammarProgressDto'];
export type ServerDailyReadingDto = import('./schema').components['schemas']['DailyReadingDto'];
export type ServerReadingArticleDto = import('./schema').components['schemas']['ReadingArticleDto'];
export type ServerRoadmapStepDto = import('./schema').components['schemas']['RoadmapStepProgressDto'];
export type ServerRoadmapProgressDto = import('./schema').components['schemas']['RoadmapProgressDto'];
export type ServerCompleteStepResultDto = import('./schema').components['schemas']['CompleteStepResultDto'];
export type ServerStudyGroupDto = import('./schema').components['schemas']['StudyGroupDto'];
export type ServerReferralHubDto = import('./schema').components['schemas']['ReferralHubDto'];
export type ServerDiagnosticProbeDto = import('./schema').components['schemas']['DiagnosticProbeDto'];
export type ServerWordWithSrsDto = import('./schema').components['schemas']['WordWithSrsDto'];
export type ServerSrsReviewResponseDto = import('./schema').components['schemas']['SrsReviewResponseDto'];
