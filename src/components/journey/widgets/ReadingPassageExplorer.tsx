'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { Volume2, BookOpen, CheckCircle2, XCircle, HelpCircle, X, Check, BookmarkPlus } from 'lucide-react';
import { toast } from 'sonner';
import { playWordAudio, stopWordAudio } from '@/lib/audio';
import { isWordSavedLocally, saveVocabFromLookup } from '@/lib/exam-dict-cache';
import {
  ExamInteractiveText,
  stripWatermarkChars,
  type CoreVocabularyItem,
} from '@/components/exam/ExamInteractiveText';
import {
  InteractiveHighlightedText,
  useOptionalVocabLookup,
  type HighlightSpan,
} from '@/components/vocab';

const emptySubscribe = () => () => {};

export interface TargetWordItem {
  word: string;
  pos: string;
  definition: string;
  audioUrl?: string;
}

export interface ComprehensionQuestionItem {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface ReadingPassageExplorerProps {
  passage: string;
  audioUrl?: string;
  targetWords: TargetWordItem[];
  comprehensionQuestions: ComprehensionQuestionItem[];
  onComplete: (stats: { score: number }) => void;
}

export const ReadingPassageExplorer: React.FC<ReadingPassageExplorerProps> = ({
  passage,
  audioUrl,
  targetWords,
  comprehensionQuestions,
  onComplete,
}) => {
  // Active lookup popover state
  const vocabLookup = useOptionalVocabLookup();
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [activeWord, setActiveWord] = useState<TargetWordItem | null>(null);
  const [isReadingAudioPlaying, setIsReadingAudioPlaying] = useState(false);
  const [savedOverrides, setSavedOverrides] = useState<Record<string, boolean>>({});
  const [isSavingWord, setIsSavingWord] = useState(false);

  // Questions state: selected option indices
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>({});
  const [isAllSubmitted, setIsAllSubmitted] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const cleanPassage = useMemo(() => stripWatermarkChars(passage), [passage]);

  // Word count helper
  const wordCount = useMemo(() => {
    return cleanPassage.trim() ? cleanPassage.trim().split(/\s+/).length : 0;
  }, [cleanPassage]);

  // Map of lowercase target words for fast case-insensitive lookup
  const targetWordsMap = useMemo(() => {
    const map = new Map<string, TargetWordItem>();
    for (const tw of targetWords) {
      if (tw.word) {
        map.set(tw.word.trim().toLowerCase(), tw);
      }
    }
    return map;
  }, [targetWords]);

  const coreVocabulary = useMemo<CoreVocabularyItem[]>(
    () =>
      targetWords
        .filter((tw) => tw.word && tw.word.trim())
        .map((tw) => ({
          word: tw.word.trim(),
          pos: tw.pos,
          definition: tw.definition,
          ...(tw.audioUrl ? { audioUs: tw.audioUrl } : {}),
        })),
    [targetWords]
  );

  const isWordSaved = useCallback(
    (word: string) => {
      const key = word.trim().toLowerCase();
      if (!key) return false;
      if (key in savedOverrides) return savedOverrides[key];
      return isMounted && isWordSavedLocally(key);
    },
    [isMounted, savedOverrides]
  );

  // Sync with global ExamWordLookupCard save & rollback events
  useEffect(() => {
    const handleWordSaved = (e: Event) => {
      const detail = (e as CustomEvent<{ word?: string }>).detail;
      const key = detail?.word?.trim().toLowerCase();
      if (!key) return;
      setSavedOverrides((prev) => (prev[key] === true ? prev : { ...prev, [key]: true }));
    };

    const handleWordRollback = (e: Event) => {
      const detail = (e as CustomEvent<{ word?: string }>).detail;
      const key = detail?.word?.trim().toLowerCase();
      if (!key) return;
      setSavedOverrides((prev) => ({ ...prev, [key]: isWordSavedLocally(key) }));
    };

    window.addEventListener('lingo_word_saved', handleWordSaved);
    window.addEventListener('lingo_word_save_rollback', handleWordRollback);
    return () => {
      window.removeEventListener('lingo_word_saved', handleWordSaved);
      window.removeEventListener('lingo_word_save_rollback', handleWordRollback);
    };
  }, []);

  // Audio playback for whole passage or URL
  const handleTogglePassageAudio = () => {
    if (isReadingAudioPlaying) {
      stopWordAudio();
      setIsReadingAudioPlaying(false);
    } else {
      setIsReadingAudioPlaying(true);
      // Play either custom audioUrl or passage TTS
      playWordAudio(cleanPassage.slice(0, 300), audioUrl).finally(() => {
        setIsReadingAudioPlaying(false);
      });
    }
  };

  // Real SRS save synced with VocabLookupProvider / ExamWordLookupCard
  const handleSaveWord = useCallback(
    async (tw: TargetWordItem) => {
      const cleanWord = tw.word.trim();
      const key = cleanWord.toLowerCase();
      if (!cleanWord || isSavingWord) return;
      if (isWordSaved(cleanWord)) {
        toast.info(`"${cleanWord}" đã có trong Sổ từ SRS!`);
        return;
      }

      setIsSavingWord(true);
      setSavedOverrides((prev) => ({ ...prev, [key]: true }));

      try {
        const result = await saveVocabFromLookup({
          word: cleanWord,
          translation: tw.definition,
          pos: tw.pos,
          example: cleanPassage.slice(0, 300),
        });

        if (!result.ok) {
          setSavedOverrides((prev) => ({ ...prev, [key]: isWordSavedLocally(key) }));
          if (result.status === 'limit_reached') {
            toast.error(result.message || 'Bạn đã đạt giới hạn lưu từ của gói Free.');
          } else {
            toast.error(result.message || 'Không thể lưu từ vựng lúc này.');
          }
          return;
        }

        if (result.status === 'already_exists') {
          toast.info(`"${cleanWord}" đã có trong Sổ từ SRS!`);
          return;
        }

        toast.success(`Đã lưu "${cleanWord}" vào Sổ từ SRS!`);
      } catch {
        setSavedOverrides((prev) => ({ ...prev, [key]: isWordSavedLocally(key) }));
        toast.error('Không thể lưu từ vựng lúc này.');
      } finally {
        setIsSavingWord(false);
      }
    },
    [cleanPassage, isSavingWord, isWordSaved]
  );

  const activeWordKey = activeWord?.word.trim().toLowerCase() ?? null;

  const highlightSpans = useMemo<HighlightSpan[]>(() => {
    if (!cleanPassage || targetWords.length === 0) return [];
    const uniqueWords = Array.from(
      new Set(
        targetWords
          .map((tw) => tw.word?.trim())
          .filter((w): w is string => Boolean(w))
      )
    ).sort((a, b) => b.length - a.length);

    if (uniqueWords.length === 0) return [];

    const escaped = uniqueWords
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    const regex = new RegExp(
      `(?<![\\p{L}\\p{M}\\p{N}_'-])(${escaped})(?![\\p{L}\\p{M}\\p{N}_'-])`,
      'giu'
    );

    const spans: HighlightSpan[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(cleanPassage)) !== null) {
      const matchedText = match[0];
      const key = matchedText.trim().toLowerCase();
      const isCurrentlyActive = activeWordKey === key;
      const isSaved = isWordSaved(key);

      spans.push({
        start: match.index,
        end: match.index + matchedText.length,
        title: 'Chạm để tra nghĩa và nghe phát âm',
        className: `inline-block mx-0.5 px-1 py-0.5 rounded cursor-pointer transition-all border-b-2 font-medium ${
          isCurrentlyActive
            ? 'bg-amber-200 dark:bg-amber-900/60 border-amber-600 dark:border-amber-400 text-amber-950 dark:text-amber-100 shadow-sm'
            : isSaved
            ? 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50'
        }`,
      });
    }

    return spans;
  }, [activeWordKey, cleanPassage, isWordSaved, targetWords]);

