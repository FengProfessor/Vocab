/**
 * Synchronized business enums mapped from the LingoPro .NET 10 domain layer.
 */

/**
 * Represents the operational lifecycle status of a user account.
 */
export enum AccountStatus {
  Active = 'Active',
  Suspended = 'Suspended',
  Banned = 'Banned',
}

/**
 * Defines AI model providers supported by the multi-tier AI router.
 */
export enum AiProviderType {
  Gemini = 'Gemini',
  Groq = 'Groq',
  Zhipu = 'Zhipu',
  LocalHeuristic = 'LocalHeuristic',
}

/**
 * Defines AI coaching and evaluation task types tracked for quota and routing.
 */
export enum AiTaskType {
  SpeakingDialogue = 'SpeakingDialogue',
  SentenceAnalysis = 'SentenceAnalysis',
  WritingEvaluation = 'WritingEvaluation',
  SmartSenseSelection = 'SmartSenseSelection',
  OcrExtraction = 'OcrExtraction',
}

/**
 * Represents the identity provider used during authentication.
 */
export enum AuthProviderType {
  Email = 'Email',
  Google = 'Google',
}

/**
 * Represents standardized certification proficiency levels (CEFR A0-C2) mapped from database migrations.
 */
export enum CertLevel {
  A0 = 'A0',
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
}

/**
 * Represents a participant's enrollment and completion status in a commitment challenge.
 */
export enum ChallengeParticipantStatus {
  Pending = 'Pending',
  Active = 'Active',
  Failed = 'Failed',
  Completed = 'Completed',
  Refunded = 'Refunded',
}

/**
 * Defines reward settlement choices for completed challenges.
 */
export enum ChallengeRewardChoice {
  Cash = 'Cash',
  Pro = 'Pro',
  Refund = 'Refund',
  ExtendSubscription = 'ExtendSubscription',
  Donate = 'Donate',
}

/**
 * Represents the campaign status of a learning commitment challenge.
 */
