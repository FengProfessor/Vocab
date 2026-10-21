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
