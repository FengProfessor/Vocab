import {
  CertLevel,
  ToeicAnswerOption,
  ToeicPart,
} from '@/types/enums';

export interface ServerToeicSubmissionResponseDto {
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
}

export interface ServerVstepScoreResult {
  rawAverage: number;
  roundedScore: number;
  certLevel: string | null;
  statusLabel: string;
}

export interface ServerWritingEvaluationDto {
  overallScore: number;
  taskAchievement: number;
  coherenceAndCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  overallFeedbackVi: string;
}

export interface ToeicQuestionDto {
  id: string;
  questionNumber: number;
  part: ToeicPart;
  prompt: string;
  passageText?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  options: Record<ToeicAnswerOption, string>;
  correctOption: ToeicAnswerOption;
  explanationVi: string;
}

export interface ToeicScoreReportDto {
  listeningRaw: number;
  readingRaw: number;
  listeningScaled: number;
  readingScaled: number;
  totalScaled: number;
  cefrBand: string;
}

export interface TranscriptCueDto {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
  translation?: string;
  speaker?: string;
}

export interface VstepRawSkillScoresDto {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
}

export interface VstepScoreResultDto {
  skillScores: VstepRawSkillScoresDto;
  rawAverage: number;
  overallScore: number;
  achievedLevel: CertLevel | 'BELOW_B1';
  summaryVi: string;
}

export interface EvaluateEssayParams {
  promptText: string;
  essayText: string;
}

export type * from '@/types/toeic';
export type { VnuBac3CatalogItem } from '@/types/vnu-bac-3';
export type {
  VstepSkillType,
  VstepCefrLevel,
  VstepExamMode,
  VstepQuestion,
  VstepPassage,
  VstepTask,
  VstepSection,
  VstepScoreResult,
} from '@/lib/vstep-types';
