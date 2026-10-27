/**
 * VNU Test Bậc 3 Split-Pane Layout Component (4-Skill Support & Technical Minimalist)
 * File: src/components/vnu-bac-3/VnuSplitPane.tsx
 */


import React, { useState, useEffect } from 'react';
import {
  Flag,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Volume2,
  FileText,
  Mic,
  Sparkles,
  Edit3,
} from 'lucide-react';
import {
  VnuBac3Exam,
  VnuBac3Question,
  VnuBac3Task,
  VnuBac3Section,
  VnuBac3ExamMode,
  VnuBac3QuestionReview,
  WritingEvalResult,
} from '@/types/vnu-bac-3';
import { VnuAudioPlayer } from './VnuAudioPlayer';
import { ExamInteractiveText } from '@/components/exam/ExamInteractiveText';
import {
  stripHtmlTags,
  cleanOptionText,
  cleanQuestionPrompt,
} from '@/components/toeic/ToeicSplitPane';

interface ExplanationData {
  questionId: string;
  correctAnswer: string;
  explanationVi: string;
  transcript?: string;
  vocabularyNotes?: Array<{ word: string; meaning: string; ipa?: string }>;
}

interface VnuSplitPaneProps {
  exam: VnuBac3Exam;
  currentQuestionId: string;
  userAnswers: Record<string, string>;
  flaggedQuestions: Record<string, boolean>;
  mode: VnuBac3ExamMode;
  sessionToken?: string;
  onAnswerSelect: (questionId: string, answer: string) => void;
  onToggleFlag: (questionId: string) => void;
  onNavigateQuestion: (nextId: string) => void;
  onRequestExplain?: (questionId: string) => Promise<ExplanationData | null>;
  isReviewMode?: boolean;
  showReviewModal?: boolean;
  reviewQuestions?: VnuBac3QuestionReview[];
  writingDrafts?: Record<string, string>;
  speakingNotes?: Record<string, string>;
  writingEvals?: Record<string, WritingEvalResult>;
  evaluatingTaskId?: string | null;
  onWritingDraftChange?: (taskId: string, draft: string) => void;
  onSpeakingNotesChange?: (taskId: string, notes: string) => void;
  onEvaluateWriting?: (taskId: string, prompt: string, minWords: number, text: string) => Promise<void>;
  onOpenPalette?: () => void;
}

