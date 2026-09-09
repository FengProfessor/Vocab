import { TestRunner, expect } from './test-harness';
import {
  loadToeicPartPractice,
  resolveToeicMediaUrl,
} from '@/lib/toeic-test-loader';
import { calculateToeicScore } from '@/lib/toeic-scoring';
import fs from 'node:fs';
import path from 'node:path';

export async function runUserFeedbackV4Tests(runner: TestRunner) {
  runner.describe('User Feedback V4: Bank Part Practice, Palette UI, Part Score Report', () => {

    // 1. Part Practice with Bank & Limit
    runner.it('V4-1: loadToeicPartPractice loads 6 questions from bank for Part 1 with continuous numbering 1..6', () => {
      const questions = loadToeicPartPractice(1, 'bank', 6, true);
      expect(questions.length).toBe(6);
      expect(questions[0].questionNumber).toBe(1);
      expect(questions[5].questionNumber).toBe(6);
      expect(questions.every((q) => q.part === 1)).toBe(true);
    });

    runner.it('V4-2: loadToeicPartPractice loads 18 questions from bank for Part 1 with continuous numbering 1..18', () => {
      const questions = loadToeicPartPractice(1, 'bank', 18, true);
      expect(questions.length).toBe(18);
      expect(questions[0].questionNumber).toBe(1);
      expect(questions[17].questionNumber).toBe(18);
      expect(questions.every((q) => q.part === 1)).toBe(true);
    });

    runner.it('V4-3: loadToeicPartPractice loads 30 questions from bank for Part 5 with continuous numbering 1..30', () => {
      const questions = loadToeicPartPractice(5, 'bank', 30, true);
      expect(questions.length).toBe(30);
      expect(questions[0].questionNumber).toBe(1);
      expect(questions[29].questionNumber).toBe(30);
      expect(questions.every((q) => q.part === 5)).toBe(true);
    });

    runner.it('V4-4: loadToeicPartPractice loads from specific test with limit (e.g. estudyme-test-1, Part 5, limit 10)', () => {
      const questions = loadToeicPartPractice(5, 'estudyme-test-1', 10, true);
      expect(questions.length).toBe(10);
      expect(questions[0].questionNumber).toBe(1);
      expect(questions[9].questionNumber).toBe(10);
      expect(questions.every((q) => q.part === 5)).toBe(true);
    });

    runner.it('V4-5: resolveToeicMediaUrl cleans double slash in Google Cloud Storage URLs to prevent HTTP 400', () => {
      const buggyUrl = 'https://storage.googleapis.com//estudyme/legacy-data/kslearning/images/418922160-1620725865601-pic1.png';
      const cleanUrl = resolveToeicMediaUrl(buggyUrl);
      expect(cleanUrl).toBe('https://storage.googleapis.com/estudyme/legacy-data/kslearning/images/418922160-1620725865601-pic1.png');
      expect(cleanUrl?.includes('storage.googleapis.com//')).toBe(false);
    });

    // 2. UI Layout: Palette button does not overlap Next question button
    runner.it('V4-6: ToeicQuestionPalette floating trigger is elevated (bottom-20) to prevent overlapping Next Question button', () => {
      const palettePath = path.resolve(__dirname, '../../src/components/toeic/ToeicQuestionPalette.tsx');
      const paletteCode = fs.readFileSync(palettePath, 'utf8');
      expect(paletteCode.includes('bottom-20')).toBe(true);
      expect(paletteCode.includes('sm:bottom-6')).toBe(false);
    });

    runner.it('V4-7: ToeicSplitPane includes Palette button inside the footer navigation bar', () => {
      const splitPanePath = path.resolve(__dirname, '../../src/components/toeic/ToeicSplitPane.tsx');
      const splitPaneCode = fs.readFileSync(splitPanePath, 'utf8');
      expect(splitPaneCode.includes('onOpenPalette')).toBe(true);
      expect(splitPaneCode.includes('Bảng câu hỏi')).toBe(true);
    });

    runner.it('V4-8: ToeicExamHeader includes Palette button in the top action controls', () => {
      const headerPath = path.resolve(__dirname, '../../src/components/toeic/ToeicExamHeader.tsx');
      const headerCode = fs.readFileSync(headerPath, 'utf8');
      expect(headerCode.includes('onOpenPalette')).toBe(true);
      expect(headerCode.includes('Bảng câu hỏi')).toBe(true);
    });

    // 3. Score Report: Part Practice Mode
    runner.it('V4-9: Short test (6 questions Part 1) is classified as !isFullTest in ToeicScoreReportView', () => {
      const scoreViewPath = path.resolve(__dirname, '../../src/components/toeic/ToeicScoreReportView.tsx');
      const scoreViewCode = fs.readFileSync(scoreViewPath, 'utf8');
      expect(scoreViewCode.includes('isFullTest')).toBe(true);
      expect(scoreViewCode.includes('PART_FEEDBACK')).toBe(true);
      expect(scoreViewCode.includes('isFullTest ?')).toBe(true);
      expect(scoreViewCode.includes('Kết quả làm bài')).toBe(true);
      expect(scoreViewCode.includes('Báo cáo kết quả luyện tập TOEIC')).toBe(true);
    });

    runner.it('V4-10: calculateToeicScore accurately tallies raw score for 6-question Part 1 test', () => {
      const questions = loadToeicPartPractice(1, 'bank', 6, true);
      const answers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
      // Answer 4 correctly, 2 incorrectly
      for (let i = 0; i < 6; i++) {
        const correct = (questions[i].correctAnswer || 'A') as 'A' | 'B' | 'C' | 'D';
        answers[i + 1] = i < 4 ? correct : (correct === 'A' ? 'B' : 'A');
      }

      const result = calculateToeicScore(answers, questions, 120);
      expect(result.rawTotal).toBe(4);
      expect(result.rawListening).toBe(4);
      expect(result.rawReading).toBe(0);
      expect(result.partStats[1].correct).toBe(4);
      expect(result.partStats[1].total).toBe(6);
      expect(result.partStats[1].percentage).toBe(67);
    });

    runner.it('V4-11: GuestSaveExamModal distinguishes full test and part practice modes', () => {
      const modalPath = path.resolve(__dirname, '../../src/components/toeic/GuestSaveExamModal.tsx');
      const modalCode = fs.readFileSync(modalPath, 'utf8');
      expect(modalCode.includes('isFullTest?: boolean')).toBe(true);
      expect(modalCode.includes('totalQuestions?: number')).toBe(true);
      expect(modalCode.includes('partNum?: number | null')).toBe(true);
      expect(modalCode.includes('effectiveIsFullTest ?')).toBe(true);
      expect(modalCode.includes('câu đúng')).toBe(true);
      expect(modalCode.includes('Tốc độ TB')).toBe(true);
      expect(modalCode.includes('Lưu kết quả luyện tập vào bảng lịch sử cá nhân')).toBe(true);
    });

    runner.it('V4-12: ToeicExam page passes isFullTest, totalQuestions, and partNum to GuestSaveExamModal', () => {
      const examPagePath = path.resolve(__dirname, '../../src/app/toeic/exam/[examId]/page.tsx');
      const examPageCode = fs.readFileSync(examPagePath, 'utf8');
      expect(examPageCode.includes('isFullTest={isFullTestExam}')).toBe(true);
      expect(examPageCode.includes('totalQuestions={questions.length}')).toBe(true);
      expect(examPageCode.includes('partNum={partNum}')).toBe(true);
    });

  });
}

// Standalone execution
if (process.argv[1]?.includes('user-feedback-v4.test')) {
  const runner = new TestRunner();
  runUserFeedbackV4Tests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\nUser Feedback V4 Results: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
