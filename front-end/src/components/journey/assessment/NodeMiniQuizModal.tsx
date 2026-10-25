'use client';

/**
 * NodeMiniQuizModal
 * Formative gatekeeper after learning/practice inside a Roadmap node.
 * Requires >= 75% pass threshold to complete the node and earn micro-XP.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Volume2,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Clock,
  HelpCircle,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth-fetch';
import { completeRoadmapStep, type CompleteStepResult } from '@/lib/roadmap-client';
import { playWordAudio } from '@/lib/audio';
import { judgeAnswer } from '@/lib/study';

export interface MiniQuizQuestion {
  id: string;
  prompt: string;
  options?: string[];
  answer: string;
  explanation?: string;
  audioWord?: string;
  type?: 'mcq' | 'typing' | 'audio';
  skill?: 'vocab' | 'grammar' | 'pronunciation' | 'reading';
}

export interface NodeMiniQuizModalProps {
  open: boolean;
  onClose: () => void;
  stepId: string;
  stepTitle: string;
  stepType?: string;
  refId?: string;
  track?: 'cefr' | 'thpt';
  levelId?: string;
  questions?: MiniQuizQuestion[];
  onPassed?: (result?: CompleteStepResult | null) => void;
  onReviewLesson?: () => void;
}

/**
 * Sinh câu hỏi mẫu chất lượng cao phù hợp với từng loại node nếu không có câu hỏi truyền vào.
 */
