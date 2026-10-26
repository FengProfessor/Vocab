import { VocabApi } from '@/features/vocab/api';

import { useState, useMemo, useCallback } from 'react';
import {
  X,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  ArrowRight,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { speak } from '@/lib/study';
import { toast } from 'sonner';
import { saveWordLocally } from '@/lib/exam-dict-cache';
import { notifyWordSavedOptimistic } from '@/lib/word-summary-cache';
import {
  CONVERSATION_QUIZ_100,
  type ConversationQuizQuestion,
} from '@/data/conversations/conversation-quiz-100';

interface ConversationQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLookupWord?: (word: string) => void;
}

export function ConversationQuizModal({
  isOpen,
  onClose,
  onLookupWord,
}: ConversationQuizModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quizSize, setQuizSize] = useState<number>(20);
  const [quizState, setQuizState] = useState<'intro' | 'playing' | 'result'>('intro');

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [activeQuestions, setActiveQuestions] = useState<ConversationQuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [savedPhraseMap, setSavedPhraseMap] = useState<Record<string, boolean>>({});

  const filteredPool = useMemo(() => {
    if (selectedCategory === 'all') return CONVERSATION_QUIZ_100;
    return CONVERSATION_QUIZ_100.filter((q) => q.category === selectedCategory);
  }, [selectedCategory]);

  const startQuiz = useCallback(() => {
    // Shuffle and slice questions based on quizSize
    const shuffled = [...filteredPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(quizSize, shuffled.length));

    setActiveQuestions(selected);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsAnswerSubmitted(false);
    setQuizState('playing');
  }, [filteredPool, quizSize]);

  const currentQ = activeQuestions[currentIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsAnswerSubmitted(false);
    } else {
      setQuizState('result');
    }
  };

  const handleSavePhrase = async (phrase: string, meaning: string) => {
    if (savedPhraseMap[phrase]) {
      toast.info(`Cụm từ "${phrase}" đã có trong sổ từ của bạn`);
      return;
    }

    setSavedPhraseMap((prev) => ({ ...prev, [phrase]: true }));
    saveWordLocally(phrase);
    notifyWordSavedOptimistic();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lingo_word_saved', { detail: { word: phrase } }));
    }

    try {
      const res = await VocabApi.saveWords({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: phrase,
          translation: meaning,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.success) {
        toast.success(`Đã lưu cụm từ "${phrase}"!`);
      } else if (json.alreadyExists) {
        toast.info(`Cụm từ "${phrase}" đã có trong sổ từ`);
      }
    } catch {
      toast.success(`Đã lưu "${phrase}" vào máy`);
    }
  };

  // Calculate score
  const score = useMemo(() => {
    let correct = 0;
    activeQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });
    return correct;
  }, [activeQuestions, selectedAnswers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-border shadow-xl rounded-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Luyện tập Trắc nghiệm: Cụm từ & Giao tiếp (100 Câu)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Rèn luyện phản xạ ngữ cảnh, collocations, phrasal verbs và thành ngữ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {quizState === 'intro' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                  Giới thiệu bài test
                </span>
                <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
                  Ngân hàng 100 câu hỏi trắc nghiệm được biên soạn chuẩn theo các kỳ thi quốc tế và văn cảnh giao tiếp thực tế.
                  Mỗi câu đều có giải thích chi tiết, phát âm audio chuẩn và cho phép bạn lưu 1-click cụm từ vào sổ học.
                </p>
              </div>

              {/* Chọn chủ đề */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  1. Chọn nhóm kiến thức:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'Tất cả (100 câu)' },
                    { id: 'phrasal_verb', label: 'Cụm động từ (25 câu)' },
                    { id: 'collocation', label: 'Collocations (25 câu)' },
                    { id: 'idiom', label: 'Thành ngữ (20 câu)' },
                    { id: 'daily_dialogue', label: 'Hội thoại đời sống (15 câu)' },
                    { id: 'work_dialogue', label: 'Công sở & TOEIC (15 câu)' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                        selectedCategory === cat.id
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                          : 'border-border/70 hover:bg-muted text-foreground/80'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn số lượng câu */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  2. Số câu mỗi lượt làm:
                </label>
                <div className="flex items-center gap-2">
                  {[10, 20, 50, 100].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setQuizSize(size)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        quizSize === size
                          ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                          : 'border-border/70 hover:bg-muted text-foreground/80'
                      }`}
                    >
                      {size} câu
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                variant="chunky"
                onClick={startQuiz}
                className="w-full h-11 rounded-xl text-sm font-bold gap-2 shadow-sm"
              >
                <span>Bắt đầu làm bài test</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {quizState === 'playing' && currentQ && (
            <div className="space-y-5">
              {/* Progress & Category */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-primary">
                    Câu {currentIndex + 1} / {activeQuestions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium">
                    {currentQ.categoryLabel}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs">
                <p className="text-base sm:text-lg font-semibold text-foreground leading-relaxed">
                  {currentQ.question}
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === optIdx;
                  const isCorrect = optIdx === currentQ.correctIndex;

                  let btnStyle = 'border-border/70 hover:border-primary/50 hover:bg-muted/50 text-foreground';

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold';
                    } else if (isSelected) {
                      btnStyle = 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold';
                    } else {
                      btnStyle = 'border-border/40 opacity-60 text-muted-foreground';
                    }
                  } else if (isSelected) {
                    btnStyle = 'border-primary bg-primary/10 text-primary font-bold';
                  }

                  const labels = ['A', 'B', 'C', 'D'];

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isAnswerSubmitted}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${btnStyle}`}
                    >
                      <span className="flex items-center justify-center h-6 w-6 rounded-md bg-muted text-xs font-bold shrink-0">
                        {labels[optIdx]}
                      </span>
                      <span className="text-sm font-medium leading-tight flex-1">{opt}</span>

                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Card (Show after answering) */}
              {isAnswerSubmitted && (
                <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-3 animate-in fade-in-50 duration-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        Giải thích chi tiết:
                      </span>
                      <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
                        {currentQ.explanationVi}
                      </p>
                    </div>
                  </div>

                  {/* Target Phrase Badge with 1-Click Save */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => speak(currentQ.targetPhrase)}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Nghe phát âm cụm từ"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                      <span
                        onClick={() => onLookupWord?.(currentQ.targetPhrase)}
                        className="font-bold text-primary hover:underline cursor-pointer"
                        title="Tra cứu từ điển"
                      >
                        {currentQ.targetPhrase}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        : {currentQ.targetMeaningVi}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant={savedPhraseMap[currentQ.targetPhrase] ? 'outline' : 'secondary'}
                        onClick={() => void handleSavePhrase(currentQ.targetPhrase, currentQ.targetMeaningVi)}
                        className={`h-6 px-2 rounded-md text-[11px] gap-1 transition-all ${
                          savedPhraseMap[currentQ.targetPhrase]
                            ? 'border-emerald-300 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400'
                            : ''
                        }`}
                      >
                        {savedPhraseMap[currentQ.targetPhrase] ? (
                          <>
                            <BookmarkCheck className="h-3 w-3 text-emerald-500" />
                            <span>Đã lưu</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-3 w-3" />
                            <span>Lưu cụm từ</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Action Button */}
              {isAnswerSubmitted && (
                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="chunky"
                    onClick={handleNextQuestion}
                    className="h-10 px-5 rounded-xl text-xs sm:text-sm font-semibold gap-1.5 shadow-sm"
                  >
                    <span>
                      {currentIndex < activeQuestions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {quizState === 'result' && (
            <div className="text-center py-6 space-y-6">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                <Trophy className="h-12 w-12" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground">Hoàn thành bài luyện tập!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Bạn trả lời đúng{' '}
                  <span className="font-bold text-primary text-base">
                    {score} / {activeQuestions.length}
                  </span>{' '}
                  câu ({Math.round((score / activeQuestions.length) * 100)}%)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQuizState('intro')}
                  className="rounded-xl h-10 px-4 text-xs font-semibold gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Chọn chủ đề khác</span>
                </Button>

                <Button
                  type="button"
                  variant="chunky"
                  onClick={startQuiz}
                  className="rounded-xl h-10 px-5 text-xs font-semibold gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Làm lại lượt mới</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