export enum ChallengeStatus {
  Draft = 'Draft',
  Open = 'Open',
  Active = 'Active',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

/**
 * Author of a message in the AI coach conversation.
 */
export enum CoachMessageSender {
  Tutor = 'tutor',
  Student = 'student',
}

/**
 * Represents the monetary currency used in billing orders and payouts.
 */
export enum CurrencyType {
  Vnd = 'Vnd',
  Usd = 'Usd',
}

/**
 * Represents the generation status of a daily reading comprehension exercise.
 */
export enum DailyReadingStatus {
  Generating = 'Generating',
  Ready = 'Ready',
  Failed = 'Failed',
  Archived = 'Archived',
}

/**
 * Defines standardized exam types ('Toeic', 'Vstep', 'VnuBac3', 'Thpt').
 */
export enum ExamType {
  Toeic = 'Toeic',
  Vstep = 'Vstep',
  VnuBac3 = 'VnuBac3',
  Thpt = 'Thpt',
}

/**
 * Represents the pronunciation clarity rating (V0-V3) in the Speaking Foundation curriculum.
 */
export enum FoundationClarityRating {
  V0 = 'V0',
  V1 = 'V1',
  V2 = 'V2',
  V3 = 'V3',
}

/**
 * Represents the sensory or linguistic modality used in the Grade 6 Foundation curriculum.
 */
export enum FoundationModalityType {
  Text = 'Text',
  Audio = 'Audio',
  Visual = 'Visual',
  SyntacticFrame = 'SyntacticFrame',
}

/**
 * Represents the numeric difficulty tier of a grammar exercise.
 */
export enum GrammarDifficultyLevel {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

/**
 * Represents the question format of a grammar practice exercise.
 */
export enum GrammarExerciseType {
  MultipleChoice = 'MultipleChoice',
  FillBlank = 'FillBlank',
  ErrorCorrection = 'ErrorCorrection',
}

/**
 * Represents the origin source of a grammar lesson document.
 */
export enum GrammarLessonSource {
  MaiLanHuongPdf = 'MaiLanHuongPdf',
  WebScrape = 'WebScrape',
  Ai = 'Ai',
}

/**
 * Represents the difficulty or CEFR tier of a canonical grammar topic.
 */
export enum GrammarLevel {
  A0 = 'A0',
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

/**
 * Represents foundational grammar micro-stages for early-stage learners.
 */
export enum GrammarMicroStage {
  A0 = 'A0',
  A1 = 'A1',
}

/**
 * Represents the observer source that recorded a learner's lexical speaking evidence.
 */
export enum LexicalEvidenceSource {
  Learner = 'Learner',
  Teacher = 'Teacher',
  System = 'System',
}

/**
 * Represents the diagnostic classification bucket of a learner's speaking lexical mastery.
 */
export enum LexicalStatusBucket {
  Solid = 'Solid',
  Partial = 'Partial',
  Unknown = 'Unknown',
  Uncertain = 'Uncertain',
  Recheck = 'Recheck',
}

/**
 * Represents the scaffolding support level required by a learner during speaking production.
 */
export enum LexicalSupportLevel {
  Independent = 'Independent',
  Modelled = 'Modelled',
  Prompted = 'Prompted',
  NotYet = 'NotYet',
}

/**
 * Represents the product category of a billing order.
 */
export enum OrderKind {
  Individual = 'Individual',
  Group = 'Group',
  Challenge = 'Challenge',
}

/**
 * Represents the transaction settlement status of a billing order.
 */
export enum OrderStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Failed = 'Failed',
  Refunded = 'Refunded',
  Expired = 'Expired',
}

/**
 * Represents the grammatical part-of-speech classification of a vocabulary term.
 */
export enum PartOfSpeechType {
  Noun = 'Noun',
  Verb = 'Verb',
  Adjective = 'Adjective',
  Adverb = 'Adverb',
  Pronoun = 'Pronoun',
  Preposition = 'Preposition',
  Conjunction = 'Conjunction',
  Interjection = 'Interjection',
  PhrasalVerb = 'PhrasalVerb',
  Idiom = 'Idiom',
}

/**
 * Represents the payment gateway or method selected for an order.
 */
export enum PaymentMethodType {
  VnPay = 'VnPay',
  MoMo = 'MoMo',
  BankTransfer = 'BankTransfer',
  Manual = 'Manual',
}

/**
 * Defines approval statuses for ambassador cash payout requests.
 */
export enum PayoutRequestStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Completed = 'Completed',
  Requested = 'Requested',
  Processing = 'Processing',
  Paid = 'Paid',
}

/**
 * Defines CRM pipeline statuses for B2B teacher and school pilot leads.
 */
export enum PilotLeadStatus {
  New = 'New',
  Contacted = 'Contacted',
  Qualified = 'Qualified',
  Won = 'Won',
  Lost = 'Lost',
  ActivePilot = 'ActivePilot',
  Converted = 'Converted',
  Closed = 'Closed',
}

/**
 * Represents the assessment domain of an interactive practice quiz.
 */
export enum QuizType {
  Vocabulary = 'Vocabulary',
  Grammar = 'Grammar',
}

/**
 * Represents the corpus or examination source of a reading library article.
 */
export enum ReadingArticleSourceType {
  Vstep = 'Vstep',
  Toeic = 'Toeic',
  Voa = 'Voa',
  Race = 'Race',
  OpenStax = 'OpenStax',
  Custom = 'Custom',
}

/**
 * Represents the editorial publication status of a reading library article.
 */
export enum ReadingArticleStatus {
  Draft = 'Draft',
  Published = 'Published',
  Archived = 'Archived',
}

/**
 * Defines conversion lifecycle statuses for referral logs.
 */
export enum ReferralLogStatus {
  Registered = 'Registered',
  Activated = 'Activated',
  Converted = 'Converted',
  FraudFlagged = 'FraudFlagged',
  Pending = 'Pending',
  Qualified = 'Qualified',
  Rewarded = 'Rewarded',
  Rejected = 'Rejected',
}

/**
 * Defines clearance statuses for ambassador reward transactions.
 */
export enum RewardTransactionStatus {
  PendingClearance = 'PendingClearance',
  Available = 'Available',
  Deducted = 'Deducted',
  Withdrawn = 'Withdrawn',
  Cancelled = 'Cancelled',
  Clawback = 'Clawback',
  Pending = 'Pending',
  Completed = 'Completed',
}

/**
 * Defines transaction types in the ambassador reward ledger.
 */
export enum RewardTransactionType {
  ProDays = 'ProDays',
  CashCommission = 'CashCommission',
  AffiliateCash = 'AffiliateCash',
  MilestoneBonus = 'MilestoneBonus',
  PayoutDebit = 'PayoutDebit',
  ClawbackDebt = 'ClawbackDebt',
  ReferralBonus = 'ReferralBonus',
  ChallengeRefund = 'ChallengeRefund',
  StreakMilestone = 'StreakMilestone',
  PayoutWithdrawal = 'PayoutWithdrawal',
}

/**
 * Represents the assessment tier within a learning roadmap unit.
 */
export enum RoadmapAssessmentTier {
  MiniQuiz = 'MiniQuiz',
  Checkpoint = 'Checkpoint',
  ExitExam = 'ExitExam',
}

/**
 * Represents canonical level identifiers across CEFR, THPT, and TOEIC learning tracks.
 */
export enum RoadmapLevelId {
  A0 = 'A0',
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  Lop10 = 'Lop10',
  Lop11 = 'Lop11',
  Lop12 = 'Lop12',
  Toeic450 = 'Toeic450',
  Toeic650 = 'Toeic650',
  Toeic800 = 'Toeic800',
  C1 = 'C1',
  C2 = 'C2',
}

/**
 * Represents the completion status of an individual roadmap station step.
 */
export enum RoadmapStepStatus {
  Locked = 'Locked',
  InProgress = 'InProgress',
  Completed = 'Completed',
}

/**
 * Represents the curriculum track type for a learner's personalized study roadmap.
 */
export enum RoadmapTrackType {
  Cefr = 'Cefr',
  Thpt = 'Thpt',
  Toeic = 'Toeic',
  Vstep = 'Vstep',
  VnuBac3 = 'VnuBac3',
}

/**
 * Represents the spaced repetition scheduler algorithm version applied to a review card.
 */
export enum SrsAlgorithmVersion {
  Sm2 = 'Sm2',
  TsFsrs = 'TsFsrs',
}

/**
 * Represents the FSRS v5 scheduling state of a vocabulary flashcard.
 */
export enum SrsCardState {
  New = 'New',
  Learning = 'Learning',
  Review = 'Review',
  Relearning = 'Relearning',
}

/**
 * Represents the learner self-evaluation quality rating during an FSRS flashcard review.
 */
export enum SrsReviewQuality {
  Again = 'Again',
  Hard = 'Hard',
  Good = 'Good',
  Easy = 'Easy',
}

/**
 * Represents the lifecycle status of a collaborative study group.
 */
export enum StudyGroupStatus {
  Active = 'Active',
  Expired = 'Expired',
  Cancelled = 'Cancelled',
}

/**
 * Represents the reason a user's subscription plan was updated.
 */
export enum SubscriptionChangeReason {
  Upgrade = 'Upgrade',
  Downgrade = 'Downgrade',
  Expired = 'Expired',
  AdminManual = 'AdminManual',
  Payment = 'Payment',
}

/**
 * Represents the subscription tier assigned to a user account.
 */
export enum SubscriptionPlanType {
  Free = 'Free',
  Pro = 'Pro',
  Premium = 'Premium',
  School = 'School',
}

/**
 * Multiple-choice answer keys of a TOEIC question.
 */
export enum ToeicAnswerOption {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

/**
 * Represents the 7 standard parts of an official ETS TOEIC Listening & Reading exam.
 */
export enum ToeicPart {
  Part1 = 'Part1',
  Part2 = 'Part2',
  Part3 = 'Part3',
  Part4 = 'Part4',
  Part5 = 'Part5',
  Part6 = 'Part6',
  Part7 = 'Part7',
}

/**
 * Represents a learner's reading progress status on a library article.
 */
export enum UserReadingProgressStatus {
  InProgress = 'InProgress',
  Completed = 'Completed',
  Bookmarked = 'Bookmarked',
}

/**
 * Represents the system authorization role assigned to an authenticated user.
 */
export enum UserRole {
  Student = 'Student',
  Teacher = 'Teacher',
  Admin = 'Admin',
}

/**
 * Represents a learner's progression status on a curated vocabulary pack.
 */
export enum VocabPackStatus {
  NotStarted = 'NotStarted',
  InProgress = 'InProgress',
  Completed = 'Completed',
}

/**
 * Defines moderation statuses for vocabulary words ('Pending', 'Approved', 'Rejected').
 */
export enum WordApprovalStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

