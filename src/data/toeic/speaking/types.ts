/**
 * TOEIC Speaking Types & Schema Definitions
 * Phục vụ hệ thống luyện thi nói chuẩn hóa ETS TOEIC Speaking (11 câu hỏi, thang điểm 0-200, cấp độ Level 1 - Level 8)
 */

export type ToeicSpeakingQuestionType =
  | 'read_aloud'           // Q1 - Q2: Đọc to một đoạn văn (Pronunciation, Intonation, Stress)
  | 'describe_picture'     // Q3 - Q4: Miêu tả tranh (Grammar, Prepositions, Present Continuous)
  | 'respond_questions'    // Q5 - Q7: Trả lời câu hỏi khảo sát phỏng vấn (15s - 15s - 30s)
  | 'information_schedule' // Q8 - Q10: Trả lời câu hỏi dựa trên lịch trình/hóa đơn (15s - 15s - 30s)
  | 'express_opinion';     // Q11: Trình bày quan điểm (45s prep, 60s speak, OREO framework)

export interface ToeicSpeakingVocab {
  term: string;
  ipa?: string;
  meaningVi: string;
  collocation?: string;
}

export interface ToeicSpeakingQuestion {
  id: string;
  questionNumber: number; // 1 to 11
  questionType: ToeicSpeakingQuestionType;
  title: string;
  titleVi: string;
  prepTimeSeconds: number;
  speakTimeSeconds: number;
  promptText: string;
  promptVi: string;
  // Specific contextual payloads
  stimulusText?: string; // For Q1-Q2 (text to read)
  imageContext?: {
    sceneDescription: string;
    suggestedFocus: string[]; // e.g. foreground, background, people's action
  };
  scheduleData?: {
    heading: string;
    subheading?: string;
    entries: Array<{ time: string; activity: string; speakerOrLocation?: string; notes?: string }>;
  };
  // Scoring model answers
  sampleAnswerLevel6: string; // Intermediate (130-150 / 200)
  sampleAnswerLevel8: string; // Advanced (180-200 / 200)
  scoringRubricVi: {
    pronunciationAndStress: string;
    grammarAndVocabulary: string;
    coherenceAndRelevance: string;
  };
  keyTipsVi: string[];
  keyVocabulary: ToeicSpeakingVocab[];
}

export interface ToeicSpeakingExam {
  id: string;
  title: string;
  titleVi: string;
  testSet: string;
  difficulty: 'intermediate' | 'advanced';
  totalQuestions: number; // 11
  totalDurationMinutes: number; // ~20 minutes
  questions: ToeicSpeakingQuestion[];
}
