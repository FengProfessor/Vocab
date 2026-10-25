export interface WritingEvalRequest {
  examType?: 'vstep' | 'vnu-bac-3';
  taskId: string;
  taskTitle?: string;
  prompt?: string;
  minWords?: number;
  text: string;
}

export interface WritingEvalCriteriaScore {
  score: number;
  feedback: string;
}

export interface WritingEvalResult {
  taskId: string;
  overallScore: number;
  cefrBand: 'C1' | 'B2' | 'B1' | 'Below B1';
  wordCount: number;
  minWords: number;
  evaluatedAt: string;
  source: 'ai' | 'rubric';
  criteria: {
    taskFulfillment: WritingEvalCriteriaScore;
    organization: WritingEvalCriteriaScore;
    vocabulary: WritingEvalCriteriaScore;
    grammar: WritingEvalCriteriaScore;
  };
  strengths: string[];
  improvements: string[];
}