function countWords(str?: string): number {
  if (!str) return 0;
  const trimmed = str.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

export function VnuSplitPane({
  exam,
  currentQuestionId,
  userAnswers,
  flaggedQuestions,
  mode,
  onAnswerSelect,
  onToggleFlag,
  onNavigateQuestion,
  onRequestExplain,
  isReviewMode = false,
  showReviewModal = false,
  reviewQuestions,
  writingDrafts,
  speakingNotes,
  writingEvals,
  evaluatingTaskId,
  onWritingDraftChange,
  onSpeakingNotesChange,
  onEvaluateWriting,
  onOpenPalette,
}: VnuSplitPaneProps) {
  const [explanations, setExplanations] = useState<Record<string, ExplanationData>>({});
  const [loadingExplainId, setLoadingExplainId] = useState<string | null>(null);
  const [viewModeOverride, setViewModeOverride] = useState<Record<string, 'all' | 'single'>>({});

  // Trạng thái cho Writing
  const [localWritingDraft, setLocalWritingDraft] = useState<string>('');
  const [showSampleAnswer, setShowSampleAnswer] = useState<boolean>(false);
  const [showWritingTemplate, setShowWritingTemplate] = useState<boolean>(true);

  // Trạng thái cho Speaking
  const [localSpeakingNotes, setLocalSpeakingNotes] = useState<string>('');

  // 1. Tìm thông tin Section, Task và Question hoặc Task Tự luận hiện tại
  let currentSection: VnuBac3Section | null = null;
  let currentTask: VnuBac3Task | null = null;
  let currentQuestion: VnuBac3Question | null = null;
  const allItemIds: string[] = [];
  const allTasks: VnuBac3Task[] = [];

  for (const s of exam.sections) {
    for (const t of s.tasks) {
      allTasks.push(t);
      if (t.questions && t.questions.length > 0) {
        for (const q of t.questions) {
          allItemIds.push(q.id);
          if (q.id === currentQuestionId) {
            currentSection = s;
            currentTask = t;
            currentQuestion = q;
          }
        }
        if (t.id === currentQuestionId && !currentTask) {
          currentSection = s;
          currentTask = t;
          currentQuestion = t.questions[0];
        }
      } else {
        // Writing hoặc Speaking task
        allItemIds.push(t.id);
        const isMatched =
          t.id === currentQuestionId ||
          Boolean(t.writingPrompts?.some((wp) => wp.id === currentQuestionId)) ||
          Boolean(t.speakingPrompts?.some((sp) => sp.id === currentQuestionId));

        if (isMatched) {
          currentSection = s;
          currentTask = t;
        }
      }
    }
  }

  // Điều hướng giữa các Task / Part
  const currentTaskIndex = allTasks.findIndex((t) => t.id === currentTask?.id);
  const prevTask = currentTaskIndex > 0 ? allTasks[currentTaskIndex - 1] : null;
  const nextTask = currentTaskIndex < allTasks.length - 1 ? allTasks[currentTaskIndex + 1] : null;

  const getTaskTargetId = (task: VnuBac3Task): string => {
    if (task.questions && task.questions.length > 0) {
      return task.questions[0].id;
    }
    return task.id;
  };

  // Nhận diện phần dùng chung ngữ liệu (Shared Stimulus Tasks):
  // - Reading có passage (Part 2 Cloze 8 câu, Part 3 T/F 5 câu, Part 4 Đọc hiểu 5 câu)
  // - Listening Part 3 (Hội thoại dài 6 câu)
  const isSharedStimulusTask = Boolean(
    currentSection &&
    currentTask &&
    currentTask.questions &&
    currentTask.questions.length > 1 &&
    (
      (currentSection.type === 'reading' && Boolean(currentTask.passage)) ||
      (currentSection.type === 'listening' && (
        currentTask.partNumber === 3 ||
        Number(currentTask.partNumber) === 3 ||
        currentTask.id.includes('part3') ||
        Boolean(currentTask.title?.includes('Part 3'))
      ))
    )
  );

  const defaultMode: 'all' | 'single' = isSharedStimulusTask ? 'all' : 'single';
  const currentTaskId = currentTask?.id;
  const currentViewMode: 'all' | 'single' =
    currentTaskId && viewModeOverride[currentTaskId]
      ? viewModeOverride[currentTaskId]
      : defaultMode;

  const handleSetViewMode = (mode: 'all' | 'single') => {
    if (currentTaskId) {
      setViewModeOverride((prev) => ({ ...prev, [currentTaskId]: mode }));
    }
  };

  // Tự động cuộn mượt tới câu hỏi đang focus khi ở chế độ 'all'
  useEffect(() => {
    if (currentViewMode === 'all' && currentQuestionId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`vnu-question-${currentQuestionId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionId, currentViewMode]);

  const taskQuestions = currentTask?.questions || [];
  const taskAnsweredCount = taskQuestions.filter((q) => Boolean(userAnswers[q.id])).length;

  // Khôi phục nháp Writing từ localStorage khi chuyển Task
  const isWritingSection = currentSection?.type === 'writing';
  const isSpeakingSection = currentSection?.type === 'speaking';

  useEffect(() => {
    if (!isWritingSection || !currentTaskId) return;
    const storageKey = `vnu_b3_writing_${exam.id}_${currentTaskId}`;
    let draft = writingDrafts?.[currentTaskId] || '';
    if (!draft && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) draft = saved;
      } catch {
        // ignore
      }
    }
    setLocalWritingDraft(draft);
    setShowSampleAnswer(false);
  }, [isWritingSection, currentTaskId, exam.id, writingDrafts]);

  // Khôi phục ghi chú Speaking từ localStorage khi chuyển Task
  useEffect(() => {
    if (!isSpeakingSection || !currentTaskId) return;
    const storageKey = `vnu_b3_speaking_${exam.id}_${currentTaskId}`;
    let notes = speakingNotes?.[currentTaskId] || '';
    if (!notes && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) notes = saved;
      } catch {
        // ignore
      }
    }
    setLocalSpeakingNotes(notes);
  }, [isSpeakingSection, currentTaskId, exam.id, speakingNotes]);

  // Fallback nếu chưa chọn mục nào hoặc id không tồn tại
  if (!currentQuestion && !currentTask && allItemIds.length > 0) {
    const firstId = allItemIds[0];
    onNavigateQuestion(firstId);
    return null;
  }

  if (!currentSection || !currentTask) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono">
        Đang tải nội dung phòng thi...
      </div>
    );
  }

  const currentIdInList = currentQuestion?.id || currentTask.id;
  const currentIndex = allItemIds.indexOf(currentIdInList);
  const prevId = currentIndex > 0 ? allItemIds[currentIndex - 1] : null;
  const nextId = currentIndex < allItemIds.length - 1 ? allItemIds[currentIndex + 1] : null;

  // Xử lý auto-save Writing
  const handleWritingDraftChange = (text: string) => {
    setLocalWritingDraft(text);
    if (currentTask) {
      try {
        localStorage.setItem(`vnu_b3_writing_${exam.id}_${currentTask.id}`, text);
      } catch {
        // ignore
      }
      onWritingDraftChange?.(currentTask.id, text);
    }
  };

  // Xử lý auto-save Speaking
  const handleSpeakingNotesChange = (text: string) => {
    setLocalSpeakingNotes(text);
    if (currentTask) {
      try {
        localStorage.setItem(`vnu_b3_speaking_${exam.id}_${currentTask.id}`, text);
      } catch {
        // ignore
      }
      onSpeakingNotesChange?.(currentTask.id, text);
    }
  };

  // =========================================================================
  // GIAO DIỆN WRITING (TASK 1 & TASK 2)
  // =========================================================================
  if (currentSection.type === 'writing') {
    const writingPrompt = currentTask.writingPrompts?.[0];
    const taskNumber = currentTask.partNumber || writingPrompt?.taskNumber || 1;
    const minWords = writingPrompt?.minWords || (taskNumber === 1 ? 80 : 100);
    const wordCount = countWords(localWritingDraft);
    const isWordCountMet = wordCount >= minWords;
    const isFlagged = Boolean(flaggedQuestions[currentTask.id]);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[calc(100vh-140px)] min-h-[500px]">
        {/* CỘT TRÁI: ĐỀ BÀI WRITING & DATA CARD / TOPIC CHOICES */}
        <div className="lg:col-span-6 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden shadow-xs">
          {/* Header Stimulus */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {currentSection.label} — {currentTask.title}
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-none border border-blue-200 dark:border-blue-900">
              Yêu cầu: ≥ {minWords} từ
            </span>
          </div>

          {/* Nội dung Stimulus cuộn độc lập */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            {/* Hướng dẫn chung của Task */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-l-2 border-blue-500 rounded-none text-xs text-slate-600 dark:text-slate-300 italic font-mono">
              {currentTask.instructions}
            </div>

            {/* Chi tiết Prompt */}
            {writingPrompt && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1">
                  {writingPrompt.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {writingPrompt.instructions}
                </p>

                {/* Task 1: Bảng dữ liệu Data Card */}
                {writingPrompt.dataCard && (
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-sm p-3.5 space-y-2.5">
                    <div className="text-xs font-mono font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Thông tin cho trước (Data Card):</span>
                    </div>
                    <div className="space-y-1.5 font-sans text-xs">
                      {Object.entries(writingPrompt.dataCard).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-none"
                        >
                          <span className="font-mono font-bold text-slate-600 dark:text-slate-300 sm:w-36 flex-shrink-0">
                            {key}:
                          </span>
                          <span className="text-slate-900 dark:text-slate-100 font-medium">
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task 2: Danh sách Topic Choices & Guidelines */}
                {writingPrompt.topicChoices && writingPrompt.topicChoices.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      Chọn 1 trong 2 chủ đề:
                    </div>
                    {writingPrompt.topicChoices.map((choice) => (
                      <div
                        key={choice.code}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-sm space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-600 text-white font-mono text-xs font-bold rounded-none">
                            Topic {choice.code}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {choice.topic}
                          </h4>
                        </div>
                        {choice.guidelines && choice.guidelines.length > 0 && (
                          <div className="space-y-1 pl-2 border-l-2 border-slate-300 dark:border-slate-600 ml-1">
                            <div className="text-[11px] font-mono text-slate-500 font-semibold">
                              Gợi ý:
                            </div>
                            <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
                              {choice.guidelines.map((g, idx) => (
                                <li key={idx}>{g}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Khung sườn lắp ghép nhanh chuẩn B1 (Chỉ hiện ở Practice / Review Mode) */}
                {(mode === 'practice' || isReviewMode) && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowWritingTemplate(!showWritingTemplate)}
                      className="w-full flex items-center justify-between p-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 rounded-sm font-mono text-xs font-bold transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>
                          {taskNumber === 1
                            ? 'Khung câu đơn chuẩn B1 (Task 1 • ≥80 từ)'
                            : 'Khung 4 câu điền từ chuẩn B1 (Task 2 • ≥100 từ)'}
                        </span>
                      </span>
                      <span>{showWritingTemplate ? '▲ Thu gọn' : '▼ Mở công thức'}</span>
                    </button>

                    {showWritingTemplate && (
                      <div className="p-3.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-sm space-y-2.5 text-xs">
                        {taskNumber === 1 ? (
                          <>
                            <p className="text-slate-600 dark:text-slate-300 font-medium">
                              Mẹo B1: Thêm Chủ ngữ + Động từ (<code className="font-mono text-blue-700 dark:text-blue-300">S + V + O</code>) để chuyển từng dòng thông tin thành câu đơn hoàn chỉnh:
                            </p>
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 font-mono text-[11px] leading-relaxed space-y-1 text-slate-800 dark:text-slate-200">
                              <p><strong>1. Mở đoạn:</strong> We are happy to announce [Sự kiện / Nhân vật]...</p>
                              <p><strong>2. Ý 1 &amp; 2:</strong> [He/She/It] is [Thông tin dòng 1 &amp; 2].</p>
                              <p><strong>3. Ý 3 &amp; 4:</strong> This year, [triển khai dòng 3 &amp; 4 bằng câu đơn giản].</p>
                              <p><strong>4. Kết đoạn:</strong> Please join us / Contact us for more details.</p>
                            </div>
                            {!isReviewMode && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleWritingDraftChange(
                                    `We are pleased to announce [Tên sự kiện / nhân vật]. First, [Dòng thông tin 1]. Second, [Dòng thông tin 2]. In addition, [Dòng thông tin 3]. Finally, [Dòng thông tin 4]. We hope everyone will join and support this event.`
                                  )
                                }
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[11px] font-bold rounded-none transition-colors cursor-pointer"
                              >
                                + Chèn khung sườn vào bài làm
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-slate-600 dark:text-slate-300 font-medium">
                              Mẹo B1: Viết 1 đoạn văn (~6 câu). Phần khung cố định đã có sẵn <strong>~50 từ</strong>, điền thêm ý vào ngoặc vuông là đủ 100 từ:
                            </p>
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 font-mono text-[11px] leading-relaxed space-y-1 text-slate-800 dark:text-slate-200">
                              <p><strong>1. Mở đoạn:</strong> The benefits / effects of [Chủ đề] are numerous.</p>
                              <p><strong>2. Ý 1 + Giải thích:</strong> First, one main point is [Ý chính 1]. This is because [Giải thích ngắn]. For example, [Ví dụ thực tế].</p>
                              <p><strong>3. Ý 2 + Giải thích:</strong> Second, another important point is [Ý chính 2]. It is clear that [Giải thích ngắn]. For instance, [Ví dụ thực tế].</p>
                              <p><strong>4. Kết đoạn:</strong> In short, [Chủ đề] brings great benefits / big changes, such as [Ý 1] and [Ý 2].</p>
                            </div>
                            {!isReviewMode && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleWritingDraftChange(
                                    `The benefits of [Chủ đề] are numerous. First, one main benefit of [Chủ đề] is [Ý chính 1]. This is because [Giải thích đơn giản]. For example, [Ví dụ ngắn]. Second, another important benefit is [Ý chính 2]. It is clear that [Giải thích đơn giản]. For instance, [Ví dụ ngắn]. In short, [Chủ đề] brings many positive changes to our lives, such as [Ý 1] and [Ý 2].`
                                  )
                                }
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[11px] font-bold rounded-none transition-colors cursor-pointer"
                              >
                                + Chèn khung mẫu vào bài làm
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Bài viết mẫu (Hiển thị trong Practice Mode hoặc Review Mode) */}
                {(mode === 'practice' || isReviewMode) && writingPrompt.sampleAnswer && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowSampleAnswer(!showSampleAnswer)}
                      className="w-full flex items-center justify-between p-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-sm font-mono text-xs font-bold transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Bài viết mẫu tham khảo (Chuẩn B1)</span>
                      </span>
                      <span>{showSampleAnswer ? '▲ Thu gọn' : '▼ Xem bài mẫu'}</span>
                    </button>

                    {showSampleAnswer && (
                      <div className="mt-2 p-3.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-sm space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <span className="font-bold text-emerald-700 dark:text-emerald-300">
                            Chuẩn B1 CEFR
                          </span>
                          <span>Độ dài: {countWords(writingPrompt.sampleAnswer)} từ</span>
                        </div>
                        <div className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line font-sans select-text">
                          {writingPrompt.sampleAnswer}
                        </div>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-mono space-y-0.5">
                          <p className="font-bold text-slate-600 dark:text-slate-400">
                            Tiêu chí tự đối chiếu:
                          </p>
                          <p>• Trả lời đầy đủ thông tin đề bài với câu đơn đúng ngữ pháp.</p>
                          <p>• Đạt độ dài tối thiểu (≥ {minWords} từ).</p>
                          <p>• Sử dụng từ nối đơn giản (First, Second, Also, In short).</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: KHUNG SOẠN THẢO ESSAY & BỘ ĐẾM TỪ REAL-TIME */}
        <div className="lg:col-span-6 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden shadow-xs">
          {/* Header khung bài làm */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-600 text-white rounded-none">
                Bài viết Task {taskNumber}
              </span>
              {/* Word Count Status Indicator */}
              {isWordCountMet ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-[11px] font-bold rounded-none border border-emerald-300 dark:border-emerald-800">
                  Đạt ({wordCount}/{minWords} từ)
                </span>
              ) : wordCount > 0 ? (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono text-[11px] font-bold rounded-none border border-amber-300 dark:border-amber-800">
                  Chưa đủ ({wordCount}/{minWords} từ • -{minWords - wordCount})
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-mono text-[11px] rounded-none">
                  0/{minWords} từ
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onToggleFlag(currentTask.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-none border transition-colors cursor-pointer ${
                isFlagged
                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current text-amber-600' : ''}`} />
              <span>{isFlagged ? 'Đã gắn cờ' : 'Gắn cờ'}</span>
            </button>
          </div>

          {/* Textarea Editor & Bộ đếm từ */}
          <div className="flex-1 p-4 flex flex-col space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Nội dung bài viết:</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tự động lưu nháp</span>
              </span>
            </div>

            <textarea
              value={localWritingDraft}
              onChange={(e) => handleWritingDraftChange(e.target.value)}
              readOnly={isReviewMode}
              placeholder={`Nhập nội dung bài viết (tối thiểu ${minWords} từ)... Tự động lưu nháp.`}
              className="flex-1 w-full min-h-[240px] p-3.5 text-base sm:text-sm font-sans leading-relaxed text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 resize-y"
              spellCheck={false}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span>
                  Số từ:{' '}
                  <strong
                    className={
                      isWordCountMet
                        ? 'text-emerald-600 font-bold'
                        : 'text-slate-800 dark:text-slate-200'
                    }
                  >
                    {wordCount}
                  </strong>{' '}
                  / {minWords} từ
                </span>
                <span className="ml-2 text-[11px]">
                  {isWordCountMet ? (
                    <span className="text-emerald-600 font-semibold">
                      ✓ Đạt
                    </span>
                  ) : (
                    <span className="text-amber-600">
                      (Thiếu {minWords - wordCount} từ)
                    </span>
                  )}
                </span>
              </div>

              {onEvaluateWriting && (
                <button
                  type="button"
                  disabled={wordCount < 5 || evaluatingTaskId === currentTask.id}
                  onClick={() =>
                    onEvaluateWriting(
                      currentTask.id,
                      `${writingPrompt?.title || currentTask.title}\n${writingPrompt?.instructions || currentTask.instructions}`,
                      minWords,
                      localWritingDraft
                    )
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-sm border transition-all ${
                    wordCount >= 5 && evaluatingTaskId !== currentTask.id
                      ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-2xs'
                      : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {evaluatingTaskId === currentTask.id
                      ? 'Đang chấm...'
                      : writingEvals?.[currentTask.id]
                        ? 'Chấm lại (Rubric B1)'
                        : 'Chấm điểm (Rubric B1)'}
                  </span>
                </button>
              )}
            </div>

            {/* Khung kết quả chấm bài Writing theo Rubric 4 tiêu chí */}
            {writingEvals?.[currentTask.id] && (() => {
              const evalData = writingEvals[currentTask.id];
              return (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-indigo-200 dark:border-indigo-900 rounded-sm space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 font-mono font-bold text-indigo-900 dark:text-indigo-200">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Đánh giá bài viết (Rubric B1)</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-2 py-0.5 bg-indigo-600 text-white font-bold rounded-none">
                        {evalData.overallScore.toFixed(1)} / 10.0
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800 rounded-none">
                        Mức: {evalData.cefrBand}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none">
                      <div className="flex items-center justify-between font-mono font-bold text-slate-700 dark:text-slate-200 mb-1">
                        <span>1. Task Fulfillment</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{evalData.criteria.taskFulfillment.score.toFixed(1)}/10</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {evalData.criteria.taskFulfillment.feedback}
                      </p>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none">
                      <div className="flex items-center justify-between font-mono font-bold text-slate-700 dark:text-slate-200 mb-1">
                        <span>2. Organization</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{evalData.criteria.organization.score.toFixed(1)}/10</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {evalData.criteria.organization.feedback}
                      </p>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none">
                      <div className="flex items-center justify-between font-mono font-bold text-slate-700 dark:text-slate-200 mb-1">
                        <span>3. Vocabulary</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{evalData.criteria.vocabulary.score.toFixed(1)}/10</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {evalData.criteria.vocabulary.feedback}
                      </p>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none">
                      <div className="flex items-center justify-between font-mono font-bold text-slate-700 dark:text-slate-200 mb-1">
                        <span>4. Grammar</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{evalData.criteria.grammar.score.toFixed(1)}/10</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {evalData.criteria.grammar.feedback}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="space-y-1">
                      <div className="font-mono font-bold text-[11px] text-emerald-700 dark:text-emerald-400">
                        Điểm mạnh:
                      </div>
                      <ul className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300 list-disc list-inside">
                        {evalData.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <div className="font-mono font-bold text-[11px] text-amber-700 dark:text-amber-400">
                        Cần cải thiện:
                      </div>
                      <ul className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300 list-disc list-inside">
                        {evalData.improvements.map((imp, i) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Footer điều hướng: Câu trước / Câu sau */}
          <div className="p-3 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 flex items-center justify-between sticky bottom-0 z-20 shadow-md sm:static sm:shadow-none">
            <button
              type="button"
              disabled={!prevId}
              onClick={() => prevId && onNavigateQuestion(prevId)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-sm border transition-all ${
                prevId
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shadow-xs'
                  : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800/40 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Câu trước</span>
            </button>

            {onOpenPalette ? (
              <button
                type="button"
                onClick={onOpenPalette}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shadow-2xs transition-colors"
                title="Mở danh sách câu hỏi"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Mục {currentIndex + 1} / {allItemIds.length}</span>
              </button>
            ) : (
              <span className="text-xs font-mono text-slate-500">
                Mục {currentIndex + 1} / {allItemIds.length}
              </span>
            )}

            <button
              type="button"
              disabled={!nextId}
              onClick={() => nextId && onNavigateQuestion(nextId)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold rounded-sm border transition-all ${
                nextId
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:scale-95 cursor-pointer shadow-xs'
                  : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800/40 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <span>Câu tiếp</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // GIAO DIỆN SPEAKING (PART 1 & PART 2)
  // =========================================================================
  if (currentSection.type === 'speaking') {
    const speakingPrompt = currentTask.speakingPrompts?.[0];
    const partNumber = currentTask.partNumber || speakingPrompt?.partNumber || 1;
    const isFlagged = Boolean(flaggedQuestions[currentTask.id]);
    const notesWordCount = countWords(localSpeakingNotes);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[calc(100vh-140px)] min-h-[500px]">
        {/* CỘT TRÁI: ĐỀ BÀI SPEAKING & CÂU HỎI / CUE CARDS */}
        <div className="lg:col-span-6 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden shadow-xs">
          {/* Header Stimulus */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {currentSection.label} — {currentTask.title}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {partNumber === 1 ? '~3 phút' : '~5 phút'}
            </span>
          </div>

          {/* Nội dung Stimulus cuộn độc lập */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            {/* Hướng dẫn chung của Part */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-l-2 border-blue-500 rounded-none text-xs text-slate-600 dark:text-slate-300 italic font-mono">
              {currentTask.instructions}
            </div>

            {/* Part 1: Danh sách câu hỏi Social Interaction */}
            {partNumber === 1 && speakingPrompt?.questions && (
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Câu hỏi phỏng vấn:</span>
                  <span className="text-[10px] text-slate-400">
                    {speakingPrompt.questions.length} câu
                  </span>
                </div>
                {speakingPrompt.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-sm flex items-start gap-3"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-none bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 pt-0.5 leading-relaxed">
                      {q}
                    </p>
                  </div>
                ))}

                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-sm text-xs font-mono text-blue-800 dark:text-blue-300 space-y-1">
                  <div className="font-bold">Gợi ý trả lời:</div>
                  <p>• Trả lời tự nhiên từ 2–3 câu hoàn chỉnh cho mỗi câu hỏi.</p>
                  <p>• Mở rộng ý bằng lý do (Because...) hoặc ví dụ thực tế (For example...).</p>
                </div>
              </div>
            )}

            {/* Part 2: Thẻ gợi ý Cue Cards & Follow-up Questions */}
            {partNumber === 2 && speakingPrompt?.cueCards && (
              <div className="space-y-4">
                <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Chọn 1 trong 2 thẻ đề (Cue Card):
                </div>
                {speakingPrompt.cueCards.map((card) => (
                  <div
                    key={card.code}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-sm space-y-3"
                  >
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span className="px-2 py-0.5 bg-blue-600 text-white font-mono text-xs font-bold rounded-none">
                        {card.code}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {card.title}
                      </h4>
                    </div>

                    {card.prompts && card.prompts.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-mono text-slate-500 font-bold">
                          You should say:
                        </div>
                        <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-200 space-y-1 pl-1">
                          {card.prompts.map((p, idx) => (
                            <li key={idx} className="font-medium">
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {card.furtherQuestions && card.furtherQuestions.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="text-[11px] font-mono text-blue-700 dark:text-blue-300 font-bold">
                          Câu hỏi mở rộng:
                        </div>
                        <ol className="list-decimal list-inside text-xs text-slate-700 dark:text-slate-200 space-y-1 pl-1">
                          {card.furtherQuestions.map((fq, idx) => (
                            <li key={idx}>{fq}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: KHUNG GHI CHÚ DÀN Ý OUTLINE */}
        <div className="lg:col-span-6 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden shadow-xs">
          {/* Header khung bài làm */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-600 text-white rounded-none">
                Dàn ý nói
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {notesWordCount > 0 ? `${notesWordCount} từ` : 'Chưa có ghi chú'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onToggleFlag(currentTask.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-none border transition-colors cursor-pointer ${
                isFlagged
                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current text-amber-600' : ''}`} />
              <span>{isFlagged ? 'Đã gắn cờ' : 'Gắn cờ'}</span>
            </button>
          </div>

          {/* Textarea Outline & Hướng dẫn */}
          <div className="flex-1 p-4 flex flex-col space-y-3 overflow-hidden">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-mono space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" />
                <span>Chiến thuật 1 phút chuẩn bị:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Ghi chú từ khóa chính, cụm danh từ hoặc tính từ. Tránh viết cả câu để không bị lệ thuộc khi nói.
              </p>
            </div>

            <textarea
              value={localSpeakingNotes}
              onChange={(e) => handleSpeakingNotesChange(e.target.value)}
              readOnly={isReviewMode}
              placeholder="Ghi chú nhanh dàn ý (Mở đầu → Ý chính 1 → Ý chính 2 → Kết luận)... Tự động lưu nháp."
              className="flex-1 w-full min-h-[300px] p-3.5 text-base sm:text-sm leading-relaxed text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 resize-none font-mono"
              spellCheck={false}
            />

            <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Dàn ý: {notesWordCount} từ</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã lưu nháp</span>
              </span>
            </div>
          </div>

          {/* Footer điều hướng: Câu trước / Câu sau */}
          <div className="p-3 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 flex items-center justify-between sticky bottom-0 z-20 shadow-md sm:static sm:shadow-none">
            <button
              type="button"
              disabled={!prevId}
              onClick={() => prevId && onNavigateQuestion(prevId)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-sm border transition-all ${
                prevId
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shadow-xs'
                  : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800/40 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Câu trước</span>
            </button>

            {onOpenPalette ? (
              <button
                type="button"
                onClick={onOpenPalette}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shadow-2xs transition-colors"
                title="Mở danh sách câu hỏi"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Mục {currentIndex + 1} / {allItemIds.length}</span>
              </button>
            ) : (
              <span className="text-xs font-mono text-slate-500">
                Mục {currentIndex + 1} / {allItemIds.length}
              </span>
            )}

            <button
              type="button"
              disabled={!nextId}
              onClick={() => nextId && onNavigateQuestion(nextId)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold rounded-sm border transition-all ${
                nextId
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:scale-95 cursor-pointer shadow-xs'
                  : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800/40 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <span>Câu tiếp</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // GIAO DIỆN READING VÀ LISTENING (PRESERVED 100%)
  // =========================================================================
  if (!currentQuestion) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono">
        Đang tải câu hỏi...
      </div>
    );
  }

  const selectedAnswer = userAnswers[currentQuestion.id];
  const isFlagged = Boolean(flaggedQuestions[currentQuestion.id]);

  // Lấy giải thích chi tiết cho câu hỏi (trong Review hoặc Practice)
  const getQuestionExplanation = (qId: string): ExplanationData | undefined => {
    const activeReview = reviewQuestions?.find((rq) => rq.id === qId);
    const reviewExplanation: ExplanationData | undefined = activeReview
      ? {
          questionId: activeReview.id,
          correctAnswer: activeReview.correctAnswer,
          explanationVi: activeReview.explanationVi,
          transcript: activeReview.transcript,
          vocabularyNotes: activeReview.vocabularyNotes,
        }
      : undefined;
    return explanations[qId] || reviewExplanation;
  };

  const explanation = getQuestionExplanation(currentQuestion.id);
  const isInteractiveEnabled = Boolean(isReviewMode || showReviewModal || explanation);

  const isAnswerKeyMatch = (correctKey?: string, optKey?: string) => {
    if (!correctKey || !optKey) return false;
    const c = correctKey.trim().toUpperCase();
    const o = optKey.trim().toUpperCase();
    if (c === o) return true;
    if ((c === 'TRUE' || c === 'CORRECT') && o === 'A') return true;
    if ((c === 'FALSE' || c === 'INCORRECT') && o === 'B') return true;
    return false;
  };

  // Xử lý lấy giải thích trong Practice Mode
  const handleFetchQuestionExplanation = async (qId: string) => {
    if (!onRequestExplain || explanations[qId]) return;
    setLoadingExplainId(qId);
    try {
      const data = await onRequestExplain(qId);
      if (data) {
        setExplanations((prev) => ({ ...prev, [qId]: data }));
      }
    } finally {
      setLoadingExplainId(null);
    }
  };

  const handleFetchExplanation = () => {
    if (currentQuestion) {
      handleFetchQuestionExplanation(currentQuestion.id);
    }
  };
  const loadingExplain = Boolean(currentQuestion && loadingExplainId === currentQuestion.id);

  const isListening = currentSection.type === 'listening';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4 lg:h-[calc(100vh-68px)]">
      {/* ================= CỘT TRÁI: STIMULUS (BÀI ĐỌC / AUDIO / CHỈ DẪN) ================= */}
      <div className="lg:col-span-6 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden shadow-xs">
        {/* Header Stimulus siêu gọn */}
        <div className="px-2.5 py-1 sm:py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide truncate">
            {currentSection.label} — {currentTask.title}
          </div>
          <span className="text-[11px] font-mono text-slate-500 shrink-0 ml-2">
            Phần {currentTask.partNumber}
          </span>
        </div>

        {/* Nội dung Stimulus cuộn độc lập (trên mobile khống chế max-h để câu trả lời luôn hiển thị) */}
        <div className="flex-1 p-2 sm:p-3 overflow-y-auto max-h-[30vh] sm:max-h-[38vh] lg:max-h-none space-y-2 sm:space-y-3 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
          {/* Hướng dẫn chung của Task (ẩn trên mobile để ưu tiên thấy đáp án) */}
          <div className="hidden sm:block p-2 bg-slate-50 dark:bg-slate-800/50 border-l-2 border-blue-500 rounded-none text-xs text-slate-600 dark:text-slate-300 italic font-mono">
            {currentTask.instructions}
          </div>

          {/* Nếu là bài nghe: Hiển thị Audio Player */}
          {isListening && (
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 pt-0.5 pb-2">
              <VnuAudioPlayer
                examId={exam.id}
                taskId={currentTask.id}
                audioUrl={currentTask.media?.audioUrl}
                title={currentTask.title}
                mode={mode}
                maxPlays={currentTask.playCountLimit || 2}
              />
            </div>
          )}

          {/* Nếu là Reading Part 1 (Signs & Notices): Khung Biển Báo / Thông Báo gọn gàng */}
          {currentSection.type === 'reading' && !currentTask.passage && currentQuestion.prompt && (
            <div className="my-1 sm:my-2 flex flex-col items-center justify-center">
              <div className="w-full max-w-md bg-amber-50/70 dark:bg-slate-800/90 border border-slate-700 dark:border-slate-400 p-2.5 sm:p-3.5 text-center shadow-2xs">
                <div className="inline-block px-2 py-0.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono text-[10px] font-bold tracking-wider mb-1">
                  Sign / Notice #{currentQuestion.questionNumber}
                </div>
                <div className="whitespace-pre-line font-mono font-bold text-xs sm:text-base tracking-wide text-slate-900 dark:text-slate-100 leading-snug select-text">
                  <ExamInteractiveText
                    text={stripHtmlTags(currentQuestion.prompt)}
                    enabled={isInteractiveEnabled}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Nếu là bài đọc có Passage: Hiển thị bài đọc */}
          {currentTask.passage && (
            <div className="space-y-2">
              {currentTask.passage.title && (
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1">
                  <ExamInteractiveText
                    text={stripHtmlTags(currentTask.passage.title)}
                    enabled={isInteractiveEnabled}
                  />
                </h3>
              )}
              <div className="whitespace-pre-line text-slate-700 dark:text-slate-200 text-xs sm:text-sm leading-relaxed font-sans select-text">
                <ExamInteractiveText
                  text={stripHtmlTags(currentTask.passage.text)}
                  enabled={isInteractiveEnabled}
                />
              </div>
            </div>
          )}

          {/* Nếu sau khi làm bài hoặc có transcript trong practice */}
          {explanation?.transcript && (
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-sm space-y-1 mt-2">
              <div className="text-xs font-bold font-mono text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Transcript bài nghe</span>
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line font-mono select-text">
                <ExamInteractiveText
                  text={stripHtmlTags(explanation.transcript)}
                  enabled={isInteractiveEnabled}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= CỘT PHẢI: INTERACTIVE QUESTION PANEL ================= */}
      <div className="lg:col-span-6 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden shadow-xs">
        {/* Header câu hỏi siêu gọn */}
        <div className="px-2.5 py-1 sm:py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          {currentViewMode === 'all' ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-600 text-white rounded-none shrink-0">
                Câu {taskQuestions[0]?.questionNumber}–{taskQuestions[taskQuestions.length - 1]?.questionNumber}
              </span>
              <span className="text-[11px] text-slate-500 font-mono truncate hidden sm:inline">
                ({taskAnsweredCount}/{taskQuestions.length} câu)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-600 text-white rounded-none shrink-0">
                Câu {currentQuestion.questionNumber}
              </span>
              <span className="text-[11px] text-slate-500 font-mono shrink-0">
                / {allItemIds.length} mục
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {/* Nút gạt chế độ Tất cả / Từng câu (nếu task có từ 2 câu trở lên) */}
            {taskQuestions.length > 1 && (
              <div className="flex items-center bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-xs text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => handleSetViewMode('all')}
                  className={`px-2 py-0.5 rounded-2xs font-semibold transition-all cursor-pointer ${
                    currentViewMode === 'all'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={`Hiển thị danh sách tất cả ${taskQuestions.length} câu hỏi`}
                >
                  Tất cả ({taskQuestions.length} câu)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode('single')}
                  className={`px-2 py-0.5 rounded-2xs font-semibold transition-all cursor-pointer ${
                    currentViewMode === 'single'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Hiển thị từng câu hỏi độc lập"
                >
                  Từng câu
                </button>
              </div>
            )}

            {/* Nút gắn cờ ở header (chỉ hiển thị ở chế độ single vì ở chế độ all mỗi câu đã có cờ riêng) */}
            {currentViewMode === 'single' && (
              <button
                type="button"
                onClick={() => onToggleFlag(currentQuestion!.id)}
                className={`flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded-none border transition-colors cursor-pointer ${
                  isFlagged
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700 font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current text-amber-600' : ''}`} />
                <span className="hidden sm:inline">{isFlagged ? 'Đã cờ' : 'Gắn cờ'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Chế độ Tất cả: Danh sách cuộn độc lập các câu hỏi trong Task */}
        {currentViewMode === 'all' ? (
          <div className="flex-1 p-2.5 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4">
            {taskQuestions.map((q) => {
              const isCurrentFocus = q.id === currentQuestionId;
              const qSelectedAnswer = userAnswers[q.id];
              const isQFlagged = Boolean(flaggedQuestions[q.id]);
              const qExplanation = getQuestionExplanation(q.id);

              return (
                <div
                  key={q.id}
                  id={`vnu-question-${q.id}`}
                  onClick={() => {
                    if (currentQuestionId !== q.id) {
                      onNavigateQuestion(q.id);
                    }
                  }}
                  className={`p-3 sm:p-4 rounded-sm border transition-all duration-150 scroll-mt-14 sm:scroll-mt-4 ${
                    isCurrentFocus
                      ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Header câu hỏi */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded-none ${
                          isCurrentFocus
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        Câu {q.questionNumber}
                      </span>
                      {qSelectedAnswer && (
                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã chọn: {qSelectedAnswer}</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFlag(q.id);
                      }}
                      className={`flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded-none border transition-colors cursor-pointer ${
                        isQFlagged
                          ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}
                      title={isQFlagged ? 'Bỏ cờ câu này' : 'Gắn cờ câu này'}
                    >
                      <Flag className={`w-3.5 h-3.5 ${isQFlagged ? 'fill-current text-amber-600' : ''}`} />
                      <span className="hidden sm:inline">{isQFlagged ? 'Đã cờ' : 'Gắn cờ'}</span>
                    </button>
                  </div>

                  {/* Nếu là Reading Part 1 (Signs & Notices): Hiển thị trực tiếp nội dung Biển báo trong Card khi ở chế độ xem tất cả */}
                  {currentSection.type === 'reading' && !currentTask.passage && q.prompt && (
                    <div className="mb-2.5 p-2.5 bg-amber-50/70 dark:bg-slate-800/90 border border-slate-700 dark:border-slate-400 text-center rounded-xs shadow-2xs">
                      <div className="inline-block px-2 py-0.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono text-[10px] font-bold tracking-wider mb-1">
                        Sign / Notice #{q.questionNumber}
                      </div>
                      <div className="whitespace-pre-line font-mono font-bold text-xs sm:text-sm tracking-wide text-slate-900 dark:text-slate-100 leading-snug select-text">
                        {q.prompt}
                      </div>
                    </div>
                  )}

                  {/* Prompt / Câu hỏi */}
                  {q.prompt && (
                    <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-pre-line leading-snug sm:leading-relaxed mb-2.5 select-text">
                      <ExamInteractiveText
                        text={
                          currentSection.type === 'reading' && !currentTask.passage
                            ? `What does Sign / Notice #${q.questionNumber} mean?`
                            : cleanQuestionPrompt(q.prompt)
                        }
                        enabled={Boolean(isReviewMode || showReviewModal || qExplanation)}
                      />
                    </div>
                  )}

                  {/* Danh sách lựa chọn (A, B, C hoặc True, False) */}
                  <div className="space-y-1.5 sm:space-y-2">
                    {q.options.map((opt) => {
                      const isSelected = qSelectedAnswer === opt.key;
                      const isCorrectAnswer = Boolean(
                        qExplanation && isAnswerKeyMatch(qExplanation.correctAnswer, opt.key)
                      );
                      const isWrongSelection = Boolean(
                        qExplanation && isSelected && !isCorrectAnswer
                      );
                      const isOptionInteractive = Boolean(
                        isReviewMode || showReviewModal || qExplanation
                      );

                      let optionStyle =
                        'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200';

                      if (qExplanation) {
                        if (isCorrectAnswer) {
                          optionStyle =
                            'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500/30';
                        } else if (isWrongSelection) {
                          optionStyle =
                            'border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 ring-1 ring-rose-400/30';
                        }
                      } else if (isSelected) {
                        optionStyle =
                          'border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 font-semibold shadow-xs';
                      }

                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={(e) => {
                            const target = e.target as HTMLElement | null;
                            if (
                              target?.closest?.('.exam-lookup-trigger') ||
                              target?.closest?.('.exam-lookup-card')
                            ) {
                              return;
                            }
                            e.stopPropagation();
                            if (!isReviewMode) {
                              onAnswerSelect(q.id, opt.key);
                              if (currentQuestionId !== q.id) {
                                onNavigateQuestion(q.id);
                              }
                            }
                          }}
                          className={`w-full min-h-[38px] sm:min-h-[42px] p-2 sm:p-2.5 text-left border rounded-sm flex items-start gap-2.5 transition-all ${
                            isReviewMode ? 'cursor-default' : 'cursor-pointer'
                          } ${isOptionInteractive ? 'select-text' : ''} ${optionStyle}`}
                        >
                          <span
                            className={`flex-shrink-0 w-5 h-5 rounded-none flex items-center justify-center font-mono text-xs font-bold border mt-0.5 ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="text-xs sm:text-sm leading-snug sm:leading-relaxed flex-1 pt-0.5">
                            <ExamInteractiveText
                              text={cleanOptionText(opt.text, opt.key)}
                              enabled={isOptionInteractive}
                            />
                          </span>
                          {qExplanation && isCorrectAnswer && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          )}
                          {qExplanation && isWrongSelection && (
                            <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Nút Xem giải thích trong Practice Mode */}
                  {mode === 'practice' && !isReviewMode && !qExplanation && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFetchQuestionExplanation(q.id);
                        }}
                        disabled={loadingExplainId === q.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 rounded-sm transition-colors cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{loadingExplainId === q.id ? 'Đang tải...' : 'Xem giải thích'}</span>
                      </button>
                    </div>
                  )}

                  {/* Hộp hiển thị Lời giải thích On-Demand */}
                  {qExplanation && (
                    <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-sm space-y-2 mt-3">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                          Giải thích câu {q.questionNumber}
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-none">
                          Đáp án đúng: {qExplanation.correctAnswer}
                        </span>
                      </div>
                      <div
                        className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans"
                        dangerouslySetInnerHTML={{ __html: qExplanation.explanationVi }}
                      />

                      {qExplanation.vocabularyNotes && qExplanation.vocabularyNotes.length > 0 && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                          <div className="text-[11px] font-mono font-bold text-slate-500">
                            Từ vựng lưu ý:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                            {qExplanation.vocabularyNotes.map((voc, idx) => (
                              <div
                                key={idx}
                                className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none"
                              >
                                <span className="font-bold text-blue-700 dark:text-blue-400">
                                  {voc.word}
                                </span>
                                {voc.ipa && (
                                  <span className="text-slate-400 text-[11px] ml-1">{voc.ipa}</span>
                                )}
                                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                                  {voc.meaning}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Chế độ Từng câu: Giữ nguyên giao diện 1 câu gọn gàng */
          <div className="flex-1 p-2.5 sm:p-4 overflow-y-auto space-y-2 sm:space-y-3">
            {/* Prompt / Câu hỏi */}
            {currentQuestion.prompt && (
              <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-pre-line leading-snug sm:leading-relaxed select-text">
                <ExamInteractiveText
                  text={
                    currentSection.type === 'reading' && !currentTask.passage
                      ? `What does Sign / Notice #${currentQuestion.questionNumber} mean?`
                      : cleanQuestionPrompt(currentQuestion.prompt)
                  }
                  enabled={isInteractiveEnabled}
                />
              </div>
            )}

            {/* Danh sách lựa chọn (A, B, C hoặc True, False) */}
            <div className="space-y-1.5 sm:space-y-2">
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedAnswer === opt.key;
                const isCorrectAnswer = Boolean(
                  explanation && isAnswerKeyMatch(explanation.correctAnswer, opt.key)
                );
                const isWrongSelection = Boolean(explanation && isSelected && !isCorrectAnswer);

                let optionStyle =
                  'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200';

                if (explanation) {
                  if (isCorrectAnswer) {
                    optionStyle =
                      'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500/30';
                  } else if (isWrongSelection) {
                    optionStyle =
                      'border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 ring-1 ring-rose-400/30';
                  }
                } else if (isSelected) {
                  optionStyle =
                    'border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 font-semibold shadow-xs';
                }

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={(e) => {
                      const target = e.target as HTMLElement | null;
                      if (
                        target?.closest?.('.exam-lookup-trigger') ||
                        target?.closest?.('.exam-lookup-card')
                      ) {
                        return;
                      }
                      if (!isReviewMode) {
                        onAnswerSelect(currentQuestion!.id, opt.key);
                      }
                    }}
                    className={`w-full min-h-[42px] sm:min-h-[46px] p-2 sm:p-2.5 text-left border rounded-sm flex items-start gap-2.5 transition-all ${
                      isReviewMode ? 'cursor-default' : 'cursor-pointer'
                    } ${isInteractiveEnabled ? 'select-text' : ''} ${optionStyle}`}
                  >
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded-none flex items-center justify-center font-mono text-xs font-bold border mt-0.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="text-xs sm:text-sm leading-snug sm:leading-relaxed flex-1 pt-0.5">
                      <ExamInteractiveText
                        text={cleanOptionText(opt.text, opt.key)}
                        enabled={isInteractiveEnabled}
                      />
                    </span>
                    {explanation && isCorrectAnswer && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    )}
                    {explanation && isWrongSelection && (
                      <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Nút Xem giải thích trong Practice Mode */}
            {mode === 'practice' && !isReviewMode && !explanation && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFetchExplanation}
                  disabled={loadingExplain}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 rounded-sm transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{loadingExplain ? 'Đang tải...' : 'Xem giải thích'}</span>
                </button>
              </div>
            )}

            {/* Hộp hiển thị Lời giải thích On-Demand */}
            {explanation && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-sm space-y-3 mt-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                    Giải thích câu {currentQuestion.questionNumber}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-none">
                    Đáp án đúng: {explanation.correctAnswer}
                  </span>
                </div>
                <div
                  className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: explanation.explanationVi }}
                />

                {explanation.vocabularyNotes && explanation.vocabularyNotes.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="text-[11px] font-mono font-bold text-slate-500">
                      Từ vựng lưu ý:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                      {explanation.vocabularyNotes.map((voc, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none"
                        >
                          <span className="font-bold text-blue-700 dark:text-blue-400">
                            {voc.word}
                          </span>
                          {voc.ipa && (
                            <span className="text-slate-400 text-[11px] ml-1">{voc.ipa}</span>
                          )}
                          <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                            {voc.meaning}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer điều hướng: Câu trước / Câu sau hoặc Phần trước / Phần sau */}
        <div className="p-3 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 flex items-center justify-between sticky bottom-0 z-20 shadow-md lg:static lg:shadow-none">
          {currentViewMode === 'all' ? (
            <>
              <button
                type="button"
                disabled={!prevTask}
                onClick={() => prevTask && onNavigateQuestion(getTaskTargetId(prevTask))}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-sm border transition-all ${
                  prevTask
                    ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shadow-xs'
                    : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800/40 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Phần trước</span>
              </button>

              {onOpenPalette ? (
                <button
                  type="button"
                  onClick={onOpenPalette}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shadow-2xs transition-colors"
                  title="Mở danh sách câu hỏi"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đã làm {taskAnsweredCount}/{taskQuestions.length} câu</span>
                </button>
              ) : (
                <span className="text-xs font-mono text-slate-500">
                  Đã làm {taskAnsweredCount}/{taskQuestions.length} câu
                </span>
              )}

              <button
                type="button"
                disabled={!nextTask}
                onClick={() => nextTask && onNavigateQuestion(getTaskTargetId(nextTask))}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold rounded-sm border transition-all ${
                  nextTask
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:scale-95 cursor-pointer shadow-xs'
                    : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800/40 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <span>Phần tiếp</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={!prevId}
                onClick={() => prevId && onNavigateQuestion(prevId)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-sm border transition-all ${
                  prevId
                    ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shadow-xs'
                    : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800/40 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Câu trước</span>
              </button>

              {onOpenPalette ? (
                <button
                  type="button"
                  onClick={onOpenPalette}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shadow-2xs transition-colors"
                  title="Mở danh sách câu hỏi"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>{currentIndex + 1} / {allItemIds.length}</span>
                </button>
              ) : (
                <span className="text-xs font-mono text-slate-500">
                  {currentIndex + 1} / {allItemIds.length}
                </span>
              )}

              <button
                type="button"
                disabled={!nextId}
                onClick={() => nextId && onNavigateQuestion(nextId)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold rounded-sm border transition-all ${
                  nextId
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:scale-95 cursor-pointer shadow-xs'
                    : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800/40 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <span>Câu tiếp</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