  // Select option for question
  const handleSelectOption = (questionId: string, optIdx: number) => {
    if (submittedQuestions[questionId]) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optIdx,
    }));
  };

  // Submit answer for a single question
  const handleCheckQuestion = (q: ComprehensionQuestionItem) => {
    if (userAnswers[q.id] === undefined) return;

    setSubmittedQuestions((prev) => {
      const updated = { ...prev, [q.id]: true };

      // Check if all questions are now answered
      const allDone = comprehensionQuestions.every((item) => updated[item.id]);
      if (allDone) {
        setIsAllSubmitted(true);
        // Calculate score
        let correct = 0;
        for (const item of comprehensionQuestions) {
          if (userAnswers[item.id] === item.answerIndex) {
            correct++;
          }
        }
        const finalScore = Math.round((correct / comprehensionQuestions.length) * 100);
        onCompleteRef.current({ score: finalScore });
      }

      return updated;
    });
  };

  const totalAnswered = Object.keys(userAnswers).length;
  const activeSaved = activeWord ? isWordSaved(activeWord.word) : false;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base sm:text-lg">
              Đọc hiểu tương tác
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Chạm vào bất kỳ từ tiếng Anh nào để tra nghĩa nhanh (từ tô vàng là từ khóa trọng tâm).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-1 rounded-full font-medium">
            ~{wordCount} từ
          </span>

          <button
            type="button"
            onClick={handleTogglePassageAudio}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isReadingAudioPlaying
                ? 'bg-amber-500 text-white'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isReadingAudioPlaying ? 'Đang đọc...' : 'Nghe bài đọc'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Passage on Left, Word Popover or Guide on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Passage Text Container */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 leading-relaxed text-sm sm:text-base text-zinc-800 dark:text-zinc-200 whitespace-pre-line select-text">
          <InteractiveHighlightedText
            text={cleanPassage}
            spans={highlightSpans}
            enabled
            as="div"
            coreVocabulary={coreVocabulary}
            contextSentence={cleanPassage}
            activeWordClassName="bg-amber-200 dark:bg-amber-900/60 border-b-2 border-amber-600 dark:border-amber-400 text-amber-950 dark:text-amber-100 font-semibold"
            onWordClick={(_raw, clean) => {
              const tw = targetWordsMap.get(clean);
              if (tw) {
                setActiveWord(tw);
              }
            }}
          />
        </div>

        {/* Word Detail Popover / Glossary Panel */}
        <div className="lg:col-span-4 flex flex-col">
          {activeWord ? (
            <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 shadow-sm relative animate-fadeIn">
              <button
                type="button"
                onClick={() => setActiveWord(null)}
                className="absolute top-3 right-3 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-baseline gap-2 mb-1">
                <h4 className="font-bold text-lg text-indigo-900 dark:text-indigo-100">
                  {activeWord.word}
                </h4>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase">
                  [{activeWord.pos}]
                </span>
              </div>

              <div className="text-sm text-zinc-700 dark:text-zinc-300 font-medium mb-3">
                {activeWord.definition}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/60">
                <button
                  type="button"
                  onClick={() => playWordAudio(activeWord.word, activeWord.audioUrl)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Phát âm</span>
                </button>

                <button
                  type="button"
                  disabled={isSavingWord}
                  onClick={() => void handleSaveWord(activeWord)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeSaved
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {activeSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã lưu</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>{isSavingWord ? 'Đang lưu...' : 'Lưu từ'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-zinc-400 dark:text-zinc-500 h-full min-h-[140px] flex flex-col items-center justify-center">
              <HelpCircle className="w-6 h-6 mb-2 opacity-50" />
              <p className="text-xs">
                Chạm vào bất kỳ từ tiếng Anh nào trong bài đọc (hoặc từ khóa màu vàng) để tra nghĩa và nghe phát âm.
              </p>
            </div>
          )}

          {/* Quick Target Words List Chips */}
          <div className="mt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2">
              Từ khóa trong bài ({targetWords.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {targetWords.map((tw, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    setActiveWord(tw);
                    const clean = tw.word.trim();
                    if (vocabLookup && clean) {
                      vocabLookup.openLookup({
                        word: clean,
                        anchorRect: e.currentTarget.getBoundingClientRect(),
                        contextSentence: cleanPassage,
                        coreEntry: {
                          word: clean,
                          cleanWord: clean.toLowerCase(),
                          ipa: '',
                          pos: tw.pos || '',
                          definition: tw.definition,
                          synonyms: [],
                          antonyms: [],
                          ...(tw.audioUrl ? { audioUs: tw.audioUrl } : {}),
                        },
                      });
                    }
                  }}
                  className="exam-lookup-trigger px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
                >
                  {tw.word}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comprehension Questions Section */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
            Câu hỏi đọc hiểu ({comprehensionQuestions.length} câu)
          </h4>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Đã trả lời: {totalAnswered}/{comprehensionQuestions.length}
          </span>
        </div>

        <div className="space-y-6">
          {comprehensionQuestions.map((q, qIdx) => {
            const isSubmitted = Boolean(submittedQuestions[q.id]);
            const selectedOpt = userAnswers[q.id];
            const isCorrect = selectedOpt === q.answerIndex;

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80"
              >
                <div className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 mb-3 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    {qIdx + 1}
                  </span>
                  <ExamInteractiveText
                    text={q.question}
                    enabled={isMounted}
                    as="span"
                    inheritClassName
                  />
                </div>

                {/* Options List */}
                <div className="space-y-2 mb-4">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedOpt === optIdx;
                    const isThisAnswer = optIdx === q.answerIndex;

                    return (
                      <div
                        key={optIdx}
                        role="button"
                        tabIndex={isSubmitted ? -1 : 0}
                        aria-disabled={isSubmitted}
                        onClick={() => {
                          if (!isSubmitted) handleSelectOption(q.id, optIdx);
                        }}
                        onKeyDown={(e) => {
                          if (
                            !isSubmitted &&
                            e.target === e.currentTarget &&
                            (e.key === 'Enter' || e.key === ' ')
                          ) {
                            e.preventDefault();
                            handleSelectOption(q.id, optIdx);
                          }
                        }}
                        className={`w-full min-h-[44px] p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                          isSubmitted ? 'cursor-default' : 'cursor-pointer'
                        } ${
                          isSubmitted
                            ? isThisAnswer
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                              : isSelected
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200'
                              : 'bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 opacity-60'
                            : isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-900 dark:text-indigo-100 shadow-sm'
                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-indigo-300 dark:hover:border-indigo-600'
                        }`}
                      >
                        <ExamInteractiveText
                          text={opt}
                          enabled
                          as="span"
                          inheritClassName
                          contextSentence={q.question}
                        />
                        {isSubmitted && isThisAnswer && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
                        )}
                        {isSubmitted && isSelected && !isThisAnswer && (
                          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit button per question */}
                {!isSubmitted ? (
                  <button
                    type="button"
                    disabled={selectedOpt === undefined}
                    onClick={() => handleCheckQuestion(q)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                      selectedOpt !== undefined
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    Kiểm tra câu này
                  </button>
                ) : (
                  /* Explanation box (scrollable for long texts, escaped safely) */
                  <div className="mt-3 p-3.5 rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 max-h-48 overflow-y-auto">
                    <div className="font-bold mb-1 flex items-center gap-1.5">
                      {isCorrect ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ✓ Chính xác!
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">
                          ✕ Chưa chính xác!
                        </span>
                      )}
                    </div>
                    {/* Render plain text safely to prevent HTML injection (T2.16.2) */}
                    <div className="whitespace-pre-line leading-relaxed">
                      {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Final Completion Banner */}
        {isAllSubmitted && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h5 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm sm:text-base">
                  Hoàn thành bài đọc hiểu!
                </h5>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Bạn đã trả lời tất cả các câu hỏi đọc hiểu thành công.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingPassageExplorer;
