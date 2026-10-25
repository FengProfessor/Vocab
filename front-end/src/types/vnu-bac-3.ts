/**
 * VNU Test Bậc 3 (ULIS ĐHQGHN - CEFR B1) Data Contracts & TypeScript Types
 * File: src/types/vnu-bac-3.ts
 */

export type VnuBac3SkillType = 'reading' | 'listening' | 'writing' | 'speaking';

export type VnuBac3ExamMode = 'full_simulation' | 'practice';

export interface VnuBac3Option {
  key: string;       // "A" | "B" | "C" (hoặc "A" | "B" cho True/False)
  text: string;      // Nội dung phương án
}

export interface VnuBac3VocabularyItem {
  word: string;
  ipa?: string;
  meaning: string;
  example?: string;
  partOfSpeech?: string;
}

export interface VnuBac3Question {
  id: string;                         // e.g. "vnu3-r-q1", "vnu3-l-q15"
  questionNumber: number;             // Số thứ tự trong bài thi (Reading: 1..25, Listening: 1..20)
  partNumber: number;                 // 1, 2, 3, 4 (Reading) hoặc 1, 2, 3 (Listening)
  type: 'mcq' | 'true_false' | 'cloze';
  prompt?: string;                    // Câu hỏi hoặc đoạn văn có vị trí khuyết
  options: VnuBac3Option[];           // 3 phương án (A, B, C) hoặc 2 phương án (True, False)
  correctAnswer?: string | number;    // "A" | "B" | "C" hoặc 0 | 1 | 2 (SERVER AUTHORITATIVE - purged on client requests before submit)
  answerIndex?: number;               // 0: A, 1: B, 2: C (SERVER AUTHORITATIVE - purged on client requests)
  explanationVi?: string;             // Lời giải sư phạm tiếng Việt chi tiết (SERVER AUTHORITATIVE - purged before submit)
  vocabularyNotes?: VnuBac3VocabularyItem[]; // Từ vựng ghi chú kèm nghĩa và IPA
  orderNumber?: number;
}

export interface VnuBac3Passage {
  title?: string;                     // Tiêu đề bài đọc hoặc biển báo
  text: string;                       // Nội dung văn bản
  imageUrl?: string;                  // Hình ảnh biển báo nếu có
  translationVi?: string;             // Bản dịch toàn văn tiếng Việt
  wordCount?: number;
}

export interface VnuBac3WritingPrompt {
  id: string;
  taskNumber: 1 | 2;
  title: string;
  instructions: string;
  minWords: number;
  dataCard?: Record<string, string>;
  topicChoices?: Array<{
    code: string;
    topic: string;
    guidelines?: string[];
  }>;
  sampleAnswer?: string;
}

export interface VnuBac3SpeakingCard {
  id: string;
  partNumber: 1 | 2;
  title: string;
  instructions: string;
  durationMinutes: number;
  questions?: string[];
  cueCards?: Array<{
    code: string;
    title: string;
    prompts: string[];
    furtherQuestions: string[];
    sampleResponse?: string;
  }>;
}

export interface VnuBac3Task {
  id: string;                         // e.g. "reading-part1", "listening-part3-rec1"
  partNumber: number;                 // 1, 2, 3, 4
  title: string;                      // e.g. "Part 1: Signs & Notices", "Part 2: Conversations"
  instructions: string;               // Hướng dẫn làm bài
  passage?: VnuBac3Passage;           // Đoạn văn bài đọc (Reading)
  media?: {
    audioUrl?: string;                // Đường dẫn file MP3
    imageUrl?: string;
    durationSeconds?: number;
  };
  playCountLimit?: number;            // Mặc định 2 lần nghe theo quy chế ULIS
  transcript?: string;                // Tapescript bài nghe (SERVER AUTHORITATIVE - purged before submit)
  questions: VnuBac3Question[];
  writingPrompts?: VnuBac3WritingPrompt[];
  speakingPrompts?: VnuBac3SpeakingCard[];
}