function generateDefaultQuestions(
  stepType = 'vocab',
  stepTitle = 'Bài học',
  refId = ''
): MiniQuizQuestion[] {
  const t = stepType.toLowerCase();

  if (t === 'grammar') {
    return [
      {
        id: 'mq-g1',
        type: 'mcq',
        skill: 'grammar',
        prompt: `Chọn đáp án đúng nhất để hoàn thiện câu liên quan đến cấu trúc trong bài: "${stepTitle}"`,
        options: ['is studying', 'study', 'studied', 'studies'],
        answer: 'is studying',
        explanation: 'Diễn tả một hành động đang xảy ra tại thời điểm nói hoặc mang tính tạm thời.',
      },
      {
        id: 'mq-g2',
        type: 'mcq',
        skill: 'grammar',
        prompt: 'Tìm lỗi sai trong câu: "She don\'t know the answer to this question."',
        options: ["don't", 'know', 'answer', 'this'],
        answer: "don't",
        explanation: 'Chủ ngữ ngôi thứ 3 số ít "She" đi với trợ động từ phủ định "doesn\'t", không dùng "don\'t".',
      },
      {
        id: 'mq-g3',
        type: 'mcq',
        skill: 'grammar',
        prompt: 'Hoàn thành câu: "They have lived here _____ 2018."',
        options: ['since', 'for', 'in', 'at'],
        answer: 'since',
        explanation: 'Trong thì Hiện tại hoàn thành, "since" đi với mốc thời gian (2018), "for" đi với khoảng thời gian.',
      },
    ];
  }

  if (t === 'pronunciation') {
    return [
      {
        id: 'mq-p1',
        type: 'mcq',
        skill: 'pronunciation',
        prompt: `Trong cặp âm của bài "${stepTitle}", từ nào có trọng âm khác với các từ còn lại?`,
        options: ['happy', 'today', 'music', 'water'],
        answer: 'today',
        explanation: '"today" có trọng âm rơi vào âm tiết thứ 2 (to\'day), trong khi các từ còn lại có trọng âm rơi vào âm tiết 1.',
      },
      {
        id: 'mq-p2',
        type: 'mcq',
        skill: 'pronunciation',
        prompt: 'Từ nào có phần gạch chân phát âm là /s/ khi thêm đuôi -s?',
        options: ['books', 'dogs', 'watches', 'plays'],
        answer: 'books',
        explanation: 'Sau âm vô thanh /k/ (book), đuôi -s được phát âm là /s/.',
      },
      {
        id: 'mq-p3',
        type: 'mcq',
        skill: 'pronunciation',
        prompt: 'Âm kết thúc của từ "watched" phát âm là gì?',
        options: ['/t/', '/d/', '/ɪd/', '/ed/'],
        answer: '/t/',
        explanation: 'Sau các âm vô thanh như /tʃ/ (watch), đuôi -ed được phát âm là /t/.',
      },
    ];
  }

  if (t === 'reading' || t === 'cloze' || t === 'arrange' || t === 'announcement' || t === 'leaflet') {
    return [
      {
        id: 'mq-r1',
        type: 'mcq',
        skill: 'reading',
        prompt: `Dựa trên nội dung chủ đề "${stepTitle}", mục đích chính của bài đọc là gì?`,
        options: [
          'Cung cấp thông tin và hướng dẫn chi tiết cho người đọc',
          'Quảng cáo sản phẩm thương mại',
          'Kể một câu chuyện hư cấu',
          'Phê bình một bài viết khác',
        ],
        answer: 'Cung cấp thông tin và hướng dẫn chi tiết cho người đọc',
        explanation: 'Bài viết chủ yếu cung cấp thông tin, phân tích ngữ cảnh và hướng dẫn nhận biết.',
      },
      {
        id: 'mq-r2',
        type: 'mcq',
        skill: 'reading',
        prompt: 'Từ nào đồng nghĩa với "essential" trong ngữ cảnh bài đọc?',
        options: ['important', 'optional', 'useless', 'unusual'],
        answer: 'important',
        explanation: '"essential" có nghĩa là thiết yếu, cực kỳ quan trọng (= important / crucial).',
      },
      {
        id: 'mq-r3',
        type: 'mcq',
        skill: 'reading',
        prompt: 'Thông tin nào sau đây là ĐÚNG theo ngữ cảnh thường gặp?',
        options: [
          'Cần đọc kỹ tiêu đề và từ khóa trước khi làm bài',
          'Chỉ cần dịch từng từ đơn lẻ mà không cần nhìn ngữ cảnh',
          'Bỏ qua các liên từ nối trong câu',
          'Không cần chú ý đến thì của câu',
        ],
        answer: 'Cần đọc kỹ tiêu đề và từ khóa trước khi làm bài',
        explanation: 'Kỹ năng đọc hiểu hiệu quả luôn yêu cầu xác định chủ đề tổng quan và từ khóa chính.',
      },
    ];
  }

  // Mặc định: Từ vựng (vocab)
  return [
    {
      id: 'mq-v1',
      type: 'mcq',
      skill: 'vocab',
      prompt: `Nghĩa tiếng Việt chuẩn xác nhất của từ vựng trọng tâm trong "${stepTitle}" là gì?`,
      options: ['Thực hiện / Đạt được', 'Bỏ qua', 'Trì hoãn', 'Lo sợ'],
      answer: 'Thực hiện / Đạt được',
      explanation: 'Từ vựng cốt lõi biểu thị hành động chủ động hoàn thành mục tiêu đặt ra.',
    },
    {
      id: 'mq-v2',
      type: 'mcq',
      skill: 'vocab',
      prompt: 'Điền từ thích hợp vào chỗ trống: "We need to _____ our skills to succeed."',
      options: ['improve', 'improves', 'improving', 'improved'],
      answer: 'improve',
      explanation: 'Sau cấu trúc "need to + V nguyên mẫu", ta dùng động từ nguyên mẫu không chia "improve".',
    },
    {
      id: 'mq-v3',
      type: 'typing',
      skill: 'vocab',
      prompt: 'Gõ từ tiếng Anh có nghĩa là "sự thành công" (bắt đầu bằng chữ s):',
      answer: 'success',
      explanation: '"success" (danh từ): sự thành công, thắng lợi.',
    },
  ];
}

