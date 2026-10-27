/**
 * Builds the `.NET 10` `SubmitToeicExamCommand` payload from local grading output and raw request fields.
 */
export function mapToeicSubmitToDotNet(
  body: Record<string, any>,
  scoreResult?: Record<string, any> | null,
) {
  return {
    examId: String(body.testId || body.examId || 'toeic-practice'),
    listeningCorrectCount: Number(
      scoreResult?.listeningCorrect ?? body.listeningCorrectCount ?? 0,
    ),
    readingCorrectCount: Number(
      scoreResult?.readingCorrect ?? body.readingCorrectCount ?? 0,
    ),
    durationSeconds: Number(body.timeTakenSeconds ?? body.durationSeconds ?? 0),
  };
}

/**
 * Builds the `.NET 10` `SubmitVstepExamCommand` payload from local grading output and raw request fields.
 */
export function mapVstepSubmitToDotNet(
  body: Record<string, any>,
  resultObj?: Record<string, any> | null,
) {
  const safeResult = resultObj || {};
  return {
    examId: String(body.testId || body.examId || 'vstep-practice'),
    listeningScore: Number(safeResult.listeningScore ?? body.listeningScore ?? 0),
    readingScore: Number(safeResult.readingScore ?? body.readingScore ?? 0),
    writingScore: Number(safeResult.writingScore ?? body.writingScore ?? 0),
    speakingScore: Number(safeResult.speakingScore ?? body.speakingScore ?? 0),
    durationSeconds: Number(body.timeSpentSeconds ?? body.durationSeconds ?? 0),
  };
}