export interface VnuBac3Section {
  type: VnuBac3SkillType;             // 'reading' | 'listening' | 'writing' | 'speaking'
  label: string;                      // e.g. "Reading (Đọc Hiểu)", "Listening (Nghe Hiểu)"
  timeLimitMinutes: number;           // 40 cho Reading, 25 cho Listening
  totalQuestions: number;             // 25 cho Reading, 20 cho Listening
  tasks: VnuBac3Task[];
}

export interface VnuBac3Exam {
  id: string;                         // e.g. "ulis-sample-test-01", "cambridge-pet-equiv-01"
  title: string;                      // Tiêu đề đề thi
  series: 'VNU-BAC-3';
  description?: string;
  durationMinutes: number;            // 65 phút cho 2 kỹ năng trắc nghiệm (40' R + 25' L)
  targetLevel: 'B1';
  totalQuestions: number;             // 45 câu (25 Reading + 20 Listening)
  sections: VnuBac3Section[];
  isSampleTest?: boolean;
}

/**
 * Payload gửi lên Server khi thí sinh nộp bài
 */
export interface VnuBac3Submission {
  examId: string;
  mode?: VnuBac3ExamMode;
  answers: Record<string, string>;    // { "vnu3-r-q1": "A", "vnu3-r-q16": "True", ... }
  timeSpentSeconds?: number;
  sessionToken?: string;
}

/**
 * Chi tiết câu hỏi sau khi chấm (dành cho màn hình review)
 */
export interface VnuBac3QuestionReview {
  id: string;
  questionNumber: number;
  partNumber: number;
  skill: VnuBac3SkillType;
  prompt?: string;
  options: VnuBac3Option[];
  userAnswer?: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanationVi: string;
  transcript?: string;
  vocabularyNotes?: VnuBac3VocabularyItem[];
}

/**
 * Báo cáo kết quả chấm điểm chuẩn khảo thí ULIS ĐHQGHN
 */
export interface VnuBac3ScoreResult {
  examId: string;
  readingScore: number;               // 0.0 - 10.0 (làm tròn 0.5)
  readingCorrect: number;             // 0 .. 25
  readingTotal: number;               // 25
  listeningScore: number;             // 0.0 - 10.0 (làm tròn 0.5)
  listeningCorrect: number;           // 0 .. 20
  listeningTotal: number;             // 20
  overallScore: number;               // Trung bình cộng (làm tròn 0.5)
  isPassed: boolean;                  // overallScore >= 6.0 && readingScore >= 2.0 && listeningScore >= 2.0
  statusLabel: 'ĐẠT (BẬC 3 / B1)' | 'CHƯA ĐẠT';
  failureReason?: string;             // Lý do chưa đạt nếu có
  submittedAt: string;
  timeSpentSeconds?: number;
  partBreakdown: Record<string, {
    label: string;
    correct: number;
    total: number;
    accuracy: number;
  }>;
  reviewQuestions?: VnuBac3QuestionReview[];
}

export type VnuBac3Result = VnuBac3ScoreResult;

export type VnuBac3StageId =
  | 'stage-1-diagnostic'
  | 'stage-2-official-practice'
  | 'stage-3-b1-drills'
  | 'stage-4-final-mock';

/**
 * Metadata thông tin hiển thị tại trang danh mục Catalog
 */
export interface VnuBac3CatalogItem {
  id: string;
  orderNumber?: number;
  stageId?: VnuBac3StageId;
  stageLabel?: string;
  recommendedSession?: string;
  grammarFocus?: string;
  title: string;
  series: 'VNU-BAC-3';
  description: string;
  targetLevel: 'B1';
  durationMinutes: number;
  totalQuestions: number;
  readingQuestions: number;
  listeningQuestions: number;
  hasWritingAndSpeaking?: boolean;
  isSampleTest: boolean;
  difficulty: 'Standard B1' | 'Chính thức ULIS';
  tags: string[];
}

export interface WritingEvalCriteriaScore {
  score: number; // 0.0 - 10.0 (step 0.5)
  feedback: string;
}

export interface WritingEvalResult {
  taskId: string;
  overallScore: number; // 0.0 - 10.0 (step 0.5)
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