export function NodeMiniQuizModal({
  open,
  onClose,
  stepId,
  stepTitle,
  stepType = 'vocab',
  refId,
  track = 'cefr',
  levelId,
  questions: propQuestions,
  onPassed,
  onReviewLesson,
}: NodeMiniQuizModalProps) {
  // Lấy câu hỏi từ prop hoặc sinh bộ câu hỏi mặc định
  const quizQuestions = useMemo(() => {
    if (propQuestions && propQuestions.length > 0) return propQuestions;
    return generateDefaultQuestions(stepType, stepTitle, refId);
  }, [propQuestions, stepType, stepTitle, refId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [typedInput, setTypedInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(90);

  // Đếm ngược ~90s
  useEffect(() => {
    if (!open || finished) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [open, finished]);

  // Reset state khi modal mở lại
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setAnswers({});
      setRevealed(false);
      setTypedInput('');
      setSelectedOption(null);
      setFinished(false);
      setIsSubmitting(false);
      setSecondsRemaining(90);
    }
  }, [open, stepId]);

  const currentQ = quizQuestions[currentIndex];

  // Tự động phát âm nếu câu hỏi có audioWord
  useEffect(() => {
    if (open && currentQ && currentQ.audioWord && !revealed) {
      void playWordAudio(currentQ.audioWord);
    }
  }, [open, currentQ, revealed]);

  // Trả lời câu hỏi hiện tại
  const handleSelectOption = (opt: string) => {
    if (revealed) return;
    setSelectedOption(opt);
    setRevealed(true);
    setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
  };

  const handleCheckTyping = () => {
    if (revealed || !typedInput.trim()) return;
    setRevealed(true);
    setAnswers((prev) => ({ ...prev, [currentQ.id]: typedInput.trim() }));
  };

  // Tính điểm
  const calculateResult = useCallback(() => {
    let correctCount = 0;
    for (const q of quizQuestions) {
      const userAns = answers[q.id] || '';
      const isTyping = q.type === 'typing';
      let isCorrect = false;
      if (isTyping) {
        const v = judgeAnswer(userAns, q.answer);
        isCorrect = v === 'correct' || v === 'close';
      } else {
        isCorrect = userAns.trim().toLowerCase() === q.answer.trim().toLowerCase();
      }
      if (isCorrect) correctCount++;
    }
    const total = quizQuestions.length;
    const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 100;
    const passed = scorePct >= 75;
    return { correctCount, total, scorePct, passed };
  }, [quizQuestions, answers]);

  // Chuyển sang câu tiếp theo hoặc nộp bài
  const handleNext = async () => {
    if (currentIndex + 1 < quizQuestions.length) {
      setCurrentIndex((i) => i + 1);
      setRevealed(false);
      setSelectedOption(null);
      setTypedInput('');
      return;
    }

    // Đã trả lời hết tất cả câu hỏi
    setFinished(true);
    const { scorePct, passed, correctCount, total } = calculateResult();

    // Lưu kết quả vào /api/roadmap/assessment
    try {
      setIsSubmitting(true);
      await authFetch('/api/roadmap/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: stepId,
          stepId,
          tier: 'mini_quiz',
          track,
          score: scorePct,
          passed,
          details: {
            totalQuestions: total,
            correctAnswers: correctCount,
            answers,
          },
        }),
      });

      // Nếu đạt >= 75%, mở khóa/hoàn thành bước học trong user_roadmap_steps
      if (passed && stepId) {
        const result = await completeRoadmapStep(stepId, scorePct);
        toast.success(`Chúc mừng! Bạn đạt ${scorePct}% và nhận +15 XP!`);
        onPassed?.(result);
      }
    } catch (err) {
      console.warn('[NodeMiniQuiz] Assessment save error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Làm lại bài
  const handleRetry = () => {
    setCurrentIndex(0);
    setAnswers({});
    setRevealed(false);
    setSelectedOption(null);
    setTypedInput('');
    setFinished(false);
    setSecondsRemaining(90);
  };

  const { correctCount, total, scorePct, passed } = calculateResult();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md w-[95vw] p-6 rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="w-3.5 h-3.5" /> Mini-Quiz Gatekeeper
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              {Math.floor(secondsRemaining / 60)}:
              {(secondsRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <DialogTitle className="text-lg font-bold">
            {finished ? 'Kết quả Mini-Quiz' : stepTitle}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {finished
              ? 'Đánh giá mức độ tiếp thu kiến thức trước khi qua bài mới'
              : `Câu ${currentIndex + 1}/${quizQuestions.length} — Cần đạt ≥ 75% để hoàn thành`}
          </DialogDescription>
        </DialogHeader>

        {/* Thanh tiến trình */}
        {!finished && (
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden my-1">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{
                width: `${((currentIndex + (revealed ? 1 : 0)) / quizQuestions.length) * 100}%`,
              }}
            />
          </div>
        )}

        {/* Màn hình làm bài */}
        {!finished && currentQ && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <h3 className="font-medium text-sm leading-relaxed text-foreground">
                {currentQ.prompt}
              </h3>
              {currentQ.audioWord && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void playWordAudio(currentQ.audioWord!)}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Volume2 className="w-3.5 h-3.5 text-primary" /> Nghe lại từ
                </Button>
              )}
            </div>

            {/* Dạng câu hỏi trắc nghiệm */}
            {currentQ.type !== 'typing' && currentQ.options && (
              <div className="grid gap-2">
                {currentQ.options.map((opt) => {
                  const isCorrect = opt.trim().toLowerCase() === currentQ.answer.trim().toLowerCase();
                  const isSelected = opt === selectedOption;

                  let optionStyle = 'border-muted hover:border-primary/50 hover:bg-muted/30';
                  if (revealed) {
                    if (isCorrect) {
                      optionStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300';
                    } else if (isSelected) {
                      optionStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300';
                    } else {
                      optionStyle = 'opacity-40 border-muted';
                    }
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={revealed}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex items-center justify-between ${optionStyle}`}
                    >
                      <span>{opt}</span>
                      {revealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                      {revealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Dạng câu hỏi gõ từ */}
            {currentQ.type === 'typing' && (
              <div className="space-y-3">
                <Input
                  value={typedInput}
                  disabled={revealed}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder="Gõ câu trả lời của bạn..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && typedInput.trim() && !revealed) {
                      handleCheckTyping();
                    }
                  }}
                  className="h-10 text-sm"
                />
                {!revealed && (
                  <Button
                    type="button"
                    disabled={!typedInput.trim()}
                    onClick={handleCheckTyping}
                    className="w-full"
                    size="sm"
                  >
                    Kiểm tra
                  </Button>
                )}
                {revealed && (
                  <div className="p-2.5 rounded-lg text-xs bg-muted">
                    Đáp án đúng: <b className="text-emerald-600 dark:text-emerald-400">{currentQ.answer}</b>
                  </div>
                )}
              </div>
            )}

            {/* Giải thích chi tiết sau khi trả lời */}
            {revealed && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {currentQ.explanation && (
                  <div className="p-3 rounded-xl bg-muted/60 border border-muted text-xs leading-relaxed text-muted-foreground flex gap-2 items-start">
                    <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Giải thích: </span>
                      {currentQ.explanation}
                    </div>
                  </div>
                )}
                <Button type="button" onClick={() => void handleNext()} className="w-full gap-1.5">
                  {currentIndex + 1 < quizQuestions.length ? 'Câu tiếp theo' : 'Xem kết quả'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Màn hình kết quả */}
        {finished && (
          <div className="space-y-5 py-2 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-sm ${
                  passed
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 border border-amber-300 dark:border-amber-800'
                }`}
              >
                {passed ? '🎉' : '💪'}
              </div>
              <h2 className="text-xl font-bold">
                {passed ? 'Tuyệt vời! Đã đạt chuẩn' : 'Chưa đạt chuẩn (cần ≥ 75%)'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Đúng <b className="text-foreground">{correctCount}/{total}</b> câu ({scorePct}%)
              </p>
            </div>

            {/* Thông điệp khích lệ */}
            <div
              className={`p-3.5 rounded-xl text-xs leading-relaxed text-left border ${
                passed
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
              }`}
            >
              {passed
                ? 'Bạn đã hoàn thành xuất sắc mini-quiz kiểm tra nhanh! Bước học đã được ghi nhận hoàn thành và cộng thưởng +15 XP.'
                : 'Đừng nản lòng nhé! Hãy xem lại phần lý thuyết hoặc làm lại bài kiểm tra để khắc sâu kiến thức trước khi tiếp tục.'}
            </div>

            {/* Tóm tắt từng câu hỏi */}
            <div className="space-y-2 text-left max-h-40 overflow-y-auto pr-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Xem lại câu hỏi:
              </span>
              {quizQuestions.map((q, idx) => {
                const userAns = answers[q.id] || '';
                const isCorrect = userAns.trim().toLowerCase() === q.answer.trim().toLowerCase();
                return (
                  <div
                    key={q.id}
                    className="p-2.5 rounded-lg border text-xs bg-card space-y-1 flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5 flex-1">
                      <p className="font-medium line-clamp-1">
                        Câu {idx + 1}: {q.prompt}
                      </p>
                      <p className="text-muted-foreground">
                        Đáp án: <span className="text-emerald-600 font-semibold">{q.answer}</span>
                      </p>
                    </div>
                    {isCorrect ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Nút hành động */}
            <div className="grid gap-2 pt-2">
              {passed ? (
                <Button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Tiếp tục lộ trình
                </Button>
              ) : (
                <>
                  <Button type="button" onClick={handleRetry} className="w-full gap-2">
                    <RotateCcw className="w-4 h-4" /> Làm lại bài kiểm tra
                  </Button>
                  {onReviewLesson && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        onClose();
                        onReviewLesson();
                      }}
                      className="w-full gap-2 text-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Ôn lại nội dung bài học
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}